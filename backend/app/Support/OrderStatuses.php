<?php

namespace App\Support;

class OrderStatuses
{
    public const ORDER_STATUSES = [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'assigned',
        'picked_up',
        'on_the_way',
        'near_customer',
        'delivered',
        'served',
        'cancelled',
        'failed_delivery',
    ];

    public const ACTIVE_STATUSES = [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'assigned',
        'picked_up',
        'on_the_way',
        'near_customer',
    ];

    public const COMPLETED_STATUSES = [
        'delivered',
        'served',
    ];

    public const TERMINAL_STATUSES = [
        'delivered',
        'cancelled',
        'failed_delivery',
    ];

    public const ALLOWED_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['preparing', 'cancelled'],
        'preparing' => ['ready', 'cancelled'],
        'ready' => ['assigned', 'served', 'delivered', 'cancelled'],
        'assigned' => ['picked_up', 'cancelled'],
        'picked_up' => ['on_the_way'],
        'on_the_way' => ['near_customer'],
        'near_customer' => ['served', 'delivered', 'failed_delivery'],
        'delivered' => [],
        'served' => ['delivered'],
        'cancelled' => [],
        'failed_delivery' => [],
    ];

    public const RESTAURANT_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['preparing', 'cancelled'],
        'preparing' => ['ready', 'cancelled'],
        'ready' => ['cancelled', 'served', 'delivered'],
        'served' => [],
    ];

    public static function canTransition(string $from, string $to): bool
    {
        return in_array($to, self::ALLOWED_TRANSITIONS[$from] ?? [], true);
    }

    public static function nextStatuses(string $from): array
    {
        return self::ALLOWED_TRANSITIONS[$from] ?? [];
    }
}