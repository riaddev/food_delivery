import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star, Clock, MapPin, Truck, Gift, Percent, ArrowLeft,
  Plus, Minus, ShoppingCart, ChevronRight,
} from "lucide-react";
import api from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import { formatPrice, restaurantImage } from "../../utils/foodImages";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop";

const MOCK_RESTAURANT = {
  id: "mock-1",
  restaurant_name: "The Burger Republic",
  tagline: "Burgers • American • Fast Food",
  city: "Dhaka",
  address: "Dhanmondi 27, Road 6",
  description: "Hand-picked smash burgers, flame-grilled wings and loaded fries — cooked fresh to order since 2019.",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
  logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop",
  rating: 4.8,
  eta: "25-30 mins",
  delivery_fee: 60,
  free_delivery_over: 1000,
};

const MOCK_MENU_ITEMS = [
  { id: 101, name: "Classic Cheeseburger", description: "Flame-grilled beef patty, melted cheddar, crisp lettuce & our secret sauce.", price: 450, category: "Burgers", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop", is_bestseller: true },
  { id: 102, name: "Spicy Chicken Wings", description: "Crispy wings tossed in our signature chilli-garlic glaze.", price: 320, category: "Recommended", img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" },
  { id: 103, name: "Double Smokehouse Burger", description: "Two beef patties, smoky bacon, onion rings & BBQ mayo.", price: 620, category: "Burgers", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop", is_bestseller: true },
  { id: 104, name: "Loaded Cheese Fries", description: "Crispy fries smothered in molten cheese sauce & spring onions.", price: 190, category: "Sides", img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop" },
  { id: 105, name: "Crispy Garden Salad", description: "Fresh greens, cherry tomatoes, olives, grilled chicken & ranch.", price: 150, category: "Sides", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop" },
  { id: 106, name: "Chilled Coca-Cola", description: "An ice-cold 300ml can to wash it all down.", price: 55, category: "Drinks", img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800&auto=format&fit=crop" },
  { id: 107, name: "Molten Chocolate Lava", description: "Warm chocolate cake with a gooey centre, served with a scoop of ice cream.", price: 280, category: "Desserts", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop", is_bestseller: true },
];

const MOCK_REVIEWS = [
  { name: "Riad Hossain", rating: 5, comment: "The Classic Cheeseburger is insanely juicy. It arrived in 22 minutes flat!" },
  { name: "Nabila Rahman", rating: 4, comment: "Crispy wings and great value. Just wish there were a few more drink options." },
  { name: "Tanvir Ahmed", rating: 5, comment: "Easily the best smash burger in Dhanmondi. The loaded fries are addictive." },
  { name: "Sumaiya Chowdhury", rating: 5, comment: "Ordered twice this week — consistent flavour and always hot on arrival." },
];

const AVATAR_COLORS = ["from-red-500 to-rose-400", "from-amber-500 to-orange-400", "from-emerald-500 to-teal-400", "from-violet-500 to-purple-400"];

const initials = (name = "") =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const handleImgError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};

export default function RestaurantMenu() {
  const { id } = useParams();
  const { addItem, removeItem, updateQuantity, cart, itemCount, total } = useCart();
  const [payload, setPayload] = useState(null);
  const [failed, setFailed] = useState(false);
  const [activeCat, setActiveCat] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/restaurants/${id}`)
      .then((res) => { if (active) setPayload(res.data); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id]);

  const useMock = failed || !payload || (payload.menu_items || []).length === 0;

  const restaurant = {
    ...MOCK_RESTAURANT,
    ...(useMock ? {} : payload.restaurant),
  };

  const cuisine = useMock
    ? MOCK_RESTAURANT.tagline
    : [payload.restaurant.cuisine_type, payload.restaurant.city].filter(Boolean).join(" • ");

  const menuItems = useMock
    ? MOCK_MENU_ITEMS
    : payload.menu_items.filter((i) => i.is_available !== false);

  const categories = useMemo(() => {
    const seen = [];
    menuItems.forEach((i) => {
      const cat = i.category || "Recommended";
      const key = cat.toLowerCase();
      if (!seen.some((c) => c.toLowerCase() === key)) seen.push(cat);
    });
    return seen;
  }, [menuItems]);

  const qtyOf = (item) =>
    cart.items.find((i) => i.menu_item_id === item.id)?.quantity || 0;

  const currentCat = activeCat || categories[0] || "";

  const handleAdd = (item) => {
    addItem(restaurant.id, restaurant.restaurant_name, item);
  };

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    const el = document.getElementById(`menu-${cat.toLowerCase()}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      {/* Cover banner */}
      <div className="relative h-52 sm:h-64 overflow-hidden">
        <img src={restaurant.image || restaurantImage(restaurant.restaurant_name)} onError={handleImgError} alt={restaurant.restaurant_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-zinc-900/10 to-transparent" />
        <Link to="/restaurants" className="absolute top-5 left-5 sm:top-6 sm:left-8 inline-flex items-center gap-2 bg-white/90 hover:bg-white text-zinc-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur transition-all hover:-translate-y-0.5">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Floating info card */}
        <div className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-8 -mt-14 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <div className="shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-red-500 via-rose-400 to-amber-300">
                  <img src={restaurant.logo || restaurantImage(restaurant.restaurant_name)} onError={handleImgError} alt={restaurant.restaurant_name} className="w-full h-full rounded-full object-cover border-4 border-white" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">{restaurant.restaurant_name}</h1>
                <p className="text-zinc-400 text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                  <MapPin size={14} className="text-red-500 shrink-0" />
                  {cuisine}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
              <span className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                <Star size={15} className="text-amber-400" fill="currentColor" /> {restaurant.rating}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-sm font-semibold px-4 py-2 rounded-full">
                <Clock size={14} className="text-zinc-500" /> {restaurant.eta}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-sm font-semibold px-4 py-2 rounded-full">
                <Truck size={14} className="text-zinc-500" /> {formatPrice(restaurant.delivery_fee)} Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-full">
                <Gift size={14} /> Free delivery over {formatPrice(restaurant.free_delivery_over)}
              </span>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl px-5 py-3 text-white flex items-center gap-2.5 text-sm font-semibold">
            <Percent size={16} />
            <span>Get 20% off on orders above ৳800!</span>
            <ChevronRight size={15} className="ml-auto shrink-0" />
          </div>
        </div>

        {/* Sticky category nav */}
        {categories.length > 0 && (
          <nav className="sticky top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-[#F8F9FA]/90 backdrop-blur-md mt-7 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-7">
              {categories.map((cat) => {
                const key = cat.toLowerCase();
                const isActive = currentCat.toLowerCase() === key;
                return (
                  <button
                    key={cat}
                    onClick={() => scrollToCat(cat)}
                    className={`relative pb-3 pt-2 whitespace-nowrap text-sm font-semibold transition-colors duration-200 ${isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
                  >
                    {cat}
                    <span className={`absolute -bottom-px left-0 right-0 h-[3px] rounded-full bg-red-500 transition-transform duration-200 origin-left ${isActive ? "scale-x-100" : "scale-x-0"}`} />
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Menu sections */}
        {menuItems.length === 0 ? (
          <div className="bg-white rounded-3xl py-20 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            <p className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">Menu coming soon</p>
            <p className="text-zinc-400">Check back a little later for the full menu.</p>
          </div>
        ) : (
          categories.map((cat, catIdx) => {
            const key = cat.toLowerCase();
            const items = menuItems.filter((i) => (i.category || "Recommended").toLowerCase() === key);
            return (
              <section key={cat} id={`menu-${key}`} className="scroll-mt-20 mb-12">
                <div className={`flex items-center gap-4 mb-5 ${catIdx === 0 ? "mt-2" : "mt-6"}`}>
                  <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">{cat}</h2>
                  <span className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs font-semibold text-zinc-400 bg-white px-3 py-1 rounded-full shadow-sm">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => {
                    const qty = qtyOf(item);
                    return (
                      <div
                        key={item.id}
                        className="group bg-white rounded-3xl p-4 sm:p-5 flex items-center gap-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="font-bold text-zinc-900">{item.name}</h3>
                            {item.is_bestseller && (
                              <span className="bg-amber-400 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                Bestseller
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{item.description}</p>
                          <p className="font-extrabold text-zinc-900 mt-2.5">{formatPrice(item.price)}</p>
                        </div>

                        <div className="relative shrink-0">
                          <img src={item.image_url || item.img || restaurantImage(restaurant.restaurant_name)} onError={handleImgError} alt={item.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover" />
                          {qty === 0 ? (
                            <button
                              onClick={() => handleAdd(item)}
                              aria-label={`Add ${item.name} to cart`}
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.15)] flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >
                              <Plus size={18} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900 rounded-full px-1.5 py-1 shadow-lg">
                              <button onClick={() => (qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1))} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors" aria-label="Decrease">
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-white">{qty}</span>
                              <button onClick={() => updateQuantity(item.id, qty + 1)} className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors" aria-label="Increase">
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {/* Reviews */}
        <section className="mt-4">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Reviews</h2>
            <span className="inline-flex items-center gap-1 bg-white text-zinc-700 text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
              <Star size={14} className="text-amber-400" fill="currentColor" /> {restaurant.rating}
            </span>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {MOCK_REVIEWS.map((review, i) => (
              <div key={review.name} className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] w-[300px] sm:w-[340px] shrink-0 snap-start flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {initials(review.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 text-sm truncate">{review.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} className={star <= review.rating ? "text-amber-400" : "text-zinc-200"} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">"{review.comment}"</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-extrabold text-zinc-900">
                {itemCount} {itemCount === 1 ? "Item" : "Items"} <span className="text-zinc-300">|</span> {formatPrice(total)}
              </p>
              <p className="text-xs text-zinc-400 truncate">{cart.restaurantName}</p>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-[0_12px_30px_-10px_rgba(239,68,68,0.7)] transition-all hover:-translate-y-0.5 shrink-0"
            >
              <ShoppingCart size={17} /> View Cart
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">{itemCount}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}