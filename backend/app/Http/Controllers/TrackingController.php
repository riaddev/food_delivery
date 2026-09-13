<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Support\Geocoder;
use App\Support\RouteCalculator;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    public function track(string $trackingCode): JsonResponse
    {
        $order = Order::with(['restaurant:id,restaurant_name,address,phone', 'rider.user:id,name', 'statusHistories'])
            ->where('tracking_code', $trackingCode)
            ->firstOrFail();

        $rider = null;
        if ($order->rider) {
            $rider = [
                'name' => optional($order->rider->user)->name ?? 'Unknown Rider',
                'phone' => $order->rider->phone,
            ];
        }

        $riderLocation = null;
        if ($order->rider_lat && $order->rider_lng) {
            $riderLocation = [
                'lat' => (float) $order->rider_lat,
                'lng' => (float) $order->rider_lng,
                'updated_at' => $order->updated_at?->toISOString(),
            ];
        }

        $restaurantCoords = null;
        if ($order->restaurant_lat && $order->restaurant_lng) {
            $restaurantCoords = [
                'lat' => (float) $order->restaurant_lat,
                'lng' => (float) $order->restaurant_lng,
            ];
        } elseif ($order->restaurant && $order->restaurant->latitude && $order->restaurant->longitude) {
            $restaurantCoords = [
                'lat' => (float) $order->restaurant->latitude,
                'lng' => (float) $order->restaurant->longitude,
            ];
            $order->update([
                'restaurant_lat' => $order->restaurant->latitude,
                'restaurant_lng' => $order->restaurant->longitude,
            ]);
        } elseif ($order->restaurant) {
            $coords = Geocoder::geocode($order->restaurant->address . ', ' . $order->restaurant->city);
            if ($coords) {
                $restaurantCoords = $coords;
                $order->update([
                    'restaurant_lat' => $coords['lat'],
                    'restaurant_lng' => $coords['lng'],
                ]);
                if (!$order->restaurant->latitude) {
                    $order->restaurant->update([
                        'latitude' => $coords['lat'],
                        'longitude' => $coords['lng'],
                    ]);
                }
            }
        }

        $customerCoords = null;
        if ($order->customer_lat && $order->customer_lng) {
            $customerCoords = [
                'lat' => (float) $order->customer_lat,
                'lng' => (float) $order->customer_lng,
            ];
        } elseif ($order->delivery_address) {
            $coords = Geocoder::geocode($order->delivery_address);
            if ($coords) {
                $customerCoords = $coords;
                $order->update([
                    'customer_lat' => $coords['lat'],
                    'customer_lng' => $coords['lng'],
                ]);
            }
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
            'rider_location' => $riderLocation,
            'restaurant_coords' => $restaurantCoords,
            'customer_coords' => $customerCoords,
            'created_at' => $order->created_at,
            'delivered_at' => $order->delivered_at?->toISOString(),
            'status_histories' => $order->statusHistories
                ->sortBy('created_at')
                ->values()
                ->map(fn ($h) => [
                    'status' => $h->status,
                    'created_at' => $h->created_at?->toISOString(),
                ]),
        ]);
    }

    public function route(string $trackingCode): JsonResponse
    {
        $order = Order::where('tracking_code', $trackingCode)->firstOrFail();

        if (!$order->restaurant_lat || !$order->customer_lat) {
            return response()->json(['message' => 'Route not available.'], 404);
        }

        $route = RouteCalculator::getRoute(
            ['lat' => $order->restaurant_lat, 'lng' => $order->restaurant_lng],
            ['lat' => $order->customer_lat, 'lng' => $order->customer_lng]
        );

        if (!$route) {
            return response()->json(['message' => 'Could not calculate route.'], 404);
        }

        return response()->json($route);
    }
}
