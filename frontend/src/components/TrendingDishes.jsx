import React, { useState } from "react";

const tabs = ["All", "Burgers", "Sushi", "Noodles", "Pizza", "Mexican"];

const dishes = [
  {
    tag: "🔥 Bestseller",
    shop: "Burger Palace",
    name: "Signature Beef Burger",
    rating: "4.9",
    time: "20–25 min",
    price: "$12.99",
    img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop",
  },
  {
    tag: "⭐ Top Rated",
    shop: "Sushi Zen",
    name: "Premium Sushi Box",
    rating: "4.8",
    time: "30–40 min",
    price: "$18.50",
    img: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&auto=format&fit=crop",
  },
  {
    tag: "🌶️ Spicy Pick",
    shop: "Noodle House",
    name: "Spicy Chicken Ramen",
    rating: "4.7",
    time: "25–35 min",
    price: "$14.00",
    img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800&auto=format&fit=crop",
  },
  {
    tag: "🆕 New",
    shop: "Pizza Nova",
    name: "Crispy Pizza Slice",
    rating: "4.8",
    time: "30–40 min",
    price: "$11.99",
    img: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=800&auto=format&fit=crop",
  },
  {
    tag: "🔥 Popular",
    shop: "Casa Mexicana",
    name: "Loaded Nachos Bowl",
    rating: "4.6",
    time: "20–30 min",
    price: "$10.50",
    img: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=800&auto=format&fit=crop",
  },
];

const TrendingDishes = () => {
  const [active, setActive] = useState("All");

  return (
    <section className="sb-trending sb-root" id="features">
      <div className="sb-container">
        <span className="sb-eyebrow">Trending Now</span>
        <div className="sb-trending-head">
          <h2>What's Hot Right Now</h2>
          <a href="#" className="sb-see-all">
            See all dishes →
          </a>
        </div>

        <div className="sb-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`sb-tab ${active === tab ? "sb-tab-active" : ""}`}
              onClick={() => setActive(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="sb-dish-grid">
          {dishes.map((dish) => (
            <div className="sb-dish-card" key={dish.name}>
              <div className="sb-dish-media" style={{ backgroundImage: `url(${dish.img})` }}>
                <span className="sb-dish-tag">{dish.tag}</span>
                <span className="sb-dish-heart">♡</span>
              </div>
              <div className="sb-dish-body">
                <div className="sb-dish-shop">{dish.shop}</div>
                <div className="sb-dish-name">{dish.name}</div>
                <div className="sb-dish-meta">
                  <span>★ {dish.rating} · ⏱ {dish.time}</span>
                  <span className="sb-dish-price">{dish.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingDishes;
