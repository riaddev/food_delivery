import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ExternalLink,
  TrendingUp, CheckCircle2, Bike, MapPin, Home, Navigation, Zap,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { authApi, riderApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/rider/dashboard", icon: LayoutDashboard, exact: true },
];

const KITCHEN_STATUS_LABEL = {
  assigned: "Rider Assigned",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
};

const mapsUrl = (destination) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || "")}`;

const assignmentWhen = (o) => {
  const start = new Date(`${String(o.created_at).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [online, setOnline] = useState(() => Boolean(user?.rider?.is_online));
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState(null);

  const name = user?.name || "Rider";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = async () => { await logout(); navigate("/"); };

  useEffect(() => {
    let mounted = true;
    authApi
      .user()
      .then((res) => {
        if (mounted) setOnline(Boolean(res.data?.rider?.is_online));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const loadOrders = () => {
    riderApi.getOrders()
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const toggleOnline = async (value) => {
    if (onlineBusy || value === online) return;
    setOnlineBusy(true);
    setOnline(value);
    try {
      await riderApi.setAvailability(value);
    } catch {
      setOnline((prev) => !prev);
    } finally {
      setOnlineBusy(false);
    }
  };

  const runAction = async (orderId, action) => {
    setActionBusyId(orderId);
    try {
      await action();
      await riderApi.getOrders().then((res) => setOrders(res.data.orders || []));
    } catch {
      /* keep previous state; error surfaces next reload */
    } finally {
      setActionBusyId(null);
    }
  };

  const accept = (order) => runAction(order.id, () => riderApi.acceptOrder(order.id));
  const markPickedUp = (order) => runAction(order.id, () => riderApi.updateOrderStatus(order.id, "picked_up"));
  const startDelivery = (order) => runAction(order.id, () => riderApi.updateOrderStatus(order.id, "on_the_way"));
  const completeDelivery = (order) => runAction(order.id, () => riderApi.updateOrderStatus(order.id, "delivered"));

  const requests = orders.filter(
    (o) => !o.accepted_at && ["assigned"].includes(o.status)
  );
  const activeOrder =
    orders.find(
      (o) => o.accepted_at && !["delivered", "cancelled"].includes(o.status)
    ) || null;

  const todayKey = new Date().toDateString();
  const todaysDelivered = orders.filter(
    (o) => o.delivered_at && new Date(o.delivered_at).toDateString() === todayKey
  );
  const earningsToday = todaysDelivered.reduce(
    (sum, o) => sum + Number(o.delivery_fee || 0),
    0
  );

  const stats = [
    { title: "Today's Earnings", value: formatPrice(earningsToday), icon: TrendingUp, tint: "bg-emerald-50 text-emerald-600" },
    { title: "Completed Today", value: String(todaysDelivered.length), icon: CheckCircle2, tint: "bg-sky-50 text-sky-600" },
    { title: "Active Order", value: activeOrder ? "1" : "0", icon: Bike, tint: "bg-orange-soft text-orange-deep" },
  ];

  const profileSection = (collapsed) =>
    collapsed ? null : (
      <div className="px-[18px] py-5 border-b border-[#1A1D27]">
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[#F9FAFB] font-bold text-[15px] leading-tight truncate">{name}</div>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-emerald-400" /> Rider
            </span>
          </div>
        </div>
      </div>
    );

  const sidebarBottom = (collapsed) =>
    collapsed ? null : (
      <Link
        to="/"
        className="flex items-center gap-2.5 px-[11px] py-2.5 rounded-lg no-underline text-[14px] text-[#4B5563] hover:text-[#D1D5DB] hover:bg-[#1A1D27] transition-colors duration-150"
      >
        <ExternalLink size={16} strokeWidth={1.8} />
        View site
      </Link>
    );

  return (
    <DashboardLayout
      brandSubtitle="Rider"
      profileSection={profileSection}
      sidebarBottom={sidebarBottom}
      navItems={NAV_ITEMS.map((n) => ({ key: n.key, label: n.label, icon: n.icon }))}
      active="dashboard"
      onNavigate={() => {}}
      title="Rider Dashboard"
      subtitle={
        online
          ? "You're online — new delivery assignments appear below."
          : "You're offline. Go online to start receiving deliveries."
      }
      userName={name}
      userRole="Rider"
      onLogout={handleLogout}
      topbarRight={
        <div className="flex items-center gap-2">
          <span className={`hidden sm:inline text-sm font-semibold ${online ? "text-emerald-600" : "text-text-muted"}`}>
            {online ? "Online" : "Offline"}
          </span>
          <div className="flex items-center rounded-full bg-zinc-200/80 p-1">
            <button
              onClick={() => toggleOnline(true)}
              disabled={onlineBusy}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer font-outfit disabled:opacity-50 ${online ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Online
            </button>
            <button
              onClick={() => toggleOnline(false)}
              disabled={onlineBusy}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer font-outfit disabled:opacity-50 ${!online ? "bg-zinc-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Offline
            </button>
          </div>
        </div>
      }
    >
      <div className="max-w-6xl">
        {loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-[13px] border border-border p-5 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 mb-3" />
                  <div className="h-3 bg-zinc-100 rounded w-24 mb-2" />
                  <div className="h-5 bg-zinc-100 rounded w-16" />
                </div>
              ))}
            </div>
            <div className="bg-card rounded-[13px] border border-border h-40 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="bg-card rounded-[13px] border border-border p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.tint}`}>
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-text-light truncate">{s.title}</p>
                        <p className="text-xl font-bold font-mono tracking-tight text-text-primary mt-1 leading-tight">{s.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!online ? (
              <section className="bg-card rounded-[13px] border border-border">
                <div className="px-5 py-16 text-center">
                  <div className="w-11 h-11 mx-auto rounded-full bg-orange-soft flex items-center justify-center text-orange-deep mb-3">
                    <Zap size={19} />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">You're offline</p>
                  <p className="text-xs text-text-muted mb-4">Toggle Online to start receiving delivery assignments.</p>
                  <button
                    onClick={() => toggleOnline(true)}
                    disabled={onlineBusy}
                    className="inline-flex items-center gap-1.5 bg-orange-primary hover:bg-orange-deep text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer font-outfit disabled:opacity-50"
                  >
                    Go Online
                  </button>
                </div>
              </section>
            ) : activeOrder ? (
              <section className="bg-card rounded-[13px] border border-border overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-text-light">Active Delivery</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">
                      #{activeOrder.id} <span className="text-text-light font-medium">·</span>{" "}
                      <span className="text-orange-primary">{activeOrder.restaurant?.name || "Restaurant"}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
                    activeOrder.status === "picked_up" ? "bg-sky-50 text-sky-700"
                      : activeOrder.status === "on_the_way" ? "bg-indigo-50 text-indigo-700"
                        : activeOrder.status === "assigned" ? "bg-violet-50 text-violet-700"
                          : "bg-amber-50 text-amber-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activeOrder.status === "picked_up" ? "bg-sky-500"
                        : activeOrder.status === "on_the_way" ? "bg-indigo-500"
                          : activeOrder.status === "assigned" ? "bg-violet-500"
                            : "bg-amber-500"
                    }`} />
                    {activeOrder.status === "picked_up" ? "Picked up"
                      : activeOrder.status === "on_the_way" ? "On the way"
                        : activeOrder.status === "assigned" ? "Assigned"
                          : "Awaiting pickup"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                  <div className="bg-surface rounded-[13px] p-4 border border-border">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-8 h-8 rounded-full bg-orange-soft text-orange-deep flex items-center justify-center shrink-0">
                        <MapPin size={15} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">Pickup</p>
                        <p className="text-[11px] text-text-muted truncate">{activeOrder.restaurant?.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mb-3">{activeOrder.restaurant?.address || "—"}</p>

                    {activeOrder.status !== "ready" && activeOrder.status !== "picked_up" && activeOrder.status !== "on_the_way" && activeOrder.status !== "assigned" ? (
                      <>
                        <button
                          disabled
                          className="w-full bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg cursor-not-allowed font-outfit"
                        >
                          Mark as Picked Up
                        </button>
                        <p className="text-[11px] text-text-muted text-center mt-2 m-0">
                          Waiting for {activeOrder.restaurant?.name} — kitchen status:{" "}
                          <b className="text-text-primary">{KITCHEN_STATUS_LABEL[activeOrder.status] || activeOrder.status}</b>
                        </p>
                      </>
                    ) : activeOrder.status === "assigned" || activeOrder.status === "ready" ? (
                      <button
                        onClick={() => markPickedUp(activeOrder)}
                        disabled={actionBusyId === activeOrder.id}
                        className="w-full bg-text-primary hover:bg-black disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Mark as Picked Up"}
                      </button>
                    ) : null}

                    {activeOrder.items?.length > 0 && (
                      <p className="text-[11px] text-text-muted mt-3 mb-0 truncate">
                        {activeOrder.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="bg-surface rounded-[13px] p-4 border border-border">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <Home size={15} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">Drop-off</p>
                        <p className="text-[11px] text-text-muted truncate">{activeOrder.customer_name || "Customer"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mb-3">{activeOrder.delivery_address || "—"}</p>

                    {activeOrder.status === "picked_up" ? (
                      <button
                        onClick={() => startDelivery(activeOrder)}
                        disabled={actionBusyId === activeOrder.id}
                        className="w-full bg-text-primary hover:bg-black disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Start Delivery"}
                      </button>
                    ) : activeOrder.status === "on_the_way" ? (
                      <button
                        onClick={() => completeDelivery(activeOrder)}
                        disabled={actionBusyId === activeOrder.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Mark as Delivered"}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-zinc-300 text-zinc-500 disabled:cursor-not-allowed text-xs font-bold py-2.5 rounded-lg cursor-not-allowed font-outfit"
                      >
                        Mark as Delivered
                      </button>
                    )}

                    {activeOrder.delivery_instructions && (
                      <p className="text-[11px] text-text-muted mt-3 mb-0 italic">"{activeOrder.delivery_instructions}"</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border bg-surface/60">
                  <span className="text-xs text-text-muted">
                    Payout <b className="text-emerald-600 font-mono">{formatPrice(Number(activeOrder.delivery_fee || 0))}</b>
                  </span>
                  <a
                    href={mapsUrl(activeOrder.restaurant?.address || activeOrder.delivery_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-orange-primary hover:bg-orange-deep text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors font-outfit no-underline"
                  >
                    <Navigation size={14} />
                    Navigate
                  </a>
                </div>
              </section>
            ) : (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-bold text-text-primary">New Delivery Assignments</h2>
                  {requests.length > 0 && (
                    <span className="text-xs font-semibold text-text-muted">{requests.length} waiting</span>
                  )}
                </div>

                {requests.length === 0 ? (
                  <div className="bg-card rounded-[13px] border border-border">
                    <div className="px-5 py-16 text-center">
                      <div className="w-11 h-11 mx-auto rounded-full bg-orange-soft flex items-center justify-center text-orange-deep mb-3">
                        <Bike size={19} />
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">No delivery assignments</p>
                      <p className="text-xs text-text-muted">New assignments will appear here once an admin assigns you.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {requests.map((order) => (
                      <div key={order.id} className="bg-card rounded-[13px] border border-border p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold tracking-widest uppercase text-text-light font-mono">
                            #{order.id}{assignmentWhen(order) ? ` · ${assignmentWhen(order)}` : ""}
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-mono">
                            <TrendingUp size={12} />
                            {formatPrice(Number(order.delivery_fee || 0))}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-surface rounded-xl p-3 border border-border min-w-0">
                            <p className="text-[11px] font-semibold text-text-light mb-1 flex items-center gap-1">
                              <MapPin size={11} className="text-orange-primary" /> Pickup ·{" "}
                              <span className="truncate normal-case">{KITCHEN_STATUS_LABEL[order.status] || order.status}</span>
                            </p>
                            <p className="text-xs font-medium text-text-primary truncate">{order.restaurant?.name}</p>
                            <p className="text-[11px] text-text-muted truncate">{order.restaurant?.address}</p>
                          </div>
                          <div className="bg-surface rounded-xl p-3 border border-border min-w-0">
                            <p className="text-[11px] font-semibold text-text-light mb-1 flex items-center gap-1">
                              <Home size={11} className="text-sky-600" /> Drop-off
                            </p>
                            <p className="text-xs font-medium text-text-primary truncate">{order.customer_name || "Customer"}</p>
                            <p className="text-[11px] text-text-muted truncate">{order.delivery_address}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={mapsUrl(order.restaurant?.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-orange-primary transition-colors no-underline"
                          >
                            <Navigation size={12} /> Map
                          </a>
                          <button
                            onClick={() => accept(order)}
                            disabled={actionBusyId === order.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-primary hover:bg-orange-deep text-white transition-colors cursor-pointer font-outfit disabled:opacity-50"
                          >
                            {actionBusyId === order.id ? "Accepting..." : "Accept Delivery"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
