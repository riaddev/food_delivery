import React, { useState, useEffect, useRef } from "react";

const stats = [
  { num: 500, suffix: "+", label: "Restaurants" },
  { num: 10000, suffix: "+", label: "Happy Customers" },
  { num: 49, suffix: "★", label: "App Rating", prefix: "", decimal: true },
  { num: 28, suffix: "min", label: "Avg. Delivery" },
];

const popularTags = ["🍔 Burger", "🍕 Pizza", "🍣 Sushi", "🌮 Tacos", "🍜 Ramen"];

const AnimatedStat = ({ stat }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const target = stat.decimal ? stat.num : stat.num;
          const duration = 1500;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.num, stat.decimal]);

  const display = stat.decimal
    ? (count / 10).toFixed(1)
    : count;

  return (
    <div className="sb-stat" ref={ref}>
      <div className="sb-stat-num">{stat.prefix || ""}{display}{stat.suffix}</div>
      <div className="sb-stat-label">{stat.label}</div>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="sb-hero sb-root" id="home">
      <div className="sb-container sb-hero-top">
        <div className="sb-hero-copy">
          <div className="sb-hero-badge sb-animate-fade-in">
            <span className="sb-dot" />
            Delivering in your city now
          </div>

          <h1 className="sb-hero-title sb-animate-slide-left">
            Cravings
            <br />
            <span className="sb-orange-text">Delivered.</span>
          </h1>

          <p className="sb-hero-sub sb-animate-slide-left" style={{ animationDelay: "0.15s" }}>
            Browse hundreds of restaurants, order your favorite food, and
            track delivery live — all powered by smart AI.
          </p>

          <div className="sb-search-bar sb-animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="sb-search-loc">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              My Location
            </div>
            <div className="sb-search-divider" />
            <div className="sb-search-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Search restaurants or dishes...
            </div>
            <button className="sb-search-filter" title="Filters">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
                <line x1="17" y1="16" x2="23" y2="16"/>
              </svg>
            </button>
            <button className="sb-btn sb-btn-find">
              Search
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          <div className="sb-popular sb-animate-fade-in" style={{ animationDelay: "0.45s" }}>
            Popular:
            {popularTags.map((tag) => (
              <span className="sb-popular-chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="sb-hero-media sb-animate-slide-right">
          <div
            className="sb-hero-img sb-float-burger"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop)",
            }}
          />


        </div>
      </div>

      <div className="sb-container sb-stats-bar">
        {stats.map((s) => (
          <AnimatedStat key={s.label} stat={s} />
        ))}
      </div>
    </section>
  );
};

export default Hero;
