<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if ($this->driverSupports('mysql')) {
            DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending','active','suspended','approved','rejected') NOT NULL DEFAULT 'pending'");

            DB::table('restaurants')->where('status', 'active')->update(['status' => 'approved']);
            DB::table('restaurants')->where('status', 'suspended')->update(['status' => 'rejected']);

            DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'");
        } else {
            DB::table('restaurants')->where('status', 'active')->update(['status' => 'approved']);
            DB::table('restaurants')->where('status', 'suspended')->update(['status' => 'rejected']);
            DB::statement("ALTER TABLE restaurants ALTER COLUMN status SET DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if ($this->driverSupports('mysql')) {
            DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending','approved','rejected','active','suspended') NOT NULL DEFAULT 'pending'");
        }

        DB::table('restaurants')->where('status', 'approved')->update(['status' => 'active']);
        DB::table('restaurants')->where('status', 'rejected')->update(['status' => 'suspended']);

        if ($this->driverSupports('mysql')) {
            DB::statement("ALTER TABLE restaurants MODIFY status ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending'");
        }
    }

    private function driverSupports(string $driver): bool
    {
        return DB::connection()->getDriverName() === $driver;
    }
};