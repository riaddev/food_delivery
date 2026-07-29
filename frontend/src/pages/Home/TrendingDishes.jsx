import React, { useState, useEffect, useRef } from "react";

const tabs = [
  { id: "all", label: "All", icon: "🔥" },
  { id: "biryani", label: "Biryani", icon: "🍛" },
  { id: "fastfood", label: "Fast Food", icon: "🍔" },
  { id: "international", label: "International", icon: "🍕" },
];

const restaurants = [
  {
    id: "sultans-dine",
    name: "Sultan's Dine",
    icon: "👑",
    rating: "4.8",
    reviews: "12.5K",
    cuisine: "Kacchi · Biryani",
    deliveryTime: "30-40 min",
    tags: ["biryani"],
    coverImg: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Mutton Kacchi", price: "৳350" },
      { name: "Morog Polao", price: "৳280" },
      { name: "Chicken Roast", price: "৳220" },
    ],
  },
  {
    id: "haji-biryani",
    name: "Haji Biryani",
    icon: "🍚",
    rating: "4.7",
    reviews: "18.3K",
    cuisine: "Biryani · Mughlai",
    deliveryTime: "25-35 min",
    tags: ["biryani"],
    coverImg: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Mutton Biryani", price: "৳320" },
      { name: "Chicken Biryani", price: "৳250" },
      { name: "Borhani", price: "৳50" },
    ],
  },
  {
    id: "nannas-biryani",
    name: "Nanna's Biryani",
    icon: "🍛",
    rating: "4.6",
    reviews: "9.8K",
    cuisine: "Biryani · Pulao",
    deliveryTime: "30-40 min",
    tags: ["biryani"],
    coverImg: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Nanna Biryani", price: "৳300" },
      { name: "Morog Pulao", price: "৳260" },
      { name: "Chicken Roast", price: "৳200" },
    ],
  },
  {
    id: "kacchi-bhai",
    name: "Kacchi Bhai",
    icon: "🥘",
    rating: "4.5",
    reviews: "7.2K",
    cuisine: "Kacchi · Tehari",
    deliveryTime: "30-45 min",
    tags: ["biryani"],
    coverImg: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Kacchi Biryani", price: "৳290" },
      { name: "Chicken Polao", price: "৳230" },
      { name: "Beef Tehari", price: "৳260" },
    ],
  },
  {
    id: "chillox",
    name: "Chillox",
    icon: "🍔",
    rating: "4.9",
    reviews: "15.1K",
    cuisine: "Burgers · Fast Food",
    deliveryTime: "20-30 min",
    tags: ["fastfood"],
    coverImg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Beef Burger", price: "৳350" },
      { name: "Chicken Burger", price: "৳280" },
      { name: "Peri Peri Fries", price: "৳180" },
    ],
  },
  {
    id: "takeout",
    name: "Takeout",
    icon: "🥡",
    rating: "4.4",
    reviews: "6.5K",
    cuisine: "Fast Food · Wraps",
    deliveryTime: "20-30 min",
    tags: ["fastfood"],
    coverImg: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Zinger Burger", price: "৳250" },
      { name: "Beef Burger", price: "৳320" },
      { name: "French Fries", price: "৳120" },
    ],
  },
  {
    id: "star-kabab",
    name: "Star Kabab",
    icon: "🥩",
    rating: "4.6",
    reviews: "22.7K",
    cuisine: "Kabab · Biryani",
    deliveryTime: "25-35 min",
    tags: ["fastfood"],
    coverImg: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Beef Seekh Kabab", price: "৳180" },
      { name: "Chicken Tikka", price: "৳200" },
      { name: "Kacchi Biryani", price: "৳280" },
    ],
  },
  {
    id: "pizza-roma",
    name: "Pizza Roma",
    icon: "🍕",
    rating: "4.5",
    reviews: "8.9K",
    cuisine: "Pizza · Italian",
    deliveryTime: "30-40 min",
    tags: ["international"],
    coverImg: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Pepperoni Pizza", price: "৳550" },
      { name: "Margherita Pizza", price: "৳450" },
      { name: "Pasta Alfredo", price: "৳350" },
    ],
  },
  {
    id: "barcode",
    name: "Barcode",
    icon: "🍽️",
    rating: "4.7",
    reviews: "5.3K",
    cuisine: "Fusion · Continental",
    deliveryTime: "35-45 min",
    tags: ["international"],
    coverImg: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "Beef Tehari", price: "৳320" },
      { name: "Chicken Steak", price: "৳490" },
      { name: "Turkish Grilled Chicken", price: "৳560" },
    ],
  },
  {
    id: "pizzaburg",
    name: "PizzaBurg",
    icon: "🍕",
    rating: "4.3",
    reviews: "6.8K",
    cuisine: "Pizza · Burger",
    deliveryTime: "25-35 min",
    tags: ["fastfood", "international"],
    coverImg: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",
    items: [
      { name: "BBQ Meat Machine Pizza", price: "৳605" },
      { name: "Juicy Bomb Chicken Burger", price: "৳175" },
      { name: "Beef Cheese Volcano", price: "৳305" },
    ],
  },
];

const RestaurantCard = ({ restaurant }) => (
  <div className="sb-restaurant-card sb-dish-hover">
    <div className="sb-restaurant-cover">
      <div className="sb-restaurant-cover-zoom" style={{ backgroundImage: `url(${restaurant.coverImg})` }} />
      <span className="sb-restaurant-rating-badge">★ {restaurant.rating}</span>
    </div>
    <div className="sb-restaurant-body">
      <div className="sb-restaurant-info">
        <div className="sb-restaurant-icon">{restaurant.icon}</div>
        <div>
          <div className="sb-restaurant-name">{restaurant.name}</div>
          <div className="sb-restaurant-meta">
            <span>{restaurant.cuisine}</span>
            <span className="sb-restaurant-dot">·</span>
            <span>⏱ {restaurant.deliveryTime}</span>
          </div>
        </div>
      </div>
      <div className="sb-restaurant-items">
        {restaurant.items.map((item, i) => (
          <div key={i} className="sb-restaurant-item">
            <div className="sb-restaurant-item-name">{item.name}</div>
            <div className="sb-restaurant-item-row">
              <span className="sb-restaurant-item-price">{item.price}</span>
              <button className="sb-restaurant-item-add">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="sb-restaurant-footer">
        <a href="#" className="sb-restaurant-view">View Full Menu →</a>
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

  const filtered = activeTab === "all"
    ? restaurants
    : restaurants.filter((r) => r.tags.includes(activeTab));

  return (
    <section className="sb-trending sb-root" id="features" ref={sectionRef}>
      <div className="sb-container">
        <span className="sb-eyebrow">Trending Now</span>
        <div className="sb-trending-head">
          <h2>Popular Restaurants in Dhaka City</h2>
          <a href="#" className="sb-see-all">See all restaurants →</a>
        </div>

        <div className="sb-tabs sb-tabs-main">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sb-tab ${activeTab === tab.id ? "sb-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className={`sb-tab-content ${visible ? "sb-tab-visible" : ""}`}>
          <div key={activeTab} className="sb-tab-panel">
            <div className="sb-restaurant-grid">
              {filtered.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrendingDishes;
