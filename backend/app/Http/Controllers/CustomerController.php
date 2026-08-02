<?php

namespace App\Http\Controllers;

use App\Models\CustomerAddress;
use App\Models\Favorite;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\WishlistItem;
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
            ->with('restaurant', 'items')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function orderShow(Request $request, $id): JsonResponse
    {
        $order = $request->user()->orders()
            ->with('restaurant', 'items')
            ->findOrFail($id);

        return response()->json(['order' => $order]);
    }

    public function placeOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'delivery_address' => 'nullable|string|max:255',
        ]);

        $menuItemIds = collect($validated['items'])->pluck('menu_item_id');
        $menuItems = MenuItem::whereIn('id', $menuItemIds)->get()->keyBy('id');

        $total = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);

            if (!$menuItem || !$menuItem->is_available) {
                return response()->json([
                    'message' => "Menu item #{$item['menu_item_id']} is not available.",
                ], 422);
            }

            $lineTotal = $menuItem->price * $item['quantity'];
            $total += $lineTotal;

            $orderItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'quantity' => $item['quantity'],
                'price' => $menuItem->price,
            ];
        }

        $order = Order::create([
            'user_id' => $request->user()->id,
            'restaurant_id' => $validated['restaurant_id'],
            'status' => 'pending',
            'total' => $total,
            'delivery_address' => $validated['delivery_address'] ?? $request->user()->address,
        ]);

        $order->items()->createMany($orderItems);

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

        $order = Order::create([
            'user_id' => $request->user()->id,
            'restaurant_id' => $previousOrder->restaurant_id,
            'status' => 'pending',
            'total' => $total,
            'delivery_address' => $previousOrder->delivery_address,
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
            'active_orders' => $orders->whereIn('status', ['pending', 'confirmed', 'preparing', 'out_for_delivery'])->count(),
            'favorites_count' => $user->favorites()->count(),
            'addresses_count' => $user->addresses()->count(),
            'recent_orders' => $orders->take(5),
        ]);
    }
}
