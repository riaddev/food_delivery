import React from "react";

const stats = [
  { num: "500+", label: "Restaurants" },
  { num: "10K+", label: "Happy Customers" },
  { num: "4.9★", label: "App Rating" },
  { num: "28min", label: "Avg. Delivery" },
];

const popularTags = ["🍔 Burger", "🍕 Pizza", "🍣 Sushi", "🌮 Tacos", "🍜 Ramen"];

const Hero = () => {
  return (
    <section className="sb-hero sb-root" id="home">
      <div className="sb-container sb-hero-top">
        <div className="sb-hero-copy">
          <div className="sb-hero-badge">
            <span className="sb-dot" />
            Delivering in your city now
          </div>

          <h1 className="sb-hero-title">
            Cravings
            <br />
            <span className="sb-orange-text">Delivered.</span>
          </h1>

          <p className="sb-hero-sub">
            Browse hundreds of restaurants, order your favorite food, and
            track delivery live — all powered by smart AI.
          </p>

          <div className="sb-search-bar">
            <div className="sb-search-loc">📍 My Location</div>
            <div className="sb-search-input">🔍 Search restaurants or dishes...</div>
            <button className="sb-btn sb-btn-orange">Find Food</button>
          </div>

          <div className="sb-popular">
            Popular:
            {popularTags.map((tag) => (
              <span className="sb-popular-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="sb-hero-media">
          <div
            className="sb-hero-img"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop)",
            }}
          />

          <div className="sb-float-card sb-float-1">
            <div className="sb-float-avatar">🍣</div>
            <div>
              <div className="sb-float-name">Sushi Zen Box</div>
              <div className="sb-float-meta">★★★★★ · 20 min</div>
            </div>
            <div className="sb-float-arrow">↗</div>
          </div>

          <div className="sb-float-card sb-float-2">
            <div className="sb-float-clock">⏱️</div>
            <div>
              <div className="sb-float-meta">Avg. Delivery</div>
              <div className="sb-float-name">28 min</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sb-container sb-stats-bar">
        {stats.map((s) => (
          <div className="sb-stat" key={s.label}>
            <div className="sb-stat-num">{s.num}</div>
            <div className="sb-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Hero;
