<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReservationController extends Controller
{
    public const RESERVATION_DURATION_MINUTES = 120;
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|integer|exists:restaurants,id',
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'required|string|max:20',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|string|max:10',
            'party_size' => 'required|integer|min:1|max:20',
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
            ->get();

        $this->expireNoShows($reservations);

        $data = $reservations->map(fn ($r) => [
            'id' => $r->id,
            'guest_name' => $r->guest_name,
            'guest_phone' => $r->guest_phone,
            'reservation_date' => $r->reservation_date->format('Y-m-d'),
            'reservation_time' => $r->reservation_time,
            'party_size' => $r->party_size,
            'restaurant_table_id' => $r->restaurant_table_id,
            'table_number' => $r->restaurantTable?->name,
            'table_seats' => $r->restaurantTable?->seats !== null ? (int) $r->restaurantTable->seats : null,
            'special_requests' => $r->special_requests,
            'status' => $r->status,
            'created_at' => $r->created_at,
        ]);

        return response()->json(['reservations' => $data]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:confirmed,rejected,completed,cancelled,no_show',
        ]);

        $reservation = Reservation::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        $allowedFrom = [
            'confirmed' => ['pending'],
            'rejected' => ['pending'],
            'completed' => ['confirmed'],
            'no_show' => ['confirmed'],
            'cancelled' => ['pending', 'confirmed'],
        ];

        if (!in_array($reservation->status, $allowedFrom[$validated['status']] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["A {$reservation->status} reservation cannot be marked as {$validated['status']}."],
            ]);
        }

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
            ->get();

        $this->expireNoShows($reservations);

        $data = $reservations->map(fn ($r) => [
            'id' => $r->id,
            'restaurant_name' => $r->restaurant?->restaurant_name,
            'reservation_date' => $r->reservation_date->format('Y-m-d'),
            'reservation_time' => $r->reservation_time,
            'party_size' => $r->party_size,
            'restaurant_table_id' => $r->restaurant_table_id,
            'table_number' => $r->restaurantTable?->name,
            'table_seats' => $r->restaurantTable?->seats !== null ? (int) $r->restaurantTable->seats : null,
            'special_requests' => $r->special_requests,
            'status' => $r->status,
            'created_at' => $r->created_at,
            'updated_at' => $r->updated_at,
        ]);

        return response()->json(['reservations' => $data]);
    }

    /**
     * Lazily flip confirmed reservations to no_show once their dining window
     * (start + RESERVATION_DURATION_MINUTES) has fully passed. Runs on reads so
     * no scheduler is required; only reservations relevant to the current
     * request are touched.
     */
    private function expireNoShows($reservations): void
    {
        $cutoff = now()->subMinutes(self::RESERVATION_DURATION_MINUTES)->getTimestamp();

        $staleIds = $reservations
            ->filter(fn ($r) => $r->status === 'confirmed')
            ->filter(function ($r) use ($cutoff) {
                $ts = strtotime("{$r->reservation_date->format('Y-m-d')} {$r->reservation_time}");
                return $ts !== false && $ts < $cutoff;
            })
            ->pluck('id');

        if ($staleIds->isEmpty()) {
            return;
        }

        Reservation::whereIn('id', $staleIds)->update(['status' => 'no_show']);
        $reservations->each(function ($r) use ($staleIds) {
            if ($staleIds->contains($r->id)) {
                $r->status = 'no_show';
            }
        });
    }

    public function assignTable(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_table_id' => 'nullable|integer|exists:restaurant_tables,id',
        ]);

        $reservation = Reservation::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        if ($reservation->status !== 'confirmed') {
            throw ValidationException::withMessages([
                'status' => ['Only confirmed reservations can have a table assigned.'],
            ]);
        }

        if (empty($validated['restaurant_table_id'])) {
            $reservation->update(['restaurant_table_id' => null]);

            ActivityLog::create([
                'type' => 'reservation_table_unassigned',
                'description' => "Table unassigned from reservation #{$reservation->id} for {$reservation->guest_name}.",
            ]);

            return response()->json([
                'reservation' => $this->formatWithTable($reservation),
                'message' => 'Table unassigned.',
            ]);
        }

        $table = RestaurantTable::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($validated['restaurant_table_id']);

        if ($table->status !== RestaurantTable::STATUS_AVAILABLE) {
            throw ValidationException::withMessages([
                'restaurant_table_id' => ["Table \"{$table->name}\" is currently disabled."],
            ]);
        }

        if ((int) $table->seats < (int) $reservation->party_size) {
            throw ValidationException::withMessages([
                'restaurant_table_id' => [
                    "Table \"{$table->name}\" has only {$table->seats} seat(s) but the reservation is for {$reservation->party_size} guest(s).",
                ],
            ]);
        }

        $conflict = Reservation::where('restaurant_table_id', $table->id)
            ->where('status', 'confirmed')
            ->where('id', '!=', $reservation->id)
            ->whereDate('reservation_date', $reservation->reservation_date->toDateString())
            ->get()
            ->first(fn ($other) => self::timesOverlap($reservation->reservation_time, $other->reservation_time));

        if ($conflict) {
            throw ValidationException::withMessages([
                'restaurant_table_id' => [
                    "Table \"{$table->name}\" is already booked for a confirmed reservation at {$conflict->reservation_time} ({$conflict->guest_name}).",
                ],
            ]);
        }

        $reservation->update(['restaurant_table_id' => $table->id]);

        ActivityLog::create([
            'type' => 'reservation_table_assigned',
            'description' => "Table \"{$table->name}\" assigned to reservation #{$reservation->id} for {$reservation->guest_name}.",
        ]);

        return response()->json([
            'reservation' => $this->formatWithTable($reservation),
            'message' => "Table \"{$table->name}\" assigned.",
        ]);
    }

    private static function timeToMinutes($time): ?int
    {
        if (!preg_match('/^(\d{1,2}):(\d{2})/', (string) $time, $m)) {
            return null;
        }
        return ((int) $m[1]) * 60 + ((int) $m[2]);
    }

    private static function timesOverlap($timeA, $timeB): bool
    {
        $a = self::timeToMinutes($timeA);
        $b = self::timeToMinutes($timeB);
        if ($a === null || $b === null) {
            return false;
        }
        $duration = self::RESERVATION_DURATION_MINUTES;

        return $a < $b + $duration && $b < $a + $duration;
    }

    private function formatWithTable(Reservation $r): array
    {
        return [
            'id' => $r->id,
            'guest_name' => $r->guest_name,
            'guest_phone' => $r->guest_phone,
            'reservation_date' => $r->reservation_date->format('Y-m-d'),
            'reservation_time' => $r->reservation_time,
            'party_size' => $r->party_size,
            'restaurant_table_id' => $r->restaurant_table_id,
            'table_number' => $r->restaurantTable?->name,
            'table_seats' => $r->restaurantTable?->seats !== null ? (int) $r->restaurantTable->seats : null,
            'special_requests' => $r->special_requests,
            'status' => $r->status,
        ];
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