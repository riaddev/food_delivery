import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag, Utensils, Tag, Info, User, Store, Bike,
  ClipboardList, MapPin, Heart, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";
import Logo from "./Logo";

const Header = ({ transparent = false }) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const menuRef = useRef(null);

  const overHero = transparent && !scrolled;

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

  const linkCls = overHero
    ? "text-white/85 hover:text-[#FF6B00]"
    : "text-zinc-600 hover:text-[#FF6B00]";

  const guestLinks = (
    <>
      <Link to="/restaurants" onClick={closeMobile} className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${linkCls}`}>
        <Utensils size={15} strokeWidth={2} />
        Browse Food
      </Link>
      <Link to="/restaurants?filter=offers" onClick={closeMobile} className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${linkCls}`}>
        <Tag size={15} strokeWidth={2} />
        Offers
      </Link>
      <Link to="/#about" onClick={closeMobile} className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${linkCls}`}>
        <Info size={15} strokeWidth={2} />
        About Us
      </Link>
    </>
  );

  const customerLinks = (
    <>
      <Link to="/restaurants" onClick={closeMobile} className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${linkCls}`}>
        <Utensils size={15} strokeWidth={2} />
        Browse Food
      </Link>
      <Link to="/customer/dashboard?order=1" onClick={closeMobile} className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${linkCls}`}>
        <ClipboardList size={15} strokeWidth={2} />
        My Orders
      </Link>
      <Link to="/restaurants?filter=offers" onClick={closeMobile} className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${linkCls}`}>
        <Tag size={15} strokeWidth={2} />
        Offers
      </Link>
    </>
  );

  const roleBtnCls = overHero
    ? "border-white/40 text-white hover:border-[#FF6B00] hover:text-[#FF6B00]"
    : "border-gray-300 text-gray-900 hover:border-[#FF6B00] hover:text-[#FF6B00]";

  return (
    <header className={`${transparent ? "fixed top-0 left-0 right-0" : "sticky top-0"} z-[1000] py-3 transition-all duration-300 ${
      !transparent ? "bg-white border-b border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      : scrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.08)]"
      : "bg-transparent"
    }`}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 flex items-center justify-between gap-5">
        <Link to="/" onClick={closeMobile} className="flex items-center gap-2 shrink-0 outline-none focus:outline-none">
          <Logo
            size={35}
            variant="color"
            swiftClassName={overHero ? "text-white" : "text-gray-900"}
            biteClassName="text-[#FF6B00]"
          />
        </Link>

        {!user && (
          <nav className="hidden lg:flex items-center gap-8 lg:mr-8">
            {guestLinks}
          </nav>
        )}

        {isCustomer && (
          <nav className="hidden lg:flex items-center gap-8 lg:mr-8">
            {customerLinks}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" className={`lg:hidden w-[38px] h-[38px] rounded-full flex items-center justify-center transition ${overHero ? "text-white hover:bg-white/10" : "text-zinc-900 hover:bg-zinc-100"}`}>
            {mobileOpen ? <X size={19} strokeWidth={2} /> : <Menu size={19} strokeWidth={2} />}
          </button>
          {user ? (
            <>
              {isCustomer && (
                <>
                  <button onClick={() => setCartOpen(true)} aria-label="Open cart" className={`relative w-[38px] h-[38px] rounded-full flex items-center justify-center transition ${overHero ? "text-white hover:bg-white/10" : "text-zinc-900 hover:bg-zinc-100"}`}>
                    <ShoppingBag size={19} strokeWidth={2} />
                    {itemCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-[#FF6B00] text-white text-xs font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
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
                        <Link to="/customer/dashboard?order=1" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
                          <User size={16} strokeWidth={2} />
                          My Dashboard
                        </Link>
                        <Link to="/customer/dashboard?order=1" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
                          <MapPin size={16} strokeWidth={2} />
                          My Orders
                        </Link>
                        <Link to="/customer/dashboard?order=1" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
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
                <Link to="/restaurant/dashboard" className={`bg-transparent border px-4.5 py-[9px] rounded-[10px] font-semibold text-sm hover:-translate-y-0.5 transition whitespace-nowrap ${roleBtnCls}`}>
                  Dashboard
                </Link>
              )}
              {user.role === "rider" && (
                <Link to="/rider/dashboard" className={`bg-transparent border px-4.5 py-[9px] rounded-[10px] font-semibold text-sm hover:-translate-y-0.5 transition whitespace-nowrap ${roleBtnCls}`}>
                  Rider Dashboard
                </Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin/dashboard" className={`bg-transparent border px-4.5 py-[9px] rounded-[10px] font-semibold text-sm hover:-translate-y-0.5 transition whitespace-nowrap ${roleBtnCls}`}>
                  Admin
                </Link>
              )}
              <span className={`hidden md:inline text-sm font-semibold ${overHero ? "text-white/85" : "text-gray-600"}`}>{user.name}</span>
              {user.role !== "customer" && (
                <button
                  onClick={async () => { setMobileOpen(false); await logout(); navigate("/"); }}
                  className={`bg-transparent border px-4.5 py-[9px] rounded-[10px] font-semibold text-sm hover:-translate-y-0.5 transition ${roleBtnCls}`}
                >
                  Logout
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className={`border-[1.5px] px-5 py-2 rounded-[10px] text-sm font-semibold transition whitespace-nowrap ${overHero ? "border-white/40 text-white hover:border-[#FF6B00] hover:text-[#FF6B00]" : "border-[#E5E5E5] text-zinc-900 hover:border-[#FF6B00] hover:text-[#FF6B00]"}`}>
                Login
              </Link>
              <button onClick={() => setSignupOpen(true)} className="bg-gradient-to-br from-[#FF6B00] to-[#E05500] hover:opacity-90 text-white text-sm font-bold px-5 py-2 rounded-[10px] shadow-[0_4px_16px_rgba(255,107,0,0.38)] transition whitespace-nowrap">
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-100 mt-3 px-4 md:px-8 pt-3 pb-2 flex flex-col items-start gap-3 bg-white">
          {!user && guestLinks}
          {isCustomer && customerLinks}
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {signupOpen && (
        <div
          className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSignupOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSignupOpen(false)}
              aria-label="Close sign up"
              className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
            >
              <X size={19} strokeWidth={2} />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Join Swift Bite</h2>
              <p className="text-sm text-zinc-500 mt-1">Choose your account type to get started.</p>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              <Link
                to="/signup/customer"
                onClick={() => setSignupOpen(false)}
                className="flex items-center gap-4 border border-zinc-200 rounded-2xl p-5 cursor-pointer transition-all hover:border-[#FF6B00] hover:shadow-md"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-orange-50 text-[#FF6B00]">
                  <Utensils size={22} strokeWidth={2} />
                </span>
                <span>
                  <span className="block font-bold text-zinc-900 text-lg">Customer</span>
                  <span className="block text-sm text-zinc-500">Order food and get fast delivery.</span>
                </span>
              </Link>

              <Link
                to="/signup/restaurant"
                onClick={() => setSignupOpen(false)}
                className="flex items-center gap-4 border border-zinc-200 rounded-2xl p-5 cursor-pointer transition-all hover:border-[#FF6B00] hover:shadow-md"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 text-zinc-900">
                  <Store size={22} strokeWidth={2} />
                </span>
                <span>
                  <span className="block font-bold text-zinc-900 text-lg">Restaurant Partner</span>
                  <span className="block text-sm text-zinc-500">Sell your food and grow your business.</span>
                </span>
              </Link>

              <Link
                to="/signup/rider"
                onClick={() => setSignupOpen(false)}
                className="flex items-center gap-4 border border-zinc-200 rounded-2xl p-5 cursor-pointer transition-all hover:border-[#FF6B00] hover:shadow-md"
              >
                <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                  <Bike size={22} strokeWidth={2} />
                </span>
                <span>
                  <span className="block font-bold text-zinc-900 text-lg">Rider</span>
                  <span className="block text-sm text-zinc-500">Deliver food and earn on your schedule.</span>
                </span>
              </Link>
            </div>

            <p className="text-center mt-6 text-sm text-zinc-500">
              Already have an account?{" "}
              <Link to="/login" onClick={() => setSignupOpen(false)} className="text-[#FF6B00] font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;