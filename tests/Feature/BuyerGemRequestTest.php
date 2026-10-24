<?php

namespace Tests\Feature;

use App\Models\GemColor;
use App\Models\GemRequest;
use App\Models\GemShape;
use App\Models\GemType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BuyerGemRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_buyer_can_create_gem_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Pearl'], ['sort_order' => 1, 'status' => 'active']);
        $shape = GemShape::firstOrCreate(['name' => 'Round'], ['image' => 'storage/gem_shapes/Round.png', 'sort_order' => 1, 'status' => 'active']);
        $color = GemColor::firstOrCreate(['name' => 'C01'], ['image' => 'storage/gem_colors/C01.png', 'sort_order' => 1, 'status' => 'active']);

        $payload = [
            'gem_type_id'     => $type->id,
            'gem_shape_id'    => $shape->id,
            'gem_color_id'    => $color->id,
            'size'            => '8-9 mm',
            'quantity'        => 5,
            'request_details' => 'Looking for clean high luster pearls.',
        ];

        $response = $this->postJson('/api/buyer/gem-requests', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 201)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.size', '8-9 mm')
            ->assertJsonPath('data.quantity', 5)
            ->assertJsonPath('data.request_details', 'Looking for clean high luster pearls.')
            ->assertJsonPath('data.gem_type.id', $type->id)
            ->assertJsonPath('data.gem_shape.id', $shape->id)
            ->assertJsonPath('data.gem_color.id', $color->id);

        $id = $response->json('data.id');
        $this->assertIsInt($id);

        $slug = $response->json('data.slug');
        $this->assertMatchesRegularExpression('/^pearl-[0-9]{7,}$/', $slug);

        $this->assertDatabaseHas('gem_requests', [
            'user_id'     => $buyer->id,
            'gem_type_id' => $type->id,
            'status'      => 'pending',
            'quantity'    => 5,
        ]);
    }

    public function test_buyer_can_create_gem_request_with_reference_image()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Others'], ['sort_order' => 11, 'status' => 'active']);
        $image = UploadedFile::fake()->create('custom_reference.jpg', 100, 'image/jpeg');

        $payload = [
            'gem_type_id'     => $type->id,
            'size'            => '12 mm',
            'quantity'        => 2,
            'request_details' => 'Need this exact turquoise hue.',
            'reference_image' => $image,
        ];

        $response = $this->postJson('/api/buyer/gem-requests', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 201)
            ->assertJsonPath('data.status', 'pending');

        $this->assertNotNull($response->json('data.reference_image'));
    }

    public function test_buyer_can_list_their_gem_requests_and_filter_by_status()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Rubies'], ['sort_order' => 3, 'status' => 'active']);

        // Create 2 pending and 1 completed
        GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'pending',
            'quantity'        => 1,
            'request_details' => 'Req 1',
        ]);

        GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'pending',
            'quantity'        => 2,
            'request_details' => 'Req 2',
        ]);

        GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'completed',
            'quantity'        => 3,
            'request_details' => 'Req 3',
        ]);

        // Request all
        $response = $this->getJson('/api/buyer/gem-requests');
        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.total', 3);

        // Filter by pending
        $pendingResponse = $this->getJson('/api/buyer/gem-requests?status=pending');
        $pendingResponse->assertStatus(200)
            ->assertJsonPath('data.total', 2);
    }

    public function test_buyer_can_preview_specific_gem_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Emeralds'], ['sort_order' => 4, 'status' => 'active']);
        $req = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'pending',
            'quantity'        => 10,
            'size'            => '5x7 mm',
            'request_details' => 'Fine Colombian green color.',
        ]);

        $response = $this->getJson("/api/buyer/gem-requests/{$req->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.id', (int) $req->request_number)
            ->assertJsonPath('data.slug', $req->slug)
            ->assertJsonPath('data.size', '5x7 mm')
            ->assertJsonPath('data.quantity', 10)
            ->assertJsonPath('data.request_details', 'Fine Colombian green color.');
    }

    public function test_buyer_can_preview_request_using_id_and_slug()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Opals'], ['sort_order' => 6, 'status' => 'active']);
        $req = GemRequest::create([
            'user_id'     => $buyer->id,
            'gem_type_id' => $type->id,
            'status'      => 'pending',
        ]);

        // Query by numeric request_number (e.g. 1000001)
        $responseReqNum = $this->getJson("/api/buyer/gem-requests/{$req->request_number}");
        $responseReqNum->assertStatus(200)
            ->assertJsonPath('data.id', (int) $req->request_number)
            ->assertJsonPath('data.slug', $req->slug);

        // Query by database primary key ID
        $responseId = $this->getJson("/api/buyer/gem-requests/{$req->id}");
        $responseId->assertStatus(200)
            ->assertJsonPath('data.id', (int) $req->request_number)
            ->assertJsonPath('data.slug', $req->slug);

        // Query by slug: e.g. "opals-1000001"
        $responseSlug = $this->getJson("/api/buyer/gem-requests/{$req->slug}");
        $responseSlug->assertStatus(200)
            ->assertJsonPath('data.id', (int) $req->request_number)
            ->assertJsonPath('data.slug', $req->slug);
    }

    public function test_buyer_cannot_view_another_buyers_gem_request()
    {
        $buyer1 = User::factory()->create(['role' => 'buyer']);
        $buyer2 = User::factory()->create(['role' => 'buyer']);

        Sanctum::actingAs($buyer1);

        $type = GemType::firstOrCreate(['name' => 'Sapphires'], ['sort_order' => 5, 'status' => 'active']);
        $req = GemRequest::create([
            'user_id'     => $buyer2->id,
            'gem_type_id' => $type->id,
            'status'      => 'pending',
        ]);

        $response = $this->getJson("/api/buyer/gem-requests/{$req->id}");
        $response->assertStatus(404);
    }

    public function test_buyer_can_withdraw_gem_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Diamonds'], ['sort_order' => 2, 'status' => 'active']);
        $req = GemRequest::create([
            'user_id'     => $buyer->id,
            'gem_type_id' => $type->id,
            'status'      => 'pending',
        ]);

        $response = $this->postJson("/api/buyer/gem-requests/{$req->slug}/withdraw");

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.status', 'withdrawn');

        $this->assertDatabaseHas('gem_requests', [
            'id'     => $req->id,
            'status' => 'withdrawn',
        ]);

        $this->assertNotNull($req->fresh()->withdrawn_at);
    }

    public function test_buyer_cannot_withdraw_already_completed_or_withdrawn_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Topaz'], ['sort_order' => 8, 'status' => 'active']);
        $completedReq = GemRequest::create([
            'user_id'     => $buyer->id,
            'gem_type_id' => $type->id,
            'status'      => 'completed',
        ]);

        $response = $this->postJson("/api/buyer/gem-requests/{$completedReq->slug}/withdraw");
        $response->assertStatus(400)
            ->assertJsonPath('message', 'Completed gem requests cannot be withdrawn.');
    }

    public function test_buyer_gem_request_creation_is_throttled()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Sapphire'], ['sort_order' => 2, 'status' => 'active']);

        $payload = [
            'gem_type_id' => $type->id,
            'quantity'    => 1,
        ];

        // 15 allowed attempts
        for ($i = 0; $i < 15; $i++) {
            $this->postJson('/api/buyer/gem-requests', $payload)->assertStatus(201);
        }

        // 16th attempt should be throttled (HTTP 429)
        $response = $this->postJson('/api/buyer/gem-requests', $payload);
        $response->assertStatus(429);
    }

    public function test_supplier_cannot_access_buyer_gem_request_endpoints()
    {
        $supplier = User::factory()->create(['role' => 'supplier']);
        Sanctum::actingAs($supplier);

        $type = GemType::firstOrCreate(['name' => 'Emerald'], ['sort_order' => 3, 'status' => 'active']);

        // 1. Cannot list
        $this->getJson('/api/buyer/gem-requests')
            ->assertStatus(403);

        // 2. Cannot store
        $this->postJson('/api/buyer/gem-requests', [
            'gem_type_id' => $type->id,
            'quantity'    => 2,
        ])->assertStatus(403);

        // 3. Cannot view
        $this->getJson('/api/buyer/gem-requests/1')
            ->assertStatus(403);

        // 4. Cannot withdraw
        $this->postJson('/api/buyer/gem-requests/1/withdraw')
            ->assertStatus(403);
    }

    public function test_buyer_can_update_gem_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type1 = GemType::firstOrCreate(['name' => 'Pearl'], ['sort_order' => 1, 'status' => 'active']);
        $type2 = GemType::firstOrCreate(['name' => 'Sapphire'], ['sort_order' => 2, 'status' => 'active']);

        $req = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type1->id,
            'size'            => '8 mm',
            'quantity'        => 2,
            'request_details' => 'Initial details',
            'status'          => 'pending',
        ]);

        $updatePayload = [
            'gem_type_id'     => $type2->id,
            'size'            => '12 mm',
            'quantity'        => 5,
            'request_details' => 'Updated details with sapphire requirement',
        ];

        // Test via PUT /{id}/update
        $response = $this->putJson("/api/buyer/gem-requests/{$req->id}/update", $updatePayload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.size', '12 mm')
            ->assertJsonPath('data.quantity', 5)
            ->assertJsonPath('data.request_details', 'Updated details with sapphire requirement')
            ->assertJsonPath('data.gem_type.id', $type2->id);

        $this->assertDatabaseHas('gem_requests', [
            'id'              => $req->id,
            'gem_type_id'     => $type2->id,
            'size'            => '12 mm',
            'quantity'        => 5,
            'request_details' => 'Updated details with sapphire requirement',
        ]);

        // Test via POST /{id}/update as well
        $freshReq = $req->fresh();
        $responsePost = $this->postJson("/api/buyer/gem-requests/{$freshReq->slug}/update", [
            'size' => '14 mm',
        ]);

        $responsePost->assertStatus(200)
            ->assertJsonPath('data.size', '14 mm');
    }

    public function test_buyer_cannot_update_another_buyers_gem_request()
    {
        $buyer1 = User::factory()->create(['role' => 'buyer']);
        $buyer2 = User::factory()->create(['role' => 'buyer']);

        Sanctum::actingAs($buyer1);

        $type = GemType::firstOrCreate(['name' => 'Diamond'], ['sort_order' => 1, 'status' => 'active']);
        $req = GemRequest::create([
            'user_id'         => $buyer2->id,
            'gem_type_id'     => $type->id,
            'status'          => 'pending',
        ]);

        $response = $this->putJson("/api/buyer/gem-requests/{$req->id}/update", [
            'size' => '10 mm',
        ]);

        $response->assertStatus(404)
            ->assertJsonPath('message', 'Gem request not found.');
    }

    public function test_buyer_cannot_update_withdrawn_or_completed_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        Sanctum::actingAs($buyer);

        $type = GemType::firstOrCreate(['name' => 'Ruby'], ['sort_order' => 1, 'status' => 'active']);

        $withdrawnReq = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'withdrawn',
            'withdrawn_at'    => now(),
        ]);

        $response = $this->putJson("/api/buyer/gem-requests/{$withdrawnReq->id}/update", [
            'size' => '10 mm',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'This gem request has been withdrawn and cannot be edited.');

        $completedReq = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'completed',
        ]);

        $responseCompleted = $this->putJson("/api/buyer/gem-requests/{$completedReq->id}/update", [
            'size' => '10 mm',
        ]);

        $responseCompleted->assertStatus(400)
            ->assertJsonPath('message', 'Completed gem requests cannot be edited.');
    }
}


