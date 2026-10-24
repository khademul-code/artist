<?php

namespace App\Http\Controllers\API\Gem;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGemRequestRequest;
use App\Http\Requests\UpdateGemRequestRequest;
use App\Http\Resources\GemProposalResource;
use App\Http\Resources\GemRequestResource;
use App\Models\GemRequest;
use App\Models\GemRequestProposal;
use App\Models\GemType;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuyerGemRequestController extends Controller
{
    use ApiResponse;

    /**
     * List all gem requests submitted by the authenticated buyer.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $query = GemRequest::where('user_id', $user->id)
            ->with(['gemType', 'gemShape', 'gemColor'])
            ->orderBy('id', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = (int) $request->input('per_page', 10);
        $requests = $query->paginate($perPage);

        return $this->success('Gem requests retrieved successfully.', [
            'data'         => GemRequestResource::collection($requests),
            'current_page' => $requests->currentPage(),
            'per_page'     => $requests->perPage(),
            'total'        => $requests->total(),
            'last_page'    => $requests->lastPage(),
        ]);
    }

    /**
     * Store a new gem request created by the buyer.
     */
    public function store(StoreGemRequestRequest $request): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $validated = $request->validated();
        $validated['user_id'] = $user->id;
        $validated['status']  = 'pending';

        // Handle optional reference image upload
        if ($request->hasFile('reference_image') && $request->file('reference_image')->isValid()) {
            $imageFile = $request->file('reference_image');
            $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $imageFile->getClientOriginalName());
            $validated['reference_image'] = Helper::fileUpload($imageFile, 'gem_requests', $filename);
        }

        $gemRequest = GemRequest::create($validated);
        $gemRequest->load(['gemType', 'gemShape', 'gemColor']);

        return $this->success(
            'Gem request submitted successfully.',
            new GemRequestResource($gemRequest),
            201
        );
    }

    /**
     * Update an existing gem request created by the buyer.
     */
    public function update(UpdateGemRequestRequest $request, string|int $id): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $gemRequest = $this->findBuyerRequest($user->id, $id);

        if (!$gemRequest) {
            return $this->error('Gem request not found.', 404);
        }

        if ($gemRequest->status === 'withdrawn') {
            return $this->error('This gem request has been withdrawn and cannot be edited.', 400);
        }

        if ($gemRequest->status === 'completed') {
            return $this->error('Completed gem requests cannot be edited.', 400);
        }

        $validated = $request->validated();

        // Handle optional reference image upload update
        if ($request->hasFile('reference_image') && $request->file('reference_image')->isValid()) {
            $imageFile = $request->file('reference_image');
            $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $imageFile->getClientOriginalName());
            $newImagePath = Helper::fileUpload($imageFile, 'gem_requests', $filename);

            if ($newImagePath) {
                // Delete previous file if exists
                if ($gemRequest->reference_image) {
                    try {
                        Helper::fileDelete(public_path($gemRequest->reference_image));
                    } catch (\Throwable $e) {
                        // ignore file deletion failure
                    }
                }
                $validated['reference_image'] = $newImagePath;
            }
        }

        // Update slug if gem_type_id changed
        if (isset($validated['gem_type_id']) && $validated['gem_type_id'] != $gemRequest->gem_type_id) {
            $newType = GemType::find($validated['gem_type_id']);
            if ($newType) {
                $validated['slug'] = GemRequest::generateSlug($newType->name, $gemRequest->request_number);
            }
        }

        $gemRequest->update($validated);
        $gemRequest->load(['gemType', 'gemShape', 'gemColor']);

        return $this->success(
            'Gem request updated successfully.',
            new GemRequestResource($gemRequest)
        );
    }

    /**
     * Preview / Show the full details of a specific gem request.
     */
    public function show(string|int $id): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $gemRequest = $this->findBuyerRequest($user->id, $id);

        if (!$gemRequest) {
            return $this->error('Gem request not found.', 404);
        }

        return $this->success(
            'Gem request details retrieved successfully.',
            new GemRequestResource($gemRequest)
        );
    }

    /**
     * Withdraw an active gem request.
     */
    public function withdraw(string|int $id): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $gemRequest = $this->findBuyerRequest($user->id, $id);

        if (!$gemRequest) {
            return $this->error('Gem request not found.', 404);
        }

        if ($gemRequest->status === 'withdrawn') {
            return $this->error('This gem request has already been withdrawn.', 400);
        }

        if ($gemRequest->status === 'completed') {
            return $this->error('Completed gem requests cannot be withdrawn.', 400);
        }

        $gemRequest->update([
            'status'       => 'withdrawn',
            'withdrawn_at' => now(),
        ]);

        return $this->success(
            'Gem request withdrawn successfully.',
            new GemRequestResource($gemRequest->fresh(['gemType', 'gemShape', 'gemColor']))
        );
    }

    /**
     * Helper to find a buyer's request by request number, ID, or slug.
     */
    protected function findBuyerRequest(int $userId, string|int $id): ?GemRequest
    {
        return GemRequest::where('user_id', $userId)
            ->where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('request_number', (string) $id)
                        ->orWhere('id', (int) $id);
                }
                $query->orWhere('slug', (string) $id);
            })
            ->with(['gemType', 'gemShape', 'gemColor'])
            ->first();
    }

    /**
     * List all proposals received on a specific gem request for the buyer.
     */
    public function proposals(Request $request, string|int $id): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $gemRequest = $this->findBuyerRequest($user->id, $id);

        if (!$gemRequest) {
            return $this->error('Gem request not found.', 404);
        }

        $query = $gemRequest->proposals()
            ->with(['supplier'])
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
     * View details of a specific proposal received on one of the buyer's gem requests.
     */
    public function showProposal(string|int $id): JsonResponse
    {
        $user = auth()->user();

        if ($user->role !== 'buyer') {
            return $this->error('You are not authorized to perform this action.', 403);
        }

        $proposal = GemRequestProposal::whereHas('gemRequest', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
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
