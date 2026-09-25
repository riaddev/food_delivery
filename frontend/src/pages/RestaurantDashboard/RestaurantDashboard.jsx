import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Armchair, BarChart3, CalendarClock, ClipboardList, ExternalLink, LayoutDashboard,
  Settings, Store, UtensilsCrossed, Wallet,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { resolveAssetUrl, restaurantImage } from "../../utils/foodImages";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { key: "overview", label: "Dashboard", path: "/restaurant/dashboard", icon: LayoutDashboard, exact: true },
  { key: "orders", label: "Live Orders", path: "/restaurant/dashboard/orders", icon: ClipboardList },
  { key: "reservations", label: "Reservations", path: "/restaurant/dashboard/reservations", icon: CalendarClock },
  { key: "tables", label: "Tables", path: "/restaurant/dashboard/tables", icon: Armchair },
  { key: "menu", label: "Food Menu", path: "/restaurant/dashboard/menu", icon: UtensilsCrossed },
  { key: "expenses", label: "Expenses", path: "/restaurant/dashboard/expenses", icon: Wallet },
  { key: "profile", label: "Restaurant Profile", path: "/restaurant/dashboard/profile", icon: Store },
  { key: "analytics", label: "Analytics", path: "/restaurant/dashboard/analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", path: "/restaurant/dashboard/settings", icon: Settings },
];

const TITLES = {
  overview: { title: "Dashboard", subtitle: "Here's what's happening at your restaurant today." },
  orders: { title: "Live Orders", subtitle: "Track and update every order coming in." },
  reservations: { title: "Reservations", subtitle: "Manage table bookings for your restaurant." },
  tables: { title: "Tables", subtitle: "Manage your restaurant tables and seating capacity." },
  menu: { title: "Food Menu", subtitle: "Curate your dishes, prices and availability." },
  expenses: { title: "Expenses", subtitle: "Track rent, salaries and daily running costs." },
  profile: { title: "Restaurant Profile", subtitle: "Keep your store details up to date." },
  analytics: { title: "Analytics", subtitle: "A snapshot of how your restaurant is performing." },
  settings: { title: "Settings", subtitle: "Configure how your restaurant works." },
};

export default function RestaurantDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate("/"); };

  const restaurant = user?.restaurant || {};
  const name = restaurant.restaurant_name || user?.name || "Restaurant";
  const storedLogo = restaurant.logo_url || restaurant.logo || null;
  const logo = resolveAssetUrl(storedLogo) || restaurant.image_url || restaurant.image || restaurantImage(name);
  const [logoBroken, setLogoBroken] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLogoBroken(false);
  }, [logo]);
  const logoInitials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const activeKey = NAV_ITEMS.find((n) =>
    n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path)
  )?.key || "overview";

  const profileSection = (collapsed) =>
    collapsed ? null : (
      <div className="px-[18px] py-5 border-b border-[#1A1D27]">
        <div className="flex items-center gap-2.5">
          {!logoBroken ? (
            <img
              src={logo}
              alt=""
              className="w-[42px] h-[42px] rounded-full object-cover shrink-0 bg-[#1A1D27]"
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-[17px] shrink-0"
              style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
            >
              {logoInitials}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[#F9FAFB] font-bold text-[15px] leading-tight truncate">{name}</div>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-orange-soft bg-orange-primary/20 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-orange-primary" /> Owner
            </span>
          </div>
        </div>
      </div>
    );

  const sidebarBottom = (collapsed) =>
    collapsed ? null : (
      <Link
        to={`/restaurants/${restaurant.id || ""}`}
        className="flex items-center gap-2.5 px-[11px] py-2.5 rounded-lg no-underline text-[14px] text-[#4B5563] hover:text-[#D1D5DB] hover:bg-[#1A1D27] transition-colors duration-150"
      >
        <ExternalLink size={16} strokeWidth={1.8} />
        View live store
      </Link>
    );

  return (
    <DashboardLayout
      brandSubtitle="Restaurant"
      profileSection={profileSection}
      sidebarBottom={sidebarBottom}
      navItems={NAV_ITEMS.map((n) => ({ key: n.key, label: n.label, icon: n.icon }))}
      active={activeKey}
      onNavigate={(key) => {
        const item = NAV_ITEMS.find((n) => n.key === key);
        if (item) navigate(item.path);
      }}
      title={TITLES[activeKey].title}
      subtitle={TITLES[activeKey].subtitle}
      userName={name}
      userRole="Owner"
      userAvatar={logo || undefined}
      onLogout={handleLogout}
    >
      <Outlet />
    </DashboardLayout>
  );
}