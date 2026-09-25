<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SendsSetupOtp;
use App\Models\ActivityLog;
use App\Models\AdminNotification;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\Rider;
use App\Models\Setting;
use App\Models\User;
use App\Support\OrderStatuses;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
            'image' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
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
            'image' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
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
        $totalRevenue = Order::whereIn('status', OrderStatuses::COMPLETED_STATUSES)->where('payment_status', '!=', 'refunded')->sum('total');
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
                'status' => $u->status,
                'phone' => $u->phone,
                'has_restaurant' => $u->restaurant?->restaurant_name,
                'created_at' => $u->created_at,
            ]);

        return response()->json(['users' => $users]);
    }

    public function updateUserRole(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string|in:customer,restaurant,rider,admin',
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
            ->withAvg('reviews', 'rating')
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
                'owner_phone' => $r->user?->phone,
                'rating' => $r->reviews_avg_rating !== null ? round((float) $r->reviews_avg_rating, 1) : null,
                'menu_items_count' => $r->menu_items_count,
                'orders_count' => $r->orders_count,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['restaurants' => $restaurants]);
    }

    public function restaurantDetail($id): JsonResponse
    {
        $restaurant = Restaurant::with('user', 'menuItems')
            ->withCount('orders', 'reviews')
            ->withAvg('reviews', 'rating')
            ->findOrFail($id);

        return response()->json(['restaurant' => $restaurant]);
    }

    public function updateRestaurantStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,approved,rejected,suspended',
        ]);

        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update(['status' => $validated['status']]);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => 'Restaurant status updated successfully.',
        ]);
    }

    public function suspendRestaurant($id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);

        if ($restaurant->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved restaurants can be suspended.',
            ], 422);
        }

        $restaurant->update(['status' => 'suspended']);

        ActivityLog::create([
            'type' => 'restaurant_suspended',
            'description' => "Restaurant \"{$restaurant->restaurant_name}\" was suspended.",
        ]);

        $this->notify('restaurant_suspended', 'Restaurant suspended', "{$restaurant->restaurant_name} was suspended.", 'restaurants', $restaurant->id);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => "{$restaurant->restaurant_name} suspended.",
        ]);
    }

    public function activateRestaurant($id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);

        if ($restaurant->status !== 'suspended') {
            return response()->json([
                'message' => 'Only suspended restaurants can be activated.',
            ], 422);
        }

        $restaurant->update(['status' => 'approved']);

        ActivityLog::create([
            'type' => 'restaurant_activated',
            'description' => "Restaurant \"{$restaurant->restaurant_name}\" was reactivated.",
        ]);

        $this->notify('restaurant_activated', 'Restaurant reactivated', "{$restaurant->restaurant_name} is active again.", 'restaurants', $restaurant->id);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => "{$restaurant->restaurant_name} reactivated.",
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'search' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|max:255',
            'order_type' => 'sometimes|string|max:255',
            'payment_method' => 'sometimes|string|max:255',
            'payment_status' => 'sometimes|string|max:255',
            'date_from' => 'sometimes|date',
            'date_to' => 'sometimes|date',
        ]);

        $query = Order::with('user', 'restaurant', 'items', 'rider');

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                if (ctype_digit($search)) {
                    $q->orWhere('id', (int) $search);
                }
                $q->orWhere('tran_id', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"))
                    ->orWhereHas('restaurant', fn($r) => $r->where('restaurant_name', 'like', "%{$search}%"));
            });
        }

        foreach (['status', 'order_type', 'payment_method', 'payment_status'] as $filter) {
            if (!empty($validated[$filter])) {
                $query->where($filter, $validated[$filter]);
            }
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $perPage = $validated['per_page'] ?? 20;

        $orders = $query->latest()->paginate($perPage);

        $mapped = $orders->map(fn($o) => [
            'id' => $o->id,
            'customer_name' => $o->user?->name,
            'customer_email' => $o->user?->email,
            'customer_phone' => $o->user?->phone,
            'restaurant_name' => $o->restaurant?->restaurant_name,
            'restaurant_id' => $o->restaurant_id,
            'rider_name' => $o->rider?->user?->name,
            'rider_id' => $o->rider_id,
            'total' => (float) $o->total,
            'subtotal' => (float) $o->total - (float) $o->delivery_fee,
            'delivery_fee' => (float) $o->delivery_fee,
            'payment_method' => $o->payment_method,
            'payment_status' => $o->payment_status,
            'tran_id' => $o->tran_id,
            'status' => $o->status,
            'order_type' => $o->order_type,
            'table_number' => $o->table_number,
            'delivery_address' => $o->delivery_address,
            'delivered_at' => $o->delivered_at,
            'items' => $o->items,
            'created_at' => $o->created_at,
        ]);

        return response()->json([
            'orders' => $mapped->values(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function orderDetail($id): JsonResponse
    {
        $order = Order::with('user', 'restaurant', 'items', 'rider.user', 'statusHistories')
            ->findOrFail($id);

        return response()->json(['order' => $order]);
    }

    public function assignRider(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'rider_id' => 'nullable|integer|exists:riders,id',
        ]);

        $order = Order::findOrFail($id);

        if (in_array($order->status, OrderStatuses::TERMINAL_STATUSES)) {
            throw ValidationException::withMessages([
                'rider_id' => ['A rider cannot be assigned to a completed or cancelled order.'],
            ]);
        }

        if (($order->order_type ?? null) === 'takeout' && !empty($validated['rider_id'])) {
            throw ValidationException::withMessages([
                'rider_id' => ['Takeout orders are self-pickup and cannot be assigned a rider.'],
            ]);
        }

        $previousRider = $order->rider;

        if (empty($validated['rider_id'])) {
            $order->update(['rider_id' => null, 'status' => 'ready']);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => 'ready',
                'changed_by' => 'admin',
            ]);

            ActivityLog::create([
                'type' => 'rider_unassigned',
                'description' => $previousRider
                    ? "Rider \"{$previousRider->user?->name}\" was unassigned from order #{$order->id}."
                    : "Order #{$order->id} rider assignment removed.",
            ]);

            return response()->json([
                'order' => $order->fresh()->load('user', 'restaurant', 'items', 'rider.user'),
                'message' => 'Rider unassigned from order successfully.',
            ]);
        }

        $rider = Rider::findOrFail($validated['rider_id']);

        if ($rider->status !== 'approved') {
            throw ValidationException::withMessages([
                'rider_id' => ['Only approved riders can be assigned to orders.'],
            ]);
        }

        if (!$rider->is_online) {
            throw ValidationException::withMessages([
                'rider_id' => ["Rider \"{$rider->user?->name}\" is offline and cannot be assigned."],
            ]);
        }

        $activeOrderCount = Order::where('rider_id', $rider->id)
            ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
            ->count();

        if ($activeOrderCount > 0) {
            throw ValidationException::withMessages([
                'rider_id' => ["Rider \"{$rider->user?->name}\" is already delivering another order."],
            ]);
        }

        $order->update(['rider_id' => $rider->id, 'status' => 'assigned']);

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => 'assigned',
            'changed_by' => 'admin',
        ]);

        ActivityLog::create([
            'type' => 'rider_assigned',
            'description' => "Rider \"{$rider->user?->name}\" was assigned to order #{$order->id}.",
        ]);

        return response()->json([
            'order' => $order->fresh()->load('user', 'restaurant', 'items', 'rider.user'),
            'message' => 'Rider assigned to order successfully.',
        ]);
    }

    /**
     * Close the manual refund loop: only orders flagged refund_pending
     * (by cancel/complaint/failed-delivery flows) can be marked refunded,
     * after the money actually moves in the gateway dashboard.
     */
    public function markRefunded($id): JsonResponse
    {
        $order = DB::transaction(function () use ($id) {
            $locked = Order::whereKey($id)->lockForUpdate()->firstOrFail();

            if (($locked->payment_status ?? null) !== 'refund_pending') {
                throw ValidationException::withMessages([
                    'payment_status' => ['Only orders flagged for refund can be marked as refunded.'],
                ]);
            }

            $locked->update(['payment_status' => 'refunded']);

            ActivityLog::create([
                'type' => 'refund_completed',
                'description' => "Order #{$locked->id} refund marked as completed.",
            ]);

            $this->notify('refund_completed', 'Refund completed', "Order #{$locked->id} refund marked as completed.", 'orders', $locked->id);

            return $locked->fresh();
        });

        return response()->json([
            'order' => $order,
            'message' => 'Refund marked as completed.',
        ]);
    }

    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        // Admins are read-only for order lifecycle status.
        // Status is owned by restaurants (confirmed/preparing/ready) and riders
        // (picked_up/on_the_way/delivered). Route removed in routes/api.php;
        // this guard remains so direct calls can never mutate status.
        abort(403, 'Order status is managed by the restaurant and rider.');
    }

    public function stats(): JsonResponse
    {
        $todayRevenue = Order::whereDate('created_at', today())
            ->whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->where('payment_status', '!=', 'refunded')
            ->sum('total');

        $yesterdayRevenue = Order::whereDate('created_at', today()->subDay())
            ->whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->where('payment_status', '!=', 'refunded')
            ->sum('total');

        $activeOrders = Order::whereIn('status', OrderStatuses::ACTIVE_STATUSES)->count();

        $totalUsers = User::count();

        $pendingRestaurants = Restaurant::where('status', 'pending')->count();
        $pendingRiders = Rider::where('status', 'pending')->count();

        $newUsersThisWeek = User::where('created_at', '>=', now()->subDays(7))->count();

        $riders = Rider::with('user')->get();
        $ridersApprovedIds = $riders->where('status', 'approved')->pluck('id');
        $deliveringIds = Order::whereIn('rider_id', $ridersApprovedIds)
            ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
            ->pluck('rider_id')
            ->unique();

        $trendStart = now()->startOfDay()->subDays(6);
        $dailyRevenue = Order::where('created_at', '>=', $trendStart)
            ->whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->where('payment_status', '!=', 'refunded')
            ->selectRaw('DATE(created_at) as date, SUM(total) as revenue')
            ->groupBy('date')
            ->pluck('revenue', 'date');

        $trendLabels = [];
        $trendValues = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->startOfDay()->subDays($i)->toDateString();
            $trendLabels[] = now()->subDays($i)->format('D');
            $trendValues[] = (float) ($dailyRevenue[$date] ?? 0);
        }

        $statusBreakdown = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn($count) => (int) $count);

        $activeOrdersList = Order::with('user', 'restaurant', 'rider.user')
            ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'customer_name' => $o->user?->name,
                'restaurant_name' => $o->restaurant?->restaurant_name,
                'rider_name' => $o->rider?->user?->name,
                'status' => $o->status,
                'order_type' => $o->order_type,
                'total' => (float) $o->total,
                'created_at' => $o->created_at,
            ]);

        return response()->json([
            'today_revenue' => (float) $todayRevenue,
            'revenue_delta' => $yesterdayRevenue > 0
                ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1)
                : null,
            'active_orders' => $activeOrders,
            'total_users' => $totalUsers,
            'pending_approvals' => $pendingRestaurants + $pendingRiders,
            'pending_restaurants' => $pendingRestaurants,
            'pending_riders' => $pendingRiders,
            'new_users_this_week' => $newUsersThisWeek,
            'riders_active' => $ridersApprovedIds->count(),
            'riders_delivering' => $deliveringIds->count(),
            'riders_idle' => $ridersApprovedIds->count() - $deliveringIds->count(),
            'riders_suspended' => $riders->where('status', 'suspended')->count(),
            'revenue_trend_7d' => [
                'labels' => $trendLabels,
                'values' => $trendValues,
            ],
            'order_status_breakdown' => $statusBreakdown,
            'active_orders_list' => $activeOrdersList,
            'refund_pending_count' => Order::where('payment_status', 'refund_pending')->count(),
            'refunded_count' => Order::where('payment_status', 'refunded')->count(),
            'refunded_total' => (float) Order::where('payment_status', 'refunded')->sum('total'),
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

        $sent = false;

        if ($restaurant->user) {
            $sent = $this->sendSetupOtp($restaurant->user, $restaurant, $otp);
        }

        ActivityLog::create([
            'type' => 'restaurant_approved',
            'description' => "Restaurant \"{$restaurant->restaurant_name}\" was approved.",
        ]);

        $this->notify('restaurant_approved', 'Restaurant approved', "{$restaurant->restaurant_name} was approved.", 'restaurants', $restaurant->id);

        return response()->json([
            'restaurant' => $restaurant->fresh(),
            'message' => $sent
                ? "{$restaurant->restaurant_name} approved. A setup code was sent to the owner."
                : "{$restaurant->restaurant_name} approved, but the setup code could not be emailed. The owner can request a new code on the setup page.",
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

        $this->notify('restaurant_rejected', 'Restaurant rejected', "{$restaurant->restaurant_name} was rejected.", 'restaurants', $restaurant->id);

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

    public function riders(): JsonResponse
    {
        $riders = Rider::with('user')
            ->withCount(['orders as completed_deliveries' => fn($q) => $q->whereIn('status', OrderStatuses::COMPLETED_STATUSES)])
            ->latest()
            ->get()
            ->map(function ($r) {
                $activeOrder = Order::with('user')
                    ->where('rider_id', $r->id)
                    ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
                    ->latest('created_at')
                    ->first();

                return [
                    'id' => $r->id,
                    'vehicle_type' => $r->vehicle_type,
                    'city' => $r->city,
                    'phone' => $r->phone,
                    'status' => $r->status,
                    'is_online' => $r->is_online,
                    'rider_name' => $r->user?->name,
                    'rider_email' => $r->user?->email,
                    'completed_deliveries' => $r->completed_deliveries,
                    'is_delivering' => $activeOrder !== null,
                    'current_assigned_order' => $activeOrder ? [
                        'id' => $activeOrder->id,
                        'customer_name' => $activeOrder->user?->name,
                        'status' => $activeOrder->status,
                        'order_type' => $activeOrder->order_type,
                    ] : null,
                    'created_at' => $r->created_at,
                ];
            });

        return response()->json(['riders' => $riders]);
    }

    public function riderDetail($id): JsonResponse
    {
        $rider = Rider::with('user')
            ->withCount(['orders as completed_deliveries' => fn($q) => $q->whereIn('status', OrderStatuses::COMPLETED_STATUSES)])
            ->withCount(['orders as total_assigned' => fn($q) => $q->whereNotNull('rider_id')])
            ->findOrFail($id);

        $deliveredOrders = Order::where('rider_id', $rider->id)
            ->whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->whereNotNull('delivered_at')
            ->get();

        $avgMinutes = $deliveredOrders->count() > 0
            ? (int) round($deliveredOrders->avg(fn($o) => $o->created_at->diffInMinutes($o->delivered_at)))
            : null;

        $recentDeliveries = Order::with('user', 'restaurant')
            ->where('rider_id', $rider->id)
            ->latest()
            ->take(10)
            ->get();

        $activeOrder = Order::with('user', 'restaurant')
            ->where('rider_id', $rider->id)
            ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
            ->latest('created_at')
            ->first();

        return response()->json([
            'rider' => $rider,
            'completed_deliveries' => $rider->completed_deliveries,
            'total_assigned' => $rider->total_assigned,
            'is_online' => $rider->is_online,
            'is_delivering' => $activeOrder !== null,
            'current_assigned_order' => $activeOrder ? [
                'id' => $activeOrder->id,
                'customer_name' => $activeOrder->user?->name,
                'restaurant_name' => $activeOrder->restaurant?->restaurant_name,
                'status' => $activeOrder->status,
                'order_type' => $activeOrder->order_type,
                'created_at' => $activeOrder->created_at,
            ] : null,
            'avg_delivery_minutes' => $avgMinutes,
            'recent_deliveries' => $recentDeliveries,
        ]);
    }

    public function suspendRider($id): JsonResponse
    {
        $rider = Rider::findOrFail($id);

        if ($rider->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved riders can be suspended.',
            ], 422);
        }

        $rider->update(['status' => 'suspended']);

        ActivityLog::create([
            'type' => 'rider_suspended',
            'description' => "Rider \"{$rider->user?->name}\" was suspended.",
        ]);

        $this->notify('rider_suspended', 'Rider suspended', "{$rider->user?->name} was suspended.", 'riders', $rider->id);

        return response()->json([
            'rider' => $rider->fresh(),
            'message' => 'Rider suspended.',
        ]);
    }

    public function activateRider($id): JsonResponse
    {
        $rider = Rider::findOrFail($id);

        if ($rider->status !== 'suspended') {
            return response()->json([
                'message' => 'Only suspended riders can be activated.',
            ], 422);
        }

        $rider->update(['status' => 'approved']);

        ActivityLog::create([
            'type' => 'rider_activated',
            'description' => "Rider \"{$rider->user?->name}\" was reactivated.",
        ]);

        $this->notify('rider_activated', 'Rider reactivated', "{$rider->user?->name} is active again.", 'riders', $rider->id);

        return response()->json([
            'rider' => $rider->fresh(),
            'message' => 'Rider reactivated.',
        ]);
    }

    public function pendingRiders(): JsonResponse
    {
        $riders = Rider::with('user')
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'vehicle_type' => $r->vehicle_type,
                'city' => $r->city,
                'status' => $r->status,
                'rider_name' => $r->user?->name,
                'rider_email' => $r->user?->email,
                'created_at' => $r->created_at,
            ]);

        return response()->json(['riders' => $riders]);
    }

    public function approveRider($id): JsonResponse
    {
        $rider = Rider::findOrFail($id);

        if ($rider->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending rider applications can be approved.',
            ], 422);
        }

        $rider->update(['status' => 'approved']);

        $otp = (string) random_int(100000, 999999);

        $rider->user()->update([
            'setup_otp' => Hash::make($otp),
            'setup_otp_expires_at' => now()->addMinutes(15),
        ]);

        $sent = false;

        if ($rider->user) {
            $sent = $this->sendRiderSetupOtp($rider->user, $rider, $otp);
        }

        ActivityLog::create([
            'type' => 'rider_approved',
            'description' => "Rider application for \"{$rider->user?->name}\" was approved.",
        ]);

        $this->notify('rider_approved', 'Rider approved', "{$rider->user?->name} was approved as a delivery agent.", 'riders', $rider->id);

        return response()->json([
            'rider' => $rider->fresh(),
            'message' => $sent
                ? 'Rider application approved. A setup code was sent to the applicant.'
                : 'Rider application approved, but the setup code could not be emailed. The applicant can request a new code on the setup page.',
        ]);
    }

    public function rejectRider($id): JsonResponse
    {
        $rider = Rider::findOrFail($id);

        if ($rider->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending rider applications can be rejected.',
            ], 422);
        }

        $rider->update(['status' => 'rejected']);

        $rider->user()?->update([
            'setup_otp' => null,
            'setup_otp_expires_at' => null,
        ]);

        ActivityLog::create([
            'type' => 'rider_rejected',
            'description' => "Rider application for \"{$rider->user?->name}\" was rejected.",
        ]);

        $this->notify('rider_rejected', 'Rider rejected', "{$rider->user?->name} was rejected as a delivery agent.", 'riders', $rider->id);

        return response()->json([
            'rider' => $rider->fresh(),
            'message' => 'Rider application rejected.',
        ]);
    }

    public function requeueRider($id): JsonResponse
    {
        $rider = Rider::findOrFail($id);

        if ($rider->status !== 'rejected') {
            return response()->json([
                'message' => 'Only rejected rider applications can be re-queued.',
            ], 422);
        }

        $rider->update(['status' => 'pending']);

        ActivityLog::create([
            'type' => 'rider_requeued',
            'description' => "Rider application for \"{$rider->user?->name}\" was re-queued for review.",
        ]);

        $this->notify('rider_requeued', 'Rider re-queued', "{$rider->user?->name} was re-queued for review.", 'riders', $rider->id);

        return response()->json([
            'rider' => $rider->fresh(),
            'message' => 'Rider application re-queued for review.',
        ]);
    }

    public function customers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'search' => 'sometimes|string|max:255',
            'status' => 'sometimes|string|in:active,suspended',
        ]);

        $query = User::where('role', 'customer')->withCount('orders');

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $perPage = $validated['per_page'] ?? 20;

        $customers = $query->latest()->paginate($perPage);

        $spending = Order::whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->where('payment_status', '!=', 'refunded')
            ->selectRaw('user_id, SUM(total) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $mapped = $customers->map(fn($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'address' => $u->address,
            'status' => $u->status,
            'total_orders' => $u->orders_count,
            'total_spending' => (float) ($spending[$u->id] ?? 0),
            'created_at' => $u->created_at,
        ]);

        return response()->json([
            'customers' => $mapped->values(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function customerDetail($id): JsonResponse
    {
        $customer = User::where('role', 'customer')->findOrFail($id);

        $orders = Order::with('restaurant', 'items')
            ->where('user_id', $customer->id)
            ->latest()
            ->take(10)
            ->get();

        $totalSpending = Order::where('user_id', $customer->id)
            ->whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->where('payment_status', '!=', 'refunded')
            ->sum('total');

        return response()->json([
            'customer' => $customer,
            'total_orders' => $customer->orders()->count(),
            'total_spending' => (float) $totalSpending,
            'orders' => $orders,
        ]);
    }

    public function suspendCustomer($id): JsonResponse
    {
        $customer = User::where('role', 'customer')->findOrFail($id);

        if ($customer->status === 'suspended') {
            return response()->json([
                'message' => 'This customer is already suspended.',
            ], 422);
        }

        $customer->update(['status' => 'suspended']);

        ActivityLog::create([
            'type' => 'customer_suspended',
            'description' => "Customer \"{$customer->name}\" was suspended.",
        ]);

        $this->notify('customer_suspended', 'Customer suspended', "{$customer->name} was suspended.", 'customers', $customer->id);

        return response()->json([
            'customer' => $customer->fresh(),
            'message' => "{$customer->name} suspended.",
        ]);
    }

    public function activateCustomer($id): JsonResponse
    {
        $customer = User::where('role', 'customer')->findOrFail($id);

        if ($customer->status !== 'suspended') {
            return response()->json([
                'message' => 'Only suspended customers can be activated.',
            ], 422);
        }

        $customer->update(['status' => 'active']);

        ActivityLog::create([
            'type' => 'customer_activated',
            'description' => "Customer \"{$customer->name}\" was reactivated.",
        ]);

        $this->notify('customer_activated', 'Customer reactivated', "{$customer->name} is active again.", 'customers', $customer->id);

        return response()->json([
            'customer' => $customer->fresh(),
            'message' => "{$customer->name} reactivated.",
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'search' => 'sometimes|string|max:255',
            'payment_status' => 'sometimes|string|max:255',
            'payment_method' => 'sometimes|string|max:255',
        ]);

        $query = Order::with('user', 'restaurant');

        if (!empty($validated['payment_status'])) {
            $query->where('payment_status', $validated['payment_status']);
        }

        if (!empty($validated['payment_method'])) {
            $query->where('payment_method', $validated['payment_method']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                if (ctype_digit($search)) {
                    $q->orWhere('id', (int) $search);
                }
                $q->orWhere('tran_id', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('restaurant', fn($r) => $r->where('restaurant_name', 'like', "%{$search}%"));
            });
        }

        $perPage = $validated['per_page'] ?? 20;

        $payments = $query->latest()->paginate($perPage);

        $mapped = $payments->map(fn($o) => [
            'order_id' => $o->id,
            'tran_id' => $o->tran_id,
            'customer_name' => $o->user?->name,
            'restaurant_name' => $o->restaurant?->restaurant_name,
            'method' => $o->payment_method,
            'amount' => (float) $o->total,
            'status' => $o->payment_status,
            'order_status' => $o->status,
            'created_at' => $o->created_at,
        ]);

        return response()->json([
            'payments' => $mapped->values(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'range' => 'sometimes|string|in:today,7,30,month,custom',
            'from' => 'sometimes|nullable|date',
            'to' => 'sometimes|nullable|date',
        ]);

        $now = now();
        $rangeKey = $validated['range'] ?? '30';

        switch ($rangeKey) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case '7':
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'month':
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfDay();
                break;
            case 'custom':
                $start = !empty($validated['from'])
                    ? Carbon::parse($validated['from'])->startOfDay()
                    : $now->copy()->subDays(29)->startOfDay();
                $end = !empty($validated['to'])
                    ? Carbon::parse($validated['to'])->endOfDay()
                    : $now->copy()->endOfDay();
                break;
            default:
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
        }

        if ($start->greaterThan($end)) {
            throw ValidationException::withMessages([
                'from' => ['The start date must be on or before the end date.'],
            ]);
        }

        if ($start->diffInDays($end) > 92) {
            throw ValidationException::withMessages([
                'from' => ['The custom range cannot exceed 92 days.'],
            ]);
        }

        $completedOrders = Order::whereIn('status', OrderStatuses::COMPLETED_STATUSES)
            ->whereBetween('created_at', [$start, $end])
            ->get();

        // Money-kept orders only: refunded orders stay in $completedOrders
        // for work/count stats (rider leaderboards) but leave every sum.
        $revenueOrders = $completedOrders->where('payment_status', '!=', 'refunded')->values();

        $totalRevenue = $revenueOrders->sum('total');

        $avgOrderValue = $revenueOrders->count() > 0
            ? (float) round($totalRevenue / $revenueOrders->count(), 2)
            : null;

        $totalOrders = Order::whereBetween('created_at', [$start, $end])->count();
        $cancelledOrders = Order::where('status', 'cancelled')
            ->whereBetween('created_at', [$start, $end])
            ->count();
        $cancellationRate = $totalOrders > 0 ? round(($cancelledOrders / $totalOrders) * 100, 1) : null;

        $ordersPerDay = Order::whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $revenuePerDay = $revenueOrders
            ->groupBy(fn($o) => $o->created_at->toDateString())
            ->map(fn($orders) => (float) round($orders->sum('total'), 2));

        $labels = [];
        $orderValues = [];
        $revenueValues = [];
        $newCustomerValues = [];
        $newCustomerPerDay = User::where('role', 'customer')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $days = $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1;
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $labels[] = $start->copy()->addDays($i)->format('d M');
            $orderValues[] = (int) ($ordersPerDay[$date] ?? 0);
            $revenueValues[] = (float) ($revenuePerDay[$date] ?? 0);
            $newCustomerValues[] = (int) ($newCustomerPerDay[$date] ?? 0);
        }

        $ordersByStatus = Order::whereBetween('created_at', [$start, $end])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->orderByDesc('count')
            ->pluck('count', 'status')
            ->map(fn($count) => (int) $count);

        $typeSplit = Order::whereBetween('created_at', [$start, $end])
            ->selectRaw('order_type, COUNT(*) as count')
            ->groupBy('order_type')
            ->pluck('count', 'order_type')
            ->map(fn($count) => (int) $count);

        $customerIds = User::where('role', 'customer')->whereBetween('created_at', [$start, $end])->pluck('id');
        $orderingUserIds = Order::whereBetween('created_at', [$start, $end])->select('user_id')->distinct()->pluck('user_id');

        $ordersPerCustomer = Order::whereBetween('created_at', [$start, $end])
            ->selectRaw('user_id, COUNT(*) as count')
            ->groupBy('user_id')
            ->pluck('count', 'user_id');

        $returningCustomers = $ordersPerCustomer->filter(fn($count) => $count >= 2)->count();

        $revenueByRestaurant = $revenueOrders
            ->loadMissing('restaurant')
            ->groupBy('restaurant_id')
            ->map(fn($orders) => [
                'restaurant_name' => $orders->first()->restaurant?->restaurant_name ?? 'Unknown',
                'revenue' => (float) round($orders->sum('total'), 2),
            ])
            ->sortByDesc('revenue')
            ->values();

        $ordersByRestaurant = Order::with('restaurant')
            ->whereBetween('created_at', [$start, $end])
            ->get()
            ->groupBy('restaurant_id')
            ->map(fn($orders) => [
                'restaurant_name' => $orders->first()->restaurant?->restaurant_name ?? 'Unknown',
                'orders' => $orders->count(),
            ])
            ->sortByDesc('orders')
            ->values();

        $categoryRevenue = OrderItem::with('menuItem.menuCategory')
            ->whereHas('order', fn($q) => $q->whereIn('status', OrderStatuses::COMPLETED_STATUSES)->where('payment_status', '!=', 'refunded')->whereBetween('created_at', [$start, $end]))
            ->get()
            ->groupBy(fn($item) => $item->menuItem?->menuCategory?->name ?? 'Uncategorized')
            ->map(fn($items) => (float) round($items->sum(fn($i) => (float) $i->price * (int) $i->quantity), 2))
            ->sortByDesc(fn($value) => $value)
            ->values();

        $ratings = Restaurant::withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->get()
            ->map(fn($r) => [
                'restaurant_name' => $r->restaurant_name,
                'rating' => $r->reviews_avg_rating !== null ? round((float) $r->reviews_avg_rating, 1) : null,
                'reviews_count' => $r->reviews_count,
            ])
            ->filter(fn($r) => $r['rating'] !== null)
            ->sortByDesc('rating')
            ->values();

        $completedDeliveries = $completedOrders
            ->filter(fn($o) => $o->rider_id !== null && $o->delivered_at !== null)
            ->values();

        $riderStats = $completedDeliveries->groupBy('rider_id')
            ->map(function ($orders) {
                $rider = $orders->first()->rider;

                return [
                    'rider_name' => $rider?->user?->name ?? 'Unknown',
                    'deliveries' => $orders->count(),
                    'avg_delivery_minutes' => (int) round($orders->avg(fn($o) => $o->created_at->diffInMinutes($o->delivered_at))),
                ];
            })
            ->sortByDesc('deliveries')
            ->values();

        $avgDeliveryMinutes = $completedDeliveries->count() > 0
            ? (int) round($completedDeliveries->avg(fn($o) => $o->created_at->diffInMinutes($o->delivered_at)))
            : null;

        return response()->json([
            'range' => [
                'key' => $rangeKey,
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
            ],
            'revenue' => [
                'total' => (float) round($totalRevenue, 2),
                'avg_order_value' => $avgOrderValue,
                'completed_orders' => $completedOrders->count(),
                'trend' => [
                    'labels' => $labels,
                    'values' => $revenueValues,
                ],
                'by_restaurant' => $revenueByRestaurant,
                'by_category' => $categoryRevenue,
            ],
            'orders' => [
                'total' => $totalOrders,
                'completed' => $completedOrders->count(),
                'cancelled_count' => $cancelledOrders,
                'cancellation_rate' => $cancellationRate,
                'per_day_labels' => $labels,
                'per_day_values' => $orderValues,
                'by_status' => $ordersByStatus,
                'by_type' => $typeSplit,
            ],
            'customers' => [
                'total' => User::where('role', 'customer')->count(),
                'new' => $customerIds->count(),
                'active' => $orderingUserIds->count(),
                'returning' => $returningCustomers,
                'growth' => [
                    'labels' => $labels,
                    'values' => $newCustomerValues,
                ],
            ],
            'restaurants' => [
                'top_by_revenue' => $revenueByRestaurant->take(5)->values(),
                'top_by_orders' => $ordersByRestaurant->take(5)->values(),
                'ratings' => $ratings,
            ],
            'delivery' => [
                'completed_deliveries' => $completedDeliveries->count(),
                'avg_delivery_minutes' => $avgDeliveryMinutes,
                'by_rider' => $riderStats,
            ],
        ]);
    }

    public function notifications(): JsonResponse
    {
        $notifications = AdminNotification::latest()->take(20)->get();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => AdminNotification::where('is_read', false)->count(),
        ]);
    }

    public function markAllNotificationsRead(): JsonResponse
    {
        AdminNotification::where('is_read', false)->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function markNotificationRead($id): JsonResponse
    {
        $notification = AdminNotification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json([
            'notification' => $notification->fresh(),
            'message' => 'Notification marked as read.',
        ]);
    }

    public function settings(): JsonResponse
    {
        $platformDefaults = [
            'brand_name' => 'SwiftBite',
            'brand_email' => config('mail.from.address'),
            'brand_phone' => '',
            'brand_address' => '',
            'support_email' => config('mail.from.address'),
        ];

        foreach ($platformDefaults as $key => $default) {
            Setting::firstOrCreate(['key' => $key], ['value' => $default, 'group' => 'platform']);
        }

        $platform = Setting::where('group', 'platform')->pluck('value', 'key');

        return response()->json([
            'platform' => $platform,
            'read_only' => [
                'payment_gateway' => config('sslcommerz.store_name', 'SSLCommerz'),
                'payment_gateway_mode' => config('sslcommerz.sandbox') ? 'Sandbox' : 'Live',
                'payment_gateway_configured' => filled(config('sslcommerz.store_id')) && filled(config('sslcommerz.store_password')),
                'mail_host' => config('mail.host'),
                'mail_from' => config('mail.from.address'),
                'mail_from_name' => config('mail.from.name'),
                'mail_configured' => filled(config('mail.password')),
            ],
        ]);
    }

    public function updatePlatformSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'brand_name' => 'sometimes|string|max:255',
            'brand_email' => 'sometimes|email|max:255',
            'brand_phone' => 'sometimes|nullable|string|max:255',
            'brand_address' => 'sometimes|nullable|string|max:255',
            'support_email' => 'sometimes|email|max:255',
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value, 'group' => 'platform']);
        }

        return response()->json([
            'message' => 'Platform settings updated successfully.',
            'platform' => Setting::where('group', 'platform')->pluck('value', 'key'),
        ]);
    }

    public function adminProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'avatar' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
        ]);

        $user->update($validated);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Profile updated successfully.',
        ]);
    }

    public function adminChangePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        $user->update(['password' => $validated['new_password']]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function categoryRequests(Request $request): JsonResponse
    {
        $query = \App\Models\CategoryRequest::with('restaurant');

        if ($request->has('status') && in_array($request->status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $request->status);
        }

        $requests = $query->latest()->get()->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'status' => $r->status,
            'admin_note' => $r->admin_note,
            'created_at' => $r->created_at,
            'restaurant' => [
                'id' => $r->restaurant->id,
                'restaurant_name' => $r->restaurant->restaurant_name,
            ],
        ]);

        $pendingCount = \App\Models\CategoryRequest::where('status', 'pending')->count();

        return response()->json(['requests' => $requests, 'pending_count' => $pendingCount]);
    }

    public function approveCategoryRequest(int $id): JsonResponse
    {
        $request = \App\Models\CategoryRequest::findOrFail($id);

        if ($request->status !== \App\Models\CategoryRequest::PENDING) {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $existingCategory = \App\Models\Category::whereRaw('LOWER(name) = ?', [strtolower($request->name)])->first();
        if ($existingCategory) {
            $request->update(['status' => \App\Models\CategoryRequest::APPROVED]);
            return response()->json(['message' => 'A category with this name already exists. Request marked as approved.']);
        }

        $maxOrder = \App\Models\Category::max('sort_order') ?? 0;
        $category = \App\Models\Category::create([
            'name' => $request->name,
            'is_active' => true,
            'sort_order' => $maxOrder + 1,
        ]);

        $request->update(['status' => \App\Models\CategoryRequest::APPROVED]);

        $this->notify(
            'category_request_approved',
            'Category request approved',
            "The category \"{$request->name}\" has been created.",
            'categories',
            $category->id
        );

        ActivityLog::create([
            'type' => 'category_request_approved',
            'description' => "Admin approved category request #{$request->id} from {$request->restaurant->restaurant_name}: \"{$request->name}\"",
        ]);

        return response()->json([
            'message' => "Category \"{$request->name}\" has been created.",
            'category' => $category,
        ]);
    }

    public function rejectCategoryRequest(int $id, Request $request): JsonResponse
    {
        $categoryRequest = \App\Models\CategoryRequest::findOrFail($id);

        if ($categoryRequest->status !== \App\Models\CategoryRequest::PENDING) {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:500',
        ]);

        $categoryRequest->update([
            'status' => \App\Models\CategoryRequest::REJECTED,
            'admin_note' => $validated['admin_note'] ?? null,
        ]);

        $this->notify(
            'category_request_rejected',
            'Category request rejected',
            "The category request \"{$categoryRequest->name}\" has been rejected.",
            'categories',
            $categoryRequest->id
        );

        ActivityLog::create([
            'type' => 'category_request_rejected',
            'description' => "Admin rejected category request #{$categoryRequest->id} from {$categoryRequest->restaurant->restaurant_name}: \"{$categoryRequest->name}\"",
        ]);

        return response()->json(['message' => 'Request rejected.']);
    }

    // ---------- Reviews moderation (homepage curation + per-dish visibility) ----------

    public function reviews(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:pending,approved,rejected',
            'featured' => 'nullable|boolean',
            'source' => 'nullable|string|in:customer,curated',
            'search' => 'nullable|string|max:255',
        ]);

        $query = Review::with(['user:id,name,email', 'restaurant:id,restaurant_name', 'menuItem:id,name', 'order:id'])
            ->latest();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (isset($validated['featured'])) {
            $query->where('is_featured', (bool) $validated['featured']);
        }
        if (!empty($validated['source'])) {
            $query->where('source', $validated['source']);
        }
        if (!empty($validated['search'])) {
            $s = $validated['search'];
            $query->where(function ($q) use ($s) {
                $q->where('comment', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%"))
                    ->orWhereHas('restaurant', fn ($r) => $r->where('restaurant_name', 'like', "%{$s}%"))
                    ->orWhereHas('menuItem', fn ($m) => $m->where('name', 'like', "%{$s}%"));
            });
        }

        $reviews = $query->take(200)->get()->map(fn ($r) => [
            'id' => $r->id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'status' => $r->status,
            'is_featured' => (bool) $r->is_featured,
            'source' => $r->source,
            'created_at' => $r->created_at,
            'user' => $r->user ? ['id' => $r->user->id, 'name' => $r->user->name, 'email' => $r->user->email] : null,
            'restaurant' => $r->restaurant ? ['id' => $r->restaurant->id, 'restaurant_name' => $r->restaurant->restaurant_name] : null,
            'menu_item' => $r->menuItem ? ['id' => $r->menuItem->id, 'name' => $r->menuItem->name] : null,
            'order_id' => $r->order_id,
        ]);

        return response()->json([
            'reviews' => $reviews,
            'pending_count' => Review::where('status', 'pending')->count(),
            'featured_count' => Review::where('status', 'approved')->where('is_featured', true)->count(),
        ]);
    }

    public function approveReview($id): JsonResponse
    {
        $review = Review::findOrFail($id);

        if ($review->status !== 'pending') {
            return response()->json(['message' => 'Only pending reviews can be approved.'], 422);
        }

        $review->update(['status' => 'approved']);

        ActivityLog::create([
            'type' => 'review_approved',
            'description' => "Admin approved review #{$review->id} by " . ($review->user?->name ?? 'customer') . '.',
        ]);

        return response()->json(['review' => $review->fresh(), 'message' => 'Review approved — now visible on its restaurant / dish page.']);
    }

    public function rejectReview($id): JsonResponse
    {
        $review = Review::findOrFail($id);

        if ($review->status === 'rejected') {
            return response()->json(['message' => 'Review is already rejected.'], 422);
        }

        $review->update(['status' => 'rejected', 'is_featured' => false]);

        ActivityLog::create([
            'type' => 'review_rejected',
            'description' => "Admin rejected review #{$review->id}.",
        ]);

        return response()->json(['review' => $review->fresh(), 'message' => 'Review rejected — hidden everywhere.']);
    }

    public function setReviewFeatured($id, Request $request): JsonResponse
    {
        $validated = $request->validate(['is_featured' => 'required|boolean']);
        $review = Review::findOrFail($id);

        if ($review->status !== 'approved') {
            return response()->json(['message' => 'Only approved reviews can be featured on the homepage.'], 422);
        }

        if (($review->comment === null || trim($review->comment) === '') && $validated['is_featured']) {
            return response()->json(['message' => 'Reviews without text cannot be featured on the homepage.'], 422);
        }

        $review->update(['is_featured' => (bool) $validated['is_featured']]);

        ActivityLog::create([
            'type' => $review->is_featured ? 'review_featured' : 'review_unfeatured',
            'description' => "Admin " . ($review->is_featured ? 'featured' : 'unfeatured') . " review #{$review->id} for the homepage.",
        ]);

        return response()->json([
            'review' => $review->fresh(),
            'message' => $review->is_featured ? 'Review will now show on the homepage.' : 'Review removed from the homepage.',
        ]);
    }

    public function deleteReview($id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->delete();

        ActivityLog::create([
            'type' => 'review_deleted',
            'description' => "Admin deleted review #{$id}.",
        ]);

        return response()->json(['message' => 'Review deleted.']);
    }

    private function notify(string $type, string $title, string $description, ?string $linkType = null, ?int $linkId = null): void
    {
        AdminNotification::create([
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'link_type' => $linkType,
            'link_id' => $linkId,
        ]);
    }


}