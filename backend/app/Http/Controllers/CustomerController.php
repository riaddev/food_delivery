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
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

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
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'delivery_address' => 'nullable|string|max:255',
            'delivery_instructions' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|in:cash,bkash,nagad,card',
            'order_type' => 'nullable|string|in:delivery,dine_in,takeout',
            'table_number' => 'nullable|string|max:50',
        ]);

        $restaurant = Restaurant::findOrFail($validated['restaurant_id']);

        $menuItemIds = collect($validated['items'])->pluck('menu_item_id');
        $menuItems = MenuItem::whereIn('id', $menuItemIds)->get()->keyBy('id');

        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);

            if (!$menuItem || !$menuItem->is_available) {
                return response()->json([
                    'message' => "Menu item #{$item['menu_item_id']} is not available.",
                ], 422);
            }

            $subtotal += $menuItem->price * $item['quantity'];

            $orderItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'quantity' => $item['quantity'],
                'price' => $menuItem->price,
            ];
        }

        $orderType = $validated['order_type'] ?? 'delivery';
        $deliveryFee = in_array($orderType, ['dine_in', 'takeout']) ? 0 : (float) $restaurant->delivery_fee;
        $paymentMethod = $validated['payment_method'] ?? 'cash';

        $order = Order::create([
            'user_id' => $request->user()->id,
            'restaurant_id' => $validated['restaurant_id'],
            'status' => 'pending',
            'order_type' => $orderType,
            'total' => $subtotal + $deliveryFee,
            'delivery_fee' => $deliveryFee,
            'payment_method' => $paymentMethod,
            'payment_status' => 'pending',
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
            'description' => "Order #{$order->id} was placed at \"{$restaurant->restaurant_name}\".",
        ]);

        $order->load('restaurant', 'items');

        return response()->json(['order' => $order], 201);
    }

    public function reorder(Request $request, $id): JsonResponse
    {
        $previousOrder = $request->user()->orders()->with('items')->findOrFail($id);

        $menuItemIds = $previousOrder->items->pluck('menu_item_id');
        $menuItems = MenuItem::whereIn('id', $menuItemIds)->where('is_available', true)->get()->keyBy('id');

        if ($menuItems->isEmpty()) {
            return response()->json(['message' => 'None of the items from the previous order are available.'], 422);
        }

        $total = 0;
        $orderItems = [];

        foreach ($previousOrder->items as $prevItem) {
            $menuItem = $menuItems->get($prevItem->menu_item_id);
            if (!$menuItem) continue;

            $lineTotal = $menuItem->price * $prevItem->quantity;
            $total += $lineTotal;

            $orderItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'quantity' => $prevItem->quantity,
                'price' => $menuItem->price,
            ];
        }

        if (empty($orderItems)) {
            return response()->json(['message' => 'None of the items from the previous order are available.'], 422);
        }

        $restaurant = Restaurant::findOrFail($previousOrder->restaurant_id);
        $orderType = $previousOrder->order_type ?? 'delivery';
        $deliveryFee = in_array($orderType, ['dine_in', 'takeout']) ? 0 : (float) $restaurant->delivery_fee;

        $order = Order::create([
            'user_id' => $request->user()->id,
            'restaurant_id' => $previousOrder->restaurant_id,
            'status' => 'pending',
            'order_type' => $orderType,
            'total' => $total + $deliveryFee,
            'delivery_fee' => $deliveryFee,
            'payment_method' => $previousOrder->payment_method ?? 'cash',
            'payment_status' => 'pending',
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
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $delivered = $request->user()->orders()
            ->where('restaurant_id', $validated['restaurant_id'])
            ->where('status', 'delivered')
            ->exists();

        if (!$delivered) {
            return response()->json([
                'message' => 'You can only review a restaurant after an order has been delivered.',
            ], 422);
        }

        $review = Review::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'restaurant_id' => $validated['restaurant_id'],
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]
        );

        $avg = Review::where('restaurant_id', $validated['restaurant_id'])->avg('rating');

        return response()->json([
            'review' => $review->load('user:id,name,avatar'),
            'avg_rating' => $avg ? round((float) $avg, 1) : null,
            'review_count' => Review::where('restaurant_id', $validated['restaurant_id'])->count(),
            'message' => 'Thank you for your review!',
        ], 201);
    }
}
