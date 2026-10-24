<?php

namespace App\Http\Controllers\API\Jewelry;

use App\Http\Controllers\Controller;
use App\Http\Resources\JewelryDetailResource;
use App\Http\Resources\ReviewResource;
use App\Models\JewelryCard;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JewelryController extends Controller
{
    public function jewelryCard(Request $request)
    {
        $query = JewelryCard::query()
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        $perPage = $request->filled('per_page') ? (int)$request->per_page : 12;

        if ($request->filled('search')) {
            $search = strtolower(trim($request->search));

            $query->where(function ($query) use ($search) {
                $query->whereRaw("LOWER(company_name) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(company_type) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(JSON_UNQUOTE(trade_show)) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(JSON_UNQUOTE(business_category)) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(booth_number) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(company_bio) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(city) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(zip_code) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("LOWER(address) LIKE ?", ["%{$search}%"]);
            });
        }

        $jewelryCards = $query->paginateData($perPage);

        $jewelryCards->setCollection(
            $jewelryCards->getCollection()->map(function ($card) {
                return [
                    'id'                => $card->id,
                    'company_name'      => $card->company_name,
                    'city'              => $card->city,
                    'zip_code'          => $card->zip_code,
                    'sendContact_url'   => $card->mini_site_url,
                    'full_image_path'   => $card->full_image_path,
                    'avg_rating'        => round($card->reviews_avg_rating ?? 0, 1),
                    'reviews_count'     => $card->reviews_count,
                ];
            })
        );

        return response()->json([
            'success' => true,
            'data' => $jewelryCards,
        ]);
    }

    public function jewelryCardDetail($id)
    {
        $jewelryCard = JewelryCard::withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->find($id);

        if (!$jewelryCard) {
            return response()->json([
                'success' => false,
                'message' => 'Jewelry card not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Jewelry details fetched successfully',
            'data' => new JewelryDetailResource($jewelryCard),
        ]);
    }

    public function review(Request $request){

        $validator = Validator::make($request->all(), [
            'jewelry_card_id'   => 'required|exists:jewelry_cards,id',
            'rating'            => 'required|integer|min:1|max:5',
            'comment'           => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth()->user();

        $review = Review::create([
            'jewelry_card_id'   => $request->jewelry_card_id,
            'user_id'           => $user->id,
            'rating'            => $request->rating,
            'comment'           => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review created successfully',
            'data' => $review,
        ]); 
    }

    public function getReviews($id)
    {
        $reviews = Review::with('user')
            ->where('jewelry_card_id', $id)
            ->paginate(10);

        return ReviewResource::collection($reviews)
            ->additional([
                'success' => true,
                'message' => 'Reviews fetched successfully',
            ]);
    }
}
