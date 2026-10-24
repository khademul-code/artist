<?php

namespace App\Http\Controllers\API\User;

use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\BuyerResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class BuyerController extends Controller
{
    use ApiResponse;

    public function buyerProfile()
    {
        $user = User::where('id', auth()->user()->id)
            ->where('role', 'buyer')
            ->first();

        if (!$user) {
            return $this->error('You are not a buyer', 400);
        }

        return $this->success('Profile info retrieve successfully', new BuyerResource($user), 200);
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

        $user->update(Arr::except($data, ['business_name', 'about_business', 'services']));

        return $this->success(
            'Profile info updated successfully',
            new BuyerResource($user->fresh()),
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

        if ($user->avatar) {
            Helper::fileDelete($user->avatar);
        }

        $user->tokens()->delete();

        $user->delete();

        return $this->success('Account deleted successfully', [], 200);
    }
}
