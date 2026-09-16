<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // null = unlimited (made-to-order, the current behaviour).
            $table->integer('stock_quantity')->nullable()->after('is_available');
            $table->integer('daily_cap')->nullable()->after('stock_quantity');
            $table->integer('max_per_order')->nullable()->after('daily_cap');
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->integer('default_max_per_item')->nullable()->after('delivery_fee');
            $table->boolean('allow_bulk_orders')->default(false)->after('default_max_per_item');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['default_max_per_item', 'allow_bulk_orders']);
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['stock_quantity', 'daily_cap', 'max_per_order']);
        });
    }
};
