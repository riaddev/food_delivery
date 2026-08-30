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
        $img = fn(string $id) => "https://images.unsplash.com/{$id}?q=80&w=800&auto=format&fit=crop";

        $restaurants = [
            [
                'name' => "Sultan's Dine",
                'email' => 'sultans@swiftbite.com',
                'cuisine_type' => 'Bangladeshi',
                'address' => 'House 42, Road 7, Dhanmondi',
                'city' => 'Dhaka',
                'phone' => '01700000001',
                'description' => 'Famous for authentic Kacchi biryani slow-cooked over charcoal, just like the old Dhaka tradition.',
                'opening_hours' => '12:00 PM - 11:00 PM',
                'image' => 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 40,
                'items' => [
                    ['name' => 'Kacchi (Bashmati) Half', 'price' => 330, 'category' => 'Biryani', 'description' => 'Fragrant basmati rice kacchi with tender mutton pieces, served with salad and chutney.', 'image' => $img('photo-1631515243349-e0cb75fb8d3a')],
                    ['name' => 'Kacchi (Bashmati) Full', 'price' => 535, 'category' => 'Biryani', 'description' => 'Full portion of basmati kacchi with generous mutton pieces slow-cooked over charcoal.', 'image' => $img('photo-1563379091339-03b21ab4a4f8')],
                    ['name' => 'Chicken Dum Biryani', 'price' => 220, 'category' => 'Biryani', 'description' => 'Flavorful dum biryani with aromatic basmati rice and tender chicken.', 'image' => $img('photo-1589302168068-964664d93dc0')],
                    ['name' => 'Mutton Tehari', 'price' => 275, 'category' => 'Biryani', 'description' => 'Delicious mutton tehari made with fragrant Chinigura rice, cooked with flavorful spices.', 'image' => $img('photo-1633945274309-2c16c9682a8c')],
                    ['name' => 'Plain Polao with Chicken Roast & Borhani', 'price' => 330, 'category' => 'Biryani', 'description' => 'Fragrant plain polao served with classic chicken roast and refreshing borhani.', 'image' => $img('photo-1599043513900-ed6fe01d3833')],
                    ['name' => 'Chicken Roast', 'price' => 150, 'category' => 'Chicken', 'description' => 'Classic chicken roast cooked to perfection with aromatic spices.', 'image' => $img('photo-1598515214211-89d3c73ae83b')],
                    ['name' => 'Beef Rezala', 'price' => 200, 'category' => 'Kabab', 'description' => 'Beef rezala — mildly spiced creamy curry with tender beef pieces slow-cooked in yogurt.', 'image' => $img('photo-1565557623262-b51c2513a641')],
                    ['name' => 'Beef Chap', 'price' => 249, 'category' => 'Kabab', 'description' => 'Tender beef on the bone, marinated in Bengali spices and slow-cooked for deep flavor.', 'image' => $img('photo-1574484284002-952d92456975')],
                    ['name' => 'Jali Kabab', 'price' => 65, 'category' => 'Kabab', 'description' => 'Classic Bengali kabab with spiced minced meat wrapped in a soft egg-net.', 'image' => $img('photo-1529006557810-274b9b3fc259')],
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
                'opening_hours' => '12:00 PM - 12:00 AM',
                'image' => 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 50,
                'items' => [
                    ['name' => 'Regular Box (Mutton Biryani)', 'price' => 240, 'category' => 'Biryani', 'description' => 'Traditional chevon biryani in a jackfruit leaf packet — the iconic Haji Biryani experience since 1939.', 'image' => $img('photo-1671048116663-eda1518a169b')],
                    ['name' => 'Special Box (Large)', 'price' => 340, 'category' => 'Biryani', 'description' => 'Large portion of signature mutton biryani with generous meat and aromatic rice.', 'image' => $img('photo-1633945274309-2c16c9682a8c')],
                    ['name' => 'Borhani', 'price' => 100, 'category' => 'Drinks', 'description' => 'Traditional salted mint yogurt drink with cumin and mustard.', 'image' => $img('photo-1554866585-cd94860890b7')],
                    ['name' => 'Soft Drinks', 'price' => 70, 'category' => 'Drinks', 'description' => 'Assorted carbonated soft drinks.', 'image' => $img('photo-1622483767028-3f66f32aef97')],
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
                'opening_hours' => '10:00 AM - 11:30 PM',
                'image' => 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 35,
                'items' => [
                    ['name' => 'Beef Kacchi', 'price' => 180, 'category' => 'Biryani', 'description' => 'Fragrant rice prepared with tender beef, potato and aromatic spice.', 'image' => $img('photo-1563379091339-03b21ab4a4f8')],
                    ['name' => 'Beef Tehari', 'price' => 180, 'category' => 'Biryani', 'description' => 'Savory rice prepared with small beef cubes, aromatic rice and spice.', 'image' => $img('photo-1567188040759-fb8a883dc6d8')],
                    ['name' => 'Morog Polao', 'price' => 180, 'category' => 'Biryani', 'description' => 'Fragrant rice prepared with chicken, ghee and shahi spice.', 'image' => $img('photo-1599043513900-ed6fe01d3833')],
                    ['name' => 'Beef Khichuri', 'price' => 180, 'category' => 'Biryani', 'description' => 'Comforting meal prepared with rice, lentil, spice and aromatic herb.', 'image' => $img('photo-1574484284002-952d92456975')],
                    ['name' => 'Chicken Roast', 'price' => 126, 'category' => 'Chicken', 'description' => 'Thick flavourful dish prepared with mildly spiced tender chicken and secret spice.', 'image' => $img('photo-1598515214211-89d3c73ae83b')],
                    ['name' => 'Borhani', 'price' => 117, 'category' => 'Drinks', 'description' => 'Traditional spicy yogurt drink prepared with mint, cumin and mustard.', 'image' => $img('photo-1527661591475-527312dd65f5')],
                ],
            ],
            [
                'name' => 'Kacchi Bhai',
                'email' => 'kacchibhai@swiftbite.com',
                'cuisine_type' => 'Bangladeshi',
                'address' => '49, Satmasjid Road, Dhanmondi',
                'city' => 'Dhaka',
                'phone' => '01700000004',
                'description' => 'Modern take on traditional kacchi and tehari, cooked fresh every morning.',
                'opening_hours' => '12:00 PM - 11:30 PM',
                'image' => 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 45,
                'items' => [
                    ['name' => 'Basmati Kacchi 1:1', 'price' => 330, 'category' => 'Biryani', 'description' => 'Slow-cooked aromatic basmati rice layered with potatoes, marinated mutton and whole spices.', 'image' => $img('photo-1631515243349-e0cb75fb8d3a')],
                    ['name' => 'Basmati Kacchi 1:3', 'price' => 980, 'category' => 'Biryani', 'description' => 'Large portion kacchi with 3x meat for sharing.', 'image' => $img('photo-1563379091339-03b21ab4a4f8')],
                    ['name' => 'Kacchi Khadok 1:1', 'price' => 530, 'category' => 'Biryani', 'description' => 'Kacchi with 4 pieces of meat in a special khadok style.', 'image' => $img('photo-1633945274309-2c16c9682a8c')],
                    ['name' => 'Mutton Tehari 1:1', 'price' => 270, 'category' => 'Biryani', 'description' => 'Fragrant rice dish cooked with tender mutton, mustard oil and traditional spices.', 'image' => $img('photo-1567188040759-fb8a883dc6d8')],
                    ['name' => 'Beef Chaap with Plain Polao', 'price' => 290, 'category' => 'Biryani', 'description' => 'Beef marinated in spices, fried till perfection, served with plain polao.', 'image' => $img('photo-1588166524941-3bf61a9c41db')],
                    ['name' => 'Beef Rezala', 'price' => 200, 'category' => 'Kabab', 'description' => 'Classic beef rezala prepared with secret spice mix that makes this curry irresistible.', 'image' => $img('photo-1565557623262-b51c2513a641')],
                    ['name' => 'Chicken Roast', 'price' => 150, 'category' => 'Chicken', 'description' => 'Succulent, juicy and tender chicken roast.', 'image' => $img('photo-1598515214211-89d3c73ae83b')],
                    ['name' => 'Beef Chui Jhal Gosht', 'price' => 200, 'category' => 'Kabab', 'description' => 'Prepared with one of the most unique and popular chui jhal spices of Bangladesh.', 'image' => $img('photo-1574484284002-952d92456975')],
                    ['name' => 'Plain Polao', 'price' => 120, 'category' => 'Biryani', 'description' => 'Simple and classic plain polao that goes great with curries.', 'image' => $img('photo-1599043513900-ed6fe01d3833')],
                    ['name' => 'Jali Kebab', 'price' => 65, 'category' => 'Kabab', 'description' => 'A special dhakaiya kebab.', 'image' => $img('photo-1529006557810-274b9b3fc259')],
                    ['name' => 'Firni', 'price' => 70, 'category' => 'Desserts', 'description' => 'Rich in flavours with right amount of sweetness.', 'image' => $img('photo-1606313564200-e75d5e30476c')],
                    ['name' => 'Borhani', 'price' => 80, 'category' => 'Drinks', 'description' => 'Refreshing yogurt drink with a blend of coriander and mint.', 'image' => $img('photo-1527661591475-527312dd65f5')],
                    ['name' => 'Badam Sharbat', 'price' => 90, 'category' => 'Drinks', 'description' => 'Delicious almond drink prepared with milk and saffron.', 'image' => $img('photo-1541658016709-82535e94bc69')],
                ],
            ],
            [
                'name' => 'Chillox',
                'email' => 'chillox@swiftbite.com',
                'cuisine_type' => 'Burgers',
                'address' => 'AMM Convention Center, 2nd Floor, House 56A, Road 3A, Dhanmondi',
                'city' => 'Dhaka',
                'phone' => '01700000005',
                'description' => 'Dhaka\'s favourite gourmet burger joint known for juicy smashed patties and bold flavors.',
                'opening_hours' => '11:00 AM - 11:30 PM',
                'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 30,
                'items' => [
                    ['name' => 'Beef Burger', 'price' => 235, 'category' => 'Burgers', 'description' => '1 pc - Prepared with beef patty and special sauce.', 'image' => $img('photo-1568901346375-23c9450c58cd')],
                    ['name' => 'Chicken Burger', 'price' => 235, 'category' => 'Burgers', 'description' => '1 pc - Prepared with chicken patty and special sauce.', 'image' => $img('photo-1607013251379-e6eecfffe234')],
                    ['name' => 'Beef Cheese Burger', 'price' => 270, 'category' => 'Burgers', 'description' => '1 pc - Prepared with beef patty, cheese and special sauce.', 'image' => $img('photo-1678110707493-8d05425137ac')],
                    ['name' => 'Smokey BBQ Chicken Cheese Burger', 'price' => 295, 'category' => 'Burgers', 'description' => '1 pc - Prepared with chicken patty, bbq sauce and cheese.', 'image' => $img('photo-1610440042657-612c34d95e9f')],
                    ['name' => 'Crispy Chicken Burger', 'price' => 295, 'category' => 'Burgers', 'description' => '1 pc - Juicy and crispy boneless patty with lettuce, pickles and house sauce.', 'image' => $img('photo-1586190848861-99aa4a171e90')],
                    ['name' => 'Chicken Cheese Blast', 'price' => 425, 'category' => 'Burgers', 'description' => '1 pc - Prepared with 2 pcs melted cheese inside a double chicken patty and cheese outside.', 'image' => $img('photo-1572802419224-296b0aeee0d9')],
                    ['name' => 'Truffle Smasher Single', 'price' => 395, 'category' => 'Burgers', 'description' => '120 gm aged beef patty, truffle sauce, pickles, sauteed onions and cheese.', 'image' => $img('photo-1550547660-d9450f859349')],
                    ['name' => 'French Fries', 'price' => 80, 'category' => 'Fast Food', 'description' => 'Finely cut deep fried potatoes.', 'image' => $img('photo-1573080496219-bb080dd4f877')],
                    ['name' => 'Naga Drums', 'price' => 130, 'category' => 'Fast Food', 'description' => 'Spicy chicken drumstick with crispy skin, seasoned with aromatic spices.', 'image' => $img('photo-1562967914-608f82629710')],
                    ['name' => 'Fish Tots', 'price' => 235, 'category' => 'Fast Food', 'description' => '6 pcs - Crispy bite-sized dory fish, seasoned and deep-fried to perfection.', 'image' => $img('photo-1544025162-d76694265947')],
                    ['name' => 'Fried Chicken', 'price' => 135, 'category' => 'Fast Food', 'description' => 'Crispy, juicy and flavorful chicken fry, perfect in every bite.', 'image' => $img('photo-1626645738196-c2a7c87a8f58')],
                ],
            ],
            [
                'name' => 'Takeout',
                'email' => 'takeout@swiftbite.com',
                'cuisine_type' => 'Fast Food',
                'address' => 'Plot-1317, Road 30, Bashundhara R/A',
                'city' => 'Dhaka',
                'phone' => '01700000006',
                'description' => 'Quick, tasty burgers and sides for the busy crowd. 4.9 rated on foodpanda.',
                'opening_hours' => '11:30 AM - 11:45 PM',
                'image' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 25,
                'items' => [
                    ['name' => 'Chicken Burger', 'price' => 265, 'category' => 'Burgers', 'description' => '1 pc - Marinated chicken patty mixed gently with spices with fresh lettuce and onion.', 'image' => $img('photo-1586190848861-99aa4a171e90')],
                    ['name' => 'Beef Burger', 'price' => 285, 'category' => 'Burgers', 'description' => '1 pc - Marinated beef patty mixed gently with spices with fresh lettuce and onion.', 'image' => $img('photo-1607013251379-e6eecfffe234')],
                    ['name' => 'Chick Got Fried', 'price' => 285, 'category' => 'Burgers', 'description' => '1 pc - A crowd champion! A tender fried chicken in a burger served with sauce of your choice.', 'image' => $img('photo-1626645738196-c2a7c87a8f58')],
                    ['name' => 'Smash Burger', 'price' => 435, 'category' => 'Burgers', 'description' => '1 pc - Premium beef patty smashed to perfection with grilled mushroom, sliced cheese, caramelized onion and jalapeno.', 'image' => $img('photo-1550547660-d9450f859349')],
                    ['name' => 'MADOX', 'price' => 365, 'category' => 'Burgers', 'description' => '1 pc - Double-layered burger with egg muffin stuffed with cheese and beef patty marinated with green chilis.', 'image' => $img('photo-1572802419224-296b0aeee0d9')],
                    ['name' => 'Nashville Chicken Burger', 'price' => 315, 'category' => 'Burgers', 'description' => '1 pc - Crispy fried chicken coated in spicy Nashville sauce and chili pepper seasonings.', 'image' => $img('photo-1610440042657-612c34d95e9f')],
                    ['name' => 'Chicken Cheese Delight', 'price' => 425, 'category' => 'Burgers', 'description' => '1 pc - Medium-sized marinated chicken patty cooked with cheese inside.', 'image' => $img('photo-1678110707493-8d05425137ac')],
                    ['name' => 'Fries', 'price' => 195, 'category' => 'Fast Food', 'description' => 'Fries seasoned with special spices mix — the ultimate crowd favorite.', 'image' => $img('photo-1573080496219-bb080dd4f877')],
                    ['name' => 'Cheesy Bites', 'price' => 195, 'category' => 'Fast Food', 'description' => 'Deep fried chicken nuggets with rich cheese filling.', 'image' => $img('photo-1562967914-608f82629710')],
                    ['name' => 'Thai Chili Wings', 'price' => 235, 'category' => 'Fast Food', 'description' => 'Extra spicy wings coated with homemade thai chili sauce blended with naga chili.', 'image' => $img('photo-1567620832903-9fc6debc209f')],
                    ['name' => 'Brookie', 'price' => 165, 'category' => 'Desserts', 'description' => 'The perfect fusion of a fudgy brownie and a chewy chocolate chip cookie.', 'image' => $img('photo-1551024506-0bccd828d307')],
                ],
            ],
            [
                'name' => 'Star Kabab',
                'email' => 'starkabab@swiftbite.com',
                'cuisine_type' => 'Kebab',
                'address' => 'New Agargaon Road, Opposite of BBS Headquarters',
                'city' => 'Dhaka',
                'phone' => '01700000007',
                'description' => 'Authentic kebabs and Turkish cuisine in the heart of Dhaka.',
                'opening_hours' => '3:00 PM - 12:00 AM',
                'image' => 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 30,
                'items' => [
                    ['name' => 'Chicken Hariyali Kebab', 'price' => 70, 'category' => 'Kabab', 'description' => '1 pc - Vibrant green kebab prepared with chicken marinated in mint, coriander and green chili.', 'image' => $img('photo-1599487488170-d11ec9c172f0')],
                    ['name' => 'Chicken Reshmi Kebab', 'price' => 80, 'category' => 'Kabab', 'description' => '1 pc - Silky smooth minced chicken kebab prepared with cream, cashew nut and mild spice.', 'image' => $img('photo-1529006557810-274b9b3fc259')],
                    ['name' => "Chef's Special Chicken Kebab", 'price' => 120, 'category' => 'Kabab', 'description' => "1 pc - Signature chicken kebab prepared with the chef's secret blend of herb and spice.", 'image' => $img('photo-1755090154782-5215189b4083')],
                    ['name' => 'Thai Chicken Kebab', 'price' => 130, 'category' => 'Kabab', 'description' => '1 pc - Grilled chicken kebab prepared with a thai-inspired marinade of lemongrass, garlic and soy.', 'image' => $img('photo-1544025162-d76694265947')],
                    ['name' => 'Tandoori Chicken', 'price' => 130, 'category' => 'Kabab', 'description' => '1 pc - Classic quarter chicken marinated in yogurt and tandoori masala, grilled to perfection.', 'image' => $img('photo-1588166524941-3bf61a9c41db')],
                    ['name' => 'Chicken Boti Kebab', 'price' => 140, 'category' => 'Kabab', 'description' => '1 pc - Boneless chicken cube marinated in yogurt and traditional spice, grilled on a skewer.', 'image' => $img('photo-1603360946369-dc9bb6258143')],
                    ['name' => 'Beef Seekh Kebab', 'price' => 180, 'category' => 'Kabab', 'description' => '1 pc - Juicy minced beef kebab prepared with onion, coriander, mint and a special spice blend.', 'image' => $img('photo-1599487488170-d11ec9c172f0')],
                    ['name' => 'Chicken Tikka', 'price' => 180, 'category' => 'Kabab', 'description' => '1 pc - Juicy boneless chicken piece marinated in spiced yogurt and grilled in a tandoor.', 'image' => $img('photo-1625220194771-7ebdea0b70b9')],
                    ['name' => 'Chicken Shawarma', 'price' => 80, 'category' => 'Fast Food', 'description' => '1 pc - Tender grilled chicken wrapped in a warm flatbread with fresh vegetable and garlic sauce.', 'image' => $img('photo-1561758033-d89a9ad46330')],
                    ['name' => 'Chicken Wings (3 pcs)', 'price' => 120, 'category' => 'Fast Food', 'description' => '3 pcs - Crispy and juicy chicken wing prepared with seasoned batter and fried until golden.', 'image' => $img('photo-1567620832903-9fc6debc209f')],
                ],
            ],
            [
                'name' => 'Pizza Roma',
                'email' => 'pizzaroma@swiftbite.com',
                'cuisine_type' => 'Pizza',
                'address' => 'House 36, Road 117, Gulshan 2',
                'city' => 'Dhaka',
                'phone' => '01700000008',
                'description' => 'Authentic Italian pizzas made with imported cheeses and hand-stretched dough since 2005.',
                'opening_hours' => '11:00 AM - 11:00 PM',
                'image' => 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 60,
                'items' => [
                    ['name' => 'Margherita', 'price' => 450, 'category' => 'Pizza', 'description' => 'San Marzano tomatoes, fresh basil and buffalo mozzarella on hand-stretched dough.', 'image' => $img('photo-1574071318508-1cdbab80d002')],
                    ['name' => 'Pepperoni', 'price' => 550, 'category' => 'Pizza', 'description' => 'Classic pepperoni with mozzarella on hand-stretched dough.', 'image' => $img('photo-1513104890138-7c749659a591')],
                    ['name' => 'Napoletana', 'price' => 450, 'category' => 'Pizza', 'description' => 'Tomatoes, anchovies, olives and capers with mozzarella.', 'image' => $img('photo-1571407970349-bc81e7e96d47')],
                    ['name' => 'Diavola', 'price' => 500, 'category' => 'Pizza', 'description' => 'Spicy salami with mozzarella and chili flakes.', 'image' => $img('photo-1628840042765-356cda07504e')],
                    ['name' => 'Quattro Formaggi', 'price' => 520, 'category' => 'Pizza', 'description' => 'Four cheese pizza with mozzarella, gorgonzola, parmesan and fontina.', 'image' => $img('photo-1513104890138-7c749659a591')],
                    ['name' => 'Funghi', 'price' => 480, 'category' => 'Pizza', 'description' => 'Mushrooms with mozzarella and truffle oil.', 'image' => $img('photo-1571407970349-bc81e7e96d47')],
                    ['name' => 'Tandoori Chicken', 'price' => 500, 'category' => 'Pizza', 'description' => 'Italian pizza meets Deshi flavor — tandoori chicken with mozzarella and onion.', 'image' => $img('photo-1565299624946-b28f40a0ae38')],
                    ['name' => 'BBQ Chicken', 'price' => 500, 'category' => 'Pizza', 'description' => 'BBQ chicken with mozzarella, onion and smoky barbecue drizzle.', 'image' => $img('photo-1565299624946-b28f40a0ae38')],
                ],
            ],
            [
                'name' => 'Barcode',
                'email' => 'barcode@swiftbite.com',
                'cuisine_type' => 'Continental',
                'address' => 'House 55B, Road 21, Banani',
                'city' => 'Dhaka',
                'phone' => '01700000009',
                'description' => 'Italian and continental favourites since 2013. Hearty set meals and biriyani.',
                'opening_hours' => '12:00 PM - 11:30 PM',
                'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 55,
                'items' => [
                    ['name' => 'Beef Tehari Large', 'price' => 320, 'category' => 'Biryani', 'description' => 'Old Dhaka style beef tehari, done right. Large portion.', 'image' => $img('photo-1567188040759-fb8a883dc6d8')],
                    ['name' => 'Beef Tehari Regular', 'price' => 230, 'category' => 'Biryani', 'description' => 'Old Dhaka style beef tehari, done right. Regular portion.', 'image' => $img('photo-1633945274309-2c16c9682a8c')],
                    ['name' => 'Chicken Steak Meal', 'price' => 490, 'category' => 'Chicken', 'description' => 'Grilled chicken steak with mushroom sauce, veggies and side.', 'image' => $img('photo-1544025162-d76694265947')],
                    ['name' => 'Turkish Grilled Chicken Meal', 'price' => 560, 'category' => 'Chicken', 'description' => 'Turkish-spiced grilled chicken served with saffron rice and sides.', 'image' => $img('photo-1598515214211-89d3c73ae83b')],
                    ['name' => 'Mezzan Set Meal', 'price' => 475, 'category' => 'Fast Food', 'description' => 'Hearty set meal with your choice of protein and sides.', 'image' => $img('photo-1414235077428-338989a2e8c0')],
                    ['name' => 'Chicken Boti Kebab', 'price' => 140, 'category' => 'Kabab', 'description' => 'Boneless chicken pieces marinated in yogurt and traditional spice, grilled on skewers.', 'image' => $img('photo-1603360946369-dc9bb6258143')],
                    ['name' => 'Seekh Kebab', 'price' => 180, 'category' => 'Kabab', 'description' => 'Juicy minced beef kebab with onion, coriander, mint and special spice blend.', 'image' => $img('photo-1599487488170-d11ec9c172f0')],
                ],
            ],
            [
                'name' => 'PizzaBurg',
                'email' => 'pizzaburg@swiftbite.com',
                'cuisine_type' => 'Pizza & Burgers',
                'address' => 'Level 4, Jamuna Future Park',
                'city' => 'Dhaka',
                'phone' => '01700000010',
                'description' => 'Pizza and burgers under one roof — perfect for mixed cravings.',
                'opening_hours' => '11:00 AM - 11:00 PM',
                'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
                'delivery_fee' => 50,
                'items' => [
                    ['name' => 'BBQ Meat Machine Pizza (Large)', 'price' => 605, 'category' => 'Pizza', 'description' => 'Loaded with BBQ beef, chicken and a smoky barbecue drizzle.', 'image' => $img('photo-1565299624946-b28f40a0ae38')],
                    ['name' => 'Kebab Cocktail Pizza (Large)', 'price' => 635, 'category' => 'Pizza', 'description' => 'Five types of chicken and kebab spice on a pizza.', 'image' => $img('photo-1571407970349-bc81e7e96d47')],
                    ['name' => 'Meat Masala Pizza (Large)', 'price' => 605, 'category' => 'Pizza', 'description' => 'Lots of meat and spice on a perfectly baked crust.', 'image' => $img('photo-1628840042765-356cda07504e')],
                    ['name' => 'Chicken Juicy Bomb', 'price' => 175, 'category' => 'Burgers', 'description' => 'Extra-juicy chicken patty with a spicy kick.', 'image' => $img('photo-1586190848861-99aa4a171e90')],
                    ['name' => 'Beef Juicy Bomb', 'price' => 195, 'category' => 'Burgers', 'description' => 'Extra-juicy beef patty with a smoky flavor.', 'image' => $img('photo-1607013251379-e6eecfffe234')],
                    ['name' => 'Chicken Cheese Volcano', 'price' => 285, 'category' => 'Burgers', 'description' => 'Melted cheese eruption over a spiced chicken patty.', 'image' => $img('photo-1678110707493-8d05425137ac')],
                    ['name' => 'Beef Cheese Volcano', 'price' => 305, 'category' => 'Burgers', 'description' => 'Lava of melted cheese over a flame-grilled beef patty.', 'image' => $img('photo-1572802419224-296b0aeee0d9')],
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
                    'delivery_fee' => $data['delivery_fee'],
                    'status' => 'approved',
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
                'delivery_fee' => $data['delivery_fee'],
                'status' => 'approved',
            ]);

            foreach ($data['items'] as $item) {
                MenuItem::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => $item['name']],
                    [
                        'price' => $item['price'],
                        'category' => $item['category'],
                        'description' => $item['description'],
                        'image' => $item['image'] ?? null,
                        'is_available' => true,
                    ]
                );
            }
        }

        $this->command->info('Seeded ' . count($restaurants) . ' restaurants with menu items.');
    }
}
