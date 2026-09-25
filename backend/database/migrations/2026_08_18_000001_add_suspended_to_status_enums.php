<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL-only: SQLite/Postgres store status as plain strings, so the
        // ENUM widening is a no-op there (and the syntax is invalid).
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE riders MODIFY status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE riders MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
    }
};