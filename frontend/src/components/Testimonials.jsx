import React from "react";

const reviews = [
  {
    quote:
      "The AI recommendations are scary good. It suggested a dish I'd never have picked myself — now it's my weekly order. Delivery was 22 minutes. I'm never calling a restaurant directly again.",
    name: "Sarah K.",
    role: "Customer",
    initials: "SK",
    color: "#ff6a2b",
  },
  {
    quote:
      "Our revenue went up 40% in the first 3 months. The dashboard shows exactly which items sell, when, and why. It's like having a data team in your pocket.",
    name: "Marco R.",
    role: "Restaurant Owner",
    initials: "MR",
    color: "#3b82f6",
  },
  {
    quote:
      "The rider app is clean and fast. Route suggestions save me 10 minutes per delivery. My earnings tracker is accurate and I get paid on time every time.",
    name: "Priya M.",
    role: "Delivery Rider",
    initials: "PM",
    color: "#22c55e",
  },
];

const Testimonials = () => {
  return (
    <section className="sb-testimonials sb-root" id="about">
      <div className="sb-container">
        <span className="sb-eyebrow">Real People, Real Reviews</span>
        <h2>Loved across the board.</h2>
        <div className="sb-testi-rating">
          <span className="sb-testi-stars">★★★★★</span>
          <span>4.9</span>
          <span className="sb-testi-count">12,000+ reviews</span>
        </div>

        <div className="sb-testi-grid">
          {reviews.map((r) => (
            <div className="sb-testi-card" key={r.name}>
              <div className="sb-testi-stars">★★★★★</div>
              <p className="sb-testi-quote">"{r.quote}"</p>
              <div className="sb-testi-person">
                <div className="sb-testi-avatar" style={{ background: r.color }}>
                  {r.initials}
                </div>
                <div>
                  <div className="sb-testi-name">{r.name}</div>
                  <div className="sb-testi-role">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
