<?php

namespace Tests\Unit;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Support\OrderLimits;
use Tests\TestCase;

/**
 * Pure unit coverage for the cart/inventory guardrails.
 * No database interaction: all models are unsaved instances, so this
 * suite is safe to run against any environment (uses sqlite :memory:).
 */
class OrderLimitsTest extends TestCase
{
    public function test_platform_defaults(): void
    {
        $this->assertSame(10, OrderLimits::defaultMaxPerItem());
        $this->assertSame(20, OrderLimits::maxDistinctItems());
        $this->assertSame(50, OrderLimits::maxTotalUnits());
        $this->assertSame(100, OrderLimits::hardMaxPerItem());
        $this->assertSame(200, OrderLimits::hardMaxTotalUnits());
        $this->assertSame(5, OrderLimits::maxActiveOrders());
    }

    public function test_effective_max_prefers_item_then_restaurant_then_platform(): void
    {
        $this->assertSame(10, OrderLimits::effectiveMaxPerItem(null, null));

        $restaurant = new Restaurant(['default_max_per_item' => 8]);
        $this->assertSame(8, OrderLimits::effectiveMaxPerItem(null, $restaurant));

        $item = new MenuItem(['max_per_order' => 5]);
        $this->assertSame(5, OrderLimits::effectiveMaxPerItem($item, $restaurant));

        // Blank/zero falls back to the platform default.
        $this->assertSame(10, OrderLimits::effectiveMaxPerItem(new MenuItem(['max_per_order' => 0]), null));
    }

    public function test_effective_max_never_exceeds_hard_ceiling(): void
    {
        $item = new MenuItem(['max_per_order' => 9999]);
        $this->assertSame(100, OrderLimits::effectiveMaxPerItem($item, null));
    }

    public function test_needs_review_thresholds(): void
    {
        $this->assertTrue(OrderLimits::needsReview(25, 500.00));
        $this->assertTrue(OrderLimits::needsReview(2, 15000.00));
        $this->assertFalse(OrderLimits::needsReview(2, 100.00));
    }

    public function test_menu_item_sold_out_logic(): void
    {
        $this->assertTrue((new MenuItem(['is_available' => false]))->isSoldOut());
        $this->assertTrue((new MenuItem(['is_available' => true, 'stock_quantity' => 0]))->isSoldOut());
        $this->assertFalse((new MenuItem(['is_available' => true, 'stock_quantity' => 5]))->isSoldOut());
        // null stock = unlimited (made-to-order).
        $this->assertFalse((new MenuItem(['is_available' => true, 'stock_quantity' => null]))->isSoldOut());
    }
}
