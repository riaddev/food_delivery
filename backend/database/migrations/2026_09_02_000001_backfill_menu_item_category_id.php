<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $categories = DB::table('categories')->pluck('id', DB::raw('LOWER(name)'))->toArray();

        $items = DB::table('menu_items')
            ->whereNull('category_id')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->get();

        foreach ($items as $item) {
            $key = strtolower(trim($item->category));
            if (isset($categories[$key])) {
                DB::table('menu_items')
                    ->where('id', $item->id)
                    ->update(['category_id' => $categories[$key]]);
            }
        }
    }

    public function down(): void
    {
        DB::table('menu_items')->update(['category_id' => null]);
    }
};
