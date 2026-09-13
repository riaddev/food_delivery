<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * Preserves the 4 hardcoded homepage testimonials as curated,
 * admin-manageable reviews (approved + featured).
 *
 * They are source='curated' so they never distort restaurant
 * avg_rating / review_count aggregates, but they DO show on the
 * homepage featured feed and in the admin Reviews section.
 */
class HomepageReviewsSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('reviews') || !Schema::hasColumn('reviews', 'source')) {
            $this->command?->warn('HomepageReviewsSeeder skipped: reviews moderation columns not migrated yet.');

            return;
        }

        $anchor = Restaurant::where('status', 'approved')->orderBy('id')->first()
            ?? Restaurant::orderBy('id')->first();

        if (!$anchor) {
            $this->command?->warn('HomepageReviewsSeeder skipped: no restaurant to anchor curated reviews.');

            return;
        }

        $items = [
            [
                'name' => 'Tanvir Hasan',
                'email' => 'tanvir.hasan.curated@swiftbite.local',
                'quote' => 'The inventory management system saved us hours of manual work. Highly recommend for any restaurant in Dhaka looking to go digital.',
                'role' => 'Food Blogger Review',
                'rating' => 5,
            ],
            [
                'name' => 'Nusrat Jahan',
                'email' => 'nusrat.jahan.curated@swiftbite.local',
                'quote' => 'Fast delivery and the food was still hot. The real-time tracking feature is a game changer for busy professionals like me.',
                'role' => 'Verified Customer Review',
                'rating' => 5,
            ],
            [
                'name' => 'Shahidul Islam',
                'email' => 'shahidul.islam.curated@swiftbite.local',
                'quote' => 'As a restaurant partner, the analytics dashboard helped me understand what dishes perform best. Profits are up 35%!',
                'role' => 'Restaurant Partner Review',
                'rating' => 5,
            ],
            [
                'name' => 'Tasnim',
                'email' => 'tasnim.curated@swiftbite.local',
                'quote' => "My order arrived over an hour late and the food was completely cold. The tracking kept saying 'On the way' the whole time. Customer support was polite, but the experience was disappointing.",
                'role' => 'Verified Customer Review',
                'rating' => 2,
            ],
        ];

        foreach ($items as $item) {
            $user = User::firstOrCreate(
                ['email' => $item['email']],
                [
                    'name' => $item['name'],
                    'password' => bcrypt('password'),
                    'role' => 'customer',
                    'status' => 'active',
                ]
            );

            Review::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'restaurant_id' => $anchor->id,
                    'menu_item_id' => null,
                    'source' => 'curated',
                ],
                [
                    'rating' => $item['rating'],
                    'comment' => $item['quote'],
                    'status' => 'approved',
                    'is_featured' => true,
                    'order_id' => null,
                ]
            );
        }
    }
}
