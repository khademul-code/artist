<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;
use Stripe\Webhook;

class DealPaymentService
{
    /**
     * Get the configured fee for additional deals in USD.
     */
    public function getDealFee(): float
    {
        return (float) config('services.stripe.deal_fee', 5.00);
    }

    /**
     * Determine supplier daily quota and if payment is required.
     */
    public function checkSupplierDailyQuota(User $user): array
    {
        $timezone = $user->timezone ?: config('app.timezone', 'UTC');

        try {
            $todayStart = Carbon::now($timezone)->startOfDay()->utc();
            $todayEnd   = Carbon::now($timezone)->endOfDay()->utc();
        } catch (\Throwable $e) {
            $todayStart = Carbon::today()->startOfDay()->utc();
            $todayEnd   = Carbon::today()->endOfDay()->utc();
        }

        // Count successfully created deals today (free or already paid)
        $postedTodayCount = Product::where('user_id', $user->id)
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->where('status', '!=', 'pending_payment')
            ->where(function ($q) {
                $q->where('payment_status', '!=', 'unpaid')
                  ->orWhereNull('payment_status');
            })
            ->count();

        $canPostFree = ($postedTodayCount === 0);
        $dealFee = $this->getDealFee();

        return [
            'can_post_free'        => $canPostFree,
            'requires_payment'     => !$canPostFree,
            'deals_posted_today'   => $postedTodayCount,
            'free_deals_per_day'   => 1,
            'free_deals_remaining' => $canPostFree ? 1 : 0,
            'deal_fee'             => $canPostFree ? 0.00 : $dealFee,
            'currency'             => 'usd',
            'button_label'         => $canPostFree ? "+ Post Today's Deal" : "+ Post Another Deal • \${$dealFee}",
            'button_subtext'       => $canPostFree ? '1 free deal per day' : null,
            'date_window'          => [
                'timezone' => $timezone,
                'start'    => $todayStart->toIso8601String(),
                'end'      => $todayEnd->toIso8601String(),
            ],
        ];
    }

    /**
     * Create a Stripe Checkout Session for an extra product deal.
     */
    public function createCheckoutSession(User $user, Product $product, ?string $successUrl = null, ?string $cancelUrl = null): StripeSession
    {
        $secretKey = config('services.stripe.secret');

        if (empty($secretKey)) {
            throw new Exception('Stripe secret key is not configured. Please set STRIPE_SECRET in your .env file.');
        }

        Stripe::setApiKey($secretKey);

        $dealFee = $this->getDealFee();
        $amountInCents = (int) round($dealFee * 100);

        // Build fallback frontend URLs
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $defaultSuccessUrl = "{$frontendUrl}/deal/payment/success?session_id={CHECKOUT_SESSION_ID}";
        $defaultCancelUrl  = "{$frontendUrl}/deal/payment/cancel?product_id={$product->id}";

        $finalSuccessUrl = $successUrl ?: $defaultSuccessUrl;
        $finalCancelUrl  = $cancelUrl ?: $defaultCancelUrl;

        // Ensure {CHECKOUT_SESSION_ID} template is present in success URL
        if (!str_contains($finalSuccessUrl, '{CHECKOUT_SESSION_ID}')) {
            $separator = str_contains($finalSuccessUrl, '?') ? '&' : '?';
            $finalSuccessUrl .= "{$separator}session_id={CHECKOUT_SESSION_ID}";
        }

        $session = StripeSession::create([
            'line_items' => [[
                'price_data' => [
                    'currency'     => 'usd',
                    'unit_amount'   => $amountInCents,
                    'product_data' => [
                        'name'        => 'Additional Product Deal: ' . $product->name,
                        'description' => "Publishing fee for additional daily deal ({$product->name})",
                    ],
                ],
                'quantity' => 1,
            ]],
            'mode'                => 'payment',
            'customer_email'      => $user->email,
            'client_reference_id' => (string) $product->id,
            'metadata'            => [
                'product_id' => (string) $product->id,
                'user_id'    => (string) $user->id,
                'action'     => 'additional_deal_payment',
            ],
            'success_url' => $finalSuccessUrl,
            'cancel_url'  => $finalCancelUrl,
        ]);

        $product->update([
            'stripe_session_id' => $session->id,
            'payment_fee'       => $dealFee,
        ]);

        return $session;
    }

    /**
     * Verify Stripe session and activate deal.
     */
    public function verifyAndActivateDeal(string $sessionId): Product
    {
        $secretKey = config('services.stripe.secret');
        if (empty($secretKey)) {
            throw new Exception('Stripe secret key is not configured.');
        }

        Stripe::setApiKey($secretKey);

        $session = StripeSession::retrieve($sessionId);

        if (!$session) {
            throw new Exception('Invalid or non-existent Stripe session.');
        }

        $productId = $session->metadata->product_id ?? $session->client_reference_id;

        $product = Product::where('stripe_session_id', $sessionId)
            ->when($productId, fn($q) => $q->orWhere('id', $productId))
            ->first();

        if (!$product) {
            throw new Exception('Associated product deal not found.');
        }

        if ($session->payment_status === 'paid') {
            $product->update([
                'status'                   => 'active',
                'payment_status'           => 'paid',
                'payment_fee'              => (float) (($session->amount_total ?? 500) / 100),
                'stripe_session_id'        => $session->id,
                'stripe_payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : null,
            ]);
        }

        return $product;
    }

    /**
     * Handle Stripe Webhook event.
     */
    public function handleWebhook(Request $request): array
    {
        $secretKey = config('services.stripe.secret');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (empty($secretKey)) {
            throw new Exception('Stripe secret key is not configured.');
        }

        Stripe::setApiKey($secretKey);

        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        $event = null;

        if (!empty($webhookSecret) && !empty($sigHeader)) {
            try {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } catch (\UnexpectedValueException $e) {
                Log::error('Invalid Stripe webhook payload: ' . $e->getMessage());
                throw new Exception('Invalid payload');
            } catch (\Stripe\Exception\SignatureVerificationException $e) {
                Log::error('Invalid Stripe signature: ' . $e->getMessage());
                throw new Exception('Invalid signature');
            }
        } else {
            $data = json_decode($payload, true);
            $event = $data ? \Stripe\Event::constructFrom($data) : null;
        }

        if (!$event) {
            throw new Exception('Unable to parse Stripe event.');
        }

        if ($event->type === 'checkout.session.completed') {
            /** @var StripeSession $session */
            $session = $event->data->object;
            $productId = $session->metadata->product_id ?? $session->client_reference_id;

            $product = Product::where('stripe_session_id', $session->id)
                ->when($productId, fn($q) => $q->orWhere('id', $productId))
                ->first();

            if ($product && $session->payment_status === 'paid') {
                $product->update([
                    'status'                   => 'active',
                    'payment_status'           => 'paid',
                    'payment_fee'              => (float) (($session->amount_total ?? 500) / 100),
                    'stripe_session_id'        => $session->id,
                    'stripe_payment_intent_id' => is_string($session->payment_intent) ? $session->payment_intent : null,
                ]);

                Log::info("Product deal ID #{$product->id} activated via Stripe webhook.");
            }
        }

        return ['status' => 'success', 'event' => $event->type];
    }
}
