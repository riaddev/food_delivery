<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    public function track(string $trackingCode): JsonResponse
    {
        $order = Order::with(['restaurant:id,restaurant_name,address,phone', 'rider.user:id,name'])
            ->where('tracking_code', $trackingCode)
            ->firstOrFail();

        $rider = null;
        if ($order->rider) {
            $rider = [
                'name' => optional($order->rider->user)->name ?? 'Unknown Rider',
                'phone' => $order->rider->phone,
            ];
        }

        return response()->json([
            'tracking_code' => $order->tracking_code,
            'status' => $order->status,
            'restaurant' => $order->restaurant ? [
                'name' => $order->restaurant->restaurant_name,
                'address' => $order->restaurant->address,
                'phone' => $order->restaurant->phone,
            ] : null,
            'delivery_address' => $order->delivery_address,
            'rider' => $rider,
            'created_at' => $order->created_at,
            'delivered_at' => $order->delivered_at?->toISOString(),
        ]);
    }
}
