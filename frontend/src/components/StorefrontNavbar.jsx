import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/restaurants", label: "Browse Food" },
  { to: "/customer/dashboard?tab=orders", label: "My Orders" },
  { to: "/customer/dashboard?tab=favorites", label: "Favorites" },
];

export default function StorefrontNavbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-extrabold text-[19px] tracking-tight shrink-0">
          <span className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-[#FF8C00] to-[#FF6B00] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(255,107,0,0.4)]">
            <UtensilsCrossed size={16} strokeWidth={2.2} />
          </span>
          <span className="text-gray-900">Swift</span>
          <span className="text-[#FF6B00]">Bite</span>
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
          {user ? (
            <Link
              to="/customer/dashboard?tab=profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-full hover:bg-zinc-100 transition py-1 pl-1 pr-2"
            >
              <span className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-800 font-bold text-sm overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  (user.name || "?").charAt(0).toUpperCase()
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
    </header>
  );
}