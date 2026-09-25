<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCancelTest extends TestCase
{
    use RefreshDatabase;

    private function makeCustomer(): User
    {
        return User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => 'password',
            'role' => 'customer',
        ]);
    }

    private function makeRestaurant(): Restaurant
    {
        $owner = User::create([
            'name' => 'Owner',
            'email' => 'owner@example.com',
            'password' => 'password',
            'role' => 'restaurant',
        ]);

        // NOTE: sqlite enforces the original CHECK(pending,active,suspended)
        // from the create migration (the approved-vocabulary widening is a
        // MySQL-only ALTER), so fixtures use 'active' — the legacy word for
        // approved. None of the flows under test branch on restaurant status.
        return Restaurant::create([
            'user_id' => $owner->id,
            'restaurant_name' => 'Test Kitchen',
            'status' => 'active',
        ]);
    }

    private function makeItem(Restaurant $restaurant, int $stock = 10): MenuItem
    {
        return MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Test Dish',
            'price' => 100,
            'stock_quantity' => $stock,
            'is_available' => true,
        ]);
    }

    private function makeOrder(User $customer, Restaurant $restaurant, MenuItem $item, array $overrides = []): Order
    {
        // Simulate buildOrderLines having reserved stock.
        $item->decrement('stock_quantity', 2);

        $order = Order::create(array_merge([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'order_type' => 'delivery',
            'total' => 250,
            'delivery_fee' => 50,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'delivery_address' => 'House 1, Dhaka',
        ], $overrides));

        $order->items()->create([
            'menu_item_id' => $item->id,
            'name' => $item->name,
            'quantity' => 2,
            'price' => 100,
        ]);

        return $order;
    }

    public function test_customer_cancel_restores_stock(): void
    {
        $customer = $this->makeCustomer();
        $restaurant = $this->makeRestaurant();
        $item = $this->makeItem($restaurant, 10);
        $order = $this->makeOrder($customer, $restaurant, $item);

        $this->assertSame(8, $item->fresh()->stock_quantity);

        $res = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/customer/orders/{$order->id}/cancel");

        $res->assertOk();
        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertSame('cancelled', $order->fresh()->payment_status);
        $this->assertSame(10, $item->fresh()->stock_quantity);
    }

    public function test_paid_confirmed_cancel_is_blocked(): void
    {
        $customer = $this->makeCustomer();
        $restaurant = $this->makeRestaurant();
        $item = $this->makeItem($restaurant, 10);
        $order = $this->makeOrder($customer, $restaurant, $item, [
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);

        $res = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/customer/orders/{$order->id}/cancel");

        $res->assertStatus(422);
        $this->assertSame('confirmed', $order->fresh()->status);
        $this->assertSame('paid', $order->fresh()->payment_status);
        // Stock stays reserved.
        $this->assertSame(8, $item->fresh()->stock_quantity);
    }

    public function test_paid_pending_cancel_flags_refund_pending(): void
    {
        $customer = $this->makeCustomer();
        $restaurant = $this->makeRestaurant();
        $item = $this->makeItem($restaurant, 10);
        $order = $this->makeOrder($customer, $restaurant, $item, [
            'status' => 'pending',
            'payment_status' => 'paid',
        ]);

        $res = $this->actingAs($customer, 'sanctum')
            ->postJson("/api/customer/orders/{$order->id}/cancel");

        $res->assertOk();
        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertSame('refund_pending', $order->fresh()->payment_status);
        $this->assertSame(10, $item->fresh()->stock_quantity);
    }

    public function test_restaurant_cancel_of_paid_order_flags_refund_and_restores_stock(): void
    {
        $customer = $this->makeCustomer();
        $restaurant = $this->makeRestaurant();
        $owner = $restaurant->user;
        $item = $this->makeItem($restaurant, 10);
        $order = $this->makeOrder($customer, $restaurant, $item, [
            'status' => 'ready',
            'payment_status' => 'paid',
        ]);

        $res = $this->actingAs($owner, 'sanctum')
            ->putJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'cancelled']);

        $res->assertOk();
        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertSame('refund_pending', $order->fresh()->payment_status);
        $this->assertSame(10, $item->fresh()->stock_quantity);
    }

    public function test_restaurant_cancel_of_unpaid_order_marks_payment_cancelled(): void
    {
        $customer = $this->makeCustomer();
        $restaurant = $this->makeRestaurant();
        $owner = $restaurant->user;
        $item = $this->makeItem($restaurant, 10);
        $order = $this->makeOrder($customer, $restaurant, $item, [
            'status' => 'ready',
            'payment_status' => 'pending',
        ]);

        $res = $this->actingAs($owner, 'sanctum')
            ->putJson("/api/restaurant/orders/{$order->id}/status", ['status' => 'cancelled']);

        $res->assertOk();
        $this->assertSame('cancelled', $order->fresh()->payment_status);
        $this->assertSame(10, $item->fresh()->stock_quantity);
    }
}
