<?php

namespace App\Http\Controllers\Web\Admin\Gem;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Models\GemShape;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GemShapeController extends Controller
{
    public function index()
    {
        $shapes = GemShape::search(['name'])
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->paginateData();

        return Inertia::render('gem/shape/index', [
            'shapes' => $shapes,
        ]);
    }

    public function create()
    {
        $nextSortOrder = (GemShape::max('sort_order') ?? 0) + 1;

        return Inertia::render('gem/shape/create', [
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
                'items.*.name.required'  => 'The shape name is required.',
                'items.*.image.required' => 'The shape cut image is required.',
                'items.*.image.image'    => 'The shape cut must be a valid image file.',
                'items.*.image.max'      => 'The image file size may not exceed 10MB.',
            ]);

            DB::transaction(function () use ($request) {
                $maxOrder = GemShape::max('sort_order') ?? 0;

                foreach ($request->items as $index => $itemData) {
                    $imagePath = null;
                    if ($request->hasFile("items.{$index}.image")) {
                        $file = $request->file("items.{$index}.image");
                        if ($file->isValid()) {
                            $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $file->getClientOriginalName());
                            $imagePath = Helper::fileUpload($file, 'gem_shapes', $filename);
                        }
                    }

                    $sortOrder = !empty($itemData['sort_order']) ? (int) $itemData['sort_order'] : (++$maxOrder);

                    GemShape::create([
                        'name'       => $itemData['name'],
                        'image'      => $imagePath,
                        'sort_order' => $sortOrder,
                        'status'     => $itemData['status'] ?? 'active',
                    ]);
                }
            });

            $count = count($request->items);
            $message = $count === 1 ? 'Gem Shape created successfully!' : "{$count} Gem Shapes added successfully!";

            return redirect()->route('gem.shapes.index')->with('success', $message);
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
                $imagePath = Helper::fileUpload($image, 'gem_shapes', $filename);
            }
        }

        $sortOrder = $request->filled('sort_order') && $request->sort_order !== null
            ? (int) $request->sort_order
            : ((GemShape::max('sort_order') ?? 0) + 1);

        GemShape::create([
            'name'       => $request->name,
            'image'      => $imagePath,
            'sort_order' => $sortOrder,
            'status'     => $request->status ?? 'active',
        ]);

        return redirect()->route('gem.shapes.index')->with('success', 'Gem Shape created successfully!');
    }

    public function bulkStore(Request $request)
    {
        return $this->store($request);
    }

    public function edit(GemShape $gemShape)
    {
        return Inertia::render('gem/shape/edit', [
            'gemShape' => $gemShape,
        ]);
    }

    public function update(Request $request, GemShape $gemShape)
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'image'      => 'nullable|image|max:10240',
            'sort_order' => 'nullable|integer|min:0',
            'status'     => 'nullable|in:active,inactive',
        ]);

        $data = [
            'name'       => $request->name,
            'sort_order' => $request->sort_order ?? $gemShape->sort_order,
            'status'     => $request->status ?? 'active',
        ];

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            if ($image->isValid()) {
                if ($gemShape->image) {
                    Helper::fileDelete(public_path($gemShape->image));
                }
                $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $image->getClientOriginalName());
                $data['image'] = Helper::fileUpload($image, 'gem_shapes', $filename);
            }
        }

        $gemShape->update($data);

        return redirect()->route('gem.shapes.index')->with('success', 'Gem Shape updated successfully!');
    }

    public function updateStatus(GemShape $gemShape)
    {
        $gemShape->update([
            'status' => $gemShape->status === 'active' ? 'inactive' : 'active',
        ]);

        return redirect()->back()->with('success', 'Status updated successfully!');
    }

    public function destroy(GemShape $gemShape)
    {
        if ($gemShape->image) {
            Helper::fileDelete(public_path($gemShape->image));
        }

        $gemShape->delete();

        return redirect()->route('gem.shapes.index')->with('success', 'Gem Shape deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:gem_shapes,id',
        ]);

        $shapes = GemShape::whereIn('id', $request->ids)->get();
        foreach ($shapes as $shape) {
            if ($shape->image) {
                Helper::fileDelete(public_path($shape->image));
            }
            $shape->delete();
        }

        return redirect()->route('gem.shapes.index')->with('success', 'Selected Gem Shapes deleted successfully!');
    }
}
