<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@swiftbite.com',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'customer',
        ]);

        $defaultCategories = [
            'Biryani & Kacchi',
            'Fast Food',
            'Sweets & Desserts',
            'Chinese',
            'Beverages',
            'Bakery & Cafe',
        ];

        foreach ($defaultCategories as $index => $name) {
            Category::firstOrCreate(
                ['name' => $name],
                ['sort_order' => $index]
            );
        }
    }
}
