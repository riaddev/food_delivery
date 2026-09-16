import { useState, useEffect, useCallback, useRef } from "react";
import { ClipboardList, MapPin, RefreshCw, UtensilsCrossed, Bike, X, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

// Free ding using WebAudio — no audio file needed. Only rings on new pending orders.
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

const STATUS_FLOW = [
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-600" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-600" },
  { value: "preparing", label: "Preparing", color: "bg-purple-50 text-purple-600" },
  { value: "ready", label: "Ready", color: "bg-cyan-50 text-cyan-600" },
  { value: "assigned", label: "Rider Assigned", color: "bg-indigo-50 text-indigo-600" },
  { value: "picked_up", label: "Picked Up", color: "bg-violet-50 text-violet-600" },
  { value: "on_the_way", label: "On the Way", color: "bg-indigo-50 text-indigo-600" },
  { value: "near_customer", label: "Near Customer", color: "bg-amber-50 text-amber-600" },
  { value: "served", label: "Served", color: "bg-emerald-50 text-emerald-600" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-50 text-emerald-600" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-500" },
];

const statusColor = (s) => STATUS_FLOW.find((x) => x.value === s)?.color || "bg-zinc-50 text-zinc-500";
const statusLabel = (s) => STATUS_FLOW.find((x) => x.value === s)?.label || s;

const RESTAURANT_ACTIONABLE = new Set(["pending", "confirmed", "preparing", "ready"]);

const nextActions = (status, orderType) => {
  if (status === "pending") return [{ to: "confirmed", label: "Accept Order" }];
  if (status === "confirmed") return [{ to: "preparing", label: "Start Preparing" }];
  if (status === "preparing") return [{ to: "ready", label: "Mark Ready" }];
  if (status === "ready" && orderType === "dine_in") return [{ to: "served", label: "Mark Served" }];
  if (status === "ready" && orderType === "takeout") return [{ to: "delivered", label: "Mark Picked Up" }];
  return [];
};

const paymentMethodLabel = (m) => {
  if (m === "bkash") return "bKash";
  if (m === "card") return "Card";
  return "Cash on Delivery";
};

const formatDate = (d) => new Date(d).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const RESTAURANT_FILTERS = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];

function CancelConfirmModal({ order, onConfirm, onCancel, loading }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary text-lg">Cancel Order</h3>
          <button onClick={onCancel} className="text-text-light hover:text-text-primary cursor-pointer"><X size={20} /></button>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-text-primary font-medium">
              Are you sure you want to cancel Order #{order.id}?
            </p>
            <p className="text-xs text-text-muted mt-1">
              This action cannot be undone. The customer will be notified.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:border-zinc-300 hover:text-text-primary transition disabled:opacity-50 cursor-pointer"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const [assignModal, setAssignModal] = useState(null);
  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [muted, setMuted] = useState(false);
  const prevPendingRef = useRef(null); // null = first load, no ding yet
  const audioRef = useRef(null);
  const mutedRef = useRef(false);

  const [cancelModal, setCancelModal] = useState(null);

  const load = useCallback((opts = {}) => {
    restaurantApi.getOrders()
      .then((r) => {
        const list = r.data.orders || [];
        setOrders(list);
        // Ding only when a NEW pending order appears after first load.
        const pendingIds = new Set(list.filter((o) => o.status === "pending").map((o) => o.id));
        if (prevPendingRef.current && !mutedRef.current) {
          const isNew = [...pendingIds].some((id) => !prevPendingRef.current.has(id));
          if (isNew) playDing(audioRef);
        }
        prevPendingRef.current = pendingIds;
      })
      .catch(() => { if (!opts.silent) setError("Failed to load orders"); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Auto-refresh every 15s so new orders appear without manual reload.
  // Pauses when tab hidden; cleaned up on unmount.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      load({ silent: true });
    }, 15000);
    return () => clearInterval(t);
  }, [load]);

  const handleStatus = async (order, status) => {
    setUpdatingId(order.id);
    setError(null);
    try {
      await restaurantApi.updateOrderStatus(order.id, status);
      load();
    } catch {
      setError("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openAssignModal = async (order) => {
    setAssignModal(order);
    setRidersLoading(true);
    try {
      const res = await restaurantApi.getAvailableRiders();
      setRiders(res.data.riders);
    } catch {
      setError("Failed to load available riders");
    } finally {
      setRidersLoading(false);
    }
  };

  const handleAssignRider = async (riderId) => {
    if (!assignModal) return;
    setAssigning(true);
    try {
      await restaurantApi.assignRider(assignModal.id, riderId);
      setAssignModal(null);
      setRiders([]);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign rider");
    } finally {
      setAssigning(false);
    }
  };

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-[13px] border border-border p-6 animate-pulse">
            <div className="h-5 bg-zinc-100 rounded w-40 mb-3" />
            <div className="h-4 bg-zinc-100 rounded w-full mb-2" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${filter === "all" ? "bg-orange-primary text-white" : "bg-card text-text-muted border border-border hover:text-text-primary"}`}>
          All ({orders.length})
        </button>
        {RESTAURANT_FILTERS.map((f) => {
          const count = orders.filter((o) => o.status === f).length;
          if (count === 0 && !["pending", "confirmed", "preparing", "ready"].includes(f)) return null;
          return (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap capitalize transition-all cursor-pointer ${filter === f ? "bg-orange-primary text-white" : "bg-card text-text-muted border border-border hover:text-text-primary"}`}>
              {f.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? "Turn new-order sound on" : "Mute new-order sound"}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border border-border bg-card text-text-muted hover:text-text-primary cursor-pointer shrink-0"
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {muted ? "Muted" : "Sound on"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }} className="inline-flex items-center gap-1.5 font-semibold hover:text-red-700 cursor-pointer"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card rounded-[13px] border border-border py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-soft flex items-center justify-center text-orange-deep mb-4">
            <ClipboardList size={26} />
          </div>
          <p className="font-semibold text-text-primary mb-1">No orders yet</p>
          <p className="text-sm text-text-muted">When customers order from your restaurant, they'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((order) => {
            const actions = nextActions(order.status, order.order_type);
            const showAssign = order.status === "ready" && order.order_type === "delivery" && !order.rider;
            const canCancel = RESTAURANT_ACTIONABLE.has(order.status);

            return (
              <div key={order.id} className="bg-card rounded-[13px] border border-border p-4 md:p-6 transition-all duration-300 hover:border-zinc-300">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-bold text-text-primary">Order #{order.id}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      {order.needs_review && order.status !== "cancelled" && (
                        <span title={order.review_reason || "Bulk order — please confirm with customer"} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">
                          <AlertTriangle size={12} /> Needs review
                        </span>
                      )}
                      {order.order_type === "dine_in" && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <UtensilsCrossed size={12} /> Dine-In{order.table_number ? ` · Table ${order.table_number}` : ""}
                        </span>
                      )}
                      {order.tracking_code && (
                        <span className="text-xs font-mono text-text-light bg-zinc-50 px-2 py-0.5 rounded">
                          {order.tracking_code}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-muted">
                      {order.customer_name}{order.customer_phone ? ` · ${order.customer_phone}` : ""} · {formatDate(order.created_at)}
                    </p>
                    {order.payment_method && (
                      <p className="text-xs text-text-light mt-1.5">
                        {paymentMethodLabel(order.payment_method)} · {order.payment_status === "paid" ? "Paid" : order.order_type === "dine_in" ? "Pay at table" : "Pay on delivery"} · {order.order_type === "dine_in" ? "No delivery fee" : `Delivery ${order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}`}
                      </p>
                    )}
                    {order.rider && (
                      <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
                        <Bike size={11} /> Rider: {order.rider.name} · {order.rider.phone}
                      </p>
                    )}
                    {order.needs_review && order.review_reason && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-2">
                        {order.review_reason}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-text-primary text-lg font-mono tracking-tight">{formatPrice(order.total)}</p>
                </div>

                <div className="bg-surface rounded-[13px] p-4 mb-4 border border-border">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-text-primary">{item.name} <span className="text-text-light">× {item.quantity}</span></span>
                      <span className="font-semibold text-text-primary font-mono">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                    </div>
                  ))}
                  {order.delivery_address && (
                    <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border flex items-center gap-1.5">
                      <MapPin size={12} className="text-orange-primary shrink-0" /> {order.delivery_address}
                    </p>
                  )}
                </div>

                {(actions.length > 0 || showAssign || canCancel) && (
                  <div className="flex flex-wrap gap-2.5">
                    {showAssign && (
                      <button
                        onClick={() => openAssignModal(order)}
                        className="text-sm font-semibold px-4 py-2 rounded-full bg-indigo-500 text-white border border-indigo-500 hover:bg-indigo-600 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Bike size={14} /> Assign Rider
                      </button>
                    )}
                    {actions.map((a) => (
                      <button
                        key={a.to}
                        onClick={() => handleStatus(order, a.to)}
                        disabled={updatingId === order.id}
                        className="text-sm font-semibold px-4 py-2 rounded-full bg-orange-primary text-white border border-orange-primary hover:bg-orange-deep transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {updatingId === order.id ? "Updating..." : a.label}
                      </button>
                    ))}
                    {canCancel && (
                      <button
                        onClick={() => setCancelModal(order)}
                        disabled={updatingId === order.id}
                        className="text-sm font-semibold px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                    {!RESTAURANT_ACTIONABLE.has(order.status) && order.status !== "delivered" && order.status !== "cancelled" && (
                      <span className="text-xs text-text-light italic self-center">
                        {["assigned", "picked_up", "on_the_way", "near_customer", "served"].includes(order.status)
                          ? "Rider is handling delivery"
                          : "Waiting for next step"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setAssignModal(null); setRiders([]); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary text-lg">Assign Rider · Order #{assignModal.id}</h3>
              <button onClick={() => { setAssignModal(null); setRiders([]); }} className="text-text-light hover:text-text-primary cursor-pointer"><X size={20} /></button>
            </div>

            {ridersLoading ? (
              <div className="py-8 text-center text-sm text-text-muted">Loading available riders...</div>
            ) : riders.length === 0 ? (
              <div className="py-8 text-center">
                <Bike size={32} className="text-text-light mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-primary mb-0.5">No riders available</p>
                <p className="text-xs text-text-muted">All riders are currently on delivery or offline.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {riders.map((rider) => (
                  <button
                    key={rider.id}
                    onClick={() => handleAssignRider(rider.id)}
                    disabled={assigning}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-indigo-300 hover:bg-indigo-50/50 transition disabled:opacity-50 cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-text-primary">{rider.user?.name || "Unknown"}</p>
                      <p className="text-xs text-text-muted">{rider.phone}</p>
                    </div>
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {assigning ? "Assigning..." : "Assign"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CancelConfirmModal
        order={cancelModal}
        loading={updatingId === cancelModal?.id}
        onConfirm={() => {
          if (cancelModal) handleStatus(cancelModal, "cancelled").then(() => setCancelModal(null));
        }}
        onCancel={() => setCancelModal(null)}
      />
    </div>
  );
}
