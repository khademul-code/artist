<?php

namespace Tests\Feature;

use App\Models\GemRequest;
use App\Models\GemRequestProposal;
use App\Models\GemType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GemProposalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_seller_can_submit_proposal_with_price_description_and_multiple_images()
    {
        $buyer = User::factory()->create(['role' => 'buyer', 'name' => 'John Buyer']);
        $seller = User::factory()->create(['role' => 'supplier', 'name' => 'Gem Master Supplier']);

        $type = GemType::firstOrCreate(['name' => 'Sapphire'], ['sort_order' => 1, 'status' => 'active']);
        $gemRequest = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'size'            => '8-9 mm',
            'quantity'        => 2,
            'request_details' => 'Need royal blue sapphires',
            'status'          => 'pending',
        ]);

        Sanctum::actingAs($seller);

        $image1 = UploadedFile::fake()->create('proposal_1.jpg', 150, 'image/jpeg');
        $image2 = UploadedFile::fake()->create('proposal_2.jpg', 180, 'image/jpeg');

        $payload = [
            'price'       => 450.50,
            'description' => 'I have 2 unheated Ceylon royal blue sapphires matching your exact size.',
            'images'      => [$image1, $image2],
        ];

        $response = $this->postJson("/api/supplier/gem-requests/{$gemRequest->request_number}/proposals", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 201)
            ->assertJsonPath('data.description', 'I have 2 unheated Ceylon royal blue sapphires matching your exact size.')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.seller.name', 'Gem Master Supplier');

        $this->assertEquals(450.50, $response->json('data.price'));

        $images = $response->json('data.images');
        $this->assertIsArray($images);
        $this->assertCount(2, $images);

        $this->assertDatabaseHas('gem_request_proposals', [
            'gem_request_id' => $gemRequest->id,
            'user_id'        => $seller->id,
            'price'          => 450.50,
            'status'         => 'pending',
        ]);
    }



    public function test_seller_cannot_submit_proposal_to_withdrawn_or_completed_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $seller = User::factory()->create(['role' => 'supplier']);
        $type = GemType::firstOrCreate(['name' => 'Pearl'], ['sort_order' => 3, 'status' => 'active']);

        $withdrawnReq = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'withdrawn',
            'withdrawn_at'    => now(),
        ]);

        Sanctum::actingAs($seller);

        $response = $this->postJson("/api/supplier/gem-requests/{$withdrawnReq->id}/proposals", [
            'price'       => 150.00,
            'description' => 'Offer on withdrawn request',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Proposals can only be submitted for active pending gem requests.');
    }

    public function test_seller_cannot_submit_proposal_to_own_request()
    {
        $user = User::factory()->create(['role' => 'supplier']);
        $type = GemType::firstOrCreate(['name' => 'Diamond'], ['sort_order' => 4, 'status' => 'active']);

        $gemRequest = GemRequest::create([
            'user_id'         => $user->id,
            'gem_type_id'     => $type->id,
            'status'          => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/supplier/gem-requests/{$gemRequest->id}/proposals", [
            'price'       => 500.00,
            'description' => 'Self proposal',
        ]);

        $response->assertStatus(400)
            ->assertJsonPath('message', 'You cannot submit a proposal on your own gem request.');
    }

    public function test_seller_can_list_their_submitted_proposals()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $seller = User::factory()->create(['role' => 'supplier']);
        $type = GemType::firstOrCreate(['name' => 'Ruby'], ['sort_order' => 5, 'status' => 'active']);

        $req1 = GemRequest::create(['user_id' => $buyer->id, 'gem_type_id' => $type->id, 'status' => 'pending']);
        $req2 = GemRequest::create(['user_id' => $buyer->id, 'gem_type_id' => $type->id, 'status' => 'pending']);

        GemRequestProposal::create([
            'gem_request_id' => $req1->id,
            'user_id'        => $seller->id,
            'price'          => 200.00,
            'description'    => 'Proposal 1',
        ]);

        GemRequestProposal::create([
            'gem_request_id' => $req2->id,
            'user_id'        => $seller->id,
            'price'          => 350.00,
            'description'    => 'Proposal 2',
        ]);

        Sanctum::actingAs($seller);

        $response = $this->getJson('/api/supplier/gem-proposals');

        $response->assertStatus(200)
            ->assertJsonPath('total', 2)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'gem_request_id',
                        'price',
                        'description',
                        'images',
                        'status',
                        'time_ago',
                        'seller',
                    ],
                ],
                'current_page',
                'total',
            ]);
    }

    public function test_seller_can_view_specific_proposal()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $seller = User::factory()->create(['role' => 'supplier']);
        $type = GemType::firstOrCreate(['name' => 'Topaz'], ['sort_order' => 6, 'status' => 'active']);

        $req = GemRequest::create(['user_id' => $buyer->id, 'gem_type_id' => $type->id, 'status' => 'pending']);

        $proposal = GemRequestProposal::create([
            'gem_request_id' => $req->id,
            'user_id'        => $seller->id,
            'price'          => 180.00,
            'description'    => 'Topaz proposal',
        ]);

        Sanctum::actingAs($seller);

        $response = $this->getJson("/api/supplier/gem-proposals/{$proposal->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $proposal->id);
        $this->assertEquals(180.00, $response->json('data.price'));
    }

    public function test_buyer_can_view_proposals_received_on_their_gem_request()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $seller1 = User::factory()->create(['role' => 'supplier', 'name' => 'Supplier Alpha']);
        $seller2 = User::factory()->create(['role' => 'supplier', 'name' => 'Supplier Beta']);

        $type = GemType::firstOrCreate(['name' => 'Opal'], ['sort_order' => 7, 'status' => 'active']);
        $gemRequest = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'request_details' => 'Looking for Australian black opal',
            'status'          => 'pending',
        ]);

        GemRequestProposal::create([
            'gem_request_id' => $gemRequest->id,
            'user_id'        => $seller1->id,
            'price'          => 700.00,
            'description'    => 'Lightning Ridge black opal 3ct',
        ]);

        GemRequestProposal::create([
            'gem_request_id' => $gemRequest->id,
            'user_id'        => $seller2->id,
            'price'          => 650.00,
            'description'    => 'Black opal with red fire',
        ]);

        Sanctum::actingAs($buyer);

        $response = $this->getJson("/api/buyer/gem-requests/{$gemRequest->request_number}/proposals");

        $response->assertStatus(200)
            ->assertJsonPath('total', 2);

        $items = $response->json('data');
        $this->assertCount(2, $items);
        $this->assertEquals(650.00, $items[0]['price']);
        $this->assertEquals(700.00, $items[1]['price']);
        $this->assertEquals('Supplier Beta', $items[0]['seller']['name']);
        $this->assertEquals('Supplier Alpha', $items[1]['seller']['name']);
    }

    public function test_buyer_can_view_specific_proposal_received()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $seller = User::factory()->create(['role' => 'supplier', 'name' => 'Supplier Alpha']);
        $type = GemType::firstOrCreate(['name' => 'Opal'], ['sort_order' => 7, 'status' => 'active']);

        $gemRequest = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'status'          => 'pending',
        ]);

        $proposal = GemRequestProposal::create([
            'gem_request_id' => $gemRequest->id,
            'user_id'        => $seller->id,
            'price'          => 700.00,
            'description'    => 'Lightning Ridge black opal 3ct',
        ]);

        Sanctum::actingAs($buyer);

        $response = $this->getJson("/api/buyer/gem-requests/proposals/{$proposal->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $proposal->id)
            ->assertJsonPath('data.seller.name', 'Supplier Alpha');
        $this->assertEquals(700.00, $response->json('data.price'));
    }

    public function test_buyer_cannot_view_proposals_for_another_buyers_gem_request()
    {
        $buyer1 = User::factory()->create(['role' => 'buyer']);
        $buyer2 = User::factory()->create(['role' => 'buyer']);
        $type = GemType::firstOrCreate(['name' => 'Garnet'], ['sort_order' => 8, 'status' => 'active']);

        $gemRequest = GemRequest::create([
            'user_id'     => $buyer1->id,
            'gem_type_id' => $type->id,
            'status'      => 'pending',
        ]);

        Sanctum::actingAs($buyer2);

        $response = $this->getJson("/api/buyer/gem-requests/{$gemRequest->id}/proposals");
        $response->assertStatus(404);
    }

    public function test_buyer_cannot_submit_proposal_as_seller()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $type = GemType::firstOrCreate(['name' => 'Aquamarine'], ['sort_order' => 9, 'status' => 'active']);

        $gemRequest = GemRequest::create([
            'user_id'     => $buyer->id,
            'gem_type_id' => $type->id,
            'status'      => 'pending',
        ]);

        Sanctum::actingAs($buyer);

        $response = $this->postJson("/api/supplier/gem-requests/{$gemRequest->id}/proposals", [
            'price' => 100.00,
        ]);

        $response->assertStatus(403);
    }
}
