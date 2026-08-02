import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const tabs = [
  { id: "all", label: "All", icon: "🔥" },
  { id: "biryani", label: "Biryani", icon: "🍛" },
  { id: "fastfood", label: "Fast Food", icon: "🍔" },
  { id: "international", label: "International", icon: "🍕" },
];

const restaurants = [
  { id: "sultans-dine", name: "Sultan's Dine", icon: "👑", rating: "4.8", reviews: "12.5K", cuisine: "Kacchi · Biryani", deliveryTime: "30-40 min", tags: ["biryani"], coverImg: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop", items: [{ name: "Mutton Kacchi", price: "৳350" }, { name: "Morog Polao", price: "৳280" }, { name: "Chicken Roast", price: "৳220" }] },
  { id: "haji-biryani", name: "Haji Biryani", icon: "🍚", rating: "4.7", reviews: "18.3K", cuisine: "Biryani · Mughlai", deliveryTime: "25-35 min", tags: ["biryani"], coverImg: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop", items: [{ name: "Mutton Biryani", price: "৳320" }, { name: "Chicken Biryani", price: "৳250" }, { name: "Borhani", price: "৳50" }] },
  { id: "nannas-biryani", name: "Nanna's Biryani", icon: "🍛", rating: "4.6", reviews: "9.8K", cuisine: "Biryani · Pulao", deliveryTime: "30-40 min", tags: ["biryani"], coverImg: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?q=80&w=800&auto=format&fit=crop", items: [{ name: "Nanna Biryani", price: "৳300" }, { name: "Morog Pulao", price: "৳260" }, { name: "Chicken Roast", price: "৳200" }] },
  { id: "kacchi-bhai", name: "Kacchi Bhai", icon: "🥘", rating: "4.5", reviews: "7.2K", cuisine: "Kacchi · Tehari", deliveryTime: "30-45 min", tags: ["biryani"], coverImg: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop", items: [{ name: "Kacchi Biryani", price: "৳290" }, { name: "Chicken Polao", price: "৳230" }, { name: "Beef Tehari", price: "৳260" }] },
  { id: "chillox", name: "Chillox", icon: "🍔", rating: "4.9", reviews: "15.1K", cuisine: "Burgers · Fast Food", deliveryTime: "20-30 min", tags: ["fastfood"], coverImg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop", items: [{ name: "Beef Burger", price: "৳350" }, { name: "Chicken Burger", price: "৳280" }, { name: "Peri Peri Fries", price: "৳180" }] },
  { id: "takeout", name: "Takeout", icon: "🥡", rating: "4.4", reviews: "6.5K", cuisine: "Fast Food · Wraps", deliveryTime: "20-30 min", tags: ["fastfood"], coverImg: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop", items: [{ name: "Zinger Burger", price: "৳250" }, { name: "Beef Burger", price: "৳320" }, { name: "French Fries", price: "৳120" }] },
  { id: "star-kabab", name: "Star Kabab", icon: "🥩", rating: "4.6", reviews: "22.7K", cuisine: "Kabab · Biryani", deliveryTime: "25-35 min", tags: ["fastfood"], coverImg: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=800&auto=format&fit=crop", items: [{ name: "Beef Seekh Kabab", price: "৳180" }, { name: "Chicken Tikka", price: "৳200" }, { name: "Kacchi Biryani", price: "৳280" }] },
  { id: "pizza-roma", name: "Pizza Roma", icon: "🍕", rating: "4.5", reviews: "8.9K", cuisine: "Pizza · Italian", deliveryTime: "30-40 min", tags: ["international"], coverImg: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop", items: [{ name: "Pepperoni Pizza", price: "৳550" }, { name: "Margherita Pizza", price: "৳450" }, { name: "Pasta Alfredo", price: "৳350" }] },
  { id: "barcode", name: "Barcode", icon: "🍽️", rating: "4.7", reviews: "5.3K", cuisine: "Fusion · Continental", deliveryTime: "35-45 min", tags: ["international"], coverImg: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop", items: [{ name: "Beef Tehari", price: "৳320" }, { name: "Chicken Steak", price: "৳490" }, { name: "Turkish Grilled Chicken", price: "৳560" }] },
  { id: "pizzaburg", name: "PizzaBurg", icon: "🍕", rating: "4.3", reviews: "6.8K", cuisine: "Pizza · Burger", deliveryTime: "25-35 min", tags: ["fastfood", "international"], coverImg: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop", items: [{ name: "BBQ Meat Machine Pizza", price: "৳605" }, { name: "Juicy Bomb Chicken Burger", price: "৳175" }, { name: "Beef Cheese Volcano", price: "৳305" }] },
];

const RestaurantCard = ({ restaurant }) => (
  <div className="border border-gray-200 rounded-[14px] overflow-hidden bg-white transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)]">
    <div className="relative aspect-[16/9] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-110" style={{ backgroundImage: `url(${restaurant.coverImg})` }} />
      <span className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">★ {restaurant.rating}</span>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[10px] bg-[#f6f2ec] flex items-center justify-center text-xl shrink-0">{restaurant.icon}</div>
        <div>
          <div className="text-base font-bold">{restaurant.name}</div>
          <div className="text-xs text-[#6b6b6f] flex items-center gap-1 mt-0.5">
            <span>{restaurant.cuisine}</span>
            <span className="text-gray-300">·</span>
            <span>⏱ {restaurant.deliveryTime}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {restaurant.items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-[10px] p-2.5 text-center">
            <div className="text-xs font-semibold leading-tight mb-2">{item.name}</div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-sm font-extrabold text-[#ff6a2b]">{item.price}</span>
              <button className="w-[26px] h-[26px] rounded-full bg-[#ff6a2b] text-white border-none text-base font-bold flex items-center justify-center cursor-pointer hover:scale-110 transition">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-3.5 text-center">
        <Link to="/restaurants" className="text-[#ff6a2b] text-sm font-semibold hover:opacity-70">View Full Menu →</Link>
      </div>
    </div>
  </div>
);

const TrendingDishes = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

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

  const filtered = activeTab === "all" ? restaurants : restaurants.filter((r) => r.tags.includes(activeTab));

  return (
    <section className="py-4 md:py-11 bg-white" id="features" ref={sectionRef}>
      <div className="max-w-[1240px] mx-auto px-8">
        <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#ff6a2b] mb-2.5">Trending Now</span>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-[34px] font-extrabold tracking-tight m-0">Popular Restaurants in Dhaka City</h2>
          <Link to="/restaurants" className="text-[#ff6a2b] font-semibold text-sm">See all restaurants →</Link>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingDishes;
