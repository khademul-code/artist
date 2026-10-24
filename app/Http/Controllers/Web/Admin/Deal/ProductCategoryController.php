<?php

namespace App\Http\Controllers\Web\Admin\Deal;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductCategoryController extends Controller
{
    public function index()
    {
        $categories = ProductCategory::search(['name'])->paginateData();

        return Inertia::render('deal/product_category/index', [
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        return redirect()->route('deal.product-category.index');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        ProductCategory::create([
            'name' => $request->name,
            'status' => $request->status ?? 'active',
        ]);

        return redirect()->route('deal.product-category.index')->with('success', 'Product category created successfully!');
    }

    public function edit(ProductCategory $productCategory)
    {
        return redirect()->route('deal.product-category.index');
    }

    public function update(Request $request, ProductCategory $productCategory)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        $productCategory->update([
            'name' => $request->name,
            'status' => $request->status ?? $productCategory->status,
        ]);

        return redirect()->route('deal.product-category.index')->with('success', 'Product category updated successfully!');
    }

    public function updateStatus(ProductCategory $productCategory)
    {
        $productCategory->update([
            'status' => $productCategory->status === 'active' ? 'inactive' : 'active',
        ]);

        return redirect()->back()->with('success', 'Status updated successfully!');
    }

    public function destroy(ProductCategory $productCategory)
    {
        $productCategory->delete();

        return redirect()->route('deal.product-category.index')->with('success', 'Product category deleted successfully!');
    }
}
