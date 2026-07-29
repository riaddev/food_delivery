import React from "react";

const foodIcons = ["🍔", "🍕", "🍣", "🌮", "🍜", "🥗", "🍰", "🥤", "🍗", "🍝"];

const CTABanner = () => {
  return (
    <section className="sb-cta sb-root">
      <div className="sb-cta-circle c1" />
      <div className="sb-cta-circle c2" />
      <div className="sb-cta-icons">
        {foodIcons.map((icon, i) => (
          <span
            key={i}
            className="sb-float-icon"
            style={{
              left: `${5 + (i * 9.5) % 90}%`,
              top: `${10 + (i * 13 + 7) % 75}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3)}s`,
              fontSize: `${20 + (i % 4) * 4}px`,
            }}
          >
            {icon}
          </span>
        ))}
      </div>
      <div className="sb-container">
        <h2>Your first delivery is on us.</h2>
        <p>
          Sign up today and get free delivery on your first 3 orders. No
          promo code needed.
        </p>
        <div className="sb-cta-buttons">
          <button className="sb-btn sb-btn-white">Create Free Account →</button>
          <button className="sb-btn sb-btn-outline-light">Browse Restaurants</button>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
