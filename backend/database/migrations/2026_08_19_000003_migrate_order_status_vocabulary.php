<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')
            ->where('status', 'out_for_delivery')
            ->update(['status' => 'on_the_way']);
    }

    public function down(): void
    {
        DB::table('orders')
            ->where('status', 'on_the_way')
            ->update(['status' => 'out_for_delivery']);
    }
};