import React from "react";

const Header = () => {
  return (
    <header className="sb-header sb-root">
      <div className="sb-container sb-header-inner">
        <a href="/" className="sb-logo">
          <span className="sb-logo-mark">🍔</span>
          Swift<span>Bite</span>
        </a>

        <nav className="sb-nav">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
        </nav>

        <div className="sb-header-actions">
          <button className="sb-btn sb-btn-outline-dark">Sign In</button>
          <button className="sb-btn sb-btn-orange">Get Started</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
