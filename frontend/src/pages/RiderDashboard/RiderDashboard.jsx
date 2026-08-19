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

const bdt = (n) => `\u09F3${n.toLocaleString("en-US")}`;

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/rider/dashboard", icon: LayoutDashboard, exact: true },
];

const MOCK_REQUESTS = [
  { id: "REQ-2041", pickup: "Dhanmondi 27", dropoff: "Gulshan 2", distance: "3.5 km", payout: 60 },
  { id: "REQ-2042", pickup: "Banani 11", dropoff: "Uttara Sector 7", distance: "5.2 km", payout: 85 },
  { id: "REQ-2043", pickup: "Mirpur 10", dropoff: "Bashundhara R/A", distance: "4.1 km", payout: 70 },
];

const MAPS_MOCK_URL = "https://www.google.com/maps/dir/?api=1&destination=23.8103,90.4125";

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [online, setOnline] = useState(() => Boolean(user?.rider?.is_online));
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [earnings, setEarnings] = useState(1250);
  const [completed, setCompleted] = useState(5);

  const name = user?.name || "Rafi Ahmed";
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

  const accept = (req) => {
    setActiveOrder({ ...req, orderId: "ORD-1024", restaurant: "Chillox" });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setPickedUp(false);
  };

  const reject = (req) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const completeDelivery = () => {
    setEarnings((e) => e + (activeOrder?.payout || 0));
    setCompleted((c) => c + 1);
    setActiveOrder(null);
    setPickedUp(false);
  };

  const stats = [
    { title: "Today's Earnings", value: bdt(earnings), icon: TrendingUp, tint: "bg-emerald-50 text-emerald-600" },
    { title: "Completed Today", value: String(completed), icon: CheckCircle2, tint: "bg-sky-50 text-sky-600" },
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
          ? "You're online — new delivery requests appear below."
          : "You're offline. Go online to start receiving requests."
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
      <div className="max-w-6xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
              <p className="text-xs text-text-muted mb-4">Toggle Online to start receiving delivery requests.</p>
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
                  #{activeOrder.orderId} <span className="text-text-light font-medium">·</span>{" "}
                  <span className="text-orange-primary">{activeOrder.restaurant}</span>
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${pickedUp ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pickedUp ? "bg-emerald-500" : "bg-amber-500"}`} />
                {pickedUp ? "On the way" : "Awaiting pickup"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              <div className="bg-surface rounded-[13px] p-4 border border-border">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-8 h-8 rounded-full bg-orange-soft text-orange-deep flex items-center justify-center shrink-0">
                    <MapPin size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Step 1 · Pickup</p>
                    <p className="text-[11px] text-text-muted">{activeOrder.restaurant}</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-3">{activeOrder.pickup}</p>
                <button
                  onClick={() => setPickedUp(true)}
                  disabled={pickedUp}
                  className="w-full bg-text-primary hover:bg-black disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer font-outfit"
                >
                  {pickedUp ? "Picked Up" : "Mark as Picked Up"}
                </button>
              </div>

              <div className="bg-surface rounded-[13px] p-4 border border-border">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Home size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Step 2 · Drop-off</p>
                    <p className="text-[11px] text-text-muted">Customer</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-3">{activeOrder.dropoff}</p>
                <button
                  onClick={completeDelivery}
                  disabled={!pickedUp}
                  className="w-full bg-zinc-300 text-zinc-500 disabled:cursor-not-allowed enabled:bg-text-primary enabled:hover:bg-black enabled:text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer font-outfit"
                >
                  Mark as Delivered
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border bg-surface/60">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-text-muted">Distance <b className="text-text-primary">{activeOrder.distance}</b></span>
                <span className="text-text-muted">Payout <b className="text-emerald-600 font-mono">{formatPrice(activeOrder.payout)}</b></span>
              </div>
              <a
                href={MAPS_MOCK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-orange-primary hover:bg-orange-deep text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors font-outfit"
              >
                <Navigation size={14} />
                Navigate
              </a>
            </div>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-text-primary">New Delivery Requests</h2>
              {requests.length > 0 && (
                <span className="text-xs font-semibold text-text-muted">{requests.length} available</span>
              )}
            </div>

            {requests.length === 0 ? (
              <div className="bg-card rounded-[13px] border border-border">
                <div className="px-5 py-16 text-center">
                  <div className="w-11 h-11 mx-auto rounded-full bg-orange-soft flex items-center justify-center text-orange-deep mb-3">
                    <Bike size={19} />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">No delivery requests</p>
                  <p className="text-xs text-text-muted">New requests will appear here as restaurants confirm orders.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {requests.map((req) => (
                  <div key={req.id} className="bg-card rounded-[13px] border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold tracking-widest uppercase text-text-light font-mono">{req.id}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-mono">
                        <TrendingUp size={12} />
                        {formatPrice(req.payout)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface rounded-xl p-3 border border-border">
                        <p className="text-[11px] font-semibold text-text-light mb-1 flex items-center gap-1">
                          <MapPin size={11} className="text-orange-primary" /> Pickup
                        </p>
                        <p className="text-xs font-medium text-text-primary">{req.pickup}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-border">
                        <p className="text-[11px] font-semibold text-text-light mb-1 flex items-center gap-1">
                          <Home size={11} className="text-sky-600" /> Drop-off
                        </p>
                        <p className="text-xs font-medium text-text-primary">{req.dropoff}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                        <Navigation size={12} className="text-text-light" /> {req.distance}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(req)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer font-outfit"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => accept(req)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-orange-primary hover:bg-orange-deep text-white transition-colors cursor-pointer font-outfit"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}