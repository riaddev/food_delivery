import React from "react";

const columns = [
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Blog"],
  },
  {
    title: "Customers",
    links: ["Browse Restaurants", "Track Order", "Promotions", "Gift Cards"],
  },
  {
    title: "Restaurants",
    links: ["Partner Portal", "Dashboard", "Analytics", "Support"],
  },
  {
    title: "Riders",
    links: ["Become a Rider", "Rider App", "Earnings", "Community"],
  },
];

const Footer = () => {
  return (
    <footer className="sb-footer sb-root">
      <div className="sb-container">
        <div className="sb-footer-grid">
          <div className="sb-footer-brand">
            <a href="/" className="sb-logo">
              <span className="sb-logo-mark">🍔</span>
              Swift<span>Bite</span>
            </a>
            <p>
              Smart food delivery connecting customers, restaurants, and
              riders — powered by AI.
            </p>
            <div className="sb-footer-social">
              <a href="#">𝕏</a>
              <a href="#">in</a>
              <a href="#">f</a>
              <a href="#">▶</a>
            </div>
          </div>

          {columns.map((col) => (
            <div className="sb-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="sb-footer-bottom">
          <span>© 2026 SwiftBite Technologies. All rights reserved.</span>
          <div className="sb-footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
