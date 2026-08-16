<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SendsSetupOtp;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    use SendsSetupOtp;
    public function categories(): JsonResponse
    {
        $categories = Category::withCount('menuItems')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['categories' => $categories]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:255',
        ]);

        $validated['sort_order'] = Category::max('sort_order') + 1;

        $category = Category::create($validated);

        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'icon' => 'nullable|string|max:255',
        ]);

        $category->update($validated);

        return response()->json([
            'category' => $category->fresh(),
            'message' => 'Category updated successfully.',
        ]);
    }

    public function deleteCategory($id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    public function reorderCategories(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:categories,id',
        ]);

        foreach (array_values($validated['ids']) as $index => $categoryId) {
            Category::where('id', $categoryId)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Categories reordered successfully.']);
    }
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
                'accepts_dine_in' => (bool) $r->accepts_dine_in,
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
            'status' => 'required|string|in:pending,approved,rejected',
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
                'subtotal' => (float) $o->total - (float) $o->delivery_fee,
                'delivery_fee' => (float) $o->delivery_fee,
                'payment_method' => $o->payment_method,
                'payment_status' => $o->payment_status,
                'status' => $o->status,
                'order_type' => $o->order_type,
                'table_number' => $o->table_number,
                'delivery_address' => $o->delivery_address,
                'items' => $o->items,
                'created_at' => $o->created_at,
            ]);

        return response()->json(['orders' => $orders]);
    }

    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,preparing,out_for_delivery,delivered,served,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $validated['status']]);

        return response()->json([
            'order' => $order->fresh()->load('user', 'restaurant', 'items'),
            'message' => 'Order status updated successfully.',
        ]);
    }

    public function stats(): JsonResponse
    {
        $todayRevenue = Order::whereDate('created_at', today())
            ->whereIn('status', ['delivered', 'completed'])
            ->sum('total');

        $activeOrders = Order::whereIn('status', ['pending', 'confirmed', 'preparing', 'out_for_delivery'])->count();

        $totalUsers = User::count();

        $pendingApprovals = Restaurant::where('status', 'pending')->count();

        return response()->json([
            'today_revenue' => (float) $todayRevenue,
            'active_orders' => $activeOrders,
            'total_users' => $totalUsers,
            'pending_approvals' => $pendingApprovals,
        ]);
    }

    public function pendingRestaurants(): JsonResponse
    {
        $restaurants = Restaurant::with('user')
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'restaurant_name' => $r->restaurant_name,
                'cuisine_type' => $r->cuisine_type,
                'city' => $r->city,
                'owner_name' => $r->user?->name,
                'owner_email' => $r->user?->email,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['restaurants' => $restaurants]);
    }

    public function approve($id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);

        if ($restaurant->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending restaurants can be approved.',
            ], 422);
        }

        $restaurant->update(['status' => 'approved']);

        $otp = (string) random_int(100000, 999999);

        $restaurant->user()->update([
            'setup_otp' => Hash::make($otp),
            'setup_otp_expires_at' => now()->addMinutes(15),
        ]);

        if ($restaurant->user) {
            $this->sendSetupOtp($restaurant->user, $restaurant, $otp);
        }

        ActivityLog::create([
            'type' => 'restaurant_approved',
            'description' => "Restaurant \"{$restaurant->restaurant_name}\" was approved.",
        ]);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => "{$restaurant->restaurant_name} approved. A setup code was sent to the owner.",
        ]);
    }

    public function reject($id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);

        if ($restaurant->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending restaurants can be rejected.',
            ], 422);
        }

        $restaurant->update(['status' => 'rejected']);

        $restaurant->user()?->update([
            'setup_otp' => null,
            'setup_otp_expires_at' => null,
        ]);

        ActivityLog::create([
            'type' => 'restaurant_rejected',
            'description' => "Restaurant \"{$restaurant->restaurant_name}\" was rejected.",
        ]);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => "{$restaurant->restaurant_name} rejected.",
        ]);
    }

    public function activityLog(): JsonResponse
    {
        $logs = ActivityLog::latest()->take(10)->get();

        return response()->json(['activity' => $logs]);
    }
}
