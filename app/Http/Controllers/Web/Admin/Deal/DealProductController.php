<?php

namespace App\Http\Controllers\Web\Admin\Deal;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealProductController extends Controller
{
    /**
     * Display a listing of deal products with filters, metrics, status management, and search.
     */
    public function index(Request $request): Response
    {
        $query = Product::with(['category', 'user'])->latest();

        // Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Payment Status Filter
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        // Category Filter
        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('product_category_id', $request->category_id);
        }

        // Supplier Filter
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('product_type', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 10);
        $products = $query->paginate($perPage)->withQueryString();

        // Status Counts for Quick Filter Tabs
        $statusCounts = [
            'all'             => Product::count(),
            'active'          => Product::where('status', 'active')->count(),
            'pending_payment' => Product::where('status', 'pending_payment')->count(),
            'sold'            => Product::where('status', 'sold')->count(),
            'expired'         => Product::where('status', 'expired')->count(),
            'inactive'        => Product::where('status', 'inactive')->count(),
        ];

        // Overall Business Metrics
        $metrics = [
            'total_deals'   => $statusCounts['all'],
            'active_deals'  => $statusCounts['active'],
            'sold_deals'    => $statusCounts['sold'],
            'expired_deals' => $statusCounts['expired'],
            'total_revenue' => (float) Product::where('payment_status', 'paid')->sum('payment_fee'),
            'total_views'   => (int) Product::sum('view_count'),
        ];

        $categories = ProductCategory::orderBy('name')->get(['id', 'name', 'status']);
        $suppliers = User::where('role', 'supplier')->orderBy('name')->get(['id', 'name', 'email', 'role']);

        return Inertia::render('deal/product/index', [
            'products'     => $products,
            'statusCounts' => $statusCounts,
            'metrics'      => $metrics,
            'categories'   => $categories,
            'suppliers'    => $suppliers,
            'filters'      => $request->only(['search', 'status', 'payment_status', 'category_id', 'user_id', 'per_page']),
        ]);
    }

    /**
     * Display the specified deal product details.
     */
    public function show(Product $product): Response
    {
        $product->load(['category', 'user']);

        return Inertia::render('deal/product/show', [
            'product' => $product,
        ]);
    }

    /**
     * Update product status (e.g. toggle active/inactive or set sold/expired/pending_payment).
     */
    public function updateStatus(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,sold,expired,pending_payment',
        ]);

        $product->update([
            'status' => $validated['status'],
        ]);

        $statusLabel = ucfirst(str_replace('_', ' ', $validated['status']));

        return redirect()->back()->with('success', "Product status updated to {$statusLabel} successfully!");
    }

    /**
     * Remove the specified deal product and its images.
     */
    public function destroy(Request $request, $product): RedirectResponse
    {
        $item = $product instanceof Product 
            ? $product 
            : Product::where('id', $product)->orWhere('slug', $product)->firstOrFail();

        if (is_array($item->images)) {
            foreach ($item->images as $img) {
                Helper::fileDelete(public_path($img));
            }
        }

        $item->delete();

        $referer = $request->header('referer', '');
        if (str_contains($referer, '/deal/product/' . $item->id) || str_contains($referer, '/deal/product/' . $item->slug)) {
            return redirect()->route('deal.product.index')->with('success', 'Deal product deleted successfully!');
        }

        return redirect()->back()->with('success', 'Deal product deleted successfully!');
    }

    /**
     * Bulk destroy selected products.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'exists:products,id',
        ]);

        $products = Product::whereIn('id', $validated['ids'])->get();

        foreach ($products as $product) {
            if (is_array($product->images)) {
                foreach ($product->images as $img) {
                    Helper::fileDelete(public_path($img));
                }
            }
            $product->delete();
        }

        return redirect()->back()->with('success', count($validated['ids']) . ' deal products deleted successfully!');
    }
}
