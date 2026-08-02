import { useState, useEffect } from "react";
import { ClipboardList, MapPin, RefreshCw } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const STATUS_FLOW = [
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-600" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-600" },
  { value: "preparing", label: "Preparing", color: "bg-purple-50 text-purple-600" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-indigo-50 text-indigo-600" },
  { value: "delivered", label: "Delivered", color: "bg-emerald-50 text-emerald-600" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-500" },
];

const statusColor = (status) => STATUS_FLOW.find((s) => s.value === status)?.color || "bg-zinc-50 text-zinc-500";
const statusLabel = (status) => STATUS_FLOW.find((s) => s.value === status)?.label || status;

const formatDate = (date) => new Date(date).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const AppliedOrders = ["confirmed", "preparing", "out_for_delivery"];

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");

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

  const filtered = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);

  const filters = ["all", "pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
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
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Live Orders</h1>
      <p className="text-zinc-400 mb-6">Track and update every order coming in.</p>

      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filter === "all" ? "bg-zinc-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]" : "bg-white text-zinc-500 hover:text-zinc-900 shadow-sm"}`}>
          All ({orders.length})
        </button>
        {filters.filter((f) => f !== "all").map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap capitalize transition-all ${filter === f ? "bg-zinc-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]" : "bg-white text-zinc-500 hover:text-zinc-900 shadow-sm"}`}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }} className="inline-flex items-center gap-1.5 font-semibold hover:text-red-700"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl py-20 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
            <ClipboardList size={26} />
          </div>
          <p className="font-semibold text-zinc-700 mb-1">No orders yet</p>
          <p className="text-sm text-zinc-400">When customers order from your restaurant, they'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-extrabold text-zinc-900">Order #{order.id}</span>
                    {order.status === "pending" && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {order.customer_name}{order.customer_phone ? ` · ${order.customer_phone}` : ""} · {formatDate(order.created_at)}
                  </p>
                </div>
                <p className="font-extrabold text-zinc-900 text-lg">{formatPrice(order.total)}</p>
              </div>

              <div className="bg-[#F8F9FA] rounded-2xl p-4 mb-4 border border-zinc-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-zinc-700">{item.name} <span className="text-zinc-400">× {item.quantity}</span></span>
                    <span className="font-semibold text-zinc-700">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                  </div>
                ))}
                {order.delivery_address && (
                  <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-100 flex items-center gap-1.5">
                    <MapPin size={12} className="text-red-500 shrink-0" /> {order.delivery_address}
                  </p>
                )}
              </div>

              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="flex flex-wrap gap-2.5">
                  {AppliedOrders.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatus(order, s)}
                      disabled={updatingId === order.id || s === order.status}
                      className={`text-sm font-semibold px-4 py-2 rounded-full border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                        s === order.status
                          ? "bg-red-500 text-white border-red-500"
                          : s === "out_for_delivery"
                            ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
                            : "border-zinc-300 text-zinc-700 hover:border-red-500 hover:text-red-500"
                      }`}
                    >
                      {updatingId === order.id ? "Updating..." : statusLabel(s)}
                    </button>
                  ))}
                  <button
                    onClick={() => handleStatus(order, "cancelled")}
                    disabled={updatingId === order.id}
                    className="text-sm font-semibold px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}