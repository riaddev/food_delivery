<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $renames = [
            'Biryani & Rice' => 'Biryani',
            'Kabab & Grill' => 'Kabab',
        ];

        foreach ($renames as $old => $new) {
            DB::table('categories')->where('name', $old)->update(['name' => $new]);
        }

        $removed = ['Grill & Roast', 'Drinks', 'Sides', 'Pasta', 'Mains'];
        $removeIds = DB::table('categories')->whereIn('name', $removed)->pluck('id');

        if ($removeIds->isNotEmpty()) {
            DB::table('menu_items')->whereIn('category_id', $removeIds)->update(['category_id' => null]);
            DB::table('categories')->whereIn('id', $removeIds)->delete();
        }

        foreach (['Fast Food', 'Desserts'] as $name) {
            if (!DB::table('categories')->where('name', $name)->exists()) {
                DB::table('categories')->insert([
                    'name' => $name,
                    'sort_order' => 99,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        foreach (['Biryani', 'Kabab', 'Pizza', 'Burgers', 'Fast Food', 'Desserts'] as $i => $name) {
            DB::table('categories')->where('name', $name)->update(['sort_order' => $i]);
        }
    }

    public function down(): void
    {
        $reNames = [
            'Biryani' => 'Biryani & Rice',
            'Kabab' => 'Kabab & Grill',
        ];

        foreach ($reNames as $old => $new) {
            DB::table('categories')->where('name', $old)->update(['name' => $new]);
        }

        DB::table('categories')->whereIn('name', ['Fast Food', 'Desserts'])->delete();

        foreach (['Grill & Roast', 'Drinks', 'Sides', 'Pasta', 'Mains'] as $i => $name) {
            if (!DB::table('categories')->where('name', $name)->exists()) {
                DB::table('categories')->insert([
                    'name' => $name,
                    'sort_order' => 10 + $i,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
};
