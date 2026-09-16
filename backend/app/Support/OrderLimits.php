<?php

namespace App\Support;

use App\Models\MenuItem;
use App\Models\Restaurant;

class OrderLimits
{
    public static function defaultMaxPerItem(): int
    {
        return (int) config('order.default_max_per_item', 10);
    }

    public static function maxDistinctItems(): int
    {
        return (int) config('order.max_distinct_items', 20);
    }

    public static function maxTotalUnits(): int
    {
        return (int) config('order.max_total_units', 50);
    }

    public static function hardMaxPerItem(): int
    {
        return (int) config('order.hard_max_per_item', 100);
    }

    public static function hardMaxTotalUnits(): int
    {
        return (int) config('order.hard_max_total_units', 200);
    }

    public static function maxActiveOrders(): int
    {
        return (int) config('order.max_active_orders', 5);
    }

    /**
     * Effective per-item cap: item override → restaurant default → platform default.
     * Always clamped to the hard ceiling so a misconfigured store can't allow 9999.
     */
    public static function effectiveMaxPerItem(?MenuItem $item, ?Restaurant $restaurant): int
    {
        $candidate = $item?->max_per_order
            ?? $restaurant?->default_max_per_item
            ?? self::defaultMaxPerItem();

        $candidate = (int) $candidate;
        if ($candidate < 1) {
            $candidate = self::defaultMaxPerItem();
        }

        return min($candidate, self::hardMaxPerItem());
    }

    public static function needsReview(int $totalUnits, float $grandTotal): bool
    {
        return $totalUnits >= (int) config('order.review_at_units', 20)
            || $grandTotal >= (float) config('order.review_at_total', 10000);
    }

    public static function reviewReason(int $totalUnits, float $grandTotal): ?string
    {
        $reasons = [];
        if ($totalUnits >= (int) config('order.review_at_units', 20)) {
            $reasons[] = "bulk quantity ({$totalUnits} units)";
        }
        if ($grandTotal >= (float) config('order.review_at_total', 10000)) {
            $reasons[] = 'high value (৳' . number_format($grandTotal, 2) . ')';
        }

        return $reasons ? 'Bulk order — ' . implode(', ', $reasons) . '. Please confirm with customer before preparing.' : null;
    }
}
