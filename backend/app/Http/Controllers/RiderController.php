<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Rider;
use App\Support\OrderStatuses;
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

    public function orders(Request $request): JsonResponse
    {
        $rider = Rider::where('user_id', $request->user()->id)->firstOrFail();

        $orders = Order::with(['restaurant:id,restaurant_name,address', 'user', 'items'])
            ->where('rider_id', $rider->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($o) => $this->formatOrder($o));

        return response()->json(['orders' => $orders]);
    }

    public function acceptOrder(Request $request, $id): JsonResponse
    {
        $order = $this->ownOrder($request, $id);

        if ($order->accepted_at) {
            return response()->json([
                'order' => $this->formatOrder($order),
                'message' => 'Order already accepted.',
            ]);
        }

        if (
            in_array($order->status, OrderStatuses::TERMINAL_STATUSES, true)
            || !in_array($order->status, ['confirmed', 'preparing', 'ready'], true)
        ) {
            throw ValidationException::withMessages([
                'status' => ["This order can no longer be accepted (current status: {$order->status})."],
            ]);
        }

        $order->update(['accepted_at' => now()]);

        return response()->json([
            'order' => $this->formatOrder($order),
            'message' => "Order #{$order->id} accepted.",
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:picked_up,on_the_way,delivered',
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

        return Order::with(['restaurant:id,restaurant_name,address', 'user', 'items'])
            ->where('rider_id', $rider->id)
            ->findOrFail($id);
    }

    private function formatOrder(Order $o): array
    {
        return [
            'id' => $o->id,
            'status' => $o->status,
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
        ];
    }
}
