<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalUsers = User::count();
        $totalRestaurants = Restaurant::count();
        $pendingRestaurants = Restaurant::where('status', 'pending')->count();
        $totalOrders = Order::count();
        $totalRevenue = Order::whereIn('status', ['delivered', 'completed'])->sum('total');
        $recentOrders = Order::with('user', 'restaurant')->latest()->take(5)->get();
        $recentUsers = User::latest()->take(5)->get();

        return response()->json([
            'total_users' => $totalUsers,
            'total_restaurants' => $totalRestaurants,
            'pending_restaurants' => $pendingRestaurants,
            'total_orders' => $totalOrders,
            'total_revenue' => (float) $totalRevenue,
            'recent_orders' => $recentOrders,
            'recent_users' => $recentUsers,
        ]);
    }

    public function users(): JsonResponse
    {
        $users = User::with('restaurant')
            ->latest()
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'phone' => $u->phone,
                'has_restaurant' => $u->restaurant?->restaurant_name,
                'created_at' => $u->created_at,
            ]);

        return response()->json(['users' => $users]);
    }

    public function updateUserRole(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:customer,restaurant,admin',
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $validated['role']]);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'User role updated successfully.',
        ]);
    }

    public function restaurants(): JsonResponse
    {
        $restaurants = Restaurant::with('user')
            ->withCount('menuItems', 'orders')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'restaurant_name' => $r->restaurant_name,
                'cuisine_type' => $r->cuisine_type,
                'city' => $r->city,
                'status' => $r->status,
                'owner_name' => $r->user?->name,
                'owner_email' => $r->user?->email,
                'menu_items_count' => $r->menu_items_count,
                'orders_count' => $r->orders_count,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['restaurants' => $restaurants]);
    }

    public function updateRestaurantStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,active,suspended',
        ]);

        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update(['status' => $validated['status']]);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => 'Restaurant status updated successfully.',
        ]);
    }

    public function orders(): JsonResponse
    {
        $orders = Order::with('user', 'restaurant', 'items')
            ->latest()
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'customer_name' => $o->user?->name,
                'customer_email' => $o->user?->email,
                'restaurant_name' => $o->restaurant?->restaurant_name,
                'restaurant_id' => $o->restaurant_id,
                'total' => (float) $o->total,
                'status' => $o->status,
                'delivery_address' => $o->delivery_address,
                'items' => $o->items,
                'created_at' => $o->created_at,
            ]);

        return response()->json(['orders' => $orders]);
    }

    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,preparing,out_for_delivery,delivered,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $validated['status']]);

        return response()->json([
            'order' => $order->fresh()->load('user', 'restaurant', 'items'),
            'message' => 'Order status updated successfully.',
        ]);
    }
}
