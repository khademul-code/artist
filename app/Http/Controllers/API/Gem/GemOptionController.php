<?php

namespace App\Http\Controllers\API\Gem;

use App\Http\Controllers\Controller;
use App\Http\Resources\GemColorResource;
use App\Http\Resources\GemShapeResource;
use App\Http\Resources\GemTypeResource;
use App\Models\GemColor;
use App\Models\GemShape;
use App\Models\GemType;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GemOptionController extends Controller
{
    use ApiResponse;

    /**
     * Get all active gem options (types, colors, shapes) in one combined response.
     */
    public function options(Request $request): JsonResponse
    {
        $types = GemType::where('status', 'active')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $colors = GemColor::where('status', 'active')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $shapes = GemShape::where('status', 'active')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return $this->success('Gem options retrieved successfully.', [
            'types'  => GemTypeResource::collection($types),
            'colors' => GemColorResource::collection($colors),
            'shapes' => GemShapeResource::collection($shapes),
        ]);
    }
}
