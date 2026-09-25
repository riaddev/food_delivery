import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../context/CartContext";
import { resolveAssetUrl } from "../utils/foodImages";
import CartDrawer from "./CartDrawer";
import Logo from "./Logo";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/restaurants", label: "Browse Food" },
  { to: "/customer/dashboard?tab=orders", label: "My Orders" },
  { to: "/customer/dashboard?tab=favorites", label: "Favorites" },
];

export default function StorefrontNavbar() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const canShop = !user || user.role === "customer";

  const linkCls = (active) =>
    `flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition ${
      active ? "text-[#F97316] font-semibold" : "text-zinc-600 hover:text-[#F97316]"
    }`;

  const navItems = NAV_LINKS.map((link) => (
    <Link
      key={link.to}
      to={link.to}
      onClick={() => setMobileOpen(false)}
      className={linkCls(pathname === link.to)}
    >
      {link.label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-[1000] py-3 bg-white border-b border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 flex items-center justify-between gap-5">
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 shrink-0 outline-none focus:outline-none">
          <Logo
            size={34}
            variant="color"
            swiftClassName="text-gray-900"
            biteClassName="text-[#FF6B00]"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navItems}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="lg:hidden w-[38px] h-[38px] rounded-full flex items-center justify-center text-zinc-900 hover:bg-zinc-100 transition"
          >
            {mobileOpen ? <X size={19} strokeWidth={2} /> : <Menu size={19} strokeWidth={2} />}
          </button>
          {canShop && (
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative w-[38px] h-[38px] rounded-full flex items-center justify-center text-zinc-900 hover:bg-zinc-100 transition"
            >
              <ShoppingBag size={19} strokeWidth={2} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#FF6B00] text-white text-xs font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          )}
          {user ? (
            <Link
              to="/customer/dashboard?tab=profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-full hover:bg-zinc-100 transition py-1 pl-1 pr-2"
            >
              <span className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-800 font-bold text-sm overflow-hidden shrink-0 relative">
                {(user.name || "?").charAt(0).toUpperCase()}
                {resolveAssetUrl(user.avatar_url) && (
                  <img
                    src={resolveAssetUrl(user.avatar_url)}
                    alt={user.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
              </span>
              <span className="hidden md:inline text-sm font-semibold text-gray-600">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="border-[1.5px] border-[#E5E5E5] text-zinc-900 hover:border-[#FF6B00] hover:text-[#FF6B00] px-5 py-2 rounded-[10px] text-sm font-semibold transition whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                to="/signup/customer"
                onClick={() => setMobileOpen(false)}
                className="bg-gradient-to-br from-[#FF6B00] to-[#E05500] hover:opacity-90 text-white text-sm font-bold px-5 py-2 rounded-[10px] shadow-[0_4px_16px_rgba(255,107,0,0.38)] transition whitespace-nowrap"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-zinc-100 mt-3 px-4 md:px-8 pt-3 pb-2 flex flex-col items-start gap-3 bg-white">
          {navItems}
          {!user && (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#F97316] transition"
              >
                Login
              </Link>
              <Link
                to="/signup/customer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#F97316] transition"
              >
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <Link
              to="/customer/dashboard?tab=profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#F97316] transition"
            >
              Profile
            </Link>
          )}
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}