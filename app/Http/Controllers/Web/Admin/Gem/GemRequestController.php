<?php

namespace App\Http\Controllers\Web\Admin\Gem;

use App\Http\Controllers\Controller;
use App\Models\GemRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GemRequestController extends Controller
{
    /**
     * Display a listing of gem requests with status metrics and filters.
     */
    public function index(Request $request): Response
    {
        $query = GemRequest::with(['user', 'gemType', 'gemShape', 'gemColor'])
            ->latest();

        // Filter by Status
        if ($request->filled('status') && in_array($request->status, ['pending', 'in_progress', 'completed', 'withdrawn'])) {
            $query->where('status', $request->status);
        }

        // Search across request_number, details, size, user, and gem type
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('size', 'like', "%{$search}%")
                    ->orWhere('request_details', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('gemType', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 10);
        $requests = $query->paginate($perPage)->withQueryString();

        // Calculate counts for all statuses to power quick status tabs & metric cards
        $statusCounts = [
            'all'         => GemRequest::count(),
            'pending'     => GemRequest::where('status', 'pending')->count(),
            'in_progress' => GemRequest::where('status', 'in_progress')->count(),
            'completed'   => GemRequest::where('status', 'completed')->count(),
            'withdrawn'   => GemRequest::where('status', 'withdrawn')->count(),
        ];

        return Inertia::render('gem/request/index', [
            'requests'     => $requests,
            'statusCounts' => $statusCounts,
            'filters'      => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    /**
     * Display the specified gem request.
     */
    public function show(GemRequest $gemRequest, Request $request)
    {
        $gemRequest->load(['user', 'gemType', 'gemShape', 'gemColor']);

        if ($request->wantsJson()) {
            return response()->json($gemRequest);
        }

        return Inertia::render('gem/request/show', [
            'gemRequest' => $gemRequest,
        ]);
    }

    /**
     * Update the status of a gem request (pending, in_progress, completed, withdrawn).
     */
    public function updateStatus(Request $request, GemRequest $gemRequest)
    {
        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,withdrawn',
        ]);

        $newStatus = $request->status;

        // If transitioning to withdrawn, record the timestamp
        if ($newStatus === 'withdrawn' && empty($gemRequest->withdrawn_at)) {
            $gemRequest->withdrawn_at = now();
        } elseif ($newStatus !== 'withdrawn') {
            $gemRequest->withdrawn_at = null;
        }

        $gemRequest->status = $newStatus;
        $gemRequest->save();

        $statusLabel = ucfirst(str_replace('_', ' ', $newStatus));

        return redirect()->back()->with('success', "Request #{$gemRequest->request_number} status updated to {$statusLabel}!");
    }

    /**
     * Delete a single gem request.
     */
    public function destroy(GemRequest $gemRequest)
    {
        if ($gemRequest->reference_image && file_exists(public_path($gemRequest->reference_image))) {
            @unlink(public_path($gemRequest->reference_image));
        }

        $gemRequest->delete();

        return redirect()->back()->with('success', "Gem request #{$gemRequest->request_number} deleted successfully!");
    }

    /**
     * Bulk delete gem requests.
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:gem_requests,id',
        ]);

        $requests = GemRequest::whereIn('id', $request->ids)->get();

        foreach ($requests as $item) {
            if ($item->reference_image && file_exists(public_path($item->reference_image))) {
                @unlink(public_path($item->reference_image));
            }
            $item->delete();
        }

        return redirect()->back()->with('success', count($request->ids) . ' gem requests deleted successfully!');
    }
}
