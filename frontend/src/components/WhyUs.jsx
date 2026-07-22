import React from "react";

const features = [
  {
    icon: "✨",
    color: "orange",
    title: "AI-Powered Just for You",
    desc: "Our recommendation engine learns your taste and suggests dishes you'll actually love — not just the sponsored ones.",
  },
  {
    icon: "📍",
    color: "blue",
    title: "Track Your Rider Live",
    desc: "Watch your delivery on a real-time map. No more guessing — you know exactly when to open the door.",
  },
  {
    icon: "🛡️",
    color: "green",
    title: "Secure & Reliable",
    desc: "End-to-end encrypted payments, role-based access, and a support chatbot available 24/7 — your order is in safe hands.",
  },
];

const WhyUs = () => {
  return (
    <section className="sb-why sb-root" id="how-it-works">
      <div className="sb-container sb-why-grid">
        <div className="sb-why-media">
          <div
            className="sb-why-img"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=900&auto=format&fit=crop)",
            }}
          />
          <div className="sb-why-badge-rating">
            ★ 4.9 / 5
            <small>12K+ reviews</small>
          </div>
          <div className="sb-why-badge-orders">
            <div className="sb-badge-icon">📦</div>
            <div>
              <b>12,400+</b>
              <span>Orders this week</span>
            </div>
          </div>
        </div>

        <div>
          <span className="sb-eyebrow">Why SwiftBite</span>
          <h2>
            Not just another <span style={{ color: "var(--sb-orange)" }}>delivery app.</span>
          </h2>
          <p className="sb-why-lead">
            SwiftBite is a full ecosystem — smart enough to know what you want
            before you do, fast enough to get it to you while it's still hot.
          </p>

          {features.map((f) => (
            <div className="sb-feature-row" key={f.title}>
              <div className={`sb-feature-icon ${f.color}`}>{f.icon}</div>
              <div>
                <div className="sb-feature-title">{f.title}</div>
                <div className="sb-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}

          <button className="sb-btn sb-btn-black">Start ordering now →</button>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;
