<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CustomerAddress;
use App\Models\Favorite;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\WishlistItem;
use App\Support\Geocoder;
use App\Support\OrderLimits;
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'remove_avatar' => 'boolean',
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } elseif (!empty($validated['remove_avatar'])) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = null;
        }
        unset($validated['remove_avatar']);

        $user->update($validated);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'Profile updated successfully.',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($validated['new_password'])]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['restaurant', 'items', 'rider.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function orderShow(Request $request, $id): JsonResponse
    {
        $order = $request->user()->orders()
            ->with(['restaurant', 'items', 'rider.user', 'statusHistories'])
            ->findOrFail($id);

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

        $orderData = $order->toArray();
        $orderData['rider_location'] = $riderLocation;
        $orderData['restaurant_coords'] = $restaurantCoords;
        $orderData['customer_coords'] = $customerCoords;

        return response()->json(['order' => $orderData]);
    }

    public function placeOrder(Request $request): JsonResponse
    {
        $hardMaxPerItem = OrderLimits::hardMaxPerItem();
        $maxDistinct = OrderLimits::maxDistinctItems();

        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'items' => "required|array|min:1|max:{$maxDistinct}",
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => "required|integer|min:1|max:{$hardMaxPerItem}",
            'delivery_address' => 'nullable|string|max:255',
            'delivery_instructions' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|in:cash,bkash,nagad,card',
            'order_type' => 'nullable|string|in:delivery,dine_in,takeout',
            'table_number' => 'nullable|string|max:50',
        ]);

        // No duplicate lines for the same menu item (prevents quantity bypass).
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id');
        if ($menuItemIds->count() !== $menuItemIds->unique()->count()) {
            return response()->json(['message' => 'Duplicate items are not allowed. Combine them into a single line with the total quantity.'], 422);
        }

        // One customer shouldn't juggle unlimited concurrent orders.
        $activeCount = $request->user()->orders()
            ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
            ->count();
        if ($activeCount >= OrderLimits::maxActiveOrders()) {
            return response()->json([
                'message' => 'You already have ' . $activeCount . ' active orders. Please wait for one to complete before placing another.',
            ], 422);
        }

        $totalUnits = collect($validated['items'])->sum('quantity');
        if ($totalUnits > OrderLimits::hardMaxTotalUnits()) {
            return response()->json([
                'message' => 'Order is too large (' . $totalUnits . ' units). Maximum ' . OrderLimits::hardMaxTotalUnits() . ' units per order — please split it or contact the restaurant for catering.',
            ], 422);
        }

        $restaurant = Restaurant::findOrFail($validated['restaurant_id']);

        if (!$restaurant->allow_bulk_orders && $totalUnits > OrderLimits::maxTotalUnits()) {
            return response()->json([
                'message' => 'Order is too large (' . $totalUnits . ' units). This store allows up to ' . OrderLimits::maxTotalUnits() . ' units per order — contact them directly for catering / bulk orders.',
            ], 422);
        }

        try {
            $built = DB::transaction(function () use ($validated, $restaurant) {
                return $this->buildOrderLines($restaurant, $validated['items']);
            });
        } catch (ValidationException $e) {
            $messages = collect($e->errors())->flatten()->implode(' ');
            return response()->json(['message' => $messages ?: 'Order could not be placed.', 'errors' => $e->errors()], 422);
        }

        [$orderItems, $subtotal, $totalUnits] = $built;

        $orderType = $validated['order_type'] ?? 'delivery';
        $deliveryFee = in_array($orderType, ['dine_in', 'takeout']) ? 0 : (float) $restaurant->delivery_fee;
        $paymentMethod = $validated['payment_method'] ?? 'cash';
        $grandTotal = $subtotal + $deliveryFee;
        $needsReview = OrderLimits::needsReview($totalUnits, $grandTotal);

        $order = Order::create([
            'user_id' => $request->user()->id,
            'restaurant_id' => $validated['restaurant_id'],
            'status' => 'pending',
            'order_type' => $orderType,
            'total' => $grandTotal,
            'delivery_fee' => $deliveryFee,
            'payment_method' => $paymentMethod,
            'payment_status' => 'pending',
            'needs_review' => $needsReview,
            'review_reason' => $needsReview ? OrderLimits::reviewReason($totalUnits, $grandTotal) : null,
            'delivery_address' => in_array($orderType, ['dine_in', 'takeout']) ? null : ($validated['delivery_address'] ?? $request->user()->address),
            'delivery_instructions' => $validated['delivery_instructions'] ?? null,
            'table_number' => $validated['table_number'] ?? null,
        ]);

        $restaurantCoords = Geocoder::geocode($restaurant->address . ', ' . $restaurant->city);
        if ($restaurantCoords && !$restaurant->latitude) {
            $restaurant->update([
                'latitude' => $restaurantCoords['lat'],
                'longitude' => $restaurantCoords['lng'],
            ]);
        }

        $orderUpdate = [];
        if ($restaurantCoords) {
            $orderUpdate['restaurant_lat'] = $restaurantCoords['lat'];
            $orderUpdate['restaurant_lng'] = $restaurantCoords['lng'];
        } elseif ($restaurant->latitude && $restaurant->longitude) {
            $orderUpdate['restaurant_lat'] = $restaurant->latitude;
            $orderUpdate['restaurant_lng'] = $restaurant->longitude;
        }

        if ($order->delivery_address) {
            $customerCoords = Geocoder::geocode($order->delivery_address);
            if ($customerCoords) {
                $orderUpdate['customer_lat'] = $customerCoords['lat'];
                $orderUpdate['customer_lng'] = $customerCoords['lng'];
            }
        }

        if (!empty($orderUpdate)) {
            $order->update($orderUpdate);
        }

        $order->items()->createMany($orderItems);

        ActivityLog::create([
            'type' => 'order_placed',
            'description' => "Order #{$order->id} ({$totalUnits} units) was placed at \"{$restaurant->restaurant_name}\".",
        ]);

        $order->load('restaurant', 'items');

        return response()->json(['order' => $order], 201);
    }

    /**
     * Validate lines against availability / per-item caps / stock / daily caps
     * inside a transaction (caller wraps in DB::transaction with row locks).
     *
     * @return array{0: array, 1: float, 2: int}
     *
     * @throws ValidationException
     */
    private function buildOrderLines(Restaurant $restaurant, array $requested): array
    {
        $ids = collect($requested)->pluck('menu_item_id')->all();
        $menuItems = MenuItem::whereIn('id', $ids)->lockForUpdate()->get()->keyBy('id');

        $subtotal = 0;
        $totalUnits = 0;
        $orderItems = [];

        foreach ($requested as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);
            $qty = (int) $item['quantity'];

            if (!$menuItem || $menuItem->restaurant_id !== $restaurant->id) {
                throw ValidationException::withMessages([
                    'items' => ["Menu item #{$item['menu_item_id']} does not belong to this restaurant."],
                ]);
            }

            if (!$menuItem->is_available || $menuItem->isSoldOut()) {
                throw ValidationException::withMessages([
                    'items' => ["\"{$menuItem->name}\" is sold out right now."],
                ]);
            }

            $effectiveMax = OrderLimits::effectiveMaxPerItem($menuItem, $restaurant);
            if ($qty > $effectiveMax && !$restaurant->allow_bulk_orders) {
                throw ValidationException::withMessages([
                    'items' => ["\"{$menuItem->name}\" allows max {$effectiveMax} per order. Contact the restaurant for larger quantities."],
                ]);
            }
            if ($qty > OrderLimits::hardMaxPerItem()) {
                throw ValidationException::withMessages([
                    'items' => ["\"{$menuItem->name}\" quantity is too large (max " . OrderLimits::hardMaxPerItem() . ")."],
                ]);
            }

            if ($menuItem->stock_quantity !== null && $qty > (int) $menuItem->stock_quantity) {
                throw ValidationException::withMessages([
                    'items' => ["Only {$menuItem->stock_quantity} × \"{$menuItem->name}\" left in stock."],
                ]);
            }

            if ($menuItem->daily_cap !== null) {
                $soldToday = \App\Models\OrderItem::where('menu_item_id', $menuItem->id)
                    ->whereHas('order', fn ($q) => $q
                        ->where('restaurant_id', $restaurant->id)
                        ->whereDate('created_at', today())
                        ->where('status', '!=', 'cancelled'))
                    ->sum('quantity');
                $remaining = (int) $menuItem->daily_cap - (int) $soldToday;
                if ($qty > $remaining) {
                    throw ValidationException::withMessages([
                        'items' => $remaining <= 0
                            ? ["\"{$menuItem->name}\" has reached today's limit ({$menuItem->daily_cap}/day). Try again tomorrow."]
                            : ["Only {$remaining} more × \"{$menuItem->name}\" available today (daily limit {$menuItem->daily_cap})."],
                    ]);
                }
            }

            $subtotal += $menuItem->effective_price * $qty;
            $totalUnits += $qty;

            $orderItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'quantity' => $qty,
                'price' => $menuItem->effective_price,
            ];
        }

        // Decrement stock only after every line passed validation.
        foreach ($orderItems as $line) {
            $menuItem = $menuItems->get($line['menu_item_id']);
            if ($menuItem && $menuItem->stock_quantity !== null) {
                $menuItem->decrement('stock_quantity', $line['quantity']);
            }
        }

        return [$orderItems, $subtotal, $totalUnits];
    }

    public function reorder(Request $request, $id): JsonResponse
    {
        $previousOrder = $request->user()->orders()->with('items')->findOrFail($id);
        $restaurant = Restaurant::findOrFail($previousOrder->restaurant_id);

        $activeCount = $request->user()->orders()
            ->whereIn('status', OrderStatuses::ACTIVE_STATUSES)
            ->count();
        if ($activeCount >= OrderLimits::maxActiveOrders()) {
            return response()->json([
                'message' => 'You already have ' . $activeCount . ' active orders. Please wait for one to complete before reordering.',
            ], 422);
        }

        $requested = $previousOrder->items->map(fn ($i) => [
            'menu_item_id' => $i->menu_item_id,
            'quantity' => (int) $i->quantity,
        ])->all();

        if (empty($requested)) {
            return response()->json(['message' => 'None of the items from the previous order are available.'], 422);
        }

        try {
            $built = DB::transaction(function () use ($restaurant, $requested) {
                return $this->buildOrderLines($restaurant, $requested);
            });
        } catch (ValidationException $e) {
            $messages = collect($e->errors())->flatten()->implode(' ');
            return response()->json(['message' => $messages ?: 'Reorder could not be placed.', 'errors' => $e->errors()], 422);
        }

        [$orderItems, $subtotal, $totalUnits] = $built;

        $orderType = $previousOrder->order_type ?? 'delivery';
        $deliveryFee = in_array($orderType, ['dine_in', 'takeout']) ? 0 : (float) $restaurant->delivery_fee;
        $grandTotal = $subtotal + $deliveryFee;
        $needsReview = OrderLimits::needsReview($totalUnits, $grandTotal);

        $order = Order::create([
            'user_id' => $request->user()->id,
            'restaurant_id' => $previousOrder->restaurant_id,
            'status' => 'pending',
            'order_type' => $orderType,
            'total' => $grandTotal,
            'delivery_fee' => $deliveryFee,
            'payment_method' => $previousOrder->payment_method ?? 'cash',
            'payment_status' => 'pending',
            'needs_review' => $needsReview,
            'review_reason' => $needsReview ? OrderLimits::reviewReason($totalUnits, $grandTotal) : null,
            'delivery_address' => $previousOrder->delivery_address,
            'table_number' => $previousOrder->table_number,
        ]);

        $order->items()->createMany($orderItems);
        $order->load('restaurant', 'items');

        return response()->json(['order' => $order], 201);
    }

    public function favorites(Request $request): JsonResponse
    {
        $favorites = $request->user()->favorites()
            ->with('restaurant')
            ->get();

        return response()->json(['favorites' => $favorites]);
    }

    public function addFavorite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
        ]);

        $favorite = Favorite::firstOrCreate([
            'user_id' => $request->user()->id,
            'restaurant_id' => $validated['restaurant_id'],
        ]);

        return response()->json(['favorite' => $favorite], 201);
    }

    public function removeFavorite(Request $request, $restaurantId): JsonResponse
    {
        Favorite::where('user_id', $request->user()->id)
            ->where('restaurant_id', $restaurantId)
            ->delete();

        return response()->json(['message' => 'Removed from favorites.']);
    }

    public function wishlistItems(Request $request): JsonResponse
    {
        $items = $request->user()->wishlistItems()
            ->with('menuItem.restaurant')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['wishlist_items' => $items]);
    }

    public function addWishlistItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
        ]);

        $item = WishlistItem::firstOrCreate([
            'user_id' => $request->user()->id,
            'menu_item_id' => $validated['menu_item_id'],
        ]);

        $item->load('menuItem.restaurant');

        return response()->json(['wishlist_item' => $item], 201);
    }

    public function removeWishlistItem(Request $request, $menuItemId): JsonResponse
    {
        WishlistItem::where('user_id', $request->user()->id)
            ->where('menu_item_id', $menuItemId)
            ->delete();

        return response()->json(['message' => 'Removed from wishlist.']);
    }

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['addresses' => $addresses]);
    }

    public function storeAddress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        $validated['user_id'] = $request->user()->id;

        if (!empty($validated['is_default'])) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = CustomerAddress::create($validated);

        return response()->json(['address' => $address], 201);
    }

    public function updateAddress(Request $request, $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'address' => 'sometimes|string|max:255',
            'city' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'is_default' => 'boolean',
        ]);

        if (!empty($validated['is_default'])) {
            $request->user()->addresses()->where('id', '!=', $id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json(['address' => $address->fresh()]);
    }

    public function deleteAddress(Request $request, $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $address->delete();

        return response()->json(['message' => 'Address deleted.']);
    }

    public function setDefaultAddress(Request $request, $id): JsonResponse
    {
        $request->user()->addresses()->update(['is_default' => false]);
        $address = $request->user()->addresses()->findOrFail($id);
        $address->update(['is_default' => true]);

        return response()->json(['address' => $address->fresh()]);
    }

    public function dashboardOverview(Request $request): JsonResponse
    {
        $user = $request->user();
        $orders = $user->orders()->with('restaurant', 'items')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'total_orders' => $orders->count(),
            'active_orders' => $orders->whereIn('status', OrderStatuses::ACTIVE_STATUSES)->count(),
            'favorites_count' => $user->favorites()->count(),
            'wishlist_count' => $user->wishlistItems()->count(),
            'addresses_count' => $user->addresses()->count(),
            'recent_orders' => $orders->take(5),
        ]);
    }

    public function cancelOrder(Request $request, $id): JsonResponse
    {
        $order = $request->user()->orders()->with('restaurant')->findOrFail($id);

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'This order can no longer be cancelled.',
            ], 422);
        }

        $order->update(['status' => 'cancelled']);

        if ($order->payment_status === 'pending') {
            $order->update(['payment_status' => 'cancelled']);
        }

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => 'cancelled',
            'changed_by' => 'customer',
        ]);

        ActivityLog::create([
            'type' => 'order_cancelled',
            'description' => "Order #{$order->id} was cancelled by the customer.",
        ]);

        return response()->json([
            'order' => $order->fresh()->load('restaurant', 'items'),
            'message' => 'Order cancelled successfully.',
        ]);
    }

    public function storeReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'menu_item_id' => 'nullable|exists:menu_items,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $menuItem = null;
        if (!empty($validated['menu_item_id'])) {
            $menuItem = MenuItem::where('id', $validated['menu_item_id'])
                ->where('restaurant_id', $validated['restaurant_id'])
                ->first();

            if (!$menuItem) {
                return response()->json([
                    'message' => 'That dish does not belong to this restaurant.',
                ], 422);
            }

            // Dish-level policy: must have a delivered order containing that exact dish.
            $proofOrder = $request->user()->orders()
                ->where('restaurant_id', $validated['restaurant_id'])
                ->where('status', 'delivered')
                ->whereHas('items', fn ($q) => $q->where('menu_item_id', $menuItem->id))
                ->latest()
                ->first();

            if (!$proofOrder) {
                return response()->json([
                    'message' => 'You can only review a dish you have ordered and received.',
                ], 422);
            }
        } else {
            // Restaurant-level policy: must have a delivered order from that restaurant.
            $proofOrder = $request->user()->orders()
                ->where('restaurant_id', $validated['restaurant_id'])
                ->where('status', 'delivered')
                ->latest()
                ->first();

            if (!$proofOrder) {
                return response()->json([
                    'message' => 'You can only review a restaurant after an order has been delivered.',
                ], 422);
            }
        }

        $review = Review::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'restaurant_id' => $validated['restaurant_id'],
                'menu_item_id' => $validated['menu_item_id'] ?? null,
            ],
            [
                'order_id' => $proofOrder->id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                // Every new/edited customer review goes back through moderation.
                'status' => 'pending',
                'is_featured' => false,
                'source' => 'customer',
            ]
        );

        $approvedScope = Review::where('restaurant_id', $validated['restaurant_id'])
            ->where('status', 'approved')
            ->where('source', 'customer');
        $avg = (clone $approvedScope)->avg('rating');

        return response()->json([
            'review' => $review->load(['user:id,name,avatar', 'menuItem:id,name']),
            'avg_rating' => $avg ? round((float) $avg, 1) : null,
            'review_count' => (clone $approvedScope)->count(),
            'message' => 'Review submitted — it will appear after admin approval.',
        ], 201);
    }
}
