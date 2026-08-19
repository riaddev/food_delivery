<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\Review;
use App\Support\OrderStatuses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

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
            'delivery_fee' => 'nullable|numeric|min:0',
            'delivery_time' => 'nullable|string|max:255',
            'accepts_dine_in' => 'boolean',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'cover_image_url' => 'nullable|string|url|max:2048',
            'logo_url' => 'nullable|string|url|max:2048',
            'remove_cover_image' => 'boolean',
            'remove_logo' => 'boolean',
        ]);

        foreach (['cover_image', 'logo'] as $field) {
            if ($request->hasFile($field)) {
                $this->deleteStored(optional($restaurant)->{$field});
                $validated[$field] = $request->file($field)->store('restaurants', 'public');
            } elseif (!empty($validated[$field . '_url'])) {
                $this->deleteStored(optional($restaurant)->{$field});
                $validated[$field] = $validated[$field . '_url'];
            } elseif (!empty($validated['remove_' . $field])) {
                $this->deleteStored(optional($restaurant)->{$field});
                $validated[$field] = null;
            }
            unset($validated[$field . '_url'], $validated['remove_' . $field]);
        }

        $restaurant->update($validated);

        return response()->json([
            'restaurant' => $restaurant,
            'message' => 'Profile updated successfully.',
        ]);
    }

    private function deleteStored(?string $path): void
    {
        if ($path && !str_starts_with($path, 'http://') && !str_starts_with($path, 'https://')) {
            Storage::disk('public')->delete($path);
        }
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
            'category_id' => 'nullable|exists:categories,id',
            'is_available' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'image_url' => 'nullable|string|url|max:2048',
        ]);

        $validated['restaurant_id'] = $request->user()->restaurant->id;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu-items', 'public');
            $validated['image'] = $path;
        } elseif (!empty($validated['image_url'])) {
            $validated['image'] = $validated['image_url'];
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
            'category_id' => 'nullable|exists:categories,id',
            'is_available' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'image_url' => 'nullable|string|url|max:2048',
            'remove_image' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($item->image && !str_starts_with($item->image, 'http://') && !str_starts_with($item->image, 'https://')) {
                Storage::disk('public')->delete($item->image);
            }
            $path = $request->file('image')->store('menu-items', 'public');
            $validated['image'] = $path;
        } elseif (!empty($validated['image_url'])) {
            if ($item->image && !str_starts_with($item->image, 'http://') && !str_starts_with($item->image, 'https://')) {
                Storage::disk('public')->delete($item->image);
            }
            $validated['image'] = $validated['image_url'];
        } elseif (!empty($validated['remove_image'])) {
            if ($item->image && !str_starts_with($item->image, 'http://') && !str_starts_with($item->image, 'https://')) {
                Storage::disk('public')->delete($item->image);
            }
            $validated['image'] = null;
        }

        $item->update($validated);

        return response()->json(['menu_item' => $item]);
    }

    public function deleteMenuItem(Request $request, $id): JsonResponse
    {
        $item = MenuItem::where('restaurant_id', $request->user()->restaurant->id)
            ->findOrFail($id);

        if ($item->image && !str_starts_with($item->image, 'http://') && !str_starts_with($item->image, 'https://')) {
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
                    'subtotal' => (float) $o->total - (float) $o->delivery_fee,
                    'delivery_fee' => (float) $o->delivery_fee,
                    'payment_method' => $o->payment_method,
                    'payment_status' => $o->payment_status,
                    'status' => $o->status,
                    'delivery_address' => $o->delivery_address,
                    'delivery_instructions' => $o->delivery_instructions,
                    'order_type' => $o->order_type,
                    'table_number' => $o->table_number,
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
            'status' => 'required|string|in:' . implode(',', OrderStatuses::ORDER_STATUSES),
        ]);

        if (!OrderStatuses::canTransition($order->status, $validated['status'])) {
            throw ValidationException::withMessages([
                'status' => ["Order cannot move from \"{$order->status}\" to \"{$validated['status']}\"."],
            ]);
        }

        $order->update([
            'status' => $validated['status'],
            'delivered_at' => in_array($validated['status'], ['delivered', 'served']) ? now() : $order->delivered_at,
        ]);

        if ($validated['status'] === 'cancelled' && $order->payment_status === 'pending') {
            $order->update(['payment_status' => 'cancelled']);
        }

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $validated['status'],
            'changed_by' => 'restaurant',
        ]);

        return response()->json([
            'order' => $order->fresh()->load('user', 'items'),
            'message' => 'Order status updated successfully.',
        ]);
    }

    public function publicList(): JsonResponse
    {
        $restaurants = Restaurant::with('user', 'menuItems')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'approved')
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
                    'cover_image' => $r->cover_image,
                    'logo' => $r->logo,
                    'delivery_time' => $r->delivery_time,
                    'delivery_fee' => (float) $r->delivery_fee,
                    'accepts_dine_in' => (bool) $r->accepts_dine_in,
                    'menu_items' => $r->menuItems
                        ->where('is_available', true)
                        ->values()
                        ->map(fn($m) => [
                            'id' => $m->id,
                            'name' => $m->name,
                            'price' => (float) $m->price,
                            'image_url' => $m->image_url,
                            'category' => $m->category,
                        ]),
                    'menu_categories' => $r->menuItems
                        ->where('is_available', true)
                        ->pluck('category')
                        ->filter()
                        ->unique()
                        ->values(),
                    'dish_names' => $r->menuItems
                        ->where('is_available', true)
                        ->pluck('name')
                        ->values(),
                    'avg_rating' => $r->reviews_avg_rating ? round((float) $r->reviews_avg_rating, 1) : null,
                    'review_count' => $r->reviews_count,
                ];
            });

        return response()->json(['restaurants' => $restaurants]);
    }

    public function publicShow($id): JsonResponse
    {
        $restaurant = Restaurant::with('user')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'approved')
            ->findOrFail($id);

        $menuItems = $restaurant->menuItems()
            ->where('is_available', true)
            ->orderBy('category_id')
            ->orderBy('name')
            ->get();

        $reviews = Review::with('user:id,name,avatar')
            ->where('restaurant_id', $id)
            ->latest()
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                    'user' => [
                        'name' => $review->user?->name ?? 'Customer',
                        'avatar_url' => $review->user?->avatar_url,
                    ],
                ];
            });

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
                'cover_image' => $restaurant->cover_image,
                'logo' => $restaurant->logo,
                'delivery_time' => $restaurant->delivery_time,
                'delivery_fee' => (float) $restaurant->delivery_fee,
                'accepts_dine_in' => (bool) $restaurant->accepts_dine_in,
                'avg_rating' => $restaurant->reviews_avg_rating ? round((float) $restaurant->reviews_avg_rating, 1) : null,
                'review_count' => $restaurant->reviews_count,
            ],
            'menu_items' => $menuItems,
            'review_count' => $restaurant->reviews_count,
            'reviews' => $reviews,
        ]);
    }

    public function publicReviews($id): JsonResponse
    {
        $restaurant = Restaurant::withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'approved')
            ->findOrFail($id);

        $reviews = Review::with('user:id,name,avatar')
            ->where('restaurant_id', $id)
            ->latest()
            ->get()
            ->map(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                    'user' => [
                        'name' => $review->user?->name ?? 'Customer',
                        'avatar_url' => $review->user?->avatar_url,
                    ],
                ];
            });

        return response()->json([
            'avg_rating' => $restaurant->reviews_avg_rating ? round((float) $restaurant->reviews_avg_rating, 1) : null,
            'review_count' => $restaurant->reviews_count,
            'reviews' => $reviews,
        ]);
    }

    public function publicCategories(): JsonResponse
    {
        $categories = \App\Models\Category::withCount('menuItems')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['categories' => $categories]);
    }
}
