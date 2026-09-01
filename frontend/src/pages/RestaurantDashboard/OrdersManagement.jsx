import { useState, useEffect } from "react";
import { ClipboardList, MapPin, RefreshCw, UtensilsCrossed, Bike, X } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

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

const statusColor = (status) => STATUS_FLOW.find((s) => s.value === status)?.color || "bg-zinc-50 text-zinc-500";
const statusLabel = (status) => STATUS_FLOW.find((s) => s.value === status)?.label || status;

const paymentMethodLabel = (method) => {
  if (method === "bkash") return "bKash";
  if (method === "card") return "Card";
  return "Cash on Delivery";
};

const formatDate = (date) => new Date(date).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const appliedStatuses = (order) =>
  order.order_type === "dine_in"
    ? ["confirmed", "preparing", "ready", "served"]
    : ["confirmed", "preparing", "ready"];

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

  const load = () => {
    restaurantApi.getOrders()
      .then((r) => setOrders(r.data.orders))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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

  const filters = ["all", "pending", "confirmed", "preparing", "ready", "assigned", "on_the_way", "near_customer", "served", "delivered", "cancelled"];

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
        {filters.filter((f) => f !== "all").map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap capitalize transition-all cursor-pointer ${filter === f ? "bg-orange-primary text-white" : "bg-card text-text-muted border border-border hover:text-text-primary"}`}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
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
          {filtered.map((order) => (
            <div key={order.id} className="bg-card rounded-[13px] border border-border p-4 md:p-6 transition-all duration-300 hover:border-zinc-300">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-bold text-text-primary">Order #{order.id}</span>
                    {order.status === "pending" && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-dot" /> Pending
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
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

              {order.status !== "delivered" && order.status !== "served" && order.status !== "cancelled" && (
                <div className="flex flex-wrap gap-2.5">
                  {order.status === "ready" && order.order_type !== "dine_in" && !order.rider && (
                    <button
                      onClick={() => openAssignModal(order)}
                      className="text-sm font-semibold px-4 py-2 rounded-full bg-indigo-500 text-white border border-indigo-500 hover:bg-indigo-600 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Bike size={14} /> Assign Rider
                    </button>
                  )}
                  {appliedStatuses(order).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatus(order, s)}
                      disabled={updatingId === order.id || s === order.status}
                      className={`text-sm font-semibold px-4 py-2 rounded-full border transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                        s === order.status
                          ? "bg-orange-primary text-white border-orange-primary"
                          : s === "on_the_way" || s === "served"
                            ? "bg-text-primary text-white border-text-primary hover:bg-zinc-800"
                            : "border-border text-text-muted hover:border-orange-primary hover:text-orange-primary"
                      }`}
                    >
                      {updatingId === order.id ? "Updating..." : statusLabel(s)}
                    </button>
                  ))}
                  <button
                    onClick={() => handleStatus(order, "cancelled")}
                    disabled={updatingId === order.id}
                    className="text-sm font-semibold px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
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
    </div>
  );
}
