import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../features/auth/AuthContext";
import { formatPrice, restaurantImage } from "../../utils/foodImages";

const tabs = [
  { id: "all", label: "All", icon: "🔥" },
  { id: "biryani", label: "Biryani", icon: "🍛" },
  { id: "fastfood", label: "Fast Food", icon: "🍔" },
  { id: "international", label: "International", icon: "🍕" },
];

const MOCK_RESTAURANTS = [
  { id: "sultans-dine", restaurant_name: "Sultan's Dine", cuisine_type: "Kacchi · Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 701, name: "Mutton Kacchi", price: 350 }, { id: 702, name: "Morog Polao", price: 280 }, { id: 703, name: "Chicken Roast", price: 220 }] },
  { id: "haji-biryani", restaurant_name: "Haji Biryani", cuisine_type: "Biryani · Mughlai", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 711, name: "Mutton Biryani", price: 320 }, { id: 712, name: "Chicken Biryani", price: 250 }, { id: 713, name: "Borhani", price: 50 }] },
  { id: "nannas-biryani", restaurant_name: "Nanna's Biryani", cuisine_type: "Biryani · Pulao", image: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 721, name: "Nanna Biryani", price: 300 }, { id: 722, name: "Morog Pulao", price: 260 }, { id: 723, name: "Chicken Roast", price: 200 }] },
  { id: "kacchi-bhai", restaurant_name: "Kacchi Bhai", cuisine_type: "Kacchi · Tehari", image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 731, name: "Kacchi Biryani", price: 290 }, { id: 732, name: "Chicken Polao", price: 230 }, { id: 733, name: "Beef Tehari", price: 260 }] },
  { id: "chillox", restaurant_name: "Chillox", cuisine_type: "Burgers · Fast Food", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 741, name: "Beef Burger", price: 350 }, { id: 742, name: "Chicken Burger", price: 280 }, { id: 743, name: "Peri Peri Fries", price: 180 }] },
  { id: "takeout", restaurant_name: "Takeout", cuisine_type: "Fast Food · Wraps", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 751, name: "Zinger Burger", price: 250 }, { id: 752, name: "Beef Burger", price: 320 }, { id: 753, name: "French Fries", price: 120 }] },
  { id: "star-kabab", restaurant_name: "Star Kabab", cuisine_type: "Kabab · Biryani", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 761, name: "Beef Seekh Kabab", price: 180 }, { id: 762, name: "Chicken Tikka", price: 200 }, { id: 763, name: "Kacchi Biryani", price: 280 }] },
  { id: "pizza-roma", restaurant_name: "Pizza Roma", cuisine_type: "Pizza · Italian", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 771, name: "Pepperoni Pizza", price: 550 }, { id: 772, name: "Margherita Pizza", price: 450 }, { id: 773, name: "Pasta Alfredo", price: 350 }] },
  { id: "barcode", restaurant_name: "Barcode", cuisine_type: "Fusion · Continental", image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 781, name: "Beef Tehari", price: 320 }, { id: 782, name: "Chicken Steak", price: 490 }, { id: 783, name: "Turkish Grilled Chicken", price: 560 }] },
  { id: "pizzaburg", restaurant_name: "PizzaBurg", cuisine_type: "Pizza · Burger", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop", menu_items: [{ id: 791, name: "BBQ Meat Machine Pizza", price: 605 }, { id: 792, name: "Juicy Bomb Chicken Burger", price: 175 }, { id: 793, name: "Beef Cheese Volcano", price: 305 }] },
];

const hash = (n) => ((n * 9301) + 49297 * 2) % 233280;

const ICON_BY_CUISINE = [
  [/biryani|polao|tehari|kacchi/, "🍛"],
  [/burger/, "🍔"],
  [/pizza|italian/, "🍕"],
  [/kabab|grill/, "🥩"],
  [/dessert|bakery|sweet/, "🍰"],
  [/chinese|fast food|wrap|continental|fusion/, "🥡"],
  [/american/, "🍟"],
];

const iconFor = (cuisine = "") => {
  const lower = cuisine.toLowerCase();
  return ICON_BY_CUISINE.find(([re]) => re.test(lower))?.[1] || "🍽️";
};

const enrich = (r, idx) => {
  const seed = Number.isFinite(r.id) ? Math.abs(r.id) : idx + 1;
  const h = hash(seed * 31);
  const rating = r.avg_rating ?? Math.round((3.8 + (h % 13) / 10) * 10) / 10;
  const eta = 28 + (h % 6);
  const menu = r.menu_items || [];
  return {
    ...r,
    rating,
    eta,
    icon: iconFor(r.cuisine_type),
    items: menu.slice(0, 3).map((m) => ({
      ...m,
      restaurant_id: r.id,
      restaurant_name: r.restaurant_name,
    })),
  };
};

const matchesTab = (r, tabId) => {
  if (tabId === "all") return true;
  const cats = (r.menu_items || []).map((m) => (m.category || "").toLowerCase());
  const cuisine = (r.cuisine_type || "").toLowerCase();
  if (tabId === "biryani") return cats.some((c) => c.includes("biryani"));
  if (tabId === "fastfood") return cuisine.includes("fast food") || cats.includes("fast food");
  if (tabId === "international") {
    return /pizza|burger|italian|chinese|japanese|mexican|indian|others|continental|fusion|american/.test(cuisine)
      || cats.some((c) => /pizza|burger|italian|chinese/.test(c));
  }
  return true;
};

const RestaurantCard = ({ restaurant, onAdd, canOrder, linkable }) => {
  const imageStyle = { backgroundImage: `url(${restaurant.image || restaurantImage(restaurant.restaurant_name)})` };
  return (
  <div className="border border-gray-200 rounded-[14px] overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)]">
    <div className="relative aspect-[16/9] overflow-hidden">
      {linkable ? (
        <Link to={`/restaurants/${restaurant.id}`} aria-label={`View full menu of ${restaurant.restaurant_name}`} className="absolute inset-0 cursor-pointer">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-110" style={imageStyle} />
        </Link>
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={imageStyle} />
      )}
      <span className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">★ {restaurant.rating}</span>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[10px] bg-[#f6f2ec] flex items-center justify-center text-xl shrink-0">{restaurant.icon}</div>
        <div>
          <div className="text-base font-bold">{restaurant.restaurant_name}</div>
          <div className="text-xs text-[#6b6b6f] flex items-center gap-1 mt-0.5">
            <span>{restaurant.cuisine_type}</span>
            <span className="text-gray-300">·</span>
            <span>⏱ {restaurant.eta}-{restaurant.eta + 5} min</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {restaurant.items.map((item, i) => (
          <div key={item.id || i} className="border border-gray-200 rounded-[10px] p-2.5 text-center">
            <div className="text-xs font-semibold leading-tight mb-2">{item.name}</div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm font-extrabold text-[#ff6a2b]">{formatPrice(item.price)}</span>
              {canOrder && (
                <button
                  onClick={() => onAdd(item)}
                  aria-label={`Add ${item.name} to cart`}
                  className="w-[26px] h-[26px] rounded-full bg-[#ff6a2b] text-white border-none text-base font-bold flex items-center justify-center cursor-pointer hover:scale-110 transition"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-3.5 text-center">
        {linkable ? (
          <Link to={`/restaurants/${restaurant.id}`} className="text-[#ff6a2b] text-sm font-semibold hover:opacity-70">View Full Menu →</Link>
        ) : (
          <span className="text-gray-300 text-sm font-semibold">Menu preview unavailable</span>
        )}
      </div>
    </div>
  </div>
  );
};

const TrendingDishes = () => {
  const { user, isCustomer } = useAuth();
  const { addItem } = useCart();
  const canOrder = !user || isCustomer;
  const [activeTab, setActiveTab] = useState("all");
  const [visible, setVisible] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [failed, setFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    api.get("/restaurants")
      .then((res) => {
        const list = res.data.restaurants || [];
        if (list.length === 0) setFailed(true);
        setRestaurants(list);
      })
      .catch(() => setFailed(true))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const source = failed || restaurants.length === 0 ? MOCK_RESTAURANTS : restaurants;
  const isMock = source === MOCK_RESTAURANTS;

  const enriched = source.map((r, i) => enrich(r, i));
  const filtered = enriched.filter((r) => matchesTab(r, activeTab));

  const handleAdd = (item) => {
    addItem(item.restaurant_id, item.restaurant_name, item);
  };

  return (
    <section className="pt-4 md:pt-8 pb-4 md:pb-11 bg-white" id="features" ref={sectionRef}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#ff6a2b] mb-2.5">Trending Now</span>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-4">
          <h2 className="text-2xl sm:text-[34px] font-extrabold tracking-tight m-0">Popular Restaurants in Dhaka City</h2>
          <Link to="/restaurants" className="text-[#ff6a2b] font-semibold text-sm shrink-0">See all restaurants →</Link>
        </div>
        <div className="flex flex-wrap gap-2.5 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-5.5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all duration-250 ${
                activeTab === tab.id
                  ? "bg-[#ff6a2b] text-white shadow-[0_4px_14px_rgba(255,106,43,0.35)]"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#ff6a2b] hover:text-[#ff6a2b]"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className={`transition-opacity duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <div key={activeTab} className="animate-[sb-fade-tab_0.4s_ease]">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-[14px] overflow-hidden bg-white animate-pulse">
                    <div className="aspect-[16/9] bg-gray-200" />
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                      <div className="grid grid-cols-3 gap-2.5 mb-4">
                        {[1, 2, 3].map((j) => <div key={j} className="h-20 bg-gray-100 rounded-[10px]" />)}
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-14 text-gray-400 text-sm">No restaurants found in this category yet.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} onAdd={handleAdd} canOrder={canOrder && !isMock} linkable={!isMock} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingDishes;
