<?php

namespace App\Http\Controllers\Web\Admin\Review;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::with(['user', 'jewelryCard'])->search(['comment'])->paginateData(request('per_page', 10));

        return Inertia::render('review/index', [
            'reviews' => $reviews,
        ]);
    }

    public function destroy(Review $review)
    {
        $review->delete();
        return redirect()->route('review.index')->with('success', 'Review deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:reviews,id',
        ]);

        Review::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', 'Selected reviews deleted successfully!');
    }
}
