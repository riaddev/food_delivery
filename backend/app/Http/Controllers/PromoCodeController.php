<?php

namespace App\Http\Controllers;

use App\Models\PromoCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromoCodeController extends Controller
{
    public function index(): JsonResponse
    {
        $promoCodes = PromoCode::with('restaurant')
            ->latest()
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'type' => $p->type,
                'value' => (float) $p->value,
                'min_order_amount' => $p->min_order_amount !== null ? (float) $p->min_order_amount : null,
                'restaurant_name' => $p->restaurant?->restaurant_name,
                'starts_at' => $p->starts_at,
                'ends_at' => $p->ends_at,
                'usage_limit' => $p->usage_limit,
                'times_used' => $p->times_used,
                'is_active' => $p->is_active,
                'is_valid' => $p->isCurrentlyValid(),
                'created_at' => $p->created_at,
            ]);

        return response()->json(['promo_codes' => $promoCodes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:promo_codes,code|regex:/^[A-Za-z0-9_-]+$/',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0' . ($request->input('type') === 'percentage' ? '|max:100' : ''),
            'min_order_amount' => 'nullable|numeric|min:0',
            'restaurant_id' => 'nullable|integer|exists:restaurants,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'nullable|integer|min:1',
        ]);

        $promoCode = PromoCode::create($validated);

        return response()->json(['promo_code' => $promoCode->load('restaurant')], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $promoCode = PromoCode::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:promo_codes,code,' . $promoCode->id . '|regex:/^[A-Za-z0-9_-]+$/',
            'type' => 'required|string|in:percentage,fixed',
            'value' => 'required|numeric|min:0' . ($request->input('type') === 'percentage' ? '|max:100' : ''),
            'min_order_amount' => 'nullable|numeric|min:0',
            'restaurant_id' => 'nullable|integer|exists:restaurants,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'usage_limit' => 'nullable|integer|min:1',
            'is_active' => 'sometimes|boolean',
        ]);

        $promoCode->update($validated);

        return response()->json([
            'promo_code' => $promoCode->fresh()->load('restaurant'),
            'message' => 'Promo code updated successfully.',
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $promoCode = PromoCode::findOrFail($id);
        $promoCode->delete();

        return response()->json(['message' => 'Promo code deleted.']);
    }

    public function toggle($id): JsonResponse
    {
        $promoCode = PromoCode::findOrFail($id);
        $promoCode->update(['is_active' => !$promoCode->is_active]);

        return response()->json([
            'promo_code' => $promoCode->fresh()->load('restaurant'),
            'message' => $promoCode->is_active ? 'Promo code activated.' : 'Promo code deactivated.',
        ]);
    }
}