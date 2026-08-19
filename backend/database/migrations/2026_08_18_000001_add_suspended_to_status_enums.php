<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE riders MODIFY status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE riders MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
    }
};