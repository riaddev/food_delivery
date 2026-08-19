<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('area')->nullable()->after('address');
            $table->string('opening_time')->nullable()->after('opening_hours');
            $table->string('closing_time')->nullable()->after('opening_time');
            $table->string('operating_days')->nullable()->after('closing_time');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['area', 'opening_time', 'closing_time', 'operating_days']);
        });
    }
};