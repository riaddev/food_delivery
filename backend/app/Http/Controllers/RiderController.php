<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Rider;
use App\Models\RiderLocation;
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'heading' => 'nullable|numeric|between:0,360',
            'speed' => 'nullable|numeric|min:0',
        ]);

        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();

        $order = Order::where('id', $validated['order_id'])
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        if (in_array($order->status, ['delivered', 'cancelled'])) {
            return response()->json(['message' => 'Order already completed.'], 422);
        }

        RiderLocation::create([
            'rider_id' => $rider->id,
            'order_id' => $order->id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'heading' => $validated['heading'] ?? null,
            'speed' => $validated['speed'] ?? null,
        ]);

        $order->update([
            'rider_lat' => $validated['latitude'],
            'rider_lng' => $validated['longitude'],
        ]);

        return response()->json(['message' => 'Location updated.']);
    }

    public function orders(Request $request): JsonResponse
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();
        $limit = min(max((int) $request->query('limit', 100), 1), 200);

        $orders = Order::with(['restaurant:id,restaurant_name,address', 'user', 'items'])
            ->where('rider_id', $rider->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($o) => $this->formatOrder($o));

        return response()->json(['orders' => $orders]);
    }

    /**
     * Earning history: earning per order = delivery_fee on delivered orders.
     * Period buckets use delivered_at (falling back to updated_at for legacy
     * rows that were delivered before delivered_at was recorded).
     */
    public function earnings(Request $request): JsonResponse
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();

        $validated = $request->validate([
            'period' => 'nullable|string|in:today,week,month,all',
            'limit' => 'nullable|integer|min:1|max:200',
        ]);

        $period = $validated['period'] ?? 'all';
        $limit = $validated['limit'] ?? 100;

        $summary = [];
        foreach (['today', 'week', 'month', 'all'] as $bucket) {
            $row = Order::where('rider_id', $rider->id)
                ->where('status', 'delivered')
                ->tap(fn ($q) => $this->applyEarningPeriod($q, $bucket))
                ->selectRaw('COALESCE(SUM(delivery_fee), 0) as earnings, COUNT(*) as deliveries')
                ->first();

            $summary[$bucket] = [
                'earnings' => (float) ($row->earnings ?? 0),
                'deliveries' => (int) ($row->deliveries ?? 0),
            ];
        }

        $entries = Order::with('restaurant:id,restaurant_name')
            ->where('rider_id', $rider->id)
            ->where('status', 'delivered')
            ->tap(fn ($q) => $this->applyEarningPeriod($q, $period))
            ->orderByDesc('delivered_at')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'tracking_code' => $o->tracking_code,
                'delivered_at' => $o->delivered_at?->toISOString() ?? $o->updated_at?->toISOString(),
                'delivery_fee' => (float) $o->delivery_fee,
                'total' => (float) $o->total,
                'restaurant_name' => $o->restaurant?->restaurant_name,
            ]);

        return response()->json([
            'summary' => $summary,
            'entries' => $entries,
            'period' => $period,
        ]);
    }

    private function applyEarningPeriod($query, string $period): void
    {
        $start = match ($period) {
            'today' => today(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            default => null,
        };

        if (!$start) {
            return;
        }

        $query->where(function ($q) use ($start) {
            $q->where('delivered_at', '>=', $start)
                ->orWhere(fn ($q2) => $q2->whereNull('delivered_at')->where('updated_at', '>=', $start));
        });
    }

    public function acceptOrder(Request $request, $id): JsonResponse
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();

        // Atomic accept: the row lock + busy re-check inside the transaction
        // mean two concurrent accepts collapse into exactly one winner; the
        // loser gets the idempotent "already accepted" response.
        $alreadyAccepted = false;
        DB::transaction(function () use ($rider, $id, &$alreadyAccepted) {
            $order = Order::where('rider_id', $rider->id)->lockForUpdate()->findOrFail($id);

            if ($order->accepted_at) {
                $alreadyAccepted = true;

                return;
            }

            if ($order->status !== 'assigned') {
                throw ValidationException::withMessages([
                    'status' => ["This order cannot be accepted (current status: {$order->status})."],
                ]);
            }

            // A rider handles one active delivery at a time: two restaurants can
            // assign concurrently, so re-check here and not only at assign time.
            $busy = Order::where('rider_id', $rider->id)
                ->where('id', '!=', $order->id)
                ->whereNotNull('accepted_at')
                ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
                ->lockForUpdate()
                ->exists();
            if ($busy) {
                throw ValidationException::withMessages([
                    'status' => ['You already have an active delivery. Complete it before accepting another.'],
                ]);
            }

            $order->update(['accepted_at' => now()]);
        });

        $order = $this->ownOrder($request, $id);

        return response()->json([
            'order' => $this->formatOrder($order),
            'message' => $alreadyAccepted ? 'Order already accepted.' : "Order #{$order->id} accepted.",
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:picked_up,on_the_way,near_customer,served,delivered',
        ]);

        $order = $this->ownOrder($request, $id);

        if (!$order->accepted_at) {
            throw ValidationException::withMessages([
                'status' => ['Accept the delivery before updating its status.'],
            ]);
        }

        if (!OrderStatuses::canTransition($order->status, $validated['status'])) {
            $hint = $validated['status'] === 'picked_up'
                ? ' The restaurant has not marked it ready yet.'
                : '';
            throw ValidationException::withMessages([
                'status' => ["Order cannot move from \"{$order->status}\" to \"{$validated['status']}\".{$hint}"],
            ]);
        }

        $order->update([
            'status' => $validated['status'],
            'delivered_at' => $validated['status'] === 'delivered' ? now() : $order->delivered_at,
        ]);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $validated['status'],
            'changed_by' => 'rider',
        ]);

        return response()->json([
            'order' => $this->formatOrder($order),
            'message' => "Order #{$order->id} marked as {$validated['status']}.",
        ]);
    }

    private function ownOrder(Request $request, $id): Order
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();

        return Order::with(['restaurant:id,restaurant_name,address', 'user', 'items', 'statusHistories'])
            ->where('rider_id', $rider->id)
            ->findOrFail($id);
    }

    private function formatOrder(Order $o): array
    {
        return [
            'id' => $o->id,
            'status' => $o->status,
            'tracking_code' => $o->tracking_code,
            'accepted_at' => $o->accepted_at?->toISOString(),
            'delivered_at' => $o->delivered_at?->toISOString(),
            'created_at' => $o->created_at,
            'customer_name' => $o->user?->name,
            'customer_phone' => $o->user?->phone,
            'delivery_address' => $o->delivery_address,
            'delivery_instructions' => $o->delivery_instructions,
            'total' => (float) $o->total,
            'delivery_fee' => (float) $o->delivery_fee,
            'payment_method' => $o->payment_method,
            'payment_status' => $o->payment_status,
            'items' => $o->items,
            'restaurant' => $o->restaurant ? [
                'id' => $o->restaurant->id,
                'name' => $o->restaurant->restaurant_name,
                'address' => $o->restaurant->address,
            ] : null,
            'status_histories' => $o->statusHistories
                ->sortByDesc('created_at')
                ->values()
                ->map(fn ($h) => [
                    'status' => $h->status,
                    'changed_by' => $h->changed_by,
                    'created_at' => $h->created_at->toISOString(),
                ]),
        ];
    }
}
