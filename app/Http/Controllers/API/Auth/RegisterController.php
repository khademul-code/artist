<?php

namespace App\Http\Controllers\API\Auth;


use App\Helpers\Helper;
use App\Http\Controllers\Controller;
use App\Models\QuestPreference;
use App\Models\TempUser;
use App\Models\User;
use App\Notifications\AdminNotification;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Ichtrojan\Otp\Otp; // Unused after transition to link-based verification
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;



class RegisterController extends Controller
{
    use ApiResponse;

    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email',
            'password'              => 'required|min:6|confirmed',
            'role'                  => 'required|in:buyer,supplier',
            'agree_to_terms_policy' => 'nullable|boolean|in:1,true,yes',
        ]);

        $exists = TempUser::where('email', $request->email)->first();

        $userexists = User::where('email', $request->email)->first();

        if ($userexists) {
            throw new \Exception('You are already registered, please login');
        }

        if ($exists) {

            $otp = (new Otp)->generate($request->email, 'numeric', 6, 60);

            // Mail::to($exists->email)->send(new EmailVerification($otp->token, $exists));
            \Mail::to($exists->email)->send(new \App\Mail\OTP($otp->token, $exists, "Verify your email address", "verify"));


            return $this->success('Otp sent to your email successfully', ['otp' => $otp->token, 'user' => $exists], 201);
        }

        DB::beginTransaction();
        try {

            // $timezone = $this->detectTimezone($request);
            // Create user
            $tempuser = TempUser::create([
                'name'                  => $request->name,
                'email'                 => $request->email,
                'password'              => Hash::make($request->password),
                'role'                  => $request->role,
                'agree_to_terms_policy' => $request->agree_to_terms_policy ?? false,
            ]);

            // Send OTP
            $otp = $this->send_otp($tempuser);

            if (!$otp) {
                throw new \Exception('Failed to send OTP.');
            }
            // $tokenResult = $user->createToken('AuthToken');


            DB::commit();
            return response()->json([
                'status'  => 200,
                'message' => 'Otp sent to your email successfully',
                'otp'     => $otp->token,
                'data' => $tempuser
            ]);

        } catch (\Exception $exception) {
            DB::rollBack();
            return $this->error($exception->getMessage(), 500);
        }
    }
    // private function detectTimezone(Request $request): string
    // {
    //     try {
    //         $ip = $request->ip();

    //         // Localhost / testing
    //         if ($ip === '127.0.0.1' || $ip === '::1') {
    //             return 'Asia/Dhaka';
    //         }

    //         $response = Http::timeout(5)
    //             ->get("http://ip-api.com/json/{$ip}?fields=status,timezone");

    //         if (
    //             $response->successful() &&
    //             $response->json('status') === 'success' &&
    //             $response->json('timezone')
    //         ) {
    //             return $response->json('timezone');
    //         }

    //     } catch (\Exception $e) {
    //         // ignore
    //     }

    //     return 'UTC';
    // }

    public function send_otp($tempuser, $mailType = 'verify')
    {
        $otp  = (new Otp)->generate($tempuser->email, 'numeric', 6, 60);
        $message = $mailType === 'verify' ? 'Verify Your Email Address' : 'Reset Your Password';
        \Mail::to($tempuser->email)->send(new \App\Mail\OTP($otp->token, $tempuser, $message, $mailType));
        return $otp;
    }

    public function resend_otp(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
        ]);

        try {
            $tempuser = TempUser::where('email', $request->email)->first();
            if ($tempuser) {
                $otp = $this->send_otp($tempuser);
                return $this->success('OTP send successfully.', ['otp' => $otp->token], 201);
            } else {
                return $this->error('Email not found', 404);
            }
        } catch (\Exception $exception) {
            return $this->error($exception->getMessage(), 500);
        }
    }

    public function verify_otp(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'otp' => 'required|string|digits:6',
        ]);
        try {
            $tempuser = TempUser::where('email', $request->email)->first();
            if (!$tempuser) {
                return $this->error('Email not found', 404);
            }

            $verify = (new Otp)->validate($request->email, $request->otp);
            if ($verify->status) {
                
                $user = User::create([
                    'name'                  => $tempuser->name,
                    'email'                 => $tempuser->email,
                    'password'              => $tempuser->password,
                    'role'                  => $tempuser->role,
                    'agree_to_terms_policy' => $tempuser->agree_to_terms_policy,
                    'email_verified_at'     => now(),
                ]);

                $tempuser->delete();

                return response()->json([
                    'status' => 200,
                    'message' => 'Email verified successfully',
                    'token_type' => 'Bearer',
                    'token' => $user->createToken('AuthToken')->plainTextToken,
                    'data' => $user
                ]);
            } else {
                return $this->error($verify->message, 404);
            }
        } catch (\Exception $exception) {
            return $this->error($exception->getMessage(), 500);
        }
    }

    public function forgot_password(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        try {
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return $this->error('User not found', 404);
            }
            $otp = $this->send_otp($user, 'forget');
            return $this->success('OTP send to your email successfully.', ['otp' => $otp->token], 201);
        } catch (\Exception $exception) {
            return $this->error($exception->getMessage(), 500);
        }
    }

    public function forgot_verify_otp(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'otp' => 'required|string|digits:6',
        ]);

        $verify = (new Otp)->validate($request->email, $request->otp);
        if ($verify->status) {
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return Helper::jsonErrorResponse('Email not found', 404);
            }
            $user->reset_code = \Str::random(40);
            $user->reset_code_expires_at = Carbon::now()->addDays(1);
            $user->save();
            return $this->success('OTP verified successfully', [
                'token' => $user->reset_code,
            ], 201);
        } else {
            return $this->error($verify->message, 404);
        }
    }

    public function reset_password(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|confirmed',
        ]);

        try {
            $user = User::where('reset_code', $request->token)->first();

            if (!$user) {
                return $this->error('Invalid Token', 404);
            }

            if ($user->reset_code_expires_at < Carbon::now()) {
                return $this->error('Token expired', 404);
            }

            $user->password = Hash::make($request->password);
            $user->reset_code = null;
            $user->reset_code_expires_at = null;
            $user->save();

            return $this->ok('Password reset successfully');
        } catch (\Exception $exception) {
            return $this->error($exception->getMessage(), 404);
        }
    }
}
