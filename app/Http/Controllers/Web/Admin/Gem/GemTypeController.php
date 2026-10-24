<?php

namespace App\Http\Controllers\Web\Admin\Gem;

use App\Http\Controllers\Controller;
use App\Models\GemType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GemTypeController extends Controller
{
    public function index()
    {
        $types = GemType::search(['name'])
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->paginateData();

        return Inertia::render('gem/type/index', [
            'types' => $types,
        ]);
    }

    public function create()
    {
        $nextSortOrder = (GemType::max('sort_order') ?? 0) + 1;

        return Inertia::render('gem/type/create', [
            'nextSortOrder' => $nextSortOrder,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->has('items') && is_array($request->items)) {
            $request->validate([
                'items'              => 'required|array|min:1',
                'items.*.name'       => 'required|string|max:255',
                'items.*.sort_order' => 'nullable|integer|min:0',
                'items.*.status'     => 'nullable|in:active,inactive',
            ], [
                'items.*.name.required' => 'The gem type name is required.',
            ]);

            DB::transaction(function () use ($request) {
                $maxOrder = GemType::max('sort_order') ?? 0;

                foreach ($request->items as $item) {
                    $sortOrder = !empty($item['sort_order']) ? (int) $item['sort_order'] : (++$maxOrder);

                    GemType::create([
                        'name'       => $item['name'],
                        'sort_order' => $sortOrder,
                        'status'     => $item['status'] ?? 'active',
                    ]);
                }
            });

            $count = count($request->items);
            $message = $count === 1 ? 'Gem Type created successfully!' : "{$count} Gem Types added successfully!";

            return redirect()->route('gem.types.index')->with('success', $message);
        }

        $request->validate([
            'name'       => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'status'     => 'nullable|in:active,inactive',
        ]);

        $sortOrder = $request->filled('sort_order') && $request->sort_order !== null
            ? (int) $request->sort_order
            : ((GemType::max('sort_order') ?? 0) + 1);

        GemType::create([
            'name'       => $request->name,
            'sort_order' => $sortOrder,
            'status'     => $request->status ?? 'active',
        ]);

        return redirect()->route('gem.types.index')->with('success', 'Gem Type created successfully!');
    }

    public function bulkStore(Request $request)
    {
        return $this->store($request);
    }

    public function edit(GemType $gemType)
    {
        return Inertia::render('gem/type/edit', [
            'gemType' => $gemType,
        ]);
    }

    public function update(Request $request, GemType $gemType)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'status'     => 'nullable|in:active,inactive',
        ]);

        $gemType->update([
            'name'       => $request->name,
            'sort_order' => $request->sort_order ?? $gemType->sort_order,
            'status'     => $request->status ?? 'active',
        ]);

        return redirect()->route('gem.types.index')->with('success', 'Gem Type updated successfully!');
    }

    public function updateStatus(GemType $gemType)
    {
        $gemType->update([
            'status' => $gemType->status === 'active' ? 'inactive' : 'active',
        ]);

        return redirect()->back()->with('success', 'Status updated successfully!');
    }

    public function destroy(GemType $gemType)
    {
        $gemType->delete();

        return redirect()->route('gem.types.index')->with('success', 'Gem Type deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:gem_types,id',
        ]);

        GemType::whereIn('id', $request->ids)->delete();

        return redirect()->route('gem.types.index')->with('success', 'Selected Gem Types deleted successfully!');
    }
}
