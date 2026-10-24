<?php

namespace App\Http\Controllers\API\Gem;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGemProposalRequest;
use App\Http\Resources\GemProposalResource;
use App\Models\GemRequest;
use App\Models\GemRequestProposal;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierGemProposalController extends Controller
{
    use ApiResponse;

    /**
     * Submit a new proposal on a gem request.
     */
    public function store(StoreGemProposalRequest $request, string|int|null $id = null): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'supplier' && $user->role !== 'admin') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $requestId = $id ?? $request->gem_request_id;

        if (!$requestId) {
            return $this->error('Gem request ID is required.', 422);
        }

        $gemRequest = GemRequest::where(function ($query) use ($requestId) {
            if (is_numeric($requestId)) {
                $query->where('request_number', (string) $requestId)
                    ->orWhere('id', (int) $requestId);
            }
            $query->orWhere('slug', (string) $requestId);
        })->first();

        if (!$gemRequest) {
            return $this->error('Gem request not found.', 404);
        }

        // Proposals can only be sent to pending requests
        if ($gemRequest->status !== 'pending') {
            return $this->error('Proposals can only be submitted for active pending gem requests.', 400);
        }

        // Prevent proposing on own request
        if ($gemRequest->user_id === $user->id) {
            return $this->error('You cannot submit a proposal on your own gem request.', 400);
        }

        $uploadedImages = [];

        // Handle multiple images upload
        if ($request->hasFile('images')) {
            $files = $request->file('images');
            if (!is_array($files)) {
                $files = [$files];
            }

            foreach ($files as $file) {
                if ($file && $file->isValid()) {
                    $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $file->getClientOriginalName());
                    $path = Helper::fileUpload($file, 'gem_proposals', $filename);
                    if ($path) {
                        $uploadedImages[] = $path;
                    }
                }
            }
        }

        // Backward compatibility for single image field
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $imageFile = $request->file('image');
            $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $imageFile->getClientOriginalName());
            $path = Helper::fileUpload($imageFile, 'gem_proposals', $filename);
            if ($path) {
                $uploadedImages[] = $path;
            }
        }

        $proposal = GemRequestProposal::create([
            'gem_request_id' => $gemRequest->id,
            'user_id'        => $user->id,
            'price'          => $request->price,
            'description'    => $request->description,
            'images'         => $uploadedImages,
            'status'         => 'pending',
        ]);

        $proposal->load(['supplier', 'gemRequest.gemType']);

        return $this->success(
            'Proposal submitted successfully.',
            new GemProposalResource($proposal),
            201
        );
    }

    /**
     * List all proposals submitted by the authenticated supplier.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'supplier' && $user->role !== 'admin') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $query = GemRequestProposal::where('user_id', $user->id)
            ->with(['supplier', 'gemRequest.gemType'])
            ->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = (int) $request->input('per_page', 15);
        $proposals = $query->paginate($perPage);

        return response()->json([
            'status'       => 200,
            'message'      => 'Proposals retrieved successfully.',
            'data'         => GemProposalResource::collection($proposals),
            'current_page' => $proposals->currentPage(),
            'per_page'     => $proposals->perPage(),
            'total'        => $proposals->total(),
            'last_page'    => $proposals->lastPage(),
            'pagination'   => [
                'current_page' => $proposals->currentPage(),
                'last_page'    => $proposals->lastPage(),
                'per_page'     => $proposals->perPage(),
                'total'        => $proposals->total(),
            ],
        ], 200);
    }

    /**
     * View details of a specific proposal submitted by the authenticated supplier.
     */
    public function show(string|int $id): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'supplier' && $user->role !== 'admin') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $proposal = GemRequestProposal::where('user_id', $user->id)
            ->where('id', $id)
            ->with(['supplier', 'gemRequest.gemType'])
            ->first();

        if (!$proposal) {
            return $this->error('Proposal not found.', 404);
        }

        return $this->success(
            'Proposal retrieved successfully.',
            new GemProposalResource($proposal)
        );
    }
}
