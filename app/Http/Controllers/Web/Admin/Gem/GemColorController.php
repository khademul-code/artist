<?php

namespace App\Http\Controllers\Web\Admin\Gem;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Models\GemColor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GemColorController extends Controller
{
    public function index()
    {
        $colors = GemColor::search(['name'])
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->paginateData();

        return Inertia::render('gem/color/index', [
            'colors' => $colors,
        ]);
    }

    public function create()
    {
        $nextSortOrder = (GemColor::max('sort_order') ?? 0) + 1;

        return Inertia::render('gem/color/create', [
            'nextSortOrder' => $nextSortOrder,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->has('items') && is_array($request->items)) {
            $request->validate([
                'items'              => 'required|array|min:1',
                'items.*.name'       => 'required|string|max:255',
                'items.*.image'      => 'required|image|max:10240',
                'items.*.sort_order' => 'nullable|integer|min:0',
                'items.*.status'     => 'nullable|in:active,inactive',
            ], [
                'items.*.name.required'  => 'The color name is required.',
                'items.*.image.required' => 'The swatch image is required.',
                'items.*.image.image'    => 'The swatch must be a valid image file.',
                'items.*.image.max'      => 'The image file size may not exceed 10MB.',
            ]);

            DB::transaction(function () use ($request) {
                $maxOrder = GemColor::max('sort_order') ?? 0;

                foreach ($request->items as $index => $itemData) {
                    $imagePath = null;
                    if ($request->hasFile("items.{$index}.image")) {
                        $file = $request->file("items.{$index}.image");
                        if ($file->isValid()) {
                            $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $file->getClientOriginalName());
                            $imagePath = Helper::fileUpload($file, 'gem_colors', $filename);
                        }
                    }

                    $sortOrder = !empty($itemData['sort_order']) ? (int) $itemData['sort_order'] : (++$maxOrder);

                    GemColor::create([
                        'name'       => $itemData['name'],
                        'image'      => $imagePath,
                        'sort_order' => $sortOrder,
                        'status'     => $itemData['status'] ?? 'active',
                    ]);
                }
            });

            $count = count($request->items);
            $message = $count === 1 ? 'Gem Color created successfully!' : "{$count} Gem Colors added successfully!";

            return redirect()->route('gem.colors.index')->with('success', $message);
        }

        $request->validate([
            'name'       => 'required|string|max:255',
            'image'      => 'required|image|max:10240',
            'sort_order' => 'nullable|integer|min:0',
            'status'     => 'nullable|in:active,inactive',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            if ($image->isValid()) {
                $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $image->getClientOriginalName());
                $imagePath = Helper::fileUpload($image, 'gem_colors', $filename);
            }
        }

        $sortOrder = $request->filled('sort_order') && $request->sort_order !== null
            ? (int) $request->sort_order
            : ((GemColor::max('sort_order') ?? 0) + 1);

        GemColor::create([
            'name'       => $request->name,
            'image'      => $imagePath,
            'sort_order' => $sortOrder,
            'status'     => $request->status ?? 'active',
        ]);

        return redirect()->route('gem.colors.index')->with('success', 'Gem Color created successfully!');
    }

    public function bulkStore(Request $request)
    {
        return $this->store($request);
    }

    public function edit(GemColor $gemColor)
    {
        return Inertia::render('gem/color/edit', [
            'gemColor' => $gemColor,
        ]);
    }

    public function update(Request $request, GemColor $gemColor)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'image'      => 'nullable|image|max:10240',
            'sort_order' => 'nullable|integer|min:0',
            'status'     => 'nullable|in:active,inactive',
        ]);

        $data = [
            'name'       => $request->name,
            'sort_order' => $request->sort_order ?? $gemColor->sort_order,
            'status'     => $request->status ?? 'active',
        ];

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            if ($image->isValid()) {
                if ($gemColor->image) {
                    Helper::fileDelete(public_path($gemColor->image));
                }
                $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $image->getClientOriginalName());
                $data['image'] = Helper::fileUpload($image, 'gem_colors', $filename);
            }
        }

        $gemColor->update($data);

        return redirect()->route('gem.colors.index')->with('success', 'Gem Color updated successfully!');
    }

    public function updateStatus(GemColor $gemColor)
    {
        $gemColor->update([
            'status' => $gemColor->status === 'active' ? 'inactive' : 'active',
        ]);

        return redirect()->back()->with('success', 'Status updated successfully!');
    }

    public function destroy(GemColor $gemColor)
    {
        if ($gemColor->image) {
            Helper::fileDelete(public_path($gemColor->image));
        }

        $gemColor->delete();

        return redirect()->route('gem.colors.index')->with('success', 'Gem Color deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:gem_colors,id',
        ]);

        $colors = GemColor::whereIn('id', $request->ids)->get();
        foreach ($colors as $color) {
            if ($color->image) {
                Helper::fileDelete(public_path($color->image));
            }
            $color->delete();
        }

        return redirect()->route('gem.colors.index')->with('success', 'Selected Gem Colors deleted successfully!');
    }
}
