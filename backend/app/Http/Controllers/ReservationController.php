<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Reservation;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReservationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|integer|exists:restaurants,id',
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'required|string|max:20',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|string|max:10',
            'party_size' => 'required|string|in:2,4,6,8,8+',
            'special_requests' => 'nullable|string|max:500',
        ]);

        $restaurant = Restaurant::findOrFail($validated['restaurant_id']);

        if (!$restaurant->accepts_dine_in) {
            throw ValidationException::withMessages([
                'restaurant_id' => ['This restaurant does not accept reservations.'],
            ]);
        }

        $duplicate = Reservation::where('restaurant_id', $restaurant->id)
            ->where('guest_phone', $validated['guest_phone'])
            ->where('reservation_date', $validated['reservation_date'])
            ->where('reservation_time', $validated['reservation_time'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'reservation_time' => ['You already have a reservation at this time.'],
            ]);
        }

        $userId = $request->bearerToken() ? $request->user('sanctum')?->id : null;

        $reservation = Reservation::create([
            'restaurant_id' => $restaurant->id,
            'user_id' => $userId,
            'guest_name' => $validated['guest_name'],
            'guest_phone' => $validated['guest_phone'],
            'reservation_date' => $validated['reservation_date'],
            'reservation_time' => $validated['reservation_time'],
            'party_size' => $validated['party_size'],
            'special_requests' => $validated['special_requests'] ?? null,
        ]);

        ActivityLog::create([
            'type' => 'reservation_created',
            'description' => "Reservation for {$validated['guest_name']} at \"{$restaurant->restaurant_name}\" on {$validated['reservation_date']} {$validated['reservation_time']}.",
        ]);

        return response()->json([
            'reservation' => $reservation->load('restaurant'),
            'message' => 'Reservation requested. The restaurant will confirm your booking shortly.',
        ], 201);
    }

    public function restaurantIndex(Request $request): JsonResponse
    {
        $reservations = Reservation::with('user')
            ->where('restaurant_id', $request->user()->restaurant->id)
            ->orderBy('reservation_date')
            ->orderBy('reservation_time')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'guest_name' => $r->guest_name,
                'guest_phone' => $r->guest_phone,
                'reservation_date' => $r->reservation_date->format('Y-m-d'),
                'reservation_time' => $r->reservation_time,
                'party_size' => $r->party_size,
                'special_requests' => $r->special_requests,
                'status' => $r->status,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['reservations' => $reservations]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:confirmed,completed,cancelled,no_show',
        ]);

        $reservation = Reservation::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        $reservation->update(['status' => $validated['status']]);

        ActivityLog::create([
            'type' => 'reservation_updated',
            'description' => "Reservation for {$reservation->guest_name} marked as {$validated['status']}.",
        ]);

        return response()->json([
            'reservation' => $reservation->fresh(),
            'message' => "Reservation marked as {$validated['status']}.",
        ]);
    }

    public function customerIndex(Request $request): JsonResponse
    {
        $reservations = Reservation::with('restaurant')
            ->where('user_id', $request->user()->id)
            ->orderBy('reservation_date', 'desc')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'restaurant_name' => $r->restaurant?->restaurant_name,
                'reservation_date' => $r->reservation_date->format('Y-m-d'),
                'reservation_time' => $r->reservation_time,
                'party_size' => $r->party_size,
                'special_requests' => $r->special_requests,
                'status' => $r->status,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['reservations' => $reservations]);
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $reservation = Reservation::where('user_id', $request->user()->id)
            ->findOrFail($id);

        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            throw ValidationException::withMessages([
                'status' => ['Only pending or confirmed reservations can be cancelled.'],
            ]);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json([
            'reservation' => $reservation->fresh(),
            'message' => 'Reservation cancelled.',
        ]);
    }
}