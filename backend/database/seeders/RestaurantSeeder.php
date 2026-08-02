<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurants = [
            [
                'name' => "Sultan's Dine",
                'email' => 'sultans@swiftbite.com',
                'cuisine_type' => 'Bangladeshi',
                'address' => 'House 42, Road 7, Dhanmondi',
                'city' => 'Dhaka',
                'phone' => '01700000001',
                'description' => 'Famous for authentic Kacchi biryani slow-cooked over charcoal, just like the old Dhaka tradition.',
                'opening_hours' => '10:00 AM - 11:00 PM',
                'image' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Mutton Kacchi', 'price' => 350, 'category' => 'Biryani & Rice', 'description' => 'Premium mutton kacchi with saffron rice, potato and borhani on the side.'],
                    ['name' => 'Morog Polao', 'price' => 280, 'category' => 'Biryani & Rice', 'description' => 'Fragrant rice cooked with tender chicken, spices and fried onion.'],
                    ['name' => 'Chicken Roast', 'price' => 220, 'category' => 'Grill & Roast', 'description' => 'Juicy chicken roast glazed with traditional mustard-based gravy.'],
                ],
            ],
            [
                'name' => 'Haji Biryani',
                'email' => 'haji@swiftbite.com',
                'cuisine_type' => 'Bangladeshi',
                'address' => '37/A Kazi Nazrul Islam Avenue',
                'city' => 'Dhaka',
                'phone' => '01700000002',
                'description' => 'The legendary old Dhaka biryani house serving Mughlai-style mutton biryani since 1939.',
                'opening_hours' => '11:00 AM - 10:00 PM',
                'image' => 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Mutton Biryani', 'price' => 320, 'category' => 'Biryani & Rice', 'description' => 'Signature mutton biryani with perfectly spiced rice and tender meat.'],
                    ['name' => 'Chicken Biryani', 'price' => 250, 'category' => 'Biryani & Rice', 'description' => 'Classic chicken biryani with aromatic basmati rice.'],
                    ['name' => 'Borhani', 'price' => 50, 'category' => 'Drinks', 'description' => 'Refreshing yogurt-based drink with mint and spices.'],
                ],
            ],
            [
                'name' => "Nanna's Biryani",
                'email' => 'nannas@swiftbite.com',
                'cuisine_type' => 'Bangladeshi',
                'address' => 'House 12, Road 3, Gulshan 1',
                'city' => 'Dhaka',
                'phone' => '01700000003',
                'description' => 'Home-style biryani and pulao made with grandma\'s secret spice blend.',
                'opening_hours' => '10:30 AM - 10:30 PM',
                'image' => 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Nanna Biryani', 'price' => 300, 'category' => 'Biryani & Rice', 'description' => 'Their signature biryani with a unique family spice mix.'],
                    ['name' => 'Morog Pulao', 'price' => 260, 'category' => 'Biryani & Rice', 'description' => 'Comforting pulao with juicy chicken pieces and aromatic rice.'],
                    ['name' => 'Chicken Roast', 'price' => 200, 'category' => 'Grill & Roast', 'description' => 'Spiced chicken roast, slow-cooked to perfection.'],
                ],
            ],
            [
                'name' => 'Kacchi Bhai',
                'email' => 'kacchibhai@swiftbite.com',
                'cuisine_type' => 'Bangladeshi',
                'address' => 'Shop 5, Level 2, Jamuna Future Park',
                'city' => 'Dhaka',
                'phone' => '01700000004',
                'description' => 'Modern take on traditional kacchi and tehari, cooked fresh every morning.',
                'opening_hours' => '11:00 AM - 11:00 PM',
                'image' => 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Kacchi Biryani', 'price' => 290, 'category' => 'Biryani & Rice', 'description' => 'Smoky kacchi biryani with tender meat and aromatic rice.'],
                    ['name' => 'Chicken Polao', 'price' => 230, 'category' => 'Biryani & Rice', 'description' => 'Light, fluffy polao with spiced chicken.'],
                    ['name' => 'Beef Tehari', 'price' => 260, 'category' => 'Biryani & Rice', 'description' => 'Hearty beef tehari seasoned with garam masala and mustard oil.'],
                ],
            ],
            [
                'name' => 'Chillox',
                'email' => 'chillox@swiftbite.com',
                'cuisine_type' => 'Burgers',
                'address' => 'House 5, Road 16, Dhanmondi',
                'city' => 'Dhaka',
                'phone' => '01700000005',
                'description' => 'Dhaka\'s favourite gourmet burger joint known for juicy smashed patties.',
                'opening_hours' => '12:00 PM - 12:00 AM',
                'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Beef Burger', 'price' => 350, 'category' => 'Burgers', 'description' => 'Smashed beef patty with melted cheese, pickles and house sauce.'],
                    ['name' => 'Chicken Burger', 'price' => 280, 'category' => 'Burgers', 'description' => 'Crispy fried chicken fillet with signature peri peri mayo.'],
                    ['name' => 'Peri Peri Fries', 'price' => 180, 'category' => 'Sides', 'description' => 'Golden fries dusted with spicy peri peri seasoning.'],
                ],
            ],
            [
                'name' => 'Takeout',
                'email' => 'takeout@swiftbite.com',
                'cuisine_type' => 'Fast Food',
                'address' => 'Level 3, Bashundhara City Shopping Mall',
                'city' => 'Dhaka',
                'phone' => '01700000006',
                'description' => 'Quick, tasty fast food and wraps for the busy crowd.',
                'opening_hours' => '10:00 AM - 10:00 PM',
                'image' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Zinger Burger', 'price' => 250, 'category' => 'Burgers', 'description' => 'Crunchy zinger fillet, lettuce and mayo in a soft bun.'],
                    ['name' => 'Beef Burger', 'price' => 320, 'category' => 'Burgers', 'description' => 'Double beef patty with cheese and tangy special sauce.'],
                    ['name' => 'French Fries', 'price' => 120, 'category' => 'Sides', 'description' => 'Classic crispy french fries with ketchup.'],
                ],
            ],
            [
                'name' => 'Star Kabab',
                'email' => 'starkabab@swiftbite.com',
                'cuisine_type' => 'Fast Food',
                'address' => '59 Motijheel C/A',
                'city' => 'Dhaka',
                'phone' => '01700000007',
                'description' => 'A Dhaka institution for seekh kababs, tikka and biryani since the 70s.',
                'opening_hours' => '9:00 AM - 10:00 PM',
                'image' => 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Beef Seekh Kabab', 'price' => 180, 'category' => 'Kabab & Grill', 'description' => 'Charcoal-grilled minced beef kabab with onions and green chutney.'],
                    ['name' => 'Chicken Tikka', 'price' => 200, 'category' => 'Kabab & Grill', 'description' => 'Smoky chicken tikka marinated in yogurt and spices.'],
                    ['name' => 'Kacchi Biryani', 'price' => 280, 'category' => 'Biryani & Rice', 'description' => 'Their famous kacchi biryani with large cuts of mutton.'],
                ],
            ],
            [
                'name' => 'Pizza Roma',
                'email' => 'pizzaroma@swiftbite.com',
                'cuisine_type' => 'Pizza',
                'address' => 'House 21, Road 2, Banani',
                'city' => 'Dhaka',
                'phone' => '01700000008',
                'description' => 'Wood-fired Italian pizzas and pasta made with imported cheeses.',
                'opening_hours' => '11:00 AM - 11:30 PM',
                'image' => 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Pepperoni Pizza', 'price' => 550, 'category' => 'Pizza', 'description' => 'Classic pepperoni with mozzarella on hand-stretched dough.'],
                    ['name' => 'Margherita Pizza', 'price' => 450, 'category' => 'Pizza', 'description' => 'San Marzano tomatoes, fresh basil and buffalo mozzarella.'],
                    ['name' => 'Pasta Alfredo', 'price' => 350, 'category' => 'Pasta', 'description' => 'Creamy fettuccine alfredo with parmesan and black pepper.'],
                ],
            ],
            [
                'name' => 'Barcode',
                'email' => 'barcode@swiftbite.com',
                'cuisine_type' => 'Others',
                'address' => 'House 55, Road 27, Banani',
                'city' => 'Dhaka',
                'phone' => '01700000009',
                'description' => 'Fusion continental cuisine with a stylish rooftop dining experience.',
                'opening_hours' => '12:00 PM - 12:00 AM',
                'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'Beef Tehari', 'price' => 320, 'category' => 'Mains', 'description' => 'Signature fusion tehari with slow-cooked beef.'],
                    ['name' => 'Chicken Steak', 'price' => 490, 'category' => 'Mains', 'description' => 'Grilled chicken breast with mushroom sauce and veggies.'],
                    ['name' => 'Turkish Grilled Chicken', 'price' => 560, 'category' => 'Mains', 'description' => 'Turkish-spiced grilled chicken served with saffron rice.'],
                ],
            ],
            [
                'name' => 'PizzaBurg',
                'email' => 'pizzaburg@swiftbite.com',
                'cuisine_type' => 'Pizza',
                'address' => 'Level 4, Jamuna Future Park',
                'city' => 'Dhaka',
                'phone' => '01700000010',
                'description' => 'Pizza and burgers under one roof — perfect for mixed cravings.',
                'opening_hours' => '10:30 AM - 11:00 PM',
                'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
                'items' => [
                    ['name' => 'BBQ Meat Machine Pizza', 'price' => 605, 'category' => 'Pizza', 'description' => 'Loaded with BBQ beef, chicken and a smoky barbecue drizzle.'],
                    ['name' => 'Juicy Bomb Chicken Burger', 'price' => 175, 'category' => 'Burgers', 'description' => 'Extra-juicy chicken patty with a spicy kick.'],
                    ['name' => 'Beef Cheese Volcano', 'price' => 305, 'category' => 'Burgers', 'description' => 'Lava of melted cheese over a flame-grilled beef patty.'],
                ],
            ],
        ];

        foreach ($restaurants as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('password'),
                    'role' => 'restaurant',
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                ]
            );

            $restaurant = Restaurant::firstOrCreate(
                ['restaurant_name' => $data['name']],
                [
                    'user_id' => $user->id,
                    'cuisine_type' => $data['cuisine_type'],
                    'address' => $data['address'],
                    'city' => $data['city'],
                    'phone' => $data['phone'],
                    'description' => $data['description'],
                    'opening_hours' => $data['opening_hours'],
                    'image' => $data['image'],
                    'status' => 'active',
                ]
            );

            $restaurant->update([
                'user_id' => $user->id,
                'cuisine_type' => $data['cuisine_type'],
                'address' => $data['address'],
                'city' => $data['city'],
                'phone' => $data['phone'],
                'description' => $data['description'],
                'opening_hours' => $data['opening_hours'],
                'image' => $data['image'],
                'status' => 'active',
            ]);

            foreach ($data['items'] as $item) {
                MenuItem::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => $item['name']],
                    [
                        'price' => $item['price'],
                        'category' => $item['category'],
                        'description' => $item['description'],
                        'is_available' => true,
                    ]
                );
            }
        }

        $this->command->info('Seeded ' . count($restaurants) . ' restaurants with menu items.');
    }
}
