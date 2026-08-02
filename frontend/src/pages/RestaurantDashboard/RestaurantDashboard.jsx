import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, Store,
  BarChart3, Settings, LogOut, ShoppingBag, Menu, X, ExternalLink,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { restaurantImage } from "../../utils/foodImages";

const navItems = [
  { label: "Dashboard", path: "/restaurant/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Live Orders", path: "/restaurant/dashboard/orders", icon: ClipboardList },
  { label: "Food Menu", path: "/restaurant/dashboard/menu", icon: UtensilsCrossed },
  { label: "Restaurant Profile", path: "/restaurant/dashboard/profile", icon: Store },
  { label: "Analytics", path: "/restaurant/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", path: "/restaurant/dashboard/settings", icon: Settings },
];

export default function RestaurantDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const restaurant = user?.restaurant || {};
  const name = restaurant.restaurant_name || user?.name || "Restaurant";
  const initials = (name || "R").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const logo = restaurant.image || restaurantImage(name);

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
              <img src={logo} onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.classList.add("bg-zinc-800"); }} alt="" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white text-sm truncate">{name}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-[#FFB0B5] bg-[#E03546]/20 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-[#FF8A90]" /> Owner
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive ? "bg-zinc-100/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
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
          <Link
            to={`/restaurants/${restaurant.id || ""}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors duration-150"
          >
            <ExternalLink size={17} strokeWidth={2} />
            View live store
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
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-700 bg-white w-10 h-10 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center">
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-4 py-2 rounded-lg hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
              <ExternalLink size={15} className="text-[#E03546]" />
              View site
            </Link>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E03546] to-rose-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#E03546]">
                {initials}
              </div>
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