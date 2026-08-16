<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

trait SendsSetupOtp
{
    public function sendSetupOtp(User $user, Restaurant $restaurant, string $otp): void
    {
        try {
            Mail::raw(
                "Dear {$user->name},\n\n" .
                "Your restaurant \"{$restaurant->restaurant_name}\" has been approved!\n\n" .
                "Use this one-time code to set up your account: {$otp}\n\n" .
                "The code expires in 15 minutes. Visit the SwiftBite setup page to choose your password.",
                function ($message) use ($user, $restaurant) {
                    $message->to($user->email, $user->name)
                        ->subject("Your SwiftBite restaurant \"{$restaurant->restaurant_name}\" has been approved");
                }
            );
        } catch (\Throwable $e) {
            Log::warning("Failed to send setup OTP to {$user->email}: {$e->getMessage()}");
        }
    }
}