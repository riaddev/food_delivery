<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RestaurantController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        $validated = $request->validate([
            'restaurant_name' => 'sometimes|string|max:255',
            'cuisine_type' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'description' => 'nullable|string',
            'opening_hours' => 'nullable|string|max:255',
        ]);

        $restaurant->update($validated);

        return response()->json([
            'restaurant' => $restaurant,
            'message' => 'Profile updated successfully.',
        ]);
    }

    public function menuItems(Request $request): JsonResponse
    {
        $items = $request->user()->restaurant->menuItems()->orderBy('created_at', 'desc')->get();

        return response()->json(['menu_items' => $items]);
    }

    public function createMenuItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $validated['restaurant_id'] = $request->user()->restaurant->id;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu-items', 'public');
            $validated['image'] = $path;
        }

        $item = MenuItem::create($validated);

        return response()->json(['menu_item' => $item], 201);
    }

    public function updateMenuItem(Request $request, $id): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'category' => 'nullable|string|max:255',
            'is_available' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $path = $request->file('image')->store('menu-items', 'public');
            $validated['image'] = $path;
        }

        $item->update($validated);

        return response()->json(['menu_item' => $item]);
    }

    public function deleteMenuItem(Request $request, $id): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        return response()->json(['message' => 'Menu item deleted.']);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with('user', 'items')
            ->where('restaurant_id', $request->user()->restaurant->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($o) {
                return [
                    'id' => $o->id,
                    'customer_name' => $o->user?->name,
                    'customer_phone' => $o->user?->phone,
                    'total' => (float) $o->total,
                    'status' => $o->status,
                    'delivery_address' => $o->delivery_address,
                    'items' => $o->items,
                    'created_at' => $o->created_at,
                ];
            });

        return response()->json(['orders' => $orders]);
    }

    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $order = Order::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string|in:confirmed,preparing,out_for_delivery,delivered,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return response()->json([
            'order' => $order->fresh()->load('user', 'items'),
            'message' => 'Order status updated successfully.',
        ]);
    }

    public function publicList(): JsonResponse
    {
        $restaurants = Restaurant::with('user')
            ->where('status', 'active')
            ->orderBy('restaurant_name')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'restaurant_name' => $r->restaurant_name,
                    'cuisine_type' => $r->cuisine_type,
                    'city' => $r->city,
                    'address' => $r->address,
                    'phone' => $r->phone,
                    'description' => $r->description,
                    'opening_hours' => $r->opening_hours,
                    'image' => $r->image,
                ];
            });

        return response()->json(['restaurants' => $restaurants]);
    }

    public function publicShow($id): JsonResponse
    {
        $restaurant = Restaurant::with('user')
            ->where('status', 'active')
            ->findOrFail($id);

        $menuItems = $restaurant->menuItems()
            ->where('is_available', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json([
            'restaurant' => [
                'id' => $restaurant->id,
                'restaurant_name' => $restaurant->restaurant_name,
                'cuisine_type' => $restaurant->cuisine_type,
                'city' => $restaurant->city,
                'address' => $restaurant->address,
                'phone' => $restaurant->phone,
                'description' => $restaurant->description,
                'opening_hours' => $restaurant->opening_hours,
                'image' => $restaurant->image,
            ],
            'menu_items' => $menuItems,
        ]);
    }
}
