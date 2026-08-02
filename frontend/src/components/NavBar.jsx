import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";

const Header = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-[1000] py-3 transition-all duration-[400ms] ${
      scrolled
        ? "bg-white/78 backdrop-blur-md border-b border-[rgba(255,107,53,0.12)] shadow-lg"
        : "bg-white/45 backdrop-blur-sm border-b border-transparent"
    }`}>
      <div className="max-w-[1240px] mx-auto px-8 flex items-center justify-between gap-5">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-[#ff6b35]">
          <span className="w-[34px] h-[34px] rounded-lg bg-[#ff6a2b] flex items-center justify-center text-base">🍔</span>
          Swift<span className="text-gray-900">Bite</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5">
          {["Home", "Features", "How It Works", "About"].map((item) => (
            <a
              key={item}
              href={item === "Home" ? "#home" : `#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-gray-600 text-sm font-semibold px-3.5 py-2 rounded-full hover:bg-[#fff1e8] hover:text-[#ff6b35] transition"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link to="/restaurants" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition whitespace-nowrap">
                Restaurants
              </Link>
              {user.role === "customer" && (
                <>
                  <Link to="/customer/account" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition whitespace-nowrap">
                    My Account
                  </Link>
                  <button onClick={() => setCartOpen(true)} className="relative text-xl bg-transparent border border-gray-300 w-[42px] h-[42px] rounded-full flex items-center justify-center hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition">
                    🛒
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#ff6b35] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </>
              )}
              {user.role === "restaurant" && (
                <Link to="/restaurant/dashboard" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition whitespace-nowrap">
                  Dashboard
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin/dashboard" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition whitespace-nowrap">
                  Admin
                </Link>
              )}
              <span className="text-sm font-semibold text-gray-600">{user.name}</span>
              <button
                onClick={async () => { await logout(); navigate("/"); }}
                className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/restaurants" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition whitespace-nowrap">
                Restaurants
              </Link>
              <Link to="/login" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#ff6b35] hover:text-[#ff6b35] hover:-translate-y-0.5 transition whitespace-nowrap">
                Sign In
              </Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 bg-[#ff6a2b] text-white px-5.5 py-3 rounded-full font-semibold text-sm hover:bg-[#e6551a] hover:-translate-y-0.5 transition whitespace-nowrap">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
};

export default Header;
