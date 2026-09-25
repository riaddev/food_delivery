import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Utensils, Bike, Home, Headphones, XCircle, Package, MapPin, Clock } from "lucide-react";
import BackToHome from "../../components/BackToHome";
import LiveMap from "../../components/LiveMap";
import { customerApi, trackingApi } from "../../features/api/apiSlice";
import { formatPrice, formatDateTime } from "../../utils/foodImages";

const DELIVERY_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing Food", icon: Utensils },
  { key: "ready", label: "Ready for Pickup", icon: Package },
  { key: "assigned", label: "Rider Assigned", icon: Bike },
  { key: "picked_up", label: "Picked Up", icon: Bike },
  { key: "on_the_way", label: "On the Way", icon: Bike },
  { key: "near_customer", label: "Near Customer", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: Home },
];

const DINE_IN_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing Food", icon: Utensils },
  { key: "served", label: "Served", icon: Home },
];

const TAKEOUT_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing Food", icon: Utensils },
  { key: "ready", label: "Ready for Pickup", icon: Package },
  { key: "delivered", label: "Picked Up", icon: Home },
];

const STEP_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  assigned: 4,
  picked_up: 5,
  on_the_way: 6,
  near_customer: 7,
  delivered: 8,
  served: 3,
};

const TAKEOUT_STEP_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
  served: 4,
};

const STATUS_TEXT = {
  pending: "Waiting for the restaurant to confirm your order.",
  confirmed: "The restaurant has confirmed your order.",
  preparing: "The restaurant is preparing your food.",
  ready: "Your order is ready for pickup.",
  assigned: "A rider has been assigned to your order.",
  picked_up: "Your order has been picked up by the rider.",
  on_the_way: "Your order is on the way!",
  near_customer: "Your rider is near you!",
  delivered: "Your order has been delivered. Enjoy!",
  served: "Your order has been served. Enjoy!",
  cancelled: "This order was cancelled.",
};

const IN_TRANSIT_STATUSES = ["picked_up", "on_the_way", "near_customer"];

const TERMINAL_STATUSES = ["delivered", "cancelled"];

const POLL_FAST = 3000;
const POLL_SLOW = 15000;

// Rider GPS is stale if no update for 45s — show unavailable instead of fake live.
const STALE_AFTER_MS = 45000;
// Refresh OSRM route at most every 60s or after 150m of rider movement.
const ROUTE_REFRESH_MS = 60000;
const ROUTE_MIN_MOVE_M = 150;

const haversineM = (aLat, aLng, bLat, bLng) => {
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

const timeAgo = (iso, now) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} second${s === 1 ? "" : "s"} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
};

// First-reached time per status from existing history (no new API).
const statusTimeMap = (order) => {
  const map = {};
  const histories = order?.status_histories || order?.statusHistories || [];
  histories.forEach((h) => {
    if (h?.status && h?.created_at && !map[h.status]) map[h.status] = h.created_at;
  });
  if (order?.created_at && !map.pending) map.pending = order.created_at;
  if (order?.delivered_at && !map.delivered) map.delivered = order.delivered_at;
  return map;
};

const formatStepTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef(null);
  const tickerRef = useRef(null);
  const routeMetaRef = useRef({ at: 0, lat: null, lng: null });

  useEffect(() => {
    let active = true;

    const load = () =>
      customerApi
        .getOrder(id)
        .then((res) => {
          if (active) {
            setOrder(res.data.order);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.response?.status === 404 ? "Order not found." : "Couldn't load your order.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

    load();

    return () => {
      active = false;
    };
  }, [id]);

  // Poll timer resets on status change only — depending on full 'order'
  // would reset the interval on every poll response (setOrder creates a new object).
  useEffect(() => {
    if (!order) return;

    const status = order.status;
    // Stop frequent polling once terminal — marker must freeze on Delivered/Cancelled.
    if (TERMINAL_STATUSES.includes(status)) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    const isTransit = IN_TRANSIT_STATUSES.includes(status);
    const interval = isTransit ? POLL_FAST : POLL_SLOW;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      customerApi.getOrder(id).then((res) => {
        setOrder(res.data.order);
        setError(null);
      }).catch(() => {});
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- narrow deps intentional (see above)
  }, [order?.status, id]);

  // Ticker so "Updated Xs ago" stays fresh between polls. Stops on terminal.
  // Status-only dep: 'order' would restart the 5s ticker on every poll response.
  useEffect(() => {
    if (!order || TERMINAL_STATUSES.includes(order.status)) return;
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- narrow deps intentional (see above)
  }, [order?.status]);

  // Route refetch keys on lat/lng primitives — full 'order.rider_location'
  // (updated_at changes each poll) or 'route' would spam the route API.
  useEffect(() => {
    if (!order?.tracking_code) return;

    const status = order.status;
    const isTransit = IN_TRANSIT_STATUSES.includes(status);
    if (!isTransit) return;

    const rider = order.rider_location;
    const meta = routeMetaRef.current;
    const elapsed = Date.now() - meta.at;
    let moved = Infinity;
    if (rider && meta.lat != null && meta.lng != null) {
      moved = haversineM(meta.lat, meta.lng, rider.lat, rider.lng);
    }
    const shouldFetch = !route || elapsed > ROUTE_REFRESH_MS || moved > ROUTE_MIN_MOVE_M;
    if (!shouldFetch) return;

    trackingApi
      .getRoute(order.tracking_code)
      .then((res) => {
        setRoute(res.data);
        routeMetaRef.current = {
          at: Date.now(),
          lat: rider?.lat ?? null,
          lng: rider?.lng ?? null,
        };
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- narrow deps intentional (see above)
  }, [order?.tracking_code, order?.status, order?.rider_location?.lat, order?.rider_location?.lng]);

  const status = order?.status;
  const isDineIn = order?.order_type === "dine_in";
  const isTakeout = order?.order_type === "takeout";
  const steps = isDineIn ? DINE_IN_STEPS : isTakeout ? TAKEOUT_STEPS : DELIVERY_STEPS;
  const activeStep = status ? (isTakeout ? TAKEOUT_STEP_INDEX[status] ?? 0 : STEP_INDEX[status] ?? 0) : 0;
  const isCancelled = status === "cancelled";
  const isTransit = !isTakeout && IN_TRANSIT_STATUSES.includes(status);
  const hasCoords = order?.restaurant_coords || order?.customer_coords || order?.rider_location;
  // Freshness from existing orders.updated_at (no migration). Stale => not live.
  const riderUpdatedAt = order?.rider_location?.updated_at || null;
  const riderStale = !riderUpdatedAt || (now - new Date(riderUpdatedAt).getTime() > STALE_AFTER_MS);
  const showLive = isTransit && order?.rider_location && !riderStale;
  const updatedLabel = riderUpdatedAt ? timeAgo(riderUpdatedAt, now) : null;
  const stepTimes = statusTimeMap(order);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <BackToHome />
          <div className="flex-1 text-center -ml-9">
            <h1 className="font-extrabold tracking-tight text-zinc-900">Order Tracking</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {order ? `#${order.id} · ${formatDateTime(order.created_at)}` : `#${id || ""}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {loading && (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 rounded-full border-2 border-[#E03546] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && error && (
          <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-10 text-center">
            <XCircle size={40} className="text-rose-400 mx-auto mb-3" />
            <p className="font-bold text-zinc-900">{error}</p>
            <p className="text-sm text-zinc-400 mt-1">
              Make sure you're signed in with the account that placed this order.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 bg-[#E03546] hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Retry
            </button>
          </section>
        )}

        {!loading && order && (
          <>
            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                    {isCancelled ? "Order Cancelled" : order.restaurant?.restaurant_name}
                  </h2>
                  <p className={`text-sm mt-1 ${isCancelled ? "text-rose-600 font-semibold" : "text-zinc-400"}`}>
                    {isTakeout && status === "delivered"
                      ? "Your order has been picked up. Enjoy!"
                      : isTakeout && status === "ready"
                        ? "Your order is ready — pick it up from the restaurant."
                        : STATUS_TEXT[status] || "Order status is being updated."}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {showLive && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Live
                    </div>
                  )}
                  {isTransit && !showLive && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      Location unavailable/stale
                    </div>
                  )}
                  {isTransit && updatedLabel && (
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Updated {updatedLabel}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {isTransit && hasCoords && (
              <LiveMap
                restaurantCoords={order.restaurant_coords}
                customerCoords={order.customer_coords}
                riderLocation={order.rider_location}
                polyline={route?.polyline}
              />
            )}

            {isTransit && hasCoords && (
              <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Clock size={16} className="text-blue-500" />
                  <span>Estimated arrival</span>
                </div>
                <span className="font-extrabold text-zinc-900">
                  {route?.duration_min != null ? `~${route.duration_min} min · live` : "Calculating…"}
                </span>
              </div>
            )}

            {!isCancelled && (
              <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
                <ol className="flex flex-col">
                  {steps.map((step, i) => {
                    const isCompleted = i < activeStep;
                    const isActive = i === activeStep;
                    const iconBg = isCompleted
                      ? "bg-green-100 text-green-600"
                      : isActive
                        ? "bg-[#E03546] text-white"
                        : "bg-zinc-100 text-zinc-400";
                    const hasLine = i < steps.length - 1;
                    const labelColor = isCompleted || isActive ? "text-zinc-900" : "text-zinc-500";
                    const Icon = step.icon;

                    return (
                      <li key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                            <Icon size={20} strokeWidth={2.2} />
                          </div>
                          {hasLine && (
                            <span
                              className={`w-[2px] flex-1 my-1 min-h-8 rounded-full ${isCompleted ? "bg-green-500" : "bg-zinc-200"}`}
                            />
                          )}
                        </div>
                        <div className="pb-6 flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 pt-2.5">
                            <p className={`font-semibold text-sm ${isActive ? "text-[#E03546]" : labelColor}`}>
                              {step.label}
                            </p>
                            {i <= activeStep && formatStepTime(stepTimes[step.key]) && (
                              <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                                {formatStepTime(stepTimes[step.key])}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold tracking-tight text-zinc-900 text-base">
                  {order.restaurant?.restaurant_name || "Restaurant"}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    order.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {order.payment_status === "paid"
                    ? "Paid"
                    : order.payment_status === "refund_pending"
                      ? "Refund pending"
                      : isTakeout ? "Pay on pickup" : "Pay on delivery"}
                </span>
              </div>

              <div className="mt-4">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0"
                  >
                    <span className="text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-900 mr-2">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-zinc-600">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.total - order.delivery_fee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Delivery Fee</span>
                  <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-zinc-800">Total</span>
                  <span className="font-extrabold text-zinc-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Order type</span>
                <span className="font-semibold text-zinc-800">
                  {isDineIn ? "Dine-In" : isTakeout ? "Takeout" : "Delivery"}
                  {isDineIn && order.table_number ? ` · Table ${order.table_number}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Payment</span>
                <span className="font-semibold text-zinc-800 capitalize">
                  {order.payment_method === "cash" ? (isTakeout ? "Cash on Pickup" : "Cash on Delivery") : order.payment_method}
                </span>
              </div>
              {!isDineIn && !isTakeout && order.delivery_address && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Deliver to</span>
                  <span className="font-semibold text-zinc-800 max-w-[60%] text-right">{order.delivery_address}</span>
                </div>
              )}
            </section>

            <a
              href={order.restaurant?.phone ? `tel:${order.restaurant.phone}` : "/support"}
              className="w-full border-2 border-zinc-200 hover:border-[#E03546] hover:text-[#E03546] text-zinc-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors no-underline"
            >
              <Headphones size={18} strokeWidth={2.2} />
              {order.restaurant?.phone ? `Call ${order.restaurant.restaurant_name || "Restaurant"}` : "Help & Support"}
            </a>
          </>
        )}
      </main>
    </div>
  );
}
