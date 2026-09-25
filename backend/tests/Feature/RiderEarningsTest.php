<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiderEarningsTest extends TestCase
{
    use RefreshDatabase;

    private function makeRider(string $email = 'rider@example.com'): array
    {
        $user = User::create([
            'name' => 'Rider',
            'email' => $email,
            'password' => 'password',
            'role' => 'rider',
        ]);
        $rider = Rider::create([
            'user_id' => $user->id,
            'vehicle_type' => 'bike',
            'status' => 'approved',
            'is_online' => true,
        ]);

        return [$user, $rider];
    }

    private function makeRestaurant(): Restaurant
    {
        $owner = User::create([
            'name' => 'Owner',
            'email' => 'owner-' . uniqid() . '@example.com',
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

    private function makeOrder(User $customer, Restaurant $restaurant, Rider $rider, array $overrides = []): Order
    {
        return Order::create(array_merge([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'rider_id' => $rider->id,
            'status' => 'delivered',
            'order_type' => 'delivery',
            'total' => 300,
            'delivery_fee' => 50,
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'delivery_address' => 'House 1, Dhaka',
            'accepted_at' => now()->subHour(),
            'delivered_at' => now(),
        ], $overrides));
    }

    public function test_accept_is_idempotent_and_single_winner(): void
    {
        [$user, $rider] = $this->makeRider();
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => 'password',
            'role' => 'customer',
        ]);
        $restaurant = $this->makeRestaurant();
        $order = $this->makeOrder($customer, $restaurant, $rider, [
            'status' => 'assigned',
            'accepted_at' => null,
            'delivered_at' => null,
        ]);

        $first = $this->actingAs($user, 'sanctum')
            ->postJson("/api/rider/orders/{$order->id}/accept");
        $first->assertOk()->assertJson(['message' => "Order #{$order->id} accepted."]);

        $acceptedAt = $order->fresh()->accepted_at;
        $this->assertNotNull($acceptedAt);

        // Second accept is an idempotent no-op, not an error.
        $second = $this->actingAs($user, 'sanctum')
            ->postJson("/api/rider/orders/{$order->id}/accept");
        $second->assertOk()->assertJson(['message' => 'Order already accepted.']);
        $this->assertEquals($acceptedAt->toISOString(), $order->fresh()->accepted_at->toISOString());
    }

    public function test_busy_rider_cannot_accept_second_order(): void
    {
        [$user, $rider] = $this->makeRider();
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => 'password',
            'role' => 'customer',
        ]);
        $restaurant = $this->makeRestaurant();
        $first = $this->makeOrder($customer, $restaurant, $rider, [
            'status' => 'assigned',
            'accepted_at' => null,
            'delivered_at' => null,
        ]);
        $second = $this->makeOrder($customer, $restaurant, $rider, [
            'status' => 'assigned',
            'accepted_at' => null,
            'delivered_at' => null,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/rider/orders/{$first->id}/accept")
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/rider/orders/{$second->id}/accept")
            ->assertStatus(422);
    }

    public function test_earnings_buckets_are_correct(): void
    {
        [$user, $rider] = $this->makeRider('rider2@example.com');
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer2@example.com',
            'password' => 'password',
            'role' => 'customer',
        ]);
        $restaurant = $this->makeRestaurant();

        $this->makeOrder($customer, $restaurant, $rider, [
            'delivery_fee' => 50,
            'delivered_at' => now(),
        ]);
        $this->makeOrder($customer, $restaurant, $rider, [
            'delivery_fee' => 60,
            'delivered_at' => now()->subDays(2),
        ]);
        $this->makeOrder($customer, $restaurant, $rider, [
            'delivery_fee' => 40,
            'delivered_at' => now()->subMonthNoOverflow()->startOfMonth(),
        ]);

        $res = $this->actingAs($user, 'sanctum')->getJson('/api/rider/earnings?period=all');
        $res->assertOk();

        $summary = $res->json('summary');
        $this->assertEquals(50, $summary['today']['earnings']);
        $this->assertEquals(1, $summary['today']['deliveries']);
        $this->assertEquals(150, $summary['all']['earnings']);
        $this->assertEquals(3, $summary['all']['deliveries']);

        $entries = $res->json('entries');
        $this->assertCount(3, $entries);
        // Newest first.
        $this->assertEquals(50, $entries[0]['delivery_fee']);
        $this->assertSame('Test Kitchen', $entries[0]['restaurant_name']);

        // Period filter narrows entries.
        $today = $this->actingAs($user, 'sanctum')->getJson('/api/rider/earnings?period=today');
        $today->assertOk();
        $this->assertCount(1, $today->json('entries'));
        $this->assertEquals('today', $today->json('period'));
    }
}
