<?php

namespace App\Http\Controllers\Web\Admin\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CompanyInformation;
use App\Traits\FileManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    use FileManager;

    public function index(Request $request): Response
    {
        $query = User::whereIn('role', ['supplier', 'buyer'])
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'avatar',
                'role',
                'status',
                'created_at',
            ])
            ->with('company');

        if ($request->filled('role') && in_array(strtolower($request->role), ['supplier', 'buyer'])) {
            $query->where('role', strtolower($request->role));
        }

        if ($request->filled('has_company')) {
            if ($request->has_company === 'true') {
                $query->whereHas('company');
            } elseif ($request->has_company === 'false') {
                $query->whereDoesntHave('company');
            }
        }

        $users = $query->search(['name', 'email', 'phone'])->paginateData();

        return Inertia::render('user/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'has_company', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('user/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'role' => 'required|in:supplier,buyer',

            // Company info (applicable for supplier)
            'company_name' => 'nullable|string|max:255',
            'company_type' => 'nullable|string|max:255',
            'company_phone' => 'nullable|string|max:255',
            'company_address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:255',
            'year_of_est' => 'nullable|string|max:255',
            'company_bio' => 'nullable|string',
            'sendcontact_link' => 'nullable|string|max:500',
            'business_category' => 'nullable|array',
            'company_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $paths = $this->uploadToPublic($request->file('avatar'), 'uploads/users');
            $avatarPath = $paths[0] ?? null;
        }

        $role = strtolower($request->role);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'avatar' => $avatarPath,
            'role' => $role,
            'status' => 'Active',
        ]);

        if ($role === 'supplier') {
            $hasCompanyData = $request->filled('company_name') ||
                $request->filled('company_type') ||
                $request->filled('company_phone') ||
                $request->filled('company_address') ||
                $request->filled('city') ||
                $request->filled('zip_code') ||
                $request->filled('year_of_est') ||
                $request->filled('company_bio') ||
                $request->filled('sendcontact_link') ||
                $request->filled('business_category') ||
                $request->hasFile('company_image');

            if ($hasCompanyData) {
                $companyImagePath = null;
                if ($request->hasFile('company_image')) {
                    $cPaths = $this->uploadToPublic($request->file('company_image'), 'uploads/company');
                    $companyImagePath = $cPaths[0] ?? null;
                }

                $user->company()->create([
                    'company_name' => $request->company_name,
                    'company_type' => $request->company_type,
                    'company_phone' => $request->company_phone,
                    'company_address' => $request->company_address,
                    'city' => $request->city,
                    'zip_code' => $request->zip_code,
                    'year_of_est' => $request->year_of_est,
                    'company_bio' => $request->company_bio,
                    'sendcontact_link' => $request->sendcontact_link,
                    'business_category' => $request->business_category,
                    'image' => $companyImagePath,
                    'status' => 'approved',
                ]);
            }
        }

        return redirect()->route('user.index')->with('success', 'User created successfully!');
    }

    public function edit(User $user)
    {
        $user->load('company');

        return Inertia::render('user/edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'role' => 'required|in:supplier,buyer',

            // Company info (applicable for supplier)
            'company_name' => 'nullable|string|max:255',
            'company_type' => 'nullable|string|max:255',
            'company_phone' => 'nullable|string|max:255',
            'company_address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:255',
            'year_of_est' => 'nullable|string|max:255',
            'company_bio' => 'nullable|string',
            'sendcontact_link' => 'nullable|string|max:500',
            'business_category' => 'nullable|array',
            'company_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $avatarPath = $user->getRawOriginal('avatar');
        if ($request->hasFile('avatar')) {
            if ($avatarPath) {
                $this->deleteFromPublic($user, 'avatar');
            }
            $paths = $this->uploadToPublic($request->file('avatar'), 'uploads/users');
            $avatarPath = $paths[0] ?? null;
        }

        $role = strtolower($request->role);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'avatar' => $avatarPath,
            'role' => $role,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        if ($role === 'supplier') {
            $company = $user->company()->first();

            $companyData = [
                'company_name' => $request->company_name,
                'company_type' => $request->company_type,
                'company_phone' => $request->company_phone,
                'company_address' => $request->company_address,
                'city' => $request->city,
                'zip_code' => $request->zip_code,
                'year_of_est' => $request->year_of_est,
                'company_bio' => $request->company_bio,
                'sendcontact_link' => $request->sendcontact_link,
                'business_category' => $request->business_category,
            ];

            if ($request->hasFile('company_image')) {
                if ($company && $company->getRawOriginal('image')) {
                    $this->deleteFromPublic($company, 'image');
                }
                $cPaths = $this->uploadToPublic($request->file('company_image'), 'uploads/company');
                $companyData['image'] = $cPaths[0] ?? null;
            }

            if ($company) {
                $company->update($companyData);
            } else {
                $hasCompanyData = $request->filled('company_name') ||
                    $request->filled('company_type') ||
                    $request->filled('company_phone') ||
                    $request->hasFile('company_image');

                if ($hasCompanyData) {
                    $companyData['status'] = 'approved';
                    $user->company()->create($companyData);
                }
            }
        }

        return redirect()->route('user.index')->with('success', 'User updated successfully!');
    }

    public function updateStatus(User $user)
    {
        $user->update([
            'status' => $user->status === 'Active' ? 'Inactive' : 'Active',
        ]);

        return redirect()->back()->with('success', 'User status updated successfully!');
    }

    public function destroy(User $user)
    {
        if ($user->avatar && $user->getRawOriginal('avatar')) {
            $this->deleteFromPublic($user, 'avatar');
        }

        foreach ($user->company as $comp) {
            if ($comp->image && $comp->getRawOriginal('image')) {
                $this->deleteFromPublic($comp, 'image');
            }
        }

        $user->delete();
        return redirect()->back()->with('success', 'User deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
        ]);

        $users = User::whereIn('id', $request->ids)->with('company')->get();
        foreach ($users as $user) {
            if ($user->avatar && $user->getRawOriginal('avatar')) {
                $this->deleteFromPublic($user, 'avatar');
            }
            foreach ($user->company as $comp) {
                if ($comp->image && $comp->getRawOriginal('image')) {
                    $this->deleteFromPublic($comp, 'image');
                }
            }
            $user->delete();
        }

        return redirect()->back()->with('success', 'Selected users deleted successfully!');
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $fileName = 'users_' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response()->streamDownload(function () use ($request) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Company Name', 'Created At']);

            $query = User::whereIn('role', ['supplier', 'buyer'])->with('company');

            if ($request->filled('role')) {
                $query->where('role', strtolower($request->role));
            }

            if ($request->filled('has_company')) {
                if ($request->has_company === 'true') {
                    $query->whereHas('company');
                } elseif ($request->has_company === 'false') {
                    $query->whereDoesntHave('company');
                }
            }

            $query->chunk(100, function ($users) use ($handle) {
                foreach ($users as $user) {
                    $company = $user->company->first();
                    fputcsv($handle, [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->phone,
                        ucfirst($user->role),
                        $user->status,
                        $company ? $company->company_name : 'N/A',
                        $user->created_at ? $user->created_at->format('Y-m-d H:i') : '',
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
