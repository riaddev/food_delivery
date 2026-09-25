<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            // constrained() already indexes the column; no extra index needed.
            $table->foreignId('restaurant_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        // Backfill legacy rows (created before scoping) to the first restaurant
        // so they don't become invisible. If no restaurant exists, they stay null.
        $firstRestaurantId = DB::table('restaurants')->orderBy('id')->value('id');
        if ($firstRestaurantId) {
            DB::table('expenses')->whereNull('restaurant_id')->update(['restaurant_id' => $firstRestaurantId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('restaurant_id');
        });
    }
};
