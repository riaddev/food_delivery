<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SendsSetupOtp;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use SendsSetupOtp;
    public function applyRestaurant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'restaurant_name' => 'required|string|max:255',
            'cuisine_type' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(32)),
            'role' => 'restaurant',
        ]);

        Restaurant::create([
            'user_id' => $user->id,
            'restaurant_name' => $validated['restaurant_name'],
            'phone' => $validated['phone'],
            'cuisine_type' => $validated['cuisine_type'],
            'address' => $validated['address'] ?? null,
        ]);

        return response()->json([
            'message' => 'Application submitted for review.',
        ], 201);
    }

    public function registerCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
        ]);

        $validated['role'] = 'customer';
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function verifySetupOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'otp' => 'required|digits:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !$user->isRestaurant() || $user->restaurant?->status !== 'approved') {
            throw ValidationException::withMessages([
                'otp' => ['No approved restaurant application found for this email.'],
            ]);
        }

        if (!$user->setup_otp || !$user->setup_otp_expires_at || $user->setup_otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => ['This code has expired. Request a new one.'],
            ]);
        }

        if (!Hash::check($validated['otp'], $user->setup_otp)) {
            throw ValidationException::withMessages([
                'otp' => ['The code is incorrect.'],
            ]);
        }

        $token = $user->createToken('account-setup')->plainTextToken;

        return response()->json([
            'user' => $user->load('restaurant'),
            'token' => $token,
            'message' => 'Code verified. Set your password to finish setup.',
        ]);
    }

    public function resendSetupOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !$user->isRestaurant()) {
            throw ValidationException::withMessages([
                'email' => ['No restaurant application found for this email.'],
            ]);
        }

        $status = $user->restaurant?->status;

        if ($status !== 'approved') {
            throw ValidationException::withMessages([
                'email' => [$status === 'rejected'
                    ? 'Your application was rejected. Please contact support.'
                    : 'Your application is still pending approval.'],
            ]);
        }

        $otp = (string) random_int(100000, 999999);

        $user->update([
            'setup_otp' => Hash::make($otp),
            'setup_otp_expires_at' => now()->addMinutes(15),
        ]);

        if ($user->restaurant) {
            $this->sendSetupOtp($user, $user->restaurant, $otp);
        }

        return response()->json(['message' => 'A new code has been sent to your email.']);
    }

    public function setSetupPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!$user || !$user->isRestaurant()) {
            throw ValidationException::withMessages([
                'password' => ['Setup session is invalid.'],
            ]);
        }

        if ($request->user()->currentAccessToken()->name !== 'account-setup') {
            throw ValidationException::withMessages([
                'password' => ['Setup session is invalid.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'setup_otp' => null,
            'setup_otp_expires_at' => null,
        ]);

        $request->user()->currentAccessToken()->delete();

        $user->load('restaurant');

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Password set. Welcome to SwiftBite!',
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->isRestaurant()) {
            $status = $user->restaurant?->status;

            if ($status === 'pending') {
                return response()->json([
                    'message' => 'Your account is pending Admin approval.',
                ], 403);
            }

            if ($status === 'rejected') {
                return response()->json([
                    'message' => 'Your application was rejected. Please contact support for more information.',
                ], 403);
            }

            if ($user->setup_otp !== null) {
                return response()->json([
                    'message' => 'Your account is approved. Complete your account setup to set your password.',
                ], 403);
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        if ($user->isRestaurant()) {
            $user->load('restaurant');
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
