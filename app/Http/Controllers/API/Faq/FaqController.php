<?php

namespace App\Http\Controllers\API\Faq;

use App\Http\Controllers\Controller;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    use ApiResponse;

    public function forSupplier(Request $request)
    {
        $faqs = Faq::where('status', 'active')
            ->whereNot('type', 'buyer')->get();

        $faqs = FaqResource::collection($faqs);

        return $this->success('Supplier FAQs retrieved successfully!', $faqs, 200);
    }

    public function forBuyer(Request $request)
    {
        $faqs = Faq::where('status', 'active')
            ->whereNot('type', 'supplier')->get();

        $faqs = FaqResource::collection($faqs);

        return $this->success('Buyer FAQs retrieved successfully!', $faqs, 200);
    }
}
