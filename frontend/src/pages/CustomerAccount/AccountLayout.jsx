import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Heart, MapPin, User, Lock, LogOut, ShoppingBag, Menu, X } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useCart } from "../../context/CartContext";

const navItems = [
  { label: "Dashboard", path: "/customer/account", icon: LayoutDashboard },
  { label: "My Orders", path: "/customer/account/orders", icon: ClipboardList },
  { label: "Wishlist", path: "/customer/account/wishlist", icon: Heart },
  { label: "Saved Addresses", path: "/customer/account/addresses", icon: MapPin },
  { label: "Profile", path: "/customer/account/profile", icon: User },
  { label: "Change Password", path: "/customer/account/change-password", icon: Lock },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = (user?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FA] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-zinc-900 z-40 flex flex-col shrink-0 border-r border-zinc-800 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between px-6 pt-7 pb-6">
          <Link to="/" className="flex items-center gap-2.5 text-xl tracking-tight font-bold text-[#E03546]">
            <span className="w-9 h-9 rounded-lg bg-[#E03546] flex items-center justify-center text-white">
              <ShoppingBag size={18} strokeWidth={2} />
            </span>
            Swift<span className="text-white">Bite</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="mx-5 mb-6 rounded-xl bg-zinc-800/60 p-4 flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#E03546] to-rose-500 p-[2px]">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center font-semibold text-white text-sm">
                  {initials}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white text-sm truncate">{user?.name}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-200 bg-amber-400/10 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-amber-300" /> Gold Member
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/customer/account"
              ? location.pathname === "/customer/account"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-zinc-100/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E03546]" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800 space-y-0.5">
          <Link to="/restaurants" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors duration-150">
            <ShoppingBag size={17} strokeWidth={2} />
            Browse Restaurants
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-[#FFB0B5] hover:bg-[#E03546]/10 transition-colors duration-150"
          >
            <LogOut size={17} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-[#F8F9FA]/80 backdrop-blur-md border-b border-zinc-100 px-4 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-700 bg-white w-10 h-10 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-center">
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {itemCount > 0 && (
              <Link
                to="/checkout"
                className="relative w-10 h-10 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-center text-zinc-700 hover:text-[#E03546] transition-colors"
              >
                <ShoppingBag size={18} />
                <span className="absolute -top-1 -right-1 bg-[#E03546] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              </Link>
            )}
            <Link
              to="/restaurants"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <ShoppingBag size={15} className="text-[#E03546]" />
              Browse Restaurants
            </Link>
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E03546] to-rose-500 p-[2px]">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#E03546]">
                    {initials}
                  </div>
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-zinc-900">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}