import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sb-header sb-root${scrolled ? " sb-header-scrolled" : ""}`}>
      <div className="sb-container sb-header-inner">
        <Link to="/" className="sb-logo-light">
          <span className="sb-logo-mark">🍔</span>
          Swift<span>Bite</span>
        </Link>

        <nav className="sb-nav-light">
          {["Home", "Features", "How It Works", "About"].map((item) => {
            const href =
              item === "Home"
                ? "#home"
                : `#${item.toLowerCase().replace(/\s+/g, "-")}`;
            return (
              <a key={item} href={href}>
                {item}
              </a>
            );
          })}
        </nav>

        <div className="sb-header-actions">
          {user ? (
            <>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                {user.name}
              </span>
              <button
                className="sb-btn sb-btn-ghost"
                onClick={async () => { await logout(); navigate("/"); }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="sb-btn sb-btn-ghost" style={{ textDecoration: "none" }}>
                Sign In
              </Link>
              <Link to="/register" className="sb-btn sb-btn-orange" style={{ textDecoration: "none" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
