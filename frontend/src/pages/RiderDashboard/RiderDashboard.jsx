import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ExternalLink, CheckCircle2,
  TrendingUp, Bike, MapPin, Home, Navigation, Zap, Package, Radio, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { authApi, riderApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

const GPS_STATUSES = ["picked_up", "on_the_way", "near_customer"];

const GPS_ERROR_MESSAGES = {
  1: "Location permission denied. Please enable it in browser settings.",
  2: "Location unavailable. Please check your device settings.",
  3: "Location request timed out. Retrying...",
};

const getGpsErrorMessage = (err) => {
  if (typeof err === "string") return err;
  return GPS_ERROR_MESSAGES[err?.code] || "Unable to get location";
};

// Distance in meters between two lat/lng pairs (haversine). Free, no API.
const gpsDistanceM = (aLat, aLng, bLat, bLng) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Throttle GPS posts: send at most every 5s unless rider moved >15m.
// Keeps near-realtime feel without spamming the free backend.
const GPS_MIN_INTERVAL_MS = 5000;
const GPS_MIN_DISTANCE_M = 15;

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", path: "/rider/dashboard", icon: LayoutDashboard, exact: true },
];

const KITCHEN_STATUS_LABEL = {
  assigned: "Rider Assigned",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for pickup",
};

const DELIVERY_STEPS = [
  { status: "assigned", label: "Rider Assigned", icon: Bike },
  { status: "picked_up", label: "Picked Up", icon: Package },
  { status: "on_the_way", label: "Out for Delivery", icon: Navigation },
  { status: "near_customer", label: "Near Customer", icon: MapPin },
  { status: "served", label: "Served", icon: CheckCircle2 },
  { status: "delivered", label: "Delivered", icon: Home },
];

const mapsUrl = (destination) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination || "")}`;

const assignmentWhen = (o) => {
  const start = new Date(`${String(o.created_at).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Free ding using WebAudio — no audio file needed. Rings on new assignments.
const playDing = (audioRef) => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioRef.current = audioRef.current || new Ctx();
    const ctx = audioRef.current;
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.45);
  } catch {
    /* audio not available — silent */
  }
};

export default function RiderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [online, setOnline] = useState(() => Boolean(user?.rider?.is_online));
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsPermissionState, setGpsPermissionState] = useState("unknown");
  const [muted, setMuted] = useState(false);
  const watchIdRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const requestGpsRef = useRef(null);
  const lastSentRef = useRef(null); // { lat, lng, at } — throttle, no fake coords
  const prevRequestsRef = useRef(null); // null = first load, no ding yet
  const audioRef = useRef(null);
  const mutedRef = useRef(false);
  const gpsFailRef = useRef(0);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

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
      .then((res) => {
        const list = res.data.orders || [];
        setOrders(list);
        // Ding only when a NEW assignment appears after first load.
        const reqIds = new Set(
          list.filter((o) => !o.accepted_at && ["assigned"].includes(o.status)).map((o) => o.id)
        );
        if (prevRequestsRef.current && !mutedRef.current) {
          const isNew = [...reqIds].some((id) => !prevRequestsRef.current.has(id));
          if (isNew) playDing(audioRef);
        }
        prevRequestsRef.current = reqIds;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  // Auto-refresh assignments every 15s while online with no active delivery.
  // Pauses when tab hidden; cleaned up on unmount or when a delivery starts.
  const hasActiveDelivery = orders.some(
    (o) => o.accepted_at && !["delivered", "cancelled"].includes(o.status)
  );
  useEffect(() => {
    if (!online || hasActiveDelivery) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      loadOrders();
    }, 15000);
    return () => clearInterval(t);
  }, [online, hasActiveDelivery]);

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

  const [earningPeriod, setEarningPeriod] = useState("all");
  const [earnings, setEarnings] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState(false);
  const [earningsReloadKey, setEarningsReloadKey] = useState(0);

  const runAction = async (orderId, action) => {
    setActionBusyId(orderId);
    try {
      await action();
      try { navigator.vibrate?.(50); } catch { /* vibration optional */ }
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
  const markNearCustomer = (order) => runAction(order.id, () => riderApi.updateOrderStatus(order.id, "near_customer"));
  const markServed = (order) => runAction(order.id, () => riderApi.updateOrderStatus(order.id, "served"));
  const completeDelivery = (order) =>
    runAction(order.id, () => riderApi.updateOrderStatus(order.id, "delivered"))
      .then(() => setEarningsReloadKey((k) => k + 1));

  const loadEarnings = useCallback((period) => {
    riderApi.getEarnings({ period, limit: 100 })
      .then((res) => {
        setEarnings({ summary: res.data.summary || null, entries: res.data.entries || [] });
        setEarningsError(false);
      })
      .catch(() => setEarningsError(true))
      .finally(() => setEarningsLoading(false));
  }, []);

  useEffect(() => {
    loadEarnings(earningPeriod);
  }, [earningPeriod, earningsReloadKey, loadEarnings]);

  const EARNING_PERIODS = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "all", label: "All time" },
  ];

  const earningWhen = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  };

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

  const sendLocation = useCallback(async (orderId, position) => {
    const { latitude, longitude, heading, speed } = position.coords;
    // Skip invalid fixes — never send fake coordinates.
    if (
      typeof latitude !== "number" || typeof longitude !== "number" ||
      Number.isNaN(latitude) || Number.isNaN(longitude)
    ) {
      return;
    }
    // Throttle: skip if barely moved and sent very recently.
    const now = Date.now();
    const last = lastSentRef.current;
    if (last) {
      const moved = gpsDistanceM(last.lat, last.lng, latitude, longitude);
      const elapsed = now - last.at;
      if (moved < GPS_MIN_DISTANCE_M && elapsed < GPS_MIN_INTERVAL_MS) return;
    }
    lastSentRef.current = { lat: latitude, lng: longitude, at: now };
    const payload = {
      order_id: orderId,
      latitude,
      longitude,
      heading: typeof heading === "number" ? heading : null,
      speed: typeof speed === "number" ? speed : null,
    };
    try {
      await riderApi.updateLocation(payload);
      gpsFailRef.current = 0;
      setGpsError(null);
    } catch (err) {
      gpsFailRef.current += 1;
      const n = gpsFailRef.current;
      const offline = !err?.response;
      setGpsError(
        offline
          ? `No connection — retrying… (${n} failed). Keeping last position, will keep trying.`
          : (err?.response?.data?.message || `Failed to send location (${n} failed) — will keep trying.`)
      );
    }
  }, []);

  const cleanupGps = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    lastSentRef.current = null;
    gpsFailRef.current = 0;
    setGpsActive(false);
  }, []);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setGpsPermissionState("unknown");
      return "unknown";
    }
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setGpsPermissionState(result.state);
      result.addEventListener("change", () => {
        setGpsPermissionState(result.state);
      });
      return result.state;
    } catch {
      setGpsPermissionState("unknown");
      return "unknown";
    }
  }, []);

  const requestGps = useCallback(
    async (orderId, retryCount = 0) => {
      cleanupGps();

      if (!navigator.geolocation) {
        setGpsError("Geolocation not supported by your browser");
        return;
      }

      const permissionState = await checkPermission();
      if (permissionState === "denied") {
        setGpsError("Location permission denied. Please enable it in browser settings.");
        setGpsPermissionState("denied");
        return;
      }

      const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendLocation(orderId, position);
          setGpsError(null);

          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => sendLocation(orderId, pos),
            (err) => {
              if (err.code === 1) {
                setGpsError(getGpsErrorMessage(err));
                setGpsPermissionState("denied");
                cleanupGps();
              } else if (err.code === 3 && retryCount < 3) {
                retryTimeoutRef.current = setTimeout(() => {
                  requestGpsRef.current?.(orderId, retryCount + 1);
                }, 2000);
              } else {
                setGpsError(getGpsErrorMessage(err));
              }
            },
            options
          );

          setGpsActive(true);
          setGpsPermissionState("granted");
        },
        (err) => {
          if (err.code === 1) {
            setGpsError(getGpsErrorMessage(err));
            setGpsPermissionState("denied");
          } else if (retryCount < 2) {
            setGpsError("Retrying location access...");
            retryTimeoutRef.current = setTimeout(() => {
              requestGpsRef.current?.(orderId, retryCount + 1);
            }, 2000);
          } else {
            setGpsError(getGpsErrorMessage(err));
          }
        },
        options
      );
    },
    [cleanupGps, checkPermission, sendLocation]
  );

  useEffect(() => {
    requestGpsRef.current = requestGps;
  });

  // GPS subscription: (re)starts watchPosition when the active delivery enters a
  // transit status, stops otherwise. Synchronous indicator reset is intentional.
  // Object dep narrowed to id/status primitives — full 'activeOrder' would
  // churn watchPosition on every poll-driven object change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cleanupGps();
    setGpsError(null);

    if (!activeOrder || !GPS_STATUSES.includes(activeOrder.status)) {
      return;
    }

    requestGps(activeOrder.id);

    return () => {
      cleanupGps();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- narrow deps intentional (see above)
  }, [activeOrder?.id, activeOrder?.status, requestGps, cleanupGps]);

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
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer font-outfit disabled:opacity-50 ${online ? "bg-emerald-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Online
            </button>
            <button
              onClick={() => toggleOnline(false)}
              disabled={onlineBusy}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer font-outfit disabled:opacity-50 ${!online ? "bg-zinc-500 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
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
                        : activeOrder.status === "near_customer" ? "bg-amber-50 text-amber-700"
                          : activeOrder.status === "served" ? "bg-emerald-50 text-emerald-700"
                            : activeOrder.status === "assigned" ? "bg-violet-50 text-violet-700"
                              : "bg-amber-50 text-amber-700"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activeOrder.status === "picked_up" ? "bg-sky-500"
                        : activeOrder.status === "on_the_way" ? "bg-indigo-500"
                          : activeOrder.status === "near_customer" ? "bg-amber-500"
                            : activeOrder.status === "served" ? "bg-emerald-500"
                              : activeOrder.status === "assigned" ? "bg-violet-500"
                                : "bg-amber-500"
                    }`} />
                    {activeOrder.status === "picked_up" ? "Picked up"
                      : activeOrder.status === "on_the_way" ? "Out for Delivery"
                        : activeOrder.status === "near_customer" ? "Near Customer"
                          : activeOrder.status === "served" ? "Served"
                            : activeOrder.status === "assigned" ? "Assigned"
                              : "Awaiting pickup"}
                  </span>
                  {gpsActive && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                      <Radio size={12} className="animate-pulse" />
                      GPS Active
                    </span>
                  )}
                  {gpsError && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                      {gpsError}
                      {gpsPermissionState === "denied" && (
                        <button
                          onClick={() => requestGps(activeOrder.id)}
                          className="ml-1 p-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Retry GPS permission"
                        >
                          <RefreshCw size={11} />
                        </button>
                      )}
                    </span>
                  )}
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

                    {activeOrder.status !== "ready" && activeOrder.status !== "picked_up" && activeOrder.status !== "on_the_way" && activeOrder.status !== "assigned" && activeOrder.status !== "near_customer" ? (
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
                        className="w-full min-h-[48px] bg-text-primary hover:bg-black disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-lg transition-colors cursor-pointer font-outfit"
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
                        className="w-full min-h-[48px] bg-text-primary hover:bg-black disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Start Delivery"}
                      </button>
                    ) : activeOrder.status === "on_the_way" ? (
                      <button
                        onClick={() => markNearCustomer(activeOrder)}
                        disabled={actionBusyId === activeOrder.id}
                        className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Near Customer"}
                      </button>
                    ) : activeOrder.status === "near_customer" ? (
                      <button
                        onClick={() => markServed(activeOrder)}
                        disabled={actionBusyId === activeOrder.id}
                        className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Mark as Served"}
                      </button>
                    ) : activeOrder.status === "served" ? (
                      <button
                        onClick={() => completeDelivery(activeOrder)}
                        disabled={actionBusyId === activeOrder.id}
                        className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-lg transition-colors cursor-pointer font-outfit"
                      >
                        {actionBusyId === activeOrder.id ? "Updating..." : "Mark as Delivered"}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full min-h-[48px] bg-zinc-300 text-zinc-500 disabled:cursor-not-allowed text-sm font-bold py-3 rounded-lg cursor-not-allowed font-outfit"
                      >
                        Mark as Delivered
                      </button>
                    )}

                    {activeOrder.delivery_instructions && (
                      <p className="text-[11px] text-text-muted mt-3 mb-0 italic">"{activeOrder.delivery_instructions}"</p>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-border">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-text-light mb-3">Delivery Progress</p>
                  <div className="flex items-start gap-0 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {DELIVERY_STEPS.map((step, i) => {
                      const stepIdx = (() => {
                        const order = ["assigned", "picked_up", "on_the_way", "near_customer", "served", "delivered"];
                        return order.indexOf(activeOrder.status);
                      })();
                      const currentIdx = (() => {
                        const order = ["assigned", "picked_up", "on_the_way", "near_customer", "served", "delivered"];
                        return order.indexOf(step.status);
                      })();
                      const isCompleted = currentIdx < stepIdx;
                      const isActive = step.status === activeOrder.status;
                      const Icon = step.icon;
                      return (
                        <div key={step.status} className="flex items-center flex-1 last:flex-initial min-w-[64px]">
                          <div className="flex flex-col items-center min-w-[52px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isCompleted ? "bg-emerald-100 text-emerald-600"
                                : isActive ? "bg-orange-100 text-orange-deep"
                                  : "bg-zinc-100 text-zinc-400"
                            }`}>
                              {isCompleted ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                            </div>
                            <p className={`text-[10px] font-medium mt-1.5 text-center leading-tight ${
                              isCompleted ? "text-emerald-600" : isActive ? "text-orange-deep font-semibold" : "text-text-light"
                            }`}>
                              {step.label}
                            </p>
                          </div>
                          {i < DELIVERY_STEPS.length - 1 && (
                            <div className={`flex-1 min-w-[8px] h-[2px] mx-1 mt-[-18px] rounded-full ${
                              currentIdx > i ? "bg-emerald-300" : "bg-zinc-200"
                            }`} />
                          )}
                        </div>
                      );
                    })}
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
                  <div className="flex items-center gap-2">
                    {requests.length > 0 && (
                      <span className="text-xs font-semibold text-text-muted">{requests.length} waiting</span>
                    )}
                    <button
                      onClick={() => setMuted((m) => !m)}
                      title={muted ? "Turn sound on" : "Mute sound"}
                      className="text-[11px] font-semibold text-text-muted hover:text-text-primary border border-border rounded-md px-2 py-1 cursor-pointer"
                    >
                      {muted ? "Muted" : "Sound on"}
                    </button>
                  </div>
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
                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 mb-4">
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
                            className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-orange-primary hover:bg-orange-deep text-white transition-colors cursor-pointer font-outfit disabled:opacity-50"
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

            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-[15px] font-bold text-text-primary">Earnings History</h2>
                <div className="flex items-center gap-1 bg-zinc-100 rounded-full p-1">
                  {EARNING_PERIODS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setEarningsLoading(true); setEarningsError(false); setEarningPeriod(p.id); }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer font-outfit ${
                        earningPeriod === p.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {earningsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-[13px] border border-border p-5 animate-pulse">
                      <div className="h-3 bg-zinc-100 rounded w-20 mb-2" />
                      <div className="h-5 bg-zinc-100 rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : earningsError || !earnings ? (
                <div className="bg-card rounded-[13px] border border-border px-5 py-10 text-center">
                  <p className="text-sm font-medium text-text-primary mb-1">Couldn't load earnings</p>
                  <p className="text-xs text-text-muted mb-4">Check your connection and try again.</p>
                  <button
                    onClick={() => { setEarningsLoading(true); setEarningsError(false); setEarningsReloadKey((k) => k + 1); }}
                    className="text-xs font-bold text-orange-primary hover:underline cursor-pointer font-outfit"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                    {EARNING_PERIODS.map((p) => {
                      const bucket = earnings.summary?.[p.id] || { earnings: 0, deliveries: 0 };
                      const isActive = earningPeriod === p.id;
                      return (
                        <div
                          key={p.id}
                          className={`bg-card rounded-[13px] border p-5 transition-colors ${isActive ? "border-orange-primary" : "border-border"}`}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-text-light">{p.label}</p>
                          <p className="text-xl font-bold font-mono tracking-tight text-emerald-600 mt-1 leading-tight">
                            {formatPrice(bucket.earnings)}
                          </p>
                          <p className="text-[11px] text-text-muted mt-1">
                            {bucket.deliveries} {bucket.deliveries === 1 ? "delivery" : "deliveries"}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {(earnings.entries || []).length === 0 ? (
                    <div className="bg-card rounded-[13px] border border-border px-5 py-12 text-center">
                      <div className="w-11 h-11 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                        <TrendingUp size={19} />
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">No deliveries in this period yet</p>
                      <p className="text-xs text-text-muted">Completed deliveries will appear here with their payouts.</p>
                    </div>
                  ) : (
                    <div className="bg-card rounded-[13px] border border-border divide-y divide-zinc-100">
                      {earnings.entries.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-text-primary truncate">
                              {e.restaurant_name || "Restaurant"}
                            </p>
                            <p className="text-[11px] text-text-muted font-mono mt-0.5">
                              #{e.id}{e.tracking_code ? ` · ${e.tracking_code}` : ""}{e.delivered_at ? ` · ${earningWhen(e.delivered_at)}` : ""}
                            </p>
                          </div>
                          <span className="text-sm font-bold font-mono text-emerald-600 shrink-0">
                            +{formatPrice(e.delivery_fee)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
