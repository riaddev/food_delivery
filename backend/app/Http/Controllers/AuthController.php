<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SendsSetupOtp;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use SendsSetupOtp;
    public function applyRestaurant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'phone' => ['required', 'string', 'regex:/^01[3-9][0-9]{8}$/'],
            'restaurant_name' => 'required|string|max:255',
            'cuisine_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'address' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'opening_time' => 'required|string|max:10',
            'closing_time' => 'required|string|max:10',
            'operating_days' => 'required|string|max:255',
        ]);

        $existing = User::where('email', $validated['email'])->first();

        if ($existing) {
            if ($existing->role === 'customer') {
                throw ValidationException::withMessages([
                    'email' => ['The email has already been taken.'],
                ]);
            }

            $restaurant = $existing->restaurant;
            $rider = $existing->rider;

            if ($existing->role === 'restaurant') {
                if (!$restaurant || !in_array($restaurant->status, ['rejected', 'suspended'])) {
                    throw ValidationException::withMessages([
                        'email' => ['The email has already been taken.'],
                    ]);
                }
            } else {
                if (!$rider || !in_array($rider->status, ['rejected', 'suspended'])) {
                    throw ValidationException::withMessages([
                        'email' => ['The email has already been taken.'],
                    ]);
                }
                if ($restaurant && !in_array($restaurant->status, ['rejected', 'suspended'])) {
                    throw ValidationException::withMessages([
                        'email' => ['The email has already been taken.'],
                    ]);
                }

                $existing->update(['role' => 'restaurant']);
                $rider->update(['status' => 'rejected']);
            }

            $user = $existing;
            $user->update(['name' => $validated['name']]);
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(32)),
                'role' => 'restaurant',
            ]);
            $restaurant = null;
        }

        $logo = null;
        if ($request->hasFile('logo')) {
            $logo = $request->file('logo')->store('restaurants', 'public');
        }

        $restaurantData = [
            'restaurant_name' => $validated['restaurant_name'],
            'phone' => $validated['phone'],
            'cuisine_type' => $validated['cuisine_type'],
            'description' => $validated['description'] ?? null,
            'logo' => $logo,
            'address' => $validated['address'],
            'area' => $validated['area'],
            'city' => $validated['city'],
            'opening_time' => $validated['opening_time'],
            'closing_time' => $validated['closing_time'],
            'operating_days' => $validated['operating_days'],
            'opening_hours' => $validated['opening_time'] . ' - ' . $validated['closing_time'],
            'status' => 'pending',
        ];

        if ($restaurant) {
            if ($restaurant->logo && $logo && $restaurant->logo !== $logo) {
                Storage::disk('public')->delete($restaurant->logo);
            }
            $restaurant->update($restaurantData);
        } else {
            $restaurantData['user_id'] = $user->id;
            Restaurant::create($restaurantData);
        }

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

    public function applyRider(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'phone' => ['required', 'string', 'regex:/^01[3-9][0-9]{8}$/'],
            'date_of_birth' => 'required|date|before:today',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'nid_number' => ['required', 'string', 'regex:/^[0-9]{10}$|^[0-9]{17}$/'],
            'nid_document' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_number' => ['required', 'string', 'regex:/^01[3-9][0-9]{8}$/'],
            'vehicle_type' => 'required|string|in:bicycle,motorcycle,scooter,other',
            'license_number' => 'required_if:vehicle_type,motorcycle,scooter|nullable|string|max:255',
            'license_document' => 'required_if:vehicle_type,motorcycle,scooter|nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'vehicle_registration' => 'required_if:vehicle_type,motorcycle,scooter|nullable|string|max:255',
            'vehicle_description' => 'required_if:vehicle_type,other|nullable|string|max:255',
            'address' => 'required|string|max:255',
            'delivery_area' => 'required|string|max:255',
            'city' => 'required|string|max:255',
        ]);

        $existing = User::where('email', $validated['email'])->first();

        if ($existing) {
            if ($existing->role === 'customer') {
                throw ValidationException::withMessages([
                    'email' => ['The email has already been taken.'],
                ]);
            }

            $rider = $existing->rider;
            $restaurant = $existing->restaurant;

            if ($existing->role === 'rider') {
                if (!$rider || !in_array($rider->status, ['rejected', 'suspended'])) {
                    throw ValidationException::withMessages([
                        'email' => ['The email has already been taken.'],
                    ]);
                }
            } else {
                if (!$restaurant || !in_array($restaurant->status, ['rejected', 'suspended'])) {
                    throw ValidationException::withMessages([
                        'email' => ['The email has already been taken.'],
                    ]);
                }
                if ($rider && !in_array($rider->status, ['rejected', 'suspended'])) {
                    throw ValidationException::withMessages([
                        'email' => ['The email has already been taken.'],
                    ]);
                }

                $existing->update(['role' => 'rider']);
                $restaurant->update(['status' => 'rejected']);
            }

            $user = $existing;
            $user->update(['name' => $validated['name']]);
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(32)),
                'role' => 'rider',
            ]);
            $rider = null;
        }

        if ($request->hasFile('profile_photo')) {
            $user->update([
                'avatar' => $request->file('profile_photo')->store('avatars', 'public'),
            ]);
        }

        $nidDocument = null;
        if ($request->hasFile('nid_document')) {
            $nidDocument = $request->file('nid_document')->store('rider-documents', 'public');
        }

        $licenseDocument = null;
        if ($request->hasFile('license_document')) {
            $licenseDocument = $request->file('license_document')->store('rider-documents', 'public');
        }

        $riderData = [
            'vehicle_type' => $validated['vehicle_type'],
            'vehicle_description' => $validated['vehicle_description'] ?? null,
            'date_of_birth' => $validated['date_of_birth'],
            'nid_number' => $validated['nid_number'],
            'nid_document' => $nidDocument,
            'emergency_contact_name' => $validated['emergency_contact_name'],
            'emergency_contact_number' => $validated['emergency_contact_number'],
            'license_number' => $validated['license_number'] ?? null,
            'license_document' => $licenseDocument,
            'vehicle_registration' => $validated['vehicle_registration'] ?? null,
            'delivery_area' => $validated['delivery_area'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'phone' => $validated['phone'],
            'status' => 'pending',
        ];

        if ($rider) {
            if ($rider->nid_document && $nidDocument && $rider->nid_document !== $nidDocument) {
                Storage::disk('public')->delete($rider->nid_document);
            }
            if ($rider->license_document && $licenseDocument && $rider->license_document !== $licenseDocument) {
                Storage::disk('public')->delete($rider->license_document);
            }
            $rider->update($riderData);
        } else {
            $riderData['user_id'] = $user->id;
            Rider::create($riderData);
        }

        return response()->json([
            'message' => 'Application submitted for review.',
        ], 201);
    }

    public function verifySetupOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'otp' => 'required|digits:6',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || (!$user->isRestaurant() && !$user->isRider())) {
            throw ValidationException::withMessages([
                'otp' => ['No approved application found for this email.'],
            ]);
        }

        $application = $user->isRestaurant() ? $user->restaurant : $user->rider;

        if (!$application || $application->status !== 'approved') {
            throw ValidationException::withMessages([
                'otp' => ['No approved application found for this email.'],
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
            'user' => $user->load($user->isRestaurant() ? 'restaurant' : 'rider'),
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

        if (!$user || (!$user->isRestaurant() && !$user->isRider())) {
            throw ValidationException::withMessages([
                'email' => ['No application found for this email.'],
            ]);
        }

        $application = $user->isRestaurant() ? $user->restaurant : $user->rider;

        if (!$application || $application->status !== 'approved') {
            $status = $application?->status;

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

        $sent = false;

        if ($user->isRestaurant() && $user->restaurant) {
            $sent = $this->sendSetupOtp($user, $user->restaurant, $otp);
        }

        if ($user->isRider() && $user->rider) {
            $sent = $this->sendRiderSetupOtp($user, $user->rider, $otp);
        }

        if (!$sent) {
            throw ValidationException::withMessages([
                'email' => ['We could not send the code. Please try again in a moment.'],
            ]);
        }

        return response()->json(['message' => 'A new code has been sent to your email.']);
    }

    public function setSetupPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!$user || (!$user->isRestaurant() && !$user->isRider())) {
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

        $user->load($user->isRestaurant() ? 'restaurant' : 'rider');

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

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
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

            if ($status === 'suspended') {
                return response()->json([
                    'message' => 'Your account has been suspended. Please contact support.',
                ], 403);
            }

            if ($user->setup_otp !== null) {
                return response()->json([
                    'message' => 'Your account is approved. Complete your account setup to set your password.',
                ], 403);
            }
        }

        if ($user->isRider()) {
            $status = $user->rider?->status;

            if ($status === 'pending') {
                return response()->json([
                    'message' => 'Your rider application is pending Admin approval.',
                ], 403);
            }

            if ($status === 'rejected') {
                return response()->json([
                    'message' => 'Your application was rejected. Please contact support for more information.',
                ], 403);
            }

            if ($status === 'suspended') {
                return response()->json([
                    'message' => 'Your account has been suspended. Please contact support.',
                ], 403);
            }

            if ($user->rider && $user->setup_otp !== null) {
                return response()->json([
                    'message' => 'Your account is approved. Complete your account setup to set your password.',
                ], 403);
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        if ($user->isRestaurant()) {
            $user->load('restaurant');
        }

        if ($user->isRider()) {
            $user->load('rider');
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
