<?php

namespace App\Http\Controllers\Web\Admin\CompanyInformation;

use App\Http\Controllers\Controller;
use App\Models\CompanyInformation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Mail;
use App\Mail\JewelryCardStatusUpdated;

class CompanyInformationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CompanyInformation::with('user')->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('company_phone', 'like', "%{$search}%")
                  ->orWhere('company_address', 'like', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->filled('per_page') ? (int)$request->per_page : 10;
        $companyInfos = $query->paginate($perPage)->withQueryString();

        return Inertia::render('company_information/index', [
            'companyInfos' => $companyInfos,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function destroy(CompanyInformation $companyInformation)
    {
        if ($companyInformation->image) {
            \App\Helpers\Helper::fileDelete($companyInformation->image);
        }
        $companyInformation->delete();
        return redirect()->back()->with('success', 'Company Information deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:company_information,id',
        ]);

        $companyInfos = CompanyInformation::whereIn('id', $request->ids)->get();
        foreach ($companyInfos as $info) {
            if ($info->image) {
                \App\Helpers\Helper::fileDelete($info->image);
            }
            $info->delete();
        }

        return redirect()->back()->with('success', 'Selected company information deleted successfully!');
    }

    // public function sendReminder(CompanyInformation $companyInformation)
    // {
    //     $companyInformation->load('user');

    //     if ($companyInformation->user && $companyInformation->user->email) {
    //         \Illuminate\Support\Facades\Mail::to($companyInformation->user->email)
    //             ->send(new \App\Mail\SendContactLinkReminder($companyInformation));

    //         $companyInformation->update(['status' => 'requires_changes']);
                
    //         return redirect()->back()->with('success', 'Reminder email sent successfully!');
    //     }

    //     return redirect()->back()->with('error', 'User email not found.');
    // }

    public function updateStatus(Request $request, CompanyInformation $companyInformation)
    {
        $request->validate([
            'status' => 'required|in:approved,requires_changes',
            'admin_notes' => 'nullable|string',
        ]);

        $companyInformation->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
        ]);

        $jewelryCard = $companyInformation->jewelryCard;

        if ($request->status === 'approved') {
            if ($jewelryCard) {
                $jewelryCard->update(['status' => 'publish']);
            }
        } elseif ($request->status === 'requires_changes') {
            if ($jewelryCard) {
                $jewelryCard->update(['status' => 'temp_publish']);
            }
        }

        // Send email to user
        $companyInformation->load('user');
        $user = $companyInformation->user;

        if ($user) {
            Mail::to($user->email)->send(new JewelryCardStatusUpdated($user, $companyInformation, $request->status));
        }

        return redirect()->back()->with('success', 'Company information status updated and user notified successfully!');
    }
}
