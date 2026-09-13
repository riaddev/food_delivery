import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Bike, CreditCard, LayoutGrid, Package, Settings as SettingsIcon, Star, Store, Users, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { adminApi } from "../../features/api/apiSlice";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import NotificationsDropdown from "./components/NotificationsDropdown";
import Overview from "./sections/Overview";
import Orders from "./sections/Orders";
import Restaurants from "./sections/Restaurants";
import Customers from "./sections/Customers";
import DeliveryAgents from "./sections/DeliveryAgents";
import Categories from "./sections/Categories";
import Reviews from "./sections/Reviews";
import Payments from "./sections/Payments";
import Analytics from "./sections/Analytics";
import Settings from "./sections/Settings";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "orders", label: "Orders", icon: Package },
  { key: "restaurants", label: "Restaurants", icon: Store },
  { key: "agents", label: "Delivery Agents", icon: Bike },
  { key: "customers", label: "Customers", icon: Users },
  { key: "categories", label: "Categories", icon: UtensilsCrossed },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const SECTIONS = {
  overview: { title: "Overview", subtitle: null },
  orders: { title: "Orders", subtitle: "Track and manage every order on the platform" },
  restaurants: { title: "Restaurants", subtitle: "Review applications and manage partner restaurants" },
  agents: { title: "Delivery Agents", subtitle: "Review rider applications and manage delivery accounts" },
  customers: { title: "Customers", subtitle: "Manage customer accounts and access" },
  categories: { title: "Categories", subtitle: "Curate how dishes are organised" },
  reviews: { title: "Reviews", subtitle: "Approve reviews and feature the best on the homepage" },
  payments: { title: "Payments", subtitle: "Transaction history across all orders" },
  analytics: { title: "Analytics", subtitle: "Orders, revenue and performance trends" },
  settings: { title: "Settings", subtitle: "Platform configuration and account" },
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in-up">
      <div className={`px-5 py-3 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center gap-2.5 ${
        toast.type === "error" ? "bg-danger text-white" : "bg-success text-white"
      }`}>
        <span className="text-sm font-semibold">{toast.msg}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("overview");
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pendingRestaurants, setPendingRestaurants] = useState(0);
  const [pendingRiders, setPendingRiders] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [shellLoading, setShellLoading] = useState(true);
  const [shellError, setShellError] = useState(false);
  const [focusOrderId, setFocusOrderId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const fetchShell = useCallback(async () => {
    setShellLoading(true);
    setShellError(false);
    try {
      const [statsRes, activityRes, pendingRestaurantsRes, pendingRidersRes, reviewsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getActivityLog(),
        adminApi.getPendingRestaurants(),
        adminApi.getPendingRiders(),
        adminApi.getReviews({ status: "pending" }).catch(() => null),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data.activity || []);
      setPendingRestaurants((pendingRestaurantsRes.data.restaurants || []).length);
      setPendingRiders((pendingRidersRes.data.riders || []).length);
      if (reviewsRes) setPendingReviews(reviewsRes.data.pending_count ?? (reviewsRes.data.reviews || []).length);
    } catch {
      setShellError(true);
    } finally {
      setShellLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchShell, 0);
    return () => window.clearTimeout(t);
  }, [fetchShell]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleViewOrder = (id) => {
    setFocusOrderId(id);
    setActive("orders");
  };

  const navItems = NAV_ITEMS.map((item) => {
    if (item.key === "orders") return { ...item, badge: stats?.active_orders || undefined };
    if (item.key === "restaurants") {
      return { ...item, badge: (stats?.pending_restaurants ?? pendingRestaurants) || undefined };
    }
    if (item.key === "agents") return { ...item, badge: (stats?.pending_riders ?? pendingRiders) || undefined };
    if (item.key === "reviews") return { ...item, badge: pendingReviews || undefined };
    return item;
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Toast toast={toast} />
      <DashboardLayout
        brandSubtitle="Admin"
        navItems={navItems}
        active={active}
        onNavigate={setActive}
        title={SECTIONS[active].title}
        subtitle={SECTIONS[active].subtitle || (active === "overview" ? today : undefined)}
        userName={user?.name || "Admin User"}
        userRole="Super Admin"
        userAvatar={user?.avatar_url}
        onLogout={handleLogout}
        topbarRight={<NotificationsDropdown onNavigate={setActive} />}
      >
        {active === "overview" && (
          <Overview
            stats={stats}
            activity={activity}
            loading={shellLoading}
            error={shellError}
            onRetry={fetchShell}
            onNavigate={setActive}
            showToast={showToast}
          />
        )}
        {active === "orders" && (
          <Orders
            focusOrderId={focusOrderId}
            onFocusHandled={() => setFocusOrderId(null)}
            onNavigate={setActive}
            showToast={showToast}
          />
        )}
        {active === "restaurants" && <Restaurants showToast={showToast} />}
        {active === "agents" && <DeliveryAgents showToast={showToast} />}
        {active === "customers" && <Customers showToast={showToast} />}
        {active === "categories" && <Categories showToast={showToast} />}
        {active === "reviews" && <Reviews showToast={showToast} />}
        {active === "payments" && <Payments onViewOrder={handleViewOrder} showToast={showToast} />}
        {active === "analytics" && <Analytics />}
        {active === "settings" && <Settings showToast={showToast} />}
      </DashboardLayout>
    </>
  );
}