import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell, Bike, CalendarClock, Camera, Check, CheckCircle2, Clock, CreditCard, Heart, KeyRound, MapPin,
  MessageCircle, Navigation, Package, Pencil, Phone, Plus, Settings, ShoppingCart, Star, Trash2, User, Utensils,
  X, XCircle,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { customerApi, trackingApi, reservationApi } from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import CartDrawer from "../../components/CartDrawer";
import LiveMap from "../../components/LiveMap";
import { Card, EmptyState, SectionTitle } from "../../components/dashboard/Card";
import { formatPrice, resolveAssetUrl, restaurantImage } from "../../utils/foodImages";

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const ORANGE = "#F97316";

const STATUS_COLOR = {
  pending: "#D97706",
  confirmed: "#2563EB",
  preparing: "#D97706",
  ready: "#0E7490",
  assigned: "#7C3AED",
  picked_up: "#2563EB",
  on_the_way: "#2563EB",
  near_customer: "#F59E0B",
  delivered: "#16A34A",
  served: "#16A34A",
  cancelled: "#DC2626",
};

const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  assigned: "Rider Assigned",
  picked_up: "Picked up",
  on_the_way: "On the way",
  near_customer: "Near Customer",
  delivered: "Delivered",
  served: "Served",
  cancelled: "Cancelled",
};

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready", "assigned", "picked_up", "on_the_way", "near_customer"];

const STEPS = [
  { label: "Placed", status: "pending" },
  { label: "Confirmed", status: "confirmed" },
  { label: "Preparing", status: "preparing" },
  { label: "Ready", status: "ready" },
  { label: "On the way", status: "on_the_way" },
  { label: "Near You", status: "near_customer" },
  { label: "Delivered", status: "delivered" },
];

const stepIndex = (status) => {
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : -1;
};

const orderItemsLabel = (order) => {
  const items = order?.items || [];
  if (items.length === 0) return "—";
  return items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ");
};

const orderDate = (order) => {
  if (!order?.created_at) return "—";
  return new Date(order.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/* ------------------------------------------------------------------ */
/*  Delivery tracker (Figma)                                           */
/* ------------------------------------------------------------------ */

function DeliveryTracker({ current }) {
  return (
    <div className="flex items-start w-full mt-5 overflow-x-auto">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
                style={{
                  background: done ? (active ? ORANGE : "rgba(249,115,22,0.45)") : "rgba(255,255,255,0.07)",
                  boxShadow: active ? `0 0 0 5px rgba(249,115,22,0.2)` : "none",
                  color: done ? "#fff" : "#4B5563",
                }}
              >
                {done && <Check size={14} strokeWidth={3} />}
              </div>
              <span
                className="text-[10.5px] font-semibold text-center whitespace-nowrap"
                style={{ color: done ? (active ? ORANGE : "rgba(249,115,22,0.55)") : "#4B5563" }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-[1.5px] mb-6 mx-1"
                style={{ background: done ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.07)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review modal                                                       */
/* ------------------------------------------------------------------ */

function ReviewModal({ order, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        restaurant_id: order.restaurant_id,
        rating,
        comment: comment.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] font-bold text-text-primary">Rate your order</h3>
          <button onClick={onClose} className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none">
            <X size={18} />
          </button>
        </div>
        <p className="text-[13px] text-text-muted mb-4">
          {order.restaurant?.restaurant_name || "Restaurant"} · Order #{order.id}
        </p>

        <div className="flex justify-center gap-1.5 mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="cursor-pointer border-none bg-none p-0.5"
              aria-label={`${star} stars`}
            >
              <Star
                size={30}
                className={star <= rating ? "text-amber-400" : "text-zinc-300"}
                fill={star <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience (optional)"
          className="w-full px-3.5 py-2.5 rounded-[10px] text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-text-light font-outfit box-border resize-none mb-3"
        />

        {error && (
          <p className="text-xs text-danger bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-3">{error}</p>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
          >
            {busy ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Support modal                                                      */
/* ------------------------------------------------------------------ */

const SUPPORT_ISSUES = [
  "Order hasn't arrived",
  "Missing item",
  "Wrong item",
  "Food quality issue",
  "Payment problem",
  "Other issue",
];

function SupportModal({ order, onClose, onSubmit }) {
  const [issue, setIssue] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!issue) {
      setError("Please choose an issue type.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        order_id: order.id,
        issue,
        note: note.trim() || null,
      });
      onClose();
    } catch {
      setError("Could not submit. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] font-bold text-text-primary">Contact Support</h3>
          <button onClick={onClose} className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none">
            <X size={18} />
          </button>
        </div>
        <p className="text-[13px] text-text-muted mb-4">
          {order.restaurant?.restaurant_name || "Restaurant"} · Order #{order.id}
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {SUPPORT_ISSUES.map((s) => (
            <button
              key={s}
              onClick={() => setIssue(s)}
              className={`text-left px-3.5 py-2.5 rounded-lg text-[14px] font-semibold border transition-colors cursor-pointer font-outfit ${
                issue === s
                  ? "bg-orange-soft border-orange-primary text-orange-deep"
                  : "bg-white border-border text-text-primary hover:border-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add more detail (optional)"
          className="w-full px-3.5 py-2.5 rounded-[10px] text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-text-light font-outfit box-border resize-none mb-3"
        />

        {error && (
          <p className="text-xs text-danger bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-3">{error}</p>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
          >
            {busy ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cancel confirmation modal                                          */
/* ------------------------------------------------------------------ */

function CancelConfirmModal({ order, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(order.id);
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-sm shadow-2xl">
        <div className="w-11 h-11 rounded-full bg-red-50 text-danger flex items-center justify-center mb-3">
          <XCircle size={20} strokeWidth={2} />
        </div>
        <h3 className="text-[16px] font-bold text-text-primary mb-1">Cancel this order?</h3>
        <p className="text-[13px] text-text-muted mb-5">
          Are you sure you want to cancel Order #{order.id}? This can't be undone.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit"
          >
            Keep Order
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 bg-danger hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
          >
            {busy ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Order details modal                                                */
/* ------------------------------------------------------------------ */

const paymentMethodLabel = (method) => {
  if (method === "bkash") return "bKash";
  if (method === "card") return "Card";
  return "Cash on Delivery";
};

function OrderDetailsModal({ order, onClose, onTrack, onReorder, onReview }) {
  const subtotal = (order.items || []).reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const color = STATUS_COLOR[order.status] || "#9CA3AF";
  const isDelivered = order.status === "delivered" || order.status === "served";
  const isActive = ACTIVE_STATUSES.includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-[17px] font-bold text-text-primary">Order #{order.id}</h3>
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>
            <p className="text-[13px] text-text-muted mt-0.5">
              {order.restaurant?.restaurant_name || "Restaurant"} · {orderDate(order)}
            </p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="bg-surface rounded-[13px] border border-border p-4 mt-4 mb-4">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-text-primary">
                {item.name} <span className="text-text-light">× {item.quantity}</span>
              </span>
              <span className="font-semibold font-mono text-text-primary">
                {formatPrice(Number(item.price) * item.quantity)}
              </span>
            </div>
          ))}
          <div className="border-t border-border mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">Subtotal</span>
              <span className="font-mono text-text-primary">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">Delivery fee</span>
              <span className="font-mono text-text-primary">
                {deliveryFee > 0 ? formatPrice(deliveryFee) : "Free"}
              </span>
            </div>
            <div className="flex justify-between text-[14px] font-bold pt-1.5">
              <span className="text-text-primary">Total</span>
              <span className="font-mono text-orange-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {order.delivery_address && (
          <p className="text-[13px] text-text-muted flex items-start gap-1.5 mb-1.5">
            <MapPin size={13} className="text-orange-primary shrink-0 mt-0.5" />
            {order.delivery_address}
          </p>
        )}
        <p className="text-[13px] text-text-muted mb-5">
          <CreditCard size={13} className="inline text-orange-primary mr-1.5 -mt-0.5" />
          {paymentMethodLabel(order.payment_method)}{" "}
          <span className={order.payment_status === "paid" ? "text-success font-semibold" : "text-amber-600 font-semibold"}>
            · {order.payment_status === "paid" ? "Paid" : "Unpaid"}
          </span>
        </p>

        <div className="flex gap-2.5">
          {isActive && (
            <button
              onClick={() => { onClose(); onTrack(order); }}
              className="flex-1 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
            >
              Track Order
            </button>
          )}
          {isDelivered && (
            <>
              <button
                onClick={() => { onClose(); onReorder(order); }}
                className="flex-1 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
              >
                Reorder
              </button>
              <button
                onClick={() => { onClose(); onReview(order); }}
                className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit"
              >
                Review
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Track live modal (real GPS tracking)                                */
/* ------------------------------------------------------------------ */

const IN_TRANSIT_STATUSES = ["picked_up", "on_the_way", "near_customer"];
const TERMINAL_STATUSES = ["delivered", "cancelled"];
const STALE_AFTER_MS = 45000;
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

const trackingTimeAgo = (iso, now) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} second${s === 1 ? "" : "s"} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)}h ago`;
};

function LiveTrackingMap({ order }) {
  const [route, setRoute] = useState(null);
  const [pollData, setPollData] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef(null);
  const tickerRef = useRef(null);
  const routeMetaRef = useRef({ at: 0, lat: null, lng: null });

  useEffect(() => {
    if (!order.tracking_code || !IN_TRANSIT_STATUSES.includes(order.status)) return;

    const fetchRoute = (rider) => {
      trackingApi.getRoute(order.tracking_code)
        .then((res) => {
          setRoute(res.data);
          routeMetaRef.current = { at: Date.now(), lat: rider?.lat ?? null, lng: rider?.lng ?? null };
        })
        .catch(() => {});
    };

    fetchRoute(null);

    const poll = () => {
      trackingApi.track(order.tracking_code)
        .then((res) => {
          const data = res.data;
          setPollData(data);
          setNow(Date.now());
          if (TERMINAL_STATUSES.includes(data?.status)) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return;
          }
          // Refresh route at most every 60s or after 150m rider move (free OSRM).
          const rider = data?.rider_location;
          const meta = routeMetaRef.current;
          const elapsed = Date.now() - meta.at;
          let moved = Infinity;
          if (rider && meta.lat != null) moved = haversineM(meta.lat, meta.lng, rider.lat, rider.lng);
          if (elapsed > ROUTE_REFRESH_MS || moved > ROUTE_MIN_MOVE_M) fetchRoute(rider);
        })
        .catch(() => {});
    };

    poll();
    timerRef.current = setInterval(poll, 3000);
    tickerRef.current = setInterval(() => setNow(Date.now()), 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [order.tracking_code, order.status]);

  const data = pollData || {};
  const restaurantCoords = data.restaurant_coords || order.restaurant_coords || null;
  const customerCoords = data.customer_coords || order.customer_coords || null;
  const riderLocation = data.rider_location || order.rider_location || null;
  const riderUpdatedAt = riderLocation?.updated_at || null;
  const riderStale = !riderUpdatedAt || (now - new Date(riderUpdatedAt).getTime() > STALE_AFTER_MS);
  const updatedLabel = riderUpdatedAt ? trackingTimeAgo(riderUpdatedAt, now) : null;

  if (!restaurantCoords && !customerCoords && !riderLocation) {
    return (
      <div className="rounded-[13px] border border-border overflow-hidden bg-[#F2F3F5] h-44 flex items-center justify-center">
        <p className="text-[12px] text-text-muted">Map will appear once coordinates are available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <LiveMap
        restaurantCoords={restaurantCoords}
        customerCoords={customerCoords}
        riderLocation={riderLocation}
        polyline={route?.polyline}
      />
      <div className="flex items-center justify-between px-1">
        {riderLocation && !riderStale ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live{updatedLabel ? ` · Updated ${updatedLabel}` : ""}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-amber-600">
            Location unavailable/stale{updatedLabel ? ` · Updated ${updatedLabel}` : ""}
          </span>
        )}
        {route?.duration_min != null && (
          <span className="text-[11px] text-text-muted">ETA ~{route.duration_min} min</span>
        )}
      </div>
    </div>
  );
}

function TrackLiveModal({ order, onClose, onSupport }) {
  const color = STATUS_COLOR[order.status] || "#9CA3AF";
  const rider = order.rider;
  const isTransit = IN_TRANSIT_STATUSES.includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-[17px] font-bold text-text-primary">Track Order #{order.id}</h3>
                <span
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block pulse-dot" style={{ background: color }} />
                  {STATUS_LABEL[order.status] || order.status}
                </span>
                {isTransit && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-[13px] text-text-muted mt-0.5">
                {order.restaurant?.restaurant_name || "Restaurant"} · {orderItemsLabel(order)}
              </p>
            </div>
            <button onClick={onClose} className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-surface rounded-[13px] border border-border px-4 py-3">
            <span className="text-[13px] text-text-muted">Restaurant estimate</span>
            <span className="text-[16px] font-bold font-mono text-text-primary">
              {order.restaurant?.delivery_time || "TBA"}
            </span>
          </div>

          <LiveTrackingMap order={order} />

          {rider && (
            <div className="flex items-center gap-3 bg-surface rounded-[13px] border border-border px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-orange-soft text-orange-deep flex items-center justify-center font-bold text-[14px] shrink-0">
                {(rider.name || "R").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-text-primary truncate">{rider.name}</div>
                {rider.rating && (
                  <div className="text-[12px] text-text-muted flex items-center gap-1">
                    <Star size={11} className="text-amber-400" fill="currentColor" /> {rider.rating}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={() => { onClose(); onSupport(order); }}
              className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit"
            >
              <MessageCircle size={14} className="inline mr-1.5 -mt-0.5" /> Support
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Orders view                                                        */
/* ------------------------------------------------------------------ */

function OrdersView({ orders, overview, tab, setTab, onReorder, onCancel, onReview, onSupport }) {
  const [reviewOrder, setReviewOrder] = useState(null);
  const [supportOrder, setSupportOrder] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [trackOrder, setTrackOrder] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const selected = activeOrders.find((o) => o.id === selectedId) || activeOrders[0] || null;
  const currentIdx = selected ? stepIndex(selected.status) : -1;

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered" || o.status === "served").length;

  const summary = [
    { label: "Total orders", value: String(overview?.total_orders ?? orders.length), note: "since joining", accent: true },
    { label: "Total spent", value: formatPrice(totalSpent), note: "all time" },
    { label: "Delivered", value: String(deliveredCount), note: "orders delivered" },
  ];

  const list = tab === "active" ? activeOrders : historyOrders;

  const isCancellable = (o) => ["pending", "confirmed"].includes(o.status);
  const canTrack = (o) => ["preparing", "ready", "assigned", "picked_up", "on_the_way", "near_customer"].includes(o.status);

  const selectOrder = (o) => {
    if (tab === "active" && ACTIVE_STATUSES.includes(o.status)) setSelectedId(o.id);
    else setDetailsOrder(o);
  };

  // Deep link from PaymentSuccess: ?trackOrder=<id> selects the order in the
  // dashboard tracker. B1: auto-open the live modal only when trackable;
  // fresh pending/confirmed orders land on the stepper instead.
  const [deepLinkParams, setDeepLinkParams] = useSearchParams();
  const deepLinkConsumedRef = useRef(false);
  useEffect(() => {
    if (deepLinkConsumedRef.current) return;
    const raw = deepLinkParams.get("trackOrder");
    if (raw == null) return;
    if (!orders.length) return;
    deepLinkConsumedRef.current = true;
    const id = Number(raw);
    const target = Number.isInteger(id) ? orders.find((o) => o.id === id) : null;
    // Defer state updates out of the effect body (lint: no sync setState in effect).
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(deepLinkParams);
      next.delete("trackOrder");
      setDeepLinkParams(next, { replace: true });
      if (!target) return;
      setTab("active");
      if (ACTIVE_STATUSES.includes(target.status)) setSelectedId(target.id);
      else setDetailsOrder(target);
      if (canTrack(target)) setTrackOrder(target);
    }, 0);
    return () => window.clearTimeout(t);
  }, [orders, deepLinkParams, setDeepLinkParams, setTab]);

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-3 bg-card rounded-[13px] border border-border overflow-hidden mb-5">
        {summary.map((s, i) => (
          <div key={s.label} className="flex-1 min-w-0 px-2 sm:px-4 py-[18px]" style={{ borderLeft: i > 0 ? "1px solid #E5E7EB" : "none" }}>
            <div
              className={`text-lg sm:text-[22px] font-extrabold font-mono leading-none tracking-[-0.5px] truncate ${s.accent ? "text-orange-primary" : "text-text-primary"}`}
            >
              {s.value}
            </div>
            <div className="text-[11px] sm:text-[12.5px] font-semibold text-text-muted mt-1.5 truncate">{s.label}</div>
            <div className="text-[10px] sm:text-[11px] text-text-light mt-0.5 truncate">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Active order tracker */}
      <div
        className="rounded-[14px] px-6 py-6 mb-5 relative overflow-hidden"
        style={{ background: "#0F1117" }}
      >
        <div className="absolute -right-12 -top-12 w-[200px] h-[200px] rounded-full bg-orange-primary/10 pointer-events-none" />

        {selected ? (
          <>
            <div className="flex items-start justify-between relative flex-wrap gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[11px] text-orange-primary font-bold uppercase tracking-[0.07em] border border-orange-primary/40 rounded px-2 py-0.5">
                    Tracking Order #{selected.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block pulse-dot" />
                    <span className="text-[11px] text-[#4ADE80] font-bold uppercase tracking-[0.07em]">
                      {STATUS_LABEL[selected.status]} your order
                    </span>
                  </span>
                </div>
                <h2 className="text-[18px] font-bold text-[#F9FAFB] m-0 mb-1 tracking-[-0.3px]">
                  {selected.restaurant?.restaurant_name || "Restaurant"} — {orderItemsLabel(selected)}
                </h2>
                <p className="text-[13px] text-[#4B5563] m-0">
                  #{selected.id} · {orderDate(selected)}
                  {selected.delivery_address ? ` · ${selected.delivery_address}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0 ml-auto">
                <div className="text-[38px] font-extrabold text-orange-primary font-mono leading-none">
                  {selected.restaurant?.delivery_time || "—"}
                </div>
                <div className="text-[11px] text-[#4B5563] font-bold uppercase tracking-[0.06em]">
                  {selected.restaurant?.delivery_time ? "est. delivery" : "est. time TBA"}
                </div>
                <div className="text-[14px] text-[#9CA3AF] mt-1.5 font-mono font-semibold">{formatPrice(selected.total)}</div>
              </div>
            </div>

            <DeliveryTracker current={currentIdx} />

            <div className="flex flex-col min-[420px]:flex-row gap-2.5 mt-4">
              {isCancellable(selected) && (
                <button
                  onClick={() => setCancelOrder(selected)}
                  className="px-3.5 py-2.5 rounded-lg cursor-pointer text-[13.5px] font-semibold font-outfit flex items-center justify-center gap-1.5 transition-all duration-150"
                  style={{ flex: 1, background: "transparent", color: "#F87171", border: "1px solid rgba(239,68,68,0.4)" }}
                >
                  <XCircle size={14} /> Cancel Order
                </button>
              )}
              <button
                onClick={() => setSupportOrder(selected)}
                className="px-3.5 py-2.5 rounded-lg cursor-pointer text-[13.5px] font-semibold font-outfit flex items-center justify-center gap-1.5 transition-all duration-150"
                style={{ flex: 1, background: "transparent", color: "#6B7280", border: "1px solid #1A1D27" }}
              >
                <MessageCircle size={14} /> Support
              </button>
              {canTrack(selected) && (
                <button
                  onClick={() => setTrackOrder(selected)}
                  className="px-3.5 py-2.5 rounded-lg cursor-pointer text-[13.5px] font-semibold font-outfit flex items-center justify-center gap-1.5 transition-all duration-150"
                  style={{ flex: 1.4, background: ORANGE, color: "#fff", border: "none" }}
                >
                  <Navigation size={14} /> Track Live
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6 relative">
            <div className="text-[16px] font-bold text-[#F9FAFB] mb-1.5">No active orders</div>
            <p className="text-[13px] text-[#4B5563] m-0 mb-4">Hungry? Browse restaurants and place your next order.</p>
            <Link
              to="/restaurants"
              className="inline-block px-4 py-2.5 rounded-lg text-[13.5px] font-bold no-underline"
              style={{ background: ORANGE, color: "#fff" }}
            >
              Browse Restaurants
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex w-fit bg-card rounded-[10px] p-1 border border-border mb-3.5">
        {(["active", "history"]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-1.5 rounded-[7px] border-none cursor-pointer text-[13.5px] font-semibold font-outfit transition-all duration-150"
            style={{ background: tab === t ? ORANGE : "transparent", color: tab === t ? "#fff" : "#6B7280" }}
          >
            {t === "active" ? "Active" : "History"}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="flex flex-col gap-2.5 mb-5">
        {list.length === 0 && <EmptyState message={`No ${tab} orders`} />}
        {list.map((o) => {
          const color = STATUS_COLOR[o.status] || "#9CA3AF";
          const isSelected = tab === "active" && selected && o.id === selected.id;
          const isHistory = tab === "history";
          return (
            <div
              key={o.id}
              onClick={() => selectOrder(o)}
              className={`bg-card rounded-[12px] px-4 py-3.5 border flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 cursor-pointer transition-all duration-150 hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] ${
                isSelected ? "border-orange-primary shadow-[0_2px_12px_rgba(249,115,22,0.12)]" : "border-border"
              }`}
            >
              <img
                src={restaurantImage(o.restaurant?.restaurant_name)}
                alt={o.restaurant?.restaurant_name}
                className="w-[54px] h-[54px] rounded-[10px] object-cover shrink-0"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <span className="text-[14.5px] font-bold text-text-primary truncate">
                    {o.restaurant?.restaurant_name || "Restaurant"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                  {isSelected && (
                    <span className="text-[10.5px] font-bold text-orange-deep bg-orange-soft px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Tracking
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-text-muted mb-0.5 truncate">{orderItemsLabel(o)}</div>
                <div className="text-[12px] text-text-light">
                  {orderDate(o)} · <span className="font-mono text-text-muted">#{o.id}</span>
                </div>
              </div>
              <div className="w-full min-[480px]:w-auto min-[480px]:text-right min-[480px]:shrink-0">
                <div className="text-[15px] font-extrabold text-text-primary font-mono">{formatPrice(o.total)}</div>
                <div className="flex flex-wrap gap-2 mt-1.5 min-[480px]:justify-end">
                  {isHistory ? (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailsOrder(o); }}
                        className="text-[12px] text-text-muted font-semibold bg-none border border-border rounded-md px-2.5 py-1 cursor-pointer font-outfit hover:border-zinc-300 hover:text-text-primary transition-colors"
                      >
                        View Details
                      </button>
                      {(o.status === "delivered" || o.status === "served") && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); onReorder(o); }}
                            className="text-[12px] text-orange-primary font-semibold bg-none border border-orange-primary rounded-md px-2.5 py-1 cursor-pointer font-outfit hover:bg-orange-soft transition-colors"
                          >
                            Reorder
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setReviewOrder(o); }}
                            className="text-[12px] text-emerald-700 font-semibold bg-none border border-emerald-200 rounded-md px-2.5 py-1 cursor-pointer font-outfit hover:bg-emerald-50 transition-colors"
                          >
                            Review
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {isCancellable(o) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setCancelOrder(o); }}
                          className="text-[12px] text-danger font-semibold bg-none border border-red-200 rounded-md px-2.5 py-1 cursor-pointer font-outfit hover:bg-rose-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSupportOrder(o); }}
                        className="text-[12px] text-text-muted font-semibold bg-none border border-border rounded-md px-2.5 py-1 cursor-pointer font-outfit hover:border-zinc-300 hover:text-text-primary transition-colors"
                      >
                        Support
                      </button>
                      {canTrack(o) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setTrackOrder(o); }}
                          className="text-[12px] text-orange-primary font-semibold bg-none border border-orange-primary rounded-md px-2.5 py-1 cursor-pointer font-outfit hover:bg-orange-soft transition-colors"
                        >
                          Track
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviewOrder && (
        <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onSubmit={onReview} />
      )}
      {supportOrder && (
        <SupportModal order={supportOrder} onClose={() => setSupportOrder(null)} onSubmit={onSupport} />
      )}
      {cancelOrder && (
        <CancelConfirmModal order={cancelOrder} onClose={() => setCancelOrder(null)} onConfirm={onCancel} />
      )}
      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          onClose={() => setDetailsOrder(null)}
          onTrack={(o) => setTrackOrder(o)}
          onReorder={onReorder}
          onReview={(o) => setReviewOrder(o)}
        />
      )}
      {trackOrder && (
        <TrackLiveModal
          order={trackOrder}
          onClose={() => setTrackOrder(null)}
          onSupport={(o) => setSupportOrder(o)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Favorites view                                                     */
/* ------------------------------------------------------------------ */

function FavoritesView({ favorites, wishlist, onRemoveFavorite, onRemoveWishlist }) {
  return (
    <div>
      <Card className="overflow-hidden">
        <SectionTitle
          title="Favorite Restaurants"
          subtitle="Your saved spots, one tap away"
          action={
            <Link to="/restaurants" className="text-[13px] text-orange-primary font-semibold no-underline">
              Browse
            </Link>
          }
        />
        {favorites.length === 0 ? (
          <EmptyState message="No favorite restaurants yet" />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {favorites.map((fav) => {
              const r = fav.restaurant;
              return (
                <div
                  key={fav.id}
                  className="shrink-0 w-[200px] rounded-[11px] overflow-hidden border border-border cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.09)]"
                >
                  <div className="relative">
                    <img
                      src={restaurantImage(r?.restaurant_name)}
                      alt={r?.restaurant_name}
                      className="w-full h-[110px] object-cover block"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span className="absolute top-2 left-2 bg-orange-primary text-white text-[10.5px] font-bold px-1.5 py-0.5 rounded">
                      ★ {r?.rating || "New"}
                    </span>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-[14px] font-bold text-text-primary mb-0.5 truncate">{r?.restaurant_name}</div>
                    <div className="text-[12px] text-text-muted mb-2 truncate">
                      {[r?.cuisine_type, r?.city].filter(Boolean).join(" · ") || "Restaurant"}
                    </div>
                    <button
                      onClick={() => onRemoveFavorite(r.id)}
                      className="w-full text-[12px] font-semibold text-danger bg-rose-50 border border-red-100 rounded-md py-1 cursor-pointer font-outfit hover:bg-rose-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="mt-4 overflow-hidden">
        <SectionTitle title="Favorite Dishes" subtitle="Saved menu items" />
        {wishlist.length === 0 ? (
          <EmptyState message="No favorite dishes yet — tap the heart on a dish" />
        ) : (
          <div className="flex flex-col gap-2">
            {wishlist.map((wi) => {
              const item = wi.menu_item;
              const restaurant = item?.restaurant;
              return (
                <div
                  key={wi.id}
                  className="flex items-center gap-3.5 rounded-[10px] border border-border px-3.5 py-3"
                >
                  <img
                    src={item?.image_url || restaurantImage(restaurant?.restaurant_name)}
                    alt={item?.name}
                    className="w-[54px] h-[54px] rounded-[10px] object-cover shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-text-primary text-[14.5px] truncate">{item?.name}</div>
                    <div className="text-[13px] text-text-muted truncate">{restaurant?.restaurant_name}</div>
                    <div className="text-[13px] font-bold text-orange-primary font-mono mt-0.5">
                      {formatPrice(item?.price)}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveWishlist(wi.menu_item_id)}
                    className="shrink-0 text-[12px] font-semibold text-danger bg-rose-50 border border-red-100 rounded-md px-3 py-1.5 cursor-pointer font-outfit hover:bg-rose-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Addresses view                                                     */
/* ------------------------------------------------------------------ */

function AddressesView({ addresses, onSaved }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", address: "", city: "", phone: "", is_default: false });

  const resetForm = () => {
    setForm({ label: "", address: "", city: "", phone: "", is_default: false });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (addr) => {
    setForm({
      label: addr.label || "",
      address: addr.address,
      city: addr.city || "",
      phone: addr.phone || "",
      is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await customerApi.updateAddress(editingId, form);
      else await customerApi.createAddress(form);
      resetForm();
      onSaved();
    } catch {
      alert("Failed to save address");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this address?")) return;
    try {
      await customerApi.deleteAddress(id);
      onSaved();
    } catch {
      alert("Failed to delete address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await customerApi.setDefaultAddress(id);
      onSaved();
    } catch {
      alert("Failed to set default");
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-text-light font-outfit box-border";

  return (
    <div>
      {showForm && (
        <Card className="mb-5">
          <SectionTitle title={editingId ? "Edit Address" : "Add New Address"} />
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <input
              type="text"
              placeholder="Label (e.g. Home, Office)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputCls}
            />
            <div className="sm:col-span-2">
              <textarea
                placeholder="Full address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                required
                className={`${inputCls} resize-y`}
              />
            </div>
            <input
              type="text"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
            <label className="flex items-center gap-2.5 text-sm text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="w-4 h-4 accent-orange-500"
              />
              Set as default address
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all cursor-pointer font-outfit"
              >
                {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-text-muted hover:text-text-primary text-sm font-medium px-4 py-2.5 cursor-pointer font-outfit"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-[13px] border-2 border-dashed border-border hover:border-orange-primary group p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer bg-card"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-soft group-hover:bg-orange-primary text-orange-deep group-hover:text-white flex items-center justify-center mb-3 transition-colors">
              <Plus size={22} strokeWidth={2.5} />
            </div>
            <p className="font-bold text-text-primary">Add New Address</p>
            <p className="text-sm text-text-light mt-0.5">Save a home, office or friend's place</p>
          </button>
        )}

        {addresses.map((addr) => (
          <div key={addr.id} className="bg-card rounded-[13px] border border-border px-5 py-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-9 h-9 rounded-lg bg-orange-soft text-orange-deep flex items-center justify-center">
                <MapPin size={17} strokeWidth={2.2} />
              </span>
              {addr.is_default && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-deep bg-orange-soft px-2 py-0.5 rounded-full">
                  <Star size={10} fill="currentColor" /> Default
                </span>
              )}
            </div>
            {addr.label && <p className="font-bold text-text-primary mb-0.5">{addr.label}</p>}
            <p className="text-sm text-text-muted leading-relaxed">{addr.address}</p>
            <p className="text-sm text-text-light mt-0.5">{addr.city}</p>
            {addr.phone && (
              <p className="text-sm text-text-muted mt-2 flex items-center gap-1.5">
                <Phone size={13} /> {addr.phone}
              </p>
            )}
            <div className="flex gap-2 mt-4 pt-3.5 border-t border-[#F3F4F6]">
              <button
                onClick={() => handleEdit(addr)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg border border-border hover:border-zinc-400 transition-colors cursor-pointer font-outfit"
              >
                <Pencil size={12} /> Edit
              </button>
              {!addr.is_default && (
                <>
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-success hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-400 transition-colors cursor-pointer font-outfit"
                  >
                    <Star size={12} /> Set Default
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 transition-colors cursor-pointer font-outfit ml-auto"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {addresses.length === 0 && !showForm && <EmptyState message="No saved addresses yet" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile view                                                       */
/* ------------------------------------------------------------------ */

function ProfileView({ user, refreshUser }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null); // instant blob preview
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [message, setMessage] = useState(null);
  const avatarInputRef = useRef(null);

  // user loads async via refreshUser()/fetchUser — keep form in sync
  // without clobbering in-progress edits (only sync when user identity/data changes).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ name: user?.name || "", phone: user?.phone || "" });
  }, [user?.id, user?.name, user?.phone]);

  // A new avatar_url from the server replaces the local preview; reset error flag.
  const serverAvatar = resolveAssetUrl(user?.avatar_url);
  const prevServerAvatarRef = useRef(serverAvatar);
  useEffect(() => {
    if (serverAvatar && serverAvatar !== prevServerAvatarRef.current) {
      prevServerAvatarRef.current = serverAvatar;
      setAvatarPreview((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatarBroken(false);
  }, [serverAvatar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await customerApi.updateProfile(form);
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated!" });
    } catch (err) {
      const msg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors)[0]?.[0] || "Failed to save."
          : err.response?.data?.message || "Failed to save.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Photo must be under 2MB." });
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    // Show the chosen photo instantly — don't wait for upload/refresh.
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setAvatarBroken(false);
    setAvatarSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await customerApi.updateProfile(fd);
      await refreshUser();
      setMessage({ type: "success", text: "Profile photo updated!" });
    } catch (err) {
      const msg =
        err.response?.data?.errors?.avatar?.[0] ||
        err.response?.data?.message ||
        "Failed to upload photo.";
      setMessage({ type: "error", text: msg });
      // Upload failed — drop the instant preview so we don't show an unsaved photo.
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
    } finally {
      setAvatarSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!displayAvatar) return;
    if (!window.confirm("Remove your profile photo?")) return;
    // Discard an unsaved local preview without hitting the server.
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      if (!serverAvatar) return;
    }
    setAvatarSaving(true);
    setMessage(null);
    try {
      await customerApi.updateProfile({ remove_avatar: true });
      await refreshUser();
      setAvatarBroken(false);
      setMessage({ type: "success", text: "Profile photo removed." });
    } catch {
      setMessage({ type: "error", text: "Failed to remove photo." });
    } finally {
      setAvatarSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const inputCls =
    "w-full px-3.5 py-2.5 border border-border rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-200 box-border font-outfit bg-white";

  const initial = (user?.name || "U").trim().charAt(0).toUpperCase();
  const displayAvatar = avatarPreview || (!avatarBroken ? serverAvatar : null);

  return (
    <Card className="max-w-[860px]">
      {/* Profile header */}
      <div className="flex items-center gap-4 pb-5 border-b border-border">
        <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-orange-primary flex items-center justify-center text-white text-[26px] font-bold shrink-0">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={user?.name}
              className="w-full h-full object-cover"
              onError={() => setAvatarBroken(true)}
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[18px] font-bold text-text-primary m-0 tracking-[-0.3px]">{user?.name || "Customer"}</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold bg-orange-soft text-orange-deep">
              Member
            </span>
          </div>
          <div className="mt-1.5">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarSaving}
              className="text-[13px] font-semibold text-orange-primary hover:text-orange-deep bg-none border-none p-0 cursor-pointer flex items-center gap-1.5 font-outfit disabled:opacity-50"
            >
              <Camera size={14} />
              {avatarSaving ? "Uploading..." : "Change photo"}
            </button>
            {displayAvatar && (
              <button
                onClick={handleAvatarRemove}
                disabled={avatarSaving}
                className="mt-1 text-[13px] font-semibold text-danger hover:text-red-700 bg-none border-none p-0 cursor-pointer flex items-center gap-1.5 font-outfit disabled:opacity-50"
              >
                <Trash2 size={14} />
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <SectionTitle title="Personal Information" subtitle="Update your personal details and account information." />
        {message && (
          <div className={`text-sm px-3.5 py-2.5 rounded-[10px] mb-4 ${message.type === "success" ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 items-start">
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
              placeholder="+880 1X XXX XXX XX"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              value={user?.email || ""}
              readOnly
              tabIndex={-1}
              className={`${inputCls} bg-[#FAFAFA] text-text-muted cursor-not-allowed`}
            />
            <p className="text-[12px] text-text-light mt-1.5">Used for login — can't be changed here.</p>
          </div>
          <div />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-8 rounded-lg text-[15px] font-bold text-white transition cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 bg-orange-primary hover:bg-orange-deep font-outfit"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Change password view                                               */
/* ------------------------------------------------------------------ */

function PasswordView() {
  const [form, setForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (form.new_password !== form.new_password_confirmation) {
      setMessage({ type: "error", text: "New passwords do not match." });
      setSaving(false);
      return;
    }

    try {
      const res = await customerApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
        new_password_confirmation: form.new_password_confirmation,
      });
      setMessage({ type: "success", text: res.data.message });
      setForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    }
    setSaving(false);
  };

  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-text-light mb-1";
  const inputCls =
    "w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 placeholder:text-text-light font-outfit box-border";

  return (
    <Card className="max-w-lg">
      <SectionTitle title="Change Password" subtitle="Choose a strong password you don't use elsewhere" />
      {message && (
        <div className={`text-sm px-4 py-3 rounded-[10px] mb-4 ${message.type === "success" ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Current Password</label>
          <input
            type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>New Password</label>
          <input
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            className={inputCls}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className={labelCls}>Confirm New Password</label>
          <input
            type="password"
            value={form.new_password_confirmation}
            onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
            className={inputCls}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-all cursor-pointer font-outfit"
        >
          {saving ? "Changing..." : "Change Password"}
        </button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Reservations view                                                  */
/* ------------------------------------------------------------------ */

const RES_STATUS_COLOR = {
  pending: "#F97316",
  confirmed: "#16A34A",
  cancelled: "#DC2626",
  rejected: "#DC2626",
  completed: "#6B7280",
  no_show: "#374151",
};

const RES_STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  completed: "Completed",
  no_show: "No Show",
};

const RES_FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const RES_EMPTY_MESSAGE = {
  all: "Your reservations will appear here.",
  upcoming: "No upcoming reservations.",
  past: "No past reservations.",
  cancelled: "No cancelled reservations.",
};

const RES_STATUS_NOTE = {
  pending: "Your reservation request is awaiting restaurant confirmation.",
  confirmed: "Your reservation has been confirmed.",
};

const reservationDateLabel = (d) => {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
};

const formatReservationTime = (value) => {
  if (!value) return "—";
  const m = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(value);
  let h = Number(m[1]);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
};

const partySizeLabel = (size) => {
  const s = String(size ?? "");
  if (!s) return "—";
  return s === "8+ Guests" ? s : `${s} Guests`;
};

const reservationDateTime = (r) => {
  if (!r?.reservation_date || !r?.reservation_time) return null;
  const time = String(r.reservation_time).slice(0, 5);
  const d = new Date(`${r.reservation_date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const filterReservations = (list, filter) => {
  if (filter === "cancelled") return list.filter((r) => r.status === "cancelled");
  const now = Date.now();
  const when = (r) => reservationDateTime(r)?.getTime() ?? 0;
  if (filter === "upcoming") {
    return list.filter((r) => ["pending", "confirmed"].includes(r.status) && when(r) > now);
  }
  if (filter === "past") {
    return list.filter((r) => {
      if (r.status === "cancelled") return false;
      if (["completed", "no_show", "rejected"].includes(r.status)) return true;
      const t = when(r);
      return t > 0 && t <= now;
    });
  }
  return list;
};

function ResStatusBadge({ status }) {
  const color = RES_STATUS_COLOR[status] || "#9CA3AF";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-[3px] rounded-full whitespace-nowrap"
      style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
      {RES_STATUS_LABEL[status] || status}
    </span>
  );
}

function ResDetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-[13px] text-text-muted shrink-0">{label}</span>
      <span className="text-[13px] font-semibold text-text-primary text-right">{children}</span>
    </div>
  );
}

function ReservationDetailsModal({ reservation, onClose }) {
  if (!reservation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[17px] font-bold text-text-primary m-0">
                Reservation #{reservation.id}
              </h3>
              <ResStatusBadge status={reservation.status} />
            </div>
            <p className="text-[13px] text-text-muted mt-0.5 mb-0">
              {reservation.restaurant_name || "Restaurant"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-surface rounded-[13px] border border-border p-3.5 mt-4 divide-y divide-border">
          <ResDetailRow label="Restaurant">{reservation.restaurant_name || "Restaurant"}</ResDetailRow>
          <ResDetailRow label="Reservation ID">#{reservation.id}</ResDetailRow>
          <ResDetailRow label="Date">{reservationDateLabel(reservation.reservation_date)}</ResDetailRow>
          <ResDetailRow label="Time">{formatReservationTime(reservation.reservation_time)}</ResDetailRow>
          <ResDetailRow label="Guests">{partySizeLabel(reservation.party_size)}</ResDetailRow>
          {reservation.table_number != null && reservation.table_number !== "" && (
            <ResDetailRow label="Table">
              <span className="text-orange-deep">Table {reservation.table_number}</span>
            </ResDetailRow>
          )}
          <ResDetailRow label="Status">
            <ResStatusBadge status={reservation.status} />
          </ResDetailRow>
        </div>

        {reservation.special_requests && (
          <div className="mt-3.5">
            <p className="text-[12.5px] font-semibold text-text-muted m-0 mb-1">Special Requests</p>
            <p className="text-[13px] text-text-primary bg-surface border border-border rounded-[10px] px-3.5 py-2.5 m-0 leading-relaxed">
              "{reservation.special_requests}"
            </p>
          </div>
        )}

        {reservation.status === "pending" && (
          <p className="text-[12.5px] text-text-muted bg-orange-soft text-orange-deep rounded-[10px] px-3.5 py-2.5 leading-relaxed mt-3.5 mb-0">
            This request is still awaiting review by the restaurant. Your table will appear here once the
            restaurant confirms and assigns one.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold border border-border text-text-muted hover:text-text-primary hover:border-zinc-300 transition-colors cursor-pointer font-outfit bg-none"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function CancelReservationModal({ reservation, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  if (!reservation) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reservation.id);
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-sm shadow-2xl">
        <div className="w-11 h-11 rounded-full bg-red-50 text-danger flex items-center justify-center mb-3">
          <XCircle size={20} strokeWidth={2} />
        </div>
        <h3 className="text-[16px] font-bold text-text-primary mb-1">Cancel this reservation?</h3>
        <p className="text-[13px] text-text-muted mb-5">
          Are you sure you want to cancel your reservation at{" "}
          {reservation.restaurant_name || "this restaurant"}? This can't be undone.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit disabled:opacity-50"
          >
            Keep Reservation
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 bg-danger hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
          >
            {busy ? "Cancelling..." : "Cancel Reservation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReservationsView({ reservations, onCancel }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [cancelReservation, setCancelReservation] = useState(null);

  const cancellable = (r) => r.status === "pending" || r.status === "confirmed";
  const filtered = filterReservations(reservations, filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {RES_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors cursor-pointer font-outfit ${
              filter === f.key
                ? "bg-orange-primary text-white border-orange-primary"
                : "bg-card text-text-muted border-border hover:text-text-primary hover:border-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-orange-soft text-orange-deep flex items-center justify-center mx-auto mb-3">
            <CalendarClock size={22} strokeWidth={1.8} />
          </div>
          <p className="text-text-light text-[14px] mt-0 mb-4">{RES_EMPTY_MESSAGE[filter]}</p>
          <button
            onClick={() => navigate("/restaurants")}
            className="bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit transition-colors border-none"
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card rounded-[12px] px-4 py-3 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-[46px] h-[46px] rounded-[9px] bg-orange-soft text-orange-deep flex items-center justify-center shrink-0">
                  <CalendarClock size={19} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="text-[14.5px] font-bold text-text-primary truncate">
                      {r.restaurant_name || "Restaurant"}
                    </span>
                    <ResStatusBadge status={r.status} />
                  </div>
                  <div className="text-[13px] text-text-muted mb-0.5">
                    {reservationDateLabel(r.reservation_date)} · {formatReservationTime(r.reservation_time)} ·{" "}
                    {partySizeLabel(r.party_size)}
                  </div>
                  {r.special_requests && (
                    <div className="text-[12px] text-text-light truncate">"{r.special_requests}"</div>
                  )}
                  {RES_STATUS_NOTE[r.status] && (
                    <div className="text-[12px] text-text-light mt-0.5">{RES_STATUS_NOTE[r.status]}</div>
                  )}
                  <div className="text-[11.5px] text-text-light mt-1 flex items-center gap-2 flex-wrap">
                    <span>Reservation #{r.id}</span>
                    {r.table_number != null && r.table_number !== "" && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-orange-deep bg-orange-soft rounded-full px-2 py-[1px]">
                        Table {r.table_number}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 -mb-0.5">
                    <button
                      onClick={() => setDetailsReservation(r)}
                      className="text-[12px] font-semibold border border-border rounded-md px-2.5 py-1 cursor-pointer font-outfit text-text-muted hover:text-text-primary hover:border-zinc-300 transition-colors bg-none"
                    >
                      View Details
                    </button>
                    {cancellable(r) && (
                      <button
                        onClick={() => setCancelReservation(r)}
                        className="text-[12px] font-semibold border border-red-200 rounded-md px-2.5 py-1 cursor-pointer font-outfit text-danger hover:bg-rose-50 transition-colors bg-none"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReservationDetailsModal
        reservation={detailsReservation}
        onClose={() => setDetailsReservation(null)}
      />
      <CancelReservationModal
        reservation={cancelReservation}
        onClose={() => setCancelReservation(null)}
        onConfirm={onCancel}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notifications view                                                 */
/* ------------------------------------------------------------------ */

const NOTIF_ICON = {
  pending: Package,
  confirmed: Check,
  preparing: Clock,
  ready: Clock,
  picked_up: Bike,
  on_the_way: Bike,
  near_customer: MapPin,
  delivered: CheckCircle2,
  served: CheckCircle2,
  cancelled: XCircle,
  rejected: XCircle,
  no_show: Clock,
  completed: CheckCircle2,
};

function timeAgo(date) {
  if (!date) return "";
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function buildNotifications(orders, reservations = []) {
  const orderNotifs = orders
    .filter((o) => o.status !== "cancelled")
    .map((o) => ({
      id: o.id,
      key: `${o.id}:${o.status}`,
      status: o.status,
      message: `Order #${o.id} ${STATUS_LABEL[o.status]?.toLowerCase() || o.status}`,
      restaurant: o.restaurant?.restaurant_name,
      time: o.updated_at || o.created_at,
    }));

  const resNotifs = reservations
    .filter((r) => ["confirmed", "rejected", "no_show", "completed"].includes(r.status))
    .map((r) => {
      const label = RES_STATUS_LABEL[r.status]?.toLowerCase() || r.status;
      const tableBit = r.status === "confirmed" && r.table_number ? ` — Table ${r.table_number} assigned` : "";
      return {
        id: r.id,
        type: "reservation",
        key:
          r.status === "confirmed"
            ? `res-${r.id}:confirmed:t${r.table_number ?? 0}`
            : `res-${r.id}:${r.status}`,
        status: r.status,
        message: `Reservation at ${r.restaurant_name || "restaurant"} ${label}${tableBit}`,
        restaurant: r.restaurant_name,
        time: r.updated_at || r.created_at,
      };
    });

  return [...orderNotifs, ...resNotifs].sort((a, b) => new Date(b.time) - new Date(a.time));
}

const READ_NOTIFS_KEY = "swiftbite_read_notifs";

function loadReadNotifs() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(READ_NOTIFS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveReadNotifs(set) {
  try {
    window.localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable */
  }
}

function NotificationsView({ notifications, unreadSet, onOpen, onMarkAllRead }) {
  const unreadCount = notifications.filter((n) => unreadSet.has(n.key)).length;

  return (
    <div className="flex flex-col gap-2.5 mb-5">
      {notifications.length === 0 && (
        <EmptyState message="No notifications yet — order updates will appear here" />
      )}

      {notifications.length > 0 && unreadCount > 0 && (
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[13px] font-semibold text-text-muted">
            {unreadCount} unread
          </span>
          <button
            onClick={onMarkAllRead}
            className="text-[13px] text-orange-primary font-semibold bg-none border-none cursor-pointer font-outfit hover:text-orange-deep transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.map((n) => {
        const Icon = NOTIF_ICON[n.status] || Bell;
        const color = STATUS_COLOR[n.status] || "#9CA3AF";
        const unread = unreadSet.has(n.key);
        return (
          <div
            key={n.key}
            onClick={() => onOpen(n)}
            className={`bg-card rounded-[12px] px-4 py-3.5 border flex items-center gap-3.5 transition-colors duration-150 cursor-pointer ${
              unread ? "bg-orange-soft/40 border-orange-primary/30" : "border-border hover:border-zinc-300"
            }`}
          >
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${color}1A`, color }}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[14px] truncate ${unread ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>
                {n.message}
              </div>
              {n.restaurant && <div className="text-[13px] text-text-muted truncate">{n.restaurant}</div>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] text-text-light">{timeAgo(n.time)}</span>
              {unread && (
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: ORANGE }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payments view                                                      */
/* ------------------------------------------------------------------ */

const PAYMENT_METHOD_LABEL = {
  bkash: "bKash",
  card: "Card",
  cod: "Cash on Delivery",
};

function PaymentsView({ orders }) {
  const methods = orders.reduce((acc, o) => {
    const m = o.payment_method || "cod";
    acc[m] = acc[m] || { method: m, count: 0, total: 0, paid: 0 };
    acc[m].count += 1;
    acc[m].total += Number(o.total || 0);
    if (o.payment_status === "paid") acc[m].paid += Number(o.total || 0);
    return acc;
  }, {});

  const methodList = Object.values(methods);
  const recent = orders.slice(0, 8);

  return (
    <div>
      {methodList.length === 0 && <EmptyState message="No payments yet — your transaction history will show here" />}

      {methodList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          {methodList.map((m) => (
            <div key={m.method} className="bg-card rounded-[13px] border border-border px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-orange-soft text-orange-deep flex items-center justify-center mb-3">
                <CreditCard size={18} strokeWidth={2} />
              </div>
              <div className="text-[15px] font-bold text-text-primary mb-0.5">
                {PAYMENT_METHOD_LABEL[m.method] || m.method}
              </div>
              <div className="text-[13px] text-text-muted">{m.count} order{m.count > 1 ? "s" : ""}</div>
              <div className="text-[13px] text-text-light mt-1">
                {formatPrice(m.total)}{m.paid > 0 ? ` paid · ${formatPrice(m.paid)}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <Card className="overflow-hidden">
          <SectionTitle title="Recent transactions" subtitle="From your past orders" />
          <div className="flex flex-col">
            {recent.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3.5 px-4 py-3 border-b border-[#F3F4F6] last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-text-primary truncate">
                    {o.restaurant?.restaurant_name || "Order"}
                  </div>
                  <div className="text-[12px] text-text-light">
                    {orderDate(o)} · <span className="font-mono">#{o.id}</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-text-muted">
                  {PAYMENT_METHOD_LABEL[o.payment_method] || "COD"}
                </span>
                <span
                  className={`text-[12px] font-bold ${
                    o.payment_status === "paid" ? "text-success" : "text-amber-600"
                  }`}
                >
                  {o.payment_status === "paid" ? "Paid" : "Unpaid"}
                </span>
                <span className="text-[14px] font-extrabold font-mono text-text-primary w-20 text-right">
                  {formatPrice(o.total)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-text-light px-4 py-3 border-t border-[#F3F4F6]">
            Online payments are processed securely via SSLCommerz at checkout.
          </p>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings view                                                      */
/* ------------------------------------------------------------------ */

const SETTINGS_ITEMS = [
  { key: "orderNotifs", label: "Order notifications", desc: "Push alerts for order updates.", initial: true },
  { key: "promoEmails", label: "Promo emails", desc: "Get exclusive offers and discounts.", initial: true },
  { key: "smsUpdates", label: "SMS updates", desc: "Delivery status by SMS.", initial: false },
];

function SettingsView() {
  const [toggles, setToggles] = useState(() => {
    const saved = window.localStorage.getItem("swiftbite_settings");
    const parsed = saved ? JSON.parse(saved) : {};
    return SETTINGS_ITEMS.reduce((acc, s) => {
      acc[s.key] = parsed[s.key] ?? s.initial;
      return acc;
    }, {});
  });
  const [savedMsg, setSavedMsg] = useState(false);

  const flip = (key) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  const save = () => {
    window.localStorage.setItem("swiftbite_settings", JSON.stringify(toggles));
    setSavedMsg(true);
    window.setTimeout(() => setSavedMsg(false), 2200);
  };

  return (
    <Card className="max-w-xl">
      <SectionTitle title="Settings" subtitle="Preferences are saved on this device" />
      {savedMsg && (
        <div className="text-sm px-3.5 py-2.5 rounded-[10px] mb-4 bg-green-50 text-success">Settings saved.</div>
      )}
      <div className="space-y-4">
        {SETTINGS_ITEMS.map((s) => {
          const on = toggles[s.key];
          return (
            <div key={s.key} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-text-primary">{s.label}</p>
                <p className="text-[13px] text-text-muted">{s.desc}</p>
              </div>
              <button
                onClick={() => flip(s.key)}
                aria-label={s.label}
                className={`w-12 h-7 rounded-full relative transition-colors shrink-0 cursor-pointer ${
                  on ? "bg-orange-primary" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                    on ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
        <button
          onClick={save}
          className="bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-all cursor-pointer font-outfit"
        >
          Save Settings
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-[2000] animate-fade-in-up">
      <div className={`px-5 py-3 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center gap-2.5 ${
        toast.type === "error" ? "bg-danger text-white" : "bg-success text-white"
      }`}>
        <span className="text-sm font-semibold">{toast.msg}</span>
      </div>
    </div>
  );
}

function SidebarAvatar({ name, src }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBroken(false);
  }, [src]);
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        className="w-[42px] h-[42px] rounded-full object-cover shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div
      className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-bold text-[17px] shrink-0"
      style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #EA580C 100%)` }}
    >
      {(name || "R").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function CustomerDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { cart, addItem, itemCount } = useCart();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const [active, setActive] = useState(() => {
    const tab = searchParams.get("tab");
    return ["orders", "favorites", "addresses", "profile", "password", "reservations", "payments", "notifications", "settings"].includes(tab) ? tab : "orders";
  });
  const [tab, setTab] = useState("active");
  const [cartOpen, setCartOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const loadOrders = useCallback(async () => {
    try {
      const res = await customerApi.getOrders();
      setOrders(res.data.orders || []);
    } catch {
      /* keep previous */
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const [favRes, wishRes] = await Promise.all([
        customerApi.getFavorites(),
        customerApi.getWishlistItems(),
      ]);
      setFavorites(favRes.data.favorites || []);
      setWishlist(wishRes.data.wishlist_items || []);
    } catch {
      /* keep previous */
    }
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await customerApi.getAddresses();
      setAddresses(res.data.addresses || []);
    } catch {
      /* keep previous */
    }
  }, []);

  const loadReservations = useCallback(async () => {
    try {
      const res = await reservationApi.getMine();
      setReservations(res.data.reservations || []);
    } catch {
      /* keep previous */
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      customerApi.getOverview().then((r) => setOverview(r.data)).catch(() => {});
      loadOrders();
      loadFavorites();
      loadAddresses();
      loadReservations();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadOrders, loadFavorites, loadAddresses, loadReservations]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleReorder = async (order) => {
    const restaurantId = order.restaurant?.id;
    const restaurantName = order.restaurant?.restaurant_name;
    if (!restaurantId || !(order.items || []).length) {
      showToast("Nothing to reorder", "error");
      return;
    }
    if (cart.restaurantId && cart.restaurantId !== restaurantId) {
      const ok = window.confirm(
        `Your cart has items from ${cart.restaurantName || "another restaurant"}. Reorder items from ${restaurantName} and replace the cart?`
      );
      if (!ok) return;
    }
    try {
      for (const item of order.items) {
        addItem(restaurantId, restaurantName, {
          id: item.menu_item_id,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
        });
      }
      showToast("Items added to your cart");
      navigate("/checkout");
    } catch {
      showToast("Failed to reorder", "error");
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await customerApi.cancelOrder(orderId);
      showToast("Order cancelled");
      loadOrders();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel", "error");
    }
  };

  const handleSupport = async () => {
    await new Promise((r) => window.setTimeout(r, 600));
    showToast("Support request sent — we'll get back to you soon");
  };

  const handleRemoveFavorite = async (restaurantId) => {
    if (!confirm("Remove from favorites?")) return;
    try {
      await customerApi.removeFavorite(restaurantId);
      loadFavorites();
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const handleRemoveWishlist = async (menuItemId) => {
    if (!confirm("Remove from wishlist?")) return;
    try {
      await customerApi.removeWishlistItem(menuItemId);
      loadFavorites();
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const handleCancelReservation = async (id) => {
    try {
      await reservationApi.cancel(id);
      showToast("Reservation cancelled");
      loadReservations();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel", "error");
    }
  };

  const handleReview = async (data) => {
    await customerApi.submitReview(data);
    showToast("Thanks! Review submitted");
  };

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const notifications = buildNotifications(orders, reservations);
  const [readSet, setReadSet] = useState(() => loadReadNotifs());

  const unreadSet = new Set(
    notifications.map((n) => n.key).filter((key) => !readSet.has(key))
  );
  const unreadCount = unreadSet.size;

  const markRead = (key) => {
    setReadSet((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      saveReadNotifs(next);
      return next;
    });
  };

  const markAllRead = () => {
    if (notifications.length === 0) return;
    setReadSet((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.key));
      saveReadNotifs(next);
      return next;
    });
  };

  const handleNavigate = (key) => {
    if (key === "browse") {
      navigate("/restaurants");
      return;
    }
    if (key === "notifications") markAllRead();
    setActive(key);
  };

  const handleOpenNotification = (n) => {
    markRead(n.key);
    if (n.type === "reservation") {
      setActive("reservations");
      return;
    }
    navigate(`/order/tracking/${n.id}`);
  };

  const navItems = [
    { key: "browse", label: "Browse Food", icon: Utensils },
    { key: "orders", label: "My Orders", icon: Package, badge: activeOrders.length || undefined },
    { key: "favorites", label: "Favorites", icon: Heart },
    { key: "reservations", label: "Reservations", icon: CalendarClock },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Change Password", icon: KeyRound },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell, badge: unreadCount > 9 ? "9+" : unreadCount || undefined },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const sections = {
    orders: { title: "My Orders", subtitle: "Track active deliveries and view your order history." },
    favorites: { title: "Favorites", subtitle: "Restaurants and dishes you love." },
    reservations: { title: "My Reservations", subtitle: "Manage your dine-in reservations across restaurants." },
    addresses: { title: "Saved Addresses", subtitle: "Your delivery spots, one tap away." },
    profile: { title: "Profile", subtitle: "Manage your account details." },
    password: { title: "Change Password", subtitle: "Keep your account secure." },
    payments: { title: "Payments", subtitle: "Payment methods and history." },
    notifications: { title: "Notifications", subtitle: "Order updates and offers." },
    settings: { title: "Settings", subtitle: "Preferences saved on this device." },
  };

  const profileSection = (collapsed) =>
    collapsed ? null : (
      <div className="px-[18px] py-5 border-b border-[#1A1D27]">
        <div className="flex items-center gap-2.5">
          <SidebarAvatar name={user?.name} src={resolveAssetUrl(user?.avatar_url)} />
          <div className="min-w-0">
            <div className="text-[#F9FAFB] font-bold text-[15px] leading-tight truncate">
              {user?.name || "Customer"}
            </div>
            <div className="text-[#4B5563] text-[12px] mt-0.5">Member</div>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <Toast toast={toast} />
      <DashboardLayout
        brandSubtitle="My Account"
        profileSection={profileSection}
        navItems={navItems}
        active={active}
        onNavigate={handleNavigate}
        title={sections[active].title}
        subtitle={sections[active].subtitle}
        userName={user?.name || "Customer"}
        userRole="Member"
        userAvatar={resolveAssetUrl(user?.avatar_url)}
        onLogout={handleLogout}
        collapsible={false}
        topbarRight={
          itemCount > 0 ? (
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative w-[38px] h-[38px] bg-card border border-border rounded-[9px] flex items-center justify-center cursor-pointer text-text-muted hover:text-text-primary transition-colors"
            >
              <ShoppingCart size={17} strokeWidth={1.8} />
              <span className="absolute -top-1.5 -right-1.5 bg-orange-primary text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] px-1 flex items-center justify-center">
                {itemCount}
              </span>
            </button>
          ) : undefined
        }
      >
        {active === "orders" && (
          <OrdersView
            orders={orders}
            overview={overview}
            tab={tab}
            setTab={setTab}
            onReorder={handleReorder}
            onCancel={handleCancel}
            onReview={handleReview}
            onSupport={handleSupport}
          />
        )}
        {active === "favorites" && (
          <FavoritesView
            favorites={favorites}
            wishlist={wishlist}
            onRemoveFavorite={handleRemoveFavorite}
            onRemoveWishlist={handleRemoveWishlist}
          />
        )}
        {active === "addresses" && <AddressesView addresses={addresses} onSaved={loadAddresses} />}
        {active === "profile" && <ProfileView user={user} refreshUser={refreshUser} />}
        {active === "password" && <PasswordView />}
        {active === "reservations" && (
          <ReservationsView reservations={reservations} onCancel={handleCancelReservation} />
        )}
        {active === "payments" && <PaymentsView orders={orders} />}
        {active === "notifications" && (
          <NotificationsView
            notifications={notifications}
            unreadSet={unreadSet}
            onOpen={handleOpenNotification}
            onMarkAllRead={markAllRead}
          />
        )}
        {active === "settings" && <SettingsView />}
      </DashboardLayout>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}