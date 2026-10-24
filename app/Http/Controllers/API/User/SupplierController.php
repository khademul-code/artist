<?php

namespace App\Http\Controllers\API\User;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\CompanyInformationRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\SupplierResource;
use App\Mail\CompanyProfileSubmitted;
use App\Models\JewelryCard;
use App\Models\User;
use App\Models\UserActivity;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class SupplierController extends Controller
{
    use ApiResponse;

    public function supplierProfile()
    {
        $user = User::with('company')
            ->where('id', auth()->user()->id)
            ->where('role', 'supplier')
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'You are not a supplier',
                'status' => false,
            ], 400);
        }

        return $this->success('Profile info retrieve successfully', new SupplierResource($user), 200);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = Auth::user();

        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Helper::fileDelete($user->avatar);
            }
            $data['avatar'] = Helper::fileUpload(
                $request->file('avatar'),
                'avatar',
                time() . '_' . $request->file('avatar')->getClientOriginalName()
            );
        }

        $user->update($data);

        return $this->success(
            'Profile info updated successfully',
            new SupplierResource($user->fresh()),
            200
        );
    }

    public function createCompanyProfile(CompanyInformationRequest $request)
    {
        $user = Auth::user();

        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = Helper::fileUpload(
                $request->file('image'),
                'company_information',
                time() . '_' . $request->file('image')->getClientOriginalName()
            );
        }

        $company = $user->company()->create($data);

        // The card is immediately published on the board while JBA reviews it for final approval.
        JewelryCard::create([
            'company_information_id' => $company->id,
            'image'                  => $data['image'] ?? null,
            'company_name'           => $company->company_name,
            'company_type'           => $company->company_type,
            'business_category'      => $company->business_category,
            'company_bio'            => $company->company_bio,
            'phone'                  => $company->company_phone,
            'address'                => $company->company_address,
            'zip_code'               => $company->zip_code,
            'city'                   => $company->city,
            'mini_site_url'          => $company->sendcontact_link ?? null,
            'status'                 => 'temp_publish',
        ]);

        Mail::to($user->email)->send(new CompanyProfileSubmitted($user));

        // Notify admins about the update
        // $admins = User::where('role', 'Admin')->get();
        // if ($admins->count() > 0) {
        //     \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\AdminNotification(
        //         'Company Information Updated',
        //         "User {$user->name} has updated their company information."
        //     ));
        // }

        return $this->success(
            'Your company card has been submitted successfully. It is now temporarily published on the board while JBA reviews it for final approval.',
            $company,
            200
        );
    }

    public function sendContactLink(Request $request)
    {
        $user = Auth::user();

        $company = $user->company()->latest('id')->first();

        if (!$company) {
            return $this->error('Company not found', [], 404);
        }

        $company->update([
            'sendcontact_link' => $request->sendcontact_link,
        ]);

        return $this->success(
            'Mini site link submitted successfully',
            $company,
            200
        );
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect', 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return $this->success('Password changed successfully', [], 200);
    }

    public function accountDelete(Request $request)
    {
        $user = Auth::user();

        if ($user->company) {
            $user->company->delete();
        }

        if ($user->avatar) {
            Helper::fileDelete($user->avatar);
        }


        $user->tokens()->delete();

        $user->delete();

        return $this->success('Account deleted successfully', [], 200);
    }
}
