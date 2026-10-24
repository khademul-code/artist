<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\DealPaymentService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Stripe\Checkout\Session as StripeSession;
use Tests\TestCase;

class SupplierDailyDealPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.stripe.secret' => 'sk_test_mock_secret']);
        config(['services.stripe.deal_fee' => 5.00]);
    }

    public function test_supplier_daily_deal_quota_initially_allows_free_deal()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);
        Sanctum::actingAs($supplier);

        $response = $this->getJson('/api/deal/daily-quota');

        $response->assertStatus(200)
            ->assertJsonPath('data.can_post_free', true)
            ->assertJsonPath('data.requires_payment', false)
            ->assertJsonPath('data.deals_posted_today', 0)
            ->assertJsonPath('data.free_deals_remaining', 1)
            ->assertJsonPath('data.deal_fee', 0)
            ->assertJsonPath('data.button_label', "+ Post Today's Deal")
            ->assertJsonPath('data.button_subtext', "1 free deal per day");
    }

    public function test_supplier_first_deal_of_the_day_is_free()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);
        Sanctum::actingAs($supplier);

        $category = ProductCategory::create([
            'name'   => 'Gemstones',
            'status' => 'active',
        ]);

        $payload = [
            'name'                => 'Diamond Sapphire Ring',
            'product_category_id' => $category->id,
            'price'               => 1500.00,
            'quantity'            => 1,
            'deal_duration'       => '24 Hours',
            'description'         => 'Exclusive daily deal',
        ];

        $response = $this->postJson('/api/deal/product/store', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment_required', false)
            ->assertJsonPath('data.product.status', 'active')
            ->assertJsonPath('data.product.payment_status', 'free')
            ->assertJsonPath('data.product.payment_fee', 0)
            ->assertJsonPath('data.product.is_free_deal', true);

        $this->assertDatabaseHas('products', [
            'name'           => 'Diamond Sapphire Ring',
            'user_id'        => $supplier->id,
            'status'         => 'active',
            'payment_status' => 'free',
            'payment_fee'    => 0.00,
        ]);
    }

    public function test_supplier_second_deal_requires_5_dollar_payment()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);
        Sanctum::actingAs($supplier);

        $category = ProductCategory::create([
            'name'   => 'Emeralds',
            'status' => 'active',
        ]);

        // Create the free deal of today first
        Product::create([
            'user_id'             => $supplier->id,
            'product_category_id' => $category->id,
            'name'                => 'First Free Deal',
            'slug'                => 'first-free-deal',
            'price'               => 200.00,
            'quantity'            => 1,
            'status'              => 'active',
            'payment_status'      => 'free',
            'payment_fee'         => 0.00,
        ]);

        // Check quota endpoint now reflects 1 deal posted and next deal costs $5
        $quotaResponse = $this->getJson('/api/deal/daily-quota');
        $quotaResponse->assertStatus(200)
            ->assertJsonPath('data.can_post_free', false)
            ->assertJsonPath('data.requires_payment', true)
            ->assertJsonPath('data.deals_posted_today', 1)
            ->assertJsonPath('data.free_deals_remaining', 0)
            ->assertJsonPath('data.deal_fee', 5)
            ->assertJsonPath('data.button_label', "+ Post Another Deal • $5");

        // Mock DealPaymentService createCheckoutSession
        $mockService = Mockery::mock(DealPaymentService::class)->makePartial();
        $fakeStripeSession = StripeSession::constructFrom([
            'id'  => 'cs_test_mock_session_123',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_mock_session_123',
        ]);

        $mockService->shouldReceive('createCheckoutSession')
            ->once()
            ->andReturnUsing(function ($user, $product, $successUrl, $cancelUrl) use ($fakeStripeSession) {
                $product->update([
                    'stripe_session_id' => $fakeStripeSession->id,
                    'payment_fee'       => 5.00,
                ]);
                return $fakeStripeSession;
            });

        $this->app->instance(DealPaymentService::class, $mockService);

        // Submit second deal
        $payload = [
            'name'                => 'Second Paid Deal',
            'product_category_id' => $category->id,
            'price'               => 450.00,
            'quantity'            => 2,
            'deal_duration'       => '3 Days',
            'description'         => 'Paid daily deal',
        ];

        $response = $this->postJson('/api/deal/product/store', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment_required', true)
            ->assertJsonPath('data.deal_fee', 5)
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/c/pay/cs_test_mock_session_123')
            ->assertJsonPath('data.session_id', 'cs_test_mock_session_123')
            ->assertJsonPath('data.product.status', 'pending_payment')
            ->assertJsonPath('data.product.payment_status', 'unpaid')
            ->assertJsonPath('data.product.payment_fee', 5);

        $this->assertDatabaseHas('products', [
            'name'              => 'Second Paid Deal',
            'status'            => 'pending_payment',
            'payment_status'    => 'unpaid',
            'payment_fee'       => 5.00,
            'stripe_session_id' => 'cs_test_mock_session_123',
        ]);
    }

    public function test_payment_verification_activates_product()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);
        Sanctum::actingAs($supplier);

        $product = Product::create([
            'user_id'           => $supplier->id,
            'name'              => 'Pending Deal Item',
            'slug'              => 'pending-deal-item',
            'price'             => 500.00,
            'quantity'          => 1,
            'status'            => 'pending_payment',
            'payment_status'    => 'unpaid',
            'payment_fee'       => 5.00,
            'stripe_session_id' => 'cs_test_verification_999',
        ]);

        $mockService = Mockery::mock(DealPaymentService::class)->makePartial();
        $mockService->shouldReceive('verifyAndActivateDeal')
            ->with('cs_test_verification_999')
            ->once()
            ->andReturnUsing(function () use ($product) {
                $product->update([
                    'status'                   => 'active',
                    'payment_status'           => 'paid',
                    'stripe_payment_intent_id' => 'pi_test_12345',
                ]);
                return $product;
            });

        $this->app->instance(DealPaymentService::class, $mockService);

        $response = $this->postJson('/api/deal/payment/verify', [
            'session_id' => 'cs_test_verification_999',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.product.status', 'active')
            ->assertJsonPath('data.product.payment_status', 'paid');

        $this->assertDatabaseHas('products', [
            'id'             => $product->id,
            'status'         => 'active',
            'payment_status' => 'paid',
        ]);
    }

    public function test_stripe_webhook_activates_product()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);

        $product = Product::create([
            'user_id'           => $supplier->id,
            'name'              => 'Webhook Deal',
            'slug'              => 'webhook-deal',
            'price'             => 750.00,
            'quantity'          => 1,
            'status'            => 'pending_payment',
            'payment_status'    => 'unpaid',
            'payment_fee'       => 5.00,
            'stripe_session_id' => 'cs_test_webhook_session_456',
        ]);

        $payload = [
            'id'   => 'evt_test_123',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id'                  => 'cs_test_webhook_session_456',
                    'payment_status'      => 'paid',
                    'amount_total'        => 500,
                    'payment_intent'      => 'pi_webhook_success_99',
                    'client_reference_id' => (string) $product->id,
                    'metadata'            => [
                        'product_id' => (string) $product->id,
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/deal/stripe-webhook', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('products', [
            'id'                       => $product->id,
            'status'                   => 'active',
            'payment_status'           => 'paid',
            'stripe_payment_intent_id' => 'pi_webhook_success_99',
            'payment_fee'              => 5.00,
        ]);
    }

    public function test_retry_checkout_for_unpaid_deal()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);
        Sanctum::actingAs($supplier);

        $product = Product::create([
            'user_id'           => $supplier->id,
            'name'              => 'Unpaid Deal Retried',
            'slug'              => 'unpaid-deal-retried',
            'price'             => 300.00,
            'quantity'          => 1,
            'status'            => 'pending_payment',
            'payment_status'    => 'unpaid',
            'payment_fee'       => 5.00,
        ]);

        $mockService = Mockery::mock(DealPaymentService::class)->makePartial();
        $fakeStripeSession = StripeSession::constructFrom([
            'id'  => 'cs_test_retry_789',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_retry_789',
        ]);

        $mockService->shouldReceive('createCheckoutSession')
            ->once()
            ->andReturnUsing(function ($user, $prod) use ($fakeStripeSession) {
                $prod->update(['stripe_session_id' => $fakeStripeSession->id]);
                return $fakeStripeSession;
            });

        $this->app->instance(DealPaymentService::class, $mockService);

        $response = $this->postJson("/api/deal/product/checkout/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.session_id', 'cs_test_retry_789')
            ->assertJsonPath('data.checkout_url', 'https://checkout.stripe.com/c/pay/cs_test_retry_789');
    }
}
