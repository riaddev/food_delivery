<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RiderController extends Controller
{
    public function setAvailability(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isRider()) {
            throw ValidationException::withMessages([
                'is_online' => ['Only riders can change availability.'],
            ]);
        }

        $validated = $request->validate([
            'is_online' => 'required|boolean',
        ]);

        $rider = $user->rider;

        if ($rider->status !== 'approved') {
            throw ValidationException::withMessages([
                'is_online' => ['Only approved riders can go online.'],
            ]);
        }

        $rider->update(['is_online' => $validated['is_online']]);

        return response()->json([
            'rider' => $rider->fresh(),
            'is_online' => (bool) $rider->is_online,
            'message' => $validated['is_online']
                ? 'You are now online and available for deliveries.'
                : 'You are now offline.',
        ]);
    }
}