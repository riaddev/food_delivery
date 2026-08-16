<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('cover_image')->nullable()->after('image');
            $table->string('logo')->nullable()->after('cover_image');
            $table->string('delivery_time')->nullable()->after('logo');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['cover_image', 'logo', 'delivery_time']);
        });
    }
};