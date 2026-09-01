<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('restaurant_lat', 10, 8)->nullable()->after('delivery_fee');
            $table->decimal('restaurant_lng', 11, 8)->nullable()->after('restaurant_lat');
            $table->decimal('customer_lat', 10, 8)->nullable()->after('restaurant_lng');
            $table->decimal('customer_lng', 11, 8)->nullable()->after('customer_lat');
            $table->decimal('rider_lat', 10, 8)->nullable()->after('customer_lng');
            $table->decimal('rider_lng', 11, 8)->nullable()->after('rider_lat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'restaurant_lat', 'restaurant_lng',
                'customer_lat', 'customer_lng',
                'rider_lat', 'rider_lng',
            ]);
        });
    }
};
