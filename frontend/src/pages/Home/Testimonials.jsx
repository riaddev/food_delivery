import React from "react";

const reviews = [
  {
    quote:
      "The inventory management system saved us hours of manual work. Highly recommend for any restaurant in Dhaka looking to go digital.",
    name: "Tanvir Hasan",
    role: "Food Blogger Review",
    initials: "TH",
    color: "#ff6a2b",
  },
  {
    quote:
      "Fast delivery and the food was still hot. The real-time tracking feature is a game changer for busy professionals like me.",
    name: "Nusrat Jahan",
    role: "Verified Customer Review",
    initials: "NJ",
    color: "#3b82f6",
  },
  {
    quote:
      "As a restaurant partner, the analytics dashboard helped me understand what dishes perform best. Profits are up 35%!",
    name: "Shahidul Islam",
    role: "Restaurant Partner Review",
    initials: "SI",
    color: "#22c55e",
  },
];

const Testimonials = () => {
  return (
    <section className="sb-testimonials sb-root" id="about">
      <div className="sb-container">
        <span className="sb-eyebrow">Real People, Real Reviews</span>
        <h2>Trusted by Professionals.</h2>
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
