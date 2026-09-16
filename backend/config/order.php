<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Order / cart guardrails
    |--------------------------------------------------------------------------
    | null = unlimited (made-to-order). Restaurants can override per-item or
    | per-store. These are the platform defaults + hard ceilings that even
    | bulk-enabled stores cannot exceed in a single request.
    */
    'default_max_per_item' => (int) env('ORDER_MAX_PER_ITEM', 10),
    'max_distinct_items' => (int) env('ORDER_MAX_DISTINCT_ITEMS', 20),
    'max_total_units' => (int) env('ORDER_MAX_TOTAL_UNITS', 50),

    // Absolute ceilings — prevents abuse / integer overflow even for catering.
    'hard_max_per_item' => (int) env('ORDER_HARD_MAX_PER_ITEM', 100),
    'hard_max_total_units' => (int) env('ORDER_HARD_MAX_TOTAL_UNITS', 200),

    // Concurrent active orders per customer (pending → near_customer).
    'max_active_orders' => (int) env('ORDER_MAX_ACTIVE_ORDERS', 5),

    // Orders at/above these thresholds are accepted but flagged needs_review
    // so the restaurant confirms before preparing / assigning a rider.
    'review_at_units' => (int) env('ORDER_REVIEW_AT_UNITS', 20),
    'review_at_total' => (float) env('ORDER_REVIEW_AT_TOTAL', 10000),
];
