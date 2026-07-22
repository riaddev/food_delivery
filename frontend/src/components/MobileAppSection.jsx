import React from "react";

const checklist = [
  "Real-time GPS tracking",
  "AI food recommendations",
  "Instant order notifications",
  "Save favourite restaurants",
];

const MobileAppSection = () => {
  return (
    <section className="sb-mobile sb-root">
      <div className="sb-container sb-mobile-grid">
        <div>
          <span className="sb-eyebrow">Mobile App</span>
          <h2>
            Order smarter
            <br />
            from your <span style={{ color: "var(--sb-orange)" }}>pocket.</span>
          </h2>
          <p className="sb-mobile-lead">
            The SwiftBite app puts 500+ restaurants, live tracking, and AI
            recommendations right in your hand. Available on iOS and Android.
          </p>

          <div className="sb-check-list">
            {checklist.map((item) => (
              <div className="sb-check-item" key={item}>
                <span className="sb-check-icon">✓</span>
                {item}
              </div>
            ))}
          </div>

          <div className="sb-store-buttons">
            <a href="#" className="sb-store-btn">
              🍎
              <span>
                <small>Download on the</small>
                <b>App Store</b>
              </span>
            </a>
            <a href="#" className="sb-store-btn">
              ▶️
              <span>
                <small>Get it on</small>
                <b>Google Play</b>
              </span>
            </a>
          </div>
        </div>

        <div className="sb-phone">
          <div className="sb-phone-screen">
            <div className="sb-phone-greeting">Good evening 🌙</div>
            <div className="sb-phone-title">What's for dinner?</div>
            <div className="sb-phone-search">🔍 Search restaurants...</div>

            <div className="sb-phone-cats">
              <div className="sb-phone-cat" style={{ background: "var(--sb-orange)" }}>🍔</div>
              <div className="sb-phone-cat" style={{ background: "#ffe3d3" }}>🍕</div>
              <div className="sb-phone-cat" style={{ background: "#ffe3d3" }}>🍣</div>
              <div className="sb-phone-cat" style={{ background: "#ffe3d3" }}>☕</div>
              <div className="sb-phone-cat" style={{ background: "#ffe3d3" }}>🍩</div>
            </div>

            <div
              className="sb-phone-card"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop)",
              }}
            >
              <div className="sb-phone-card-info">
                <b>Burger Palace</b>
                ★ 4.9 · 20 min
              </div>
            </div>

            <div className="sb-phone-recent-title">Recent Orders</div>
            <div className="sb-phone-order-row">
              <span>🍔 Beef Burger</span>
              <span className="sb-phone-reorder">Reorder</span>
            </div>
            <div className="sb-phone-order-row">
              <span>🍕 Margherita</span>
              <span className="sb-phone-reorder">Reorder</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppSection;
