<?php

namespace App\Http\Controllers\API\Gem;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicGemRequestDetailResource;
use App\Http\Resources\PublicGemRequestListResource;
use App\Models\GemRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GemRequestController extends Controller
{
    use ApiResponse;

    /**
     * Public listing of gem requests for sellers and users.
     * Supports search, filter by gem types, and default sorting (recent first).
     */
    public function index(Request $request): JsonResponse
    {
        $query = GemRequest::with(['user', 'gemType'])
            ->where('status', 'pending');

        // Filter by gem type / types
        $typeInput = $request->input('type') 
            ?? $request->input('types') 
            ?? $request->input('gem_type_id') 
            ?? $request->input('type_id');

        if ($typeInput !== null && $typeInput !== '') {
            $types = $this->parseTypeList($typeInput);

            // If not filtering for 'all'
            $hasAll = in_array('all', array_map('strtolower', $types), true) || in_array('*', $types, true);
            if (!$hasAll && !empty($types)) {
                $query->where(function ($q) use ($types) {
                    $numericIds = array_filter($types, 'is_numeric');
                    $stringNames = array_filter($types, fn($item) => !is_numeric($item));

                    if (!empty($numericIds)) {
                        $q->whereIn('gem_type_id', array_map('intval', $numericIds));
                    }

                    if (!empty($stringNames)) {
                        $q->orWhereHas('gemType', function ($tq) use ($stringNames) {
                            $tq->where(function ($subQ) use ($stringNames) {
                                foreach ($stringNames as $name) {
                                    $subQ->orWhere('name', 'like', "%{$name}%");
                                }
                            });
                        });
                    }
                });
            }
        }

        // Search across request_details, request_number, slug, size, buyer, and gem details
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('request_details', 'like', "%{$search}%")
                    ->orWhere('size', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('business_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('gemType', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('gemShape', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('gemColor', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sorting: default to recent come first (latest)
        $sortBy = strtolower(trim((string) $request->input('sort_by', 'recent')));
        match ($sortBy) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            default  => $query->latest(), // time wise recent come first
        };

        $perPage = (int) $request->input('per_page', 15);
        $requests = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'status'       => 200,
            'message'      => 'Gem requests retrieved successfully.',
            'data'         => PublicGemRequestListResource::collection($requests),
            'current_page' => $requests->currentPage(),
            'per_page'     => $requests->perPage(),
            'total'        => $requests->total(),
            'last_page'    => $requests->lastPage(),
            'pagination'   => [
                'current_page'  => $requests->currentPage(),
                'last_page'     => $requests->lastPage(),
                'per_page'      => $requests->perPage(),
                'total'         => $requests->total(),
                'from'          => $requests->firstItem(),
                'to'            => $requests->lastItem(),
                'next_page_url' => $requests->nextPageUrl(),
                'prev_page_url' => $requests->previousPageUrl(),
            ],
        ], 200);
    }

    /**
     * Public view / details of a single gem request.
     * Can look up by request_number, ID, or slug.
     */
    public function show(string|int $id): JsonResponse
    {
        $gemRequest = GemRequest::with(['user', 'gemType', 'gemShape', 'gemColor'])
            ->where('status', 'pending')
            ->where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('request_number', (string) $id)
                        ->orWhere('id', (int) $id);
                }
                $query->orWhere('slug', (string) $id);
            })
            ->first();

        if (!$gemRequest) {
            return $this->error('Gem request not found.', 404);
        }

        return $this->success(
            'Gem request details retrieved successfully.',
            new PublicGemRequestDetailResource($gemRequest)
        );
    }

    /**
     * Helper to normalize type filter input into array of values.
     */
    protected function parseTypeList(mixed $typeInput): array
    {
        if (is_array($typeInput)) {
            return array_values(array_filter(array_map('trim', $typeInput)));
        }

        $inputStr = trim((string) $typeInput);

        if (str_starts_with($inputStr, '[') && str_ends_with($inputStr, ']')) {
            $decoded = json_decode($inputStr, true);
            if (is_array($decoded)) {
                return array_values(array_filter(array_map('trim', $decoded)));
            }
        }

        if (str_contains($inputStr, ',')) {
            return array_values(array_filter(array_map('trim', explode(',', $inputStr))));
        }

        return [$inputStr];
    }
}
