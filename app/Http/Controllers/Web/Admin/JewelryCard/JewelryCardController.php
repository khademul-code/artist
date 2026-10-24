<?php

namespace App\Http\Controllers\Web\Admin\JewelryCard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JewelryCard;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class JewelryCardController extends Controller
{
    public function index()
    {
        $jewelryCards = JewelryCard::search(['company_type', 'trade_show', 'booth_number'])->paginateData();

        return Inertia::render('jewelry_card/index', [
            'jewelryCards' => $jewelryCards,
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('jewelry_card/create', [
            'initialData' => $request->only([
                'image','company_name', 'company_type', 'business_category', 
                'company_bio', 'email', 'phone', 'address', 'city', 'zip_code',
                'mini_site_url', 'company_information_id'
            ])
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'company_name'          => 'nullable|string',
            'mini_site_url'         => 'required|url',
            'company_type'          => 'nullable|string',
            'business_category'     => 'nullable',
            'trade_show'            => 'nullable',
            'booth_number'          => 'nullable|string',
            'company_bio'           => 'nullable|string',
            'email'                 => 'nullable|email',
            'phone'                 => 'nullable|string',
            'address'               => 'nullable|string',
            'city'                  => 'nullable|string',
            'zip_code'              => 'nullable|string',
            'company_information_id'=> 'nullable|exists:company_information,id',
        ];

        if ($request->hasFile('image')) {
            $rules['image'] = 'required|image|max:10240';
        } else {
            $rules['image'] = 'required|string';
        }

        $request->validate($rules);

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('jewelry_cards', 'public');
        } else {
            $imagePath = $request->image;
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        JewelryCard::create([
            'image'                 => $imagePath,
            'company_name'          => $request->company_name,
            'mini_site_url'         => $request->mini_site_url,
            'company_type'          => $request->company_type,
            'business_category'     => is_string($request->business_category) ? array_map('trim', explode(',', $request->business_category)) : $request->business_category,
            'trade_show'            => is_string($request->trade_show) ? array_map('trim', explode(',', $request->trade_show)) : $request->trade_show,
            'booth_number'          => $request->booth_number,
            'company_bio'           => $request->company_bio,
            'email'                 => $request->email,
            'phone'                 => $request->phone,
            'address'               => $request->address,
            'city'                  => $request->city,
            'zip_code'              => $request->zip_code,
            'status'                => 'publish',
        ]);

        if ($request->filled('company_information_id')) {
            $companyInfo = \App\Models\CompanyInformation::find($request->company_information_id);
            if ($companyInfo) {
                $companyInfo->update(['status' => 'approved']);
            }
        }

        return redirect()->route('jewelry_card.index')->with('success', 'Jewelry Card created successfully!');
    }

    public function edit(JewelryCard $jewelryCard)
    {
        return Inertia::render('jewelry_card/edit', [
            'jewelryCard' => $jewelryCard,
        ]);
    }

    public function update(Request $request, JewelryCard $jewelryCard)
    {
        $request->validate([
            'image'                 => 'nullable|image|max:10240',
            'company_name'          => 'nullable|string',
            'mini_site_url'         => 'required|url',
            'company_type'          => 'nullable|string',
            'business_category'     => 'nullable',
            'trade_show'            => 'nullable',
            'booth_number'          => 'nullable|string',
            'company_bio'           => 'nullable|string',
            'email'                 => 'nullable|email',
            'phone'                 => 'nullable|string',
            'address'               => 'nullable|string',
            'city'                  => 'nullable|string',
            'zip_code'              => 'nullable|string',
        ]);

        $data = [
            'company_name'          => $request->company_name,
            'mini_site_url'         => $request->mini_site_url,
            'company_type'          => $request->company_type,
            'business_category'     => is_string($request->business_category) ? array_map('trim', explode(',', $request->business_category)) : $request->business_category,
            'trade_show'            => is_string($request->trade_show) ? array_map('trim', explode(',', $request->trade_show)) : $request->trade_show,
            'booth_number'          => $request->booth_number,
            'company_bio'           => $request->company_bio,
            'email'                 => $request->email,
            'phone'                 => $request->phone,
            'address'               => $request->address,
            'city'                  => $request->city,
            'zip_code'              => $request->zip_code,
        ];

        if ($request->hasFile('image')) {
            if ($jewelryCard->image) {
                Storage::disk('public')->delete($jewelryCard->image);
            }
            $data['image'] = $request->file('image')->store('jewelry_cards', 'public');
        }

        $jewelryCard->update($data);

        return redirect()->route('jewelry_card.index')->with('success', 'Jewelry Card updated successfully!');
    }

    public function destroy(JewelryCard $jewelryCard)
    {
        if ($jewelryCard->image) {
            Storage::disk('public')->delete($jewelryCard->image);
        }
        $jewelryCard->delete();
        return redirect()->route('jewelry_card.index')->with('success', 'Jewelry Card deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:jewelry_cards,id',
        ]);

        $jewelryCards = JewelryCard::whereIn('id', $request->ids)->get();
        foreach ($jewelryCards as $card) {
            if ($card->image) {
                Storage::disk('public')->delete($card->image);
            }
            $card->delete();
        }

        return redirect()->back()->with('success', 'Selected jewelry cards deleted successfully!');
    }
}
