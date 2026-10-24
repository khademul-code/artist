<?php

namespace Tests\Feature;

use App\Models\GemColor;
use App\Models\GemRequest;
use App\Models\GemShape;
use App\Models\GemType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicGemRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_user_or_seller_can_list_pending_gem_requests_without_auth()
    {
        $buyer = User::factory()->create([
            'name' => 'Alice Buyer',
            'role' => 'buyer',
        ]);

        $type = GemType::firstOrCreate(['name' => 'Sapphires'], ['sort_order' => 1, 'status' => 'active']);
        $shape = GemShape::firstOrCreate(['name' => 'Oval'], ['image' => 'storage/gem_shapes/Oval.png', 'sort_order' => 1, 'status' => 'active']);
        $color = GemColor::firstOrCreate(['name' => 'Royal Blue'], ['image' => 'storage/gem_colors/Blue.png', 'sort_order' => 1, 'status' => 'active']);

        $gemRequest = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'gem_shape_id'    => $shape->id,
            'gem_color_id'    => $color->id,
            'size'            => '10x8 mm',
            'quantity'        => 3,
            'request_details' => 'Looking for unheated royal blue sapphire.',
            'status'          => 'pending',
            'reference_image' => 'uploads/gem_requests/sample.jpg',
        ]);

        $response = $this->getJson('/api/gem-requests');

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', (int) $gemRequest->request_number)
            ->assertJsonPath('data.0.slug', $gemRequest->slug)
            ->assertJsonPath('data.0.request_details', 'Looking for unheated royal blue sapphire.')
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonPath('data.0.gem_type.name', 'Sapphires')
            ->assertJsonPath('data.0.buyer.name', 'Alice Buyer')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'slug',
                        'request_details',
                        'image',
                        'time_ago',
                        'status',
                        'gem_type' => ['id', 'name'],
                        'buyer'    => ['id', 'name', 'avatar'],
                        'created_at',
                    ],
                ],
                'current_page',
                'per_page',
                'total',
                'last_page',
                'pagination',
            ]);

        $this->assertNotNull($response->json('data.0.time_ago'));
        $this->assertNotNull($response->json('data.0.image'));
    }

    public function test_default_sorting_shows_recent_first()
    {
        $buyer = User::factory()->create(['name' => 'John Doe', 'role' => 'buyer']);
        $type = GemType::firstOrCreate(['name' => 'Emeralds'], ['sort_order' => 2, 'status' => 'active']);

        $older = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'request_details' => 'Older gem request',
            'status'          => 'pending',
        ]);
        $older->created_at = Carbon::now()->subDays(5);
        $older->save();

        $newer = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'request_details' => 'Newer gem request',
            'status'          => 'pending',
        ]);
        $newer->created_at = Carbon::now()->subHours(2);
        $newer->save();

        $response = $this->getJson('/api/gem-requests');

        $response->assertStatus(200);
        $items = $response->json('data');
        $this->assertCount(2, $items);
        $this->assertEquals((int) $newer->request_number, $items[0]['id']);
        $this->assertEquals((int) $older->request_number, $items[1]['id']);
    }

    public function test_filter_by_all_returns_all_types_with_recent_first()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $typePearl = GemType::firstOrCreate(['name' => 'Pearl'], ['sort_order' => 1, 'status' => 'active']);
        $typeRuby = GemType::firstOrCreate(['name' => 'Rubies'], ['sort_order' => 2, 'status' => 'active']);

        $req1 = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $typePearl->id,
            'request_details' => 'First pearl',
            'status'          => 'pending',
        ]);
        $req1->created_at = Carbon::now()->subDays(2);
        $req1->save();

        $req2 = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $typeRuby->id,
            'request_details' => 'Second ruby',
            'status'          => 'pending',
        ]);
        $req2->created_at = Carbon::now()->subHour();
        $req2->save();

        $response = $this->getJson('/api/gem-requests?type=all');

        $response->assertStatus(200)
            ->assertJsonPath('total', 2);

        $items = $response->json('data');
        $this->assertEquals((int) $req2->request_number, $items[0]['id']);
        $this->assertEquals((int) $req1->request_number, $items[1]['id']);
    }

    public function test_filter_by_specific_gem_type_name_or_id()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $typePearl = GemType::firstOrCreate(['name' => 'Pearl'], ['sort_order' => 1, 'status' => 'active']);
        $typeRuby = GemType::firstOrCreate(['name' => 'Rubies'], ['sort_order' => 2, 'status' => 'active']);

        GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $typePearl->id,
            'request_details' => 'Pearl request',
            'status'          => 'pending',
        ]);

        GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $typeRuby->id,
            'request_details' => 'Ruby request',
            'status'          => 'pending',
        ]);

        // Filter by type name
        $response = $this->getJson('/api/gem-requests?type=Pearl');
        $response->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.gem_type.name', 'Pearl');

        // Filter by type id
        $responseId = $this->getJson('/api/gem-requests?gem_type_id=' . $typeRuby->id);
        $responseId->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.gem_type.name', 'Rubies');
    }

    public function test_search_filter_matches_details_buyer_name_or_properties()
    {
        $buyer1 = User::factory()->create(['name' => 'Robert Johnson', 'role' => 'buyer']);
        $buyer2 = User::factory()->create(['name' => 'Sarah Connor', 'role' => 'buyer']);

        $type = GemType::firstOrCreate(['name' => 'Diamonds'], ['sort_order' => 1, 'status' => 'active']);

        GemRequest::create([
            'user_id'         => $buyer1->id,
            'gem_type_id'     => $type->id,
            'size'            => '2 carat',
            'request_details' => 'Flawless clarity desired',
            'status'          => 'pending',
        ]);

        GemRequest::create([
            'user_id'         => $buyer2->id,
            'gem_type_id'     => $type->id,
            'size'            => '1 carat',
            'request_details' => 'Regular cut stone',
            'status'          => 'pending',
        ]);

        // Search by detail keyword
        $resp1 = $this->getJson('/api/gem-requests?search=Flawless');
        $resp1->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.request_details', 'Flawless clarity desired');

        // Search by buyer name
        $resp2 = $this->getJson('/api/gem-requests?search=Connor');
        $resp2->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.buyer.name', 'Sarah Connor');
    }

    public function test_view_single_gem_request_returns_all_details()
    {
        $buyer = User::factory()->create(['name' => 'Michael Scott', 'role' => 'buyer']);
        $type = GemType::firstOrCreate(['name' => 'Sapphires'], ['sort_order' => 1, 'status' => 'active']);
        $shape = GemShape::firstOrCreate(['name' => 'Pear'], ['image' => 'storage/gem_shapes/Pear.png', 'sort_order' => 3, 'status' => 'active']);
        $color = GemColor::firstOrCreate(['name' => 'Cornflower Blue'], ['image' => 'storage/gem_colors/Cornflower.png', 'sort_order' => 2, 'status' => 'active']);

        $gemRequest = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'gem_shape_id'    => $shape->id,
            'gem_color_id'    => $color->id,
            'size'            => '9x7 mm',
            'quantity'        => 4,
            'request_details' => 'Deep cornflower blue shade with great clarity.',
            'status'          => 'pending',
        ]);

        // View by request_number
        $response = $this->getJson('/api/gem-requests/' . $gemRequest->request_number);

        $response->assertStatus(200)
            ->assertJsonPath('status', 200)
            ->assertJsonPath('data.id', (int) $gemRequest->request_number)
            ->assertJsonPath('data.slug', $gemRequest->slug)
            ->assertJsonPath('data.size', '9x7 mm')
            ->assertJsonPath('data.quantity', 4)
            ->assertJsonPath('data.request_details', 'Deep cornflower blue shade with great clarity.')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.buyer.name', 'Michael Scott')
            ->assertJsonPath('data.gem_type.name', 'Sapphires')
            ->assertJsonPath('data.gem_shape.name', 'Pear')
            ->assertJsonPath('data.gem_color.name', 'Cornflower Blue');

        // View by slug
        $slugResponse = $this->getJson('/api/gem-requests/' . $gemRequest->slug);
        $slugResponse->assertStatus(200)
            ->assertJsonPath('data.id', (int) $gemRequest->request_number);
    }

    public function test_view_non_existent_gem_request_returns_404()
    {
        $response = $this->getJson('/api/gem-requests/9999999');

        $response->assertStatus(404)
            ->assertJsonPath('message', 'Gem request not found.');
    }

    public function test_only_pending_requests_are_shown_not_in_progress_or_withdrawn()
    {
        $buyer = User::factory()->create(['role' => 'buyer']);
        $type = GemType::firstOrCreate(['name' => 'Pearl'], ['sort_order' => 1, 'status' => 'active']);

        $pending = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'request_details' => 'Pending request',
            'status'          => 'pending',
        ]);

        $inProgress = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'request_details' => 'In progress request',
            'status'          => 'in_progress',
        ]);

        $withdrawn = GemRequest::create([
            'user_id'         => $buyer->id,
            'gem_type_id'     => $type->id,
            'request_details' => 'Withdrawn request',
            'status'          => 'withdrawn',
            'withdrawn_at'    => now(),
        ]);

        // List test: Only pending request should be returned
        $response = $this->getJson('/api/gem-requests');
        $response->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', (int) $pending->request_number)
            ->assertJsonPath('data.0.request_details', 'Pending request');

        // Detail view test: in_progress request returns 404
        $inProgressResponse = $this->getJson('/api/gem-requests/' . $inProgress->request_number);
        $inProgressResponse->assertStatus(404);

        // Detail view test: withdrawn request returns 404
        $withdrawnResponse = $this->getJson('/api/gem-requests/' . $withdrawn->request_number);
        $withdrawnResponse->assertStatus(404);
    }
}
