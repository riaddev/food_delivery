<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreignId('menu_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default('pending');
            $table->boolean('is_featured')->default(false);
            $table->string('source', 20)->default('customer');
        });

        // Existing customer reviews were live before moderation existed.
        DB::table('reviews')->where('source', 'customer')->update(['status' => 'approved']);

        Schema::table('reviews', function (Blueprint $table) {
            $table->index(['restaurant_id', 'status'], 'reviews_restaurant_status_idx');
            $table->index(['menu_item_id', 'status'], 'reviews_menu_item_status_idx');
            $table->index(['status', 'is_featured'], 'reviews_status_featured_idx');
        });

        // Allow one restaurant-level review + one per dish per user.
        // (NULL menu_item_id rows are distinct in SQLite/MySQL; app code
        // enforces single restaurant-level review via updateOrCreate.)
        try {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropUnique(['user_id', 'restaurant_id']);
            });
        } catch (\Throwable) {
            // Index may already be gone on re-runs — safe to ignore.
        }

        Schema::table('reviews', function (Blueprint $table) {
            $table->unique(['user_id', 'restaurant_id', 'menu_item_id'], 'reviews_user_rest_item_unique');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            try {
                $table->dropUnique('reviews_user_rest_item_unique');
            } catch (\Throwable) {
            }
            try {
                $table->dropIndex('reviews_restaurant_status_idx');
            } catch (\Throwable) {
            }
            try {
                $table->dropIndex('reviews_menu_item_status_idx');
            } catch (\Throwable) {
            }
            try {
                $table->dropIndex('reviews_status_featured_idx');
            } catch (\Throwable) {
            }
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('menu_item_id');
            $table->dropConstrainedForeignId('order_id');
            $table->dropColumn(['status', 'is_featured', 'source']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->unique(['user_id', 'restaurant_id']);
        });
    }
};
