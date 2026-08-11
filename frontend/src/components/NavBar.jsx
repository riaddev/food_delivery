import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag, Utensils, UtensilsCrossed, Tag, Store, Info,
  ClipboardList, MapPin, User, Heart, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";

const Header = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  const closeMobile = () => setMobileOpen(false);
  const isCustomer = user?.role === "customer";

  const guestLinks = (
    <>
      <Link to="/restaurants" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <Utensils size={15} strokeWidth={2} />
        Browse Food
      </Link>
      <Link to="/restaurants?filter=offers" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <Tag size={15} strokeWidth={2} />
        Offers
      </Link>
      <Link to="/register/restaurant" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <Store size={15} strokeWidth={2} />
        Become a Partner
      </Link>
      <Link to="/#about" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <Info size={15} strokeWidth={2} />
        About Us
      </Link>
    </>
  );

  const customerLinks = (
    <>
      <Link to="/restaurants" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <Utensils size={15} strokeWidth={2} />
        Browse Food
      </Link>
      <Link to="/customer/account/orders" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <ClipboardList size={15} strokeWidth={2} />
        My Orders
      </Link>
      <Link to="/restaurants?filter=offers" onClick={closeMobile} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 text-sm font-medium whitespace-nowrap transition">
        <Tag size={15} strokeWidth={2} />
        Offers
      </Link>
    </>
  );

  return (
    <header className={`sticky top-0 z-[1000] bg-white border-b border-zinc-100 py-3 transition-shadow duration-[400ms] ${
      scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.06)]" : ""
    }`}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 flex items-center justify-between gap-5">
        <Link to="/" onClick={closeMobile} className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-[#E03546]">
          <span className="w-[34px] h-[34px] rounded-lg bg-[#E03546] flex items-center justify-center text-white">
            <UtensilsCrossed size={18} strokeWidth={2.2} />
          </span>
          Swift<span className="text-gray-900">Bite</span>
        </Link>

        {!user && (
          <nav className="hidden lg:flex items-center gap-8">
            {guestLinks}
          </nav>
        )}

        {isCustomer && (
          <nav className="hidden lg:flex items-center gap-8">
            {customerLinks}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" className="lg:hidden w-[38px] h-[38px] rounded-full flex items-center justify-center text-zinc-900 hover:bg-zinc-100 transition">
            {mobileOpen ? <X size={19} strokeWidth={2} /> : <Menu size={19} strokeWidth={2} />}
          </button>
          {user ? (
            <>
              {isCustomer && (
                <>
                  <button onClick={() => setCartOpen(true)} aria-label="Open cart" className="relative bg-transparent hover:bg-zinc-100 w-[38px] h-[38px] rounded-full flex items-center justify-center text-zinc-900 transition">
                    <ShoppingBag size={19} strokeWidth={2} />
                    {itemCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-[#E03546] text-white text-xs font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen((v) => !v)} aria-label="Profile menu" className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-800 font-bold text-sm hover:bg-zinc-300 transition">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        (user.name || "?").charAt(0).toUpperCase()
                      )}
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.12)] py-2">
                        <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                          <div className="text-sm font-semibold text-zinc-900 truncate">{user.name}</div>
                          <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                        </div>
                        <Link to="/customer/account/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
                          <User size={16} strokeWidth={2} />
                          My Profile
                        </Link>
                        <Link to="/customer/account/addresses" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
                          <MapPin size={16} strokeWidth={2} />
                          Saved Addresses
                        </Link>
                        <Link to="/customer/account/wishlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
                          <Heart size={16} strokeWidth={2} />
                          Wishlist
                        </Link>
                        <div className="border-t border-zinc-100 my-1" />
                        <button
                          onClick={async () => { setMenuOpen(false); setMobileOpen(false); await logout(); navigate("/"); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#E03546] hover:bg-[#E03546]/5 transition text-left"
                        >
                          <LogOut size={16} strokeWidth={2} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              {user.role === "restaurant" && (
                <Link to="/restaurant/dashboard" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#E03546] hover:text-[#E03546] hover:-translate-y-0.5 transition whitespace-nowrap">
                  Dashboard
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin/dashboard" className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#E03546] hover:text-[#E03546] hover:-translate-y-0.5 transition whitespace-nowrap">
                  Admin
                </Link>
              )}
              <span className="hidden md:inline text-sm font-semibold text-gray-600">{user.name}</span>
              {user.role !== "customer" && (
                <button
                  onClick={async () => { setMobileOpen(false); await logout(); navigate("/"); }}
                  className="bg-transparent border border-gray-300 text-gray-900 px-4.5 py-[9px] rounded-full font-semibold text-sm hover:border-[#E03546] hover:text-[#E03546] hover:-translate-y-0.5 transition"
                >
                  Logout
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="text-zinc-900 hover:text-[#E03546] text-sm font-medium transition whitespace-nowrap">
                Login
              </Link>
              <Link to="/register" className="bg-[#E03546] hover:bg-[#c72e3e] text-white text-sm font-medium px-5 py-2 rounded-full transition whitespace-nowrap">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-100 mt-3 px-4 md:px-8 pt-3 pb-2 flex flex-col items-start gap-3">
          {!user && guestLinks}
          {isCustomer && customerLinks}
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
};

export default Header;
