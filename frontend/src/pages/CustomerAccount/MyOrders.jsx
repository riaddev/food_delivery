import { useEffect, useState } from "react";
import { RefreshCw, ChevronDown, ChevronUp, MapPin, Clock3 } from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";
import { formatPrice, formatDateTime, restaurantImage } from "../../utils/foodImages";

const STATUSES = [
  { id: "Ongoing", label: "Ongoing" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const statusColors = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  preparing: "bg-purple-50 text-purple-600",
  out_for_delivery: "bg-indigo-50 text-indigo-600",
  delivered: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-red-50 text-red-500",
};

const statusLabel = (s = "") => s.replace(/_/g, " ");

const statusFlow = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Ongoing");
  const [expandedId, setExpandedId] = useState(null);
  const [reordering, setReordering] = useState(null);

  useEffect(() => {
    customerApi.getOrders()
      .then((res) => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (filter === "Ongoing") return !["delivered", "cancelled"].includes(o.status);
    return o.status === filter;
  });

  const handleReorder = async (orderId) => {
    setReordering(orderId);
    try {
      await customerApi.reorder(orderId);
      const res = await customerApi.getOrders();
      setOrders(res.data.orders);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reorder");
    }
    setReordering(null);
  };

  const stepIndex = (status) => {
    const i = statusFlow.indexOf(status);
    return i >= 0 ? i : 0;
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Your Orders</h1>
        <p className="text-zinc-400 mt-1">Track or reorder your favorite meals.</p>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-8">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              filter === s.id
                ? "bg-zinc-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                : "bg-white text-zinc-500 shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:text-zinc-900"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 animate-pulse flex gap-5">
              <div className="w-28 h-28 rounded-2xl bg-zinc-100 shrink-0" />
              <div className="flex-1">
                <div className="h-5 bg-zinc-100 rounded w-40 mb-3" />
                <div className="h-4 bg-zinc-100 rounded w-56 mb-2" />
                <div className="h-8 bg-zinc-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl py-20 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
            <Clock3 size={28} />
          </div>
          <p className="font-semibold text-zinc-700 mb-1">No {filter.toLowerCase()} orders</p>
          <p className="text-sm text-zinc-400">Orders in this category will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center gap-5 p-5 text-left"
                >
                  <img src={restaurantImage(order.restaurant?.restaurant_name)} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-zinc-900 truncate">{order.restaurant?.restaurant_name || "Restaurant"}</p>
                      <span className="text-zinc-300">·</span>
                      <span className="text-sm font-semibold text-zinc-950">#{order.id}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2.5">{formatDateTime(order.created_at)} · {order.items.length} item(s)</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || "bg-zinc-50 text-zinc-500"}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-xl font-extrabold tracking-tight text-zinc-900">{formatPrice(order.total)}</span>
                    {expanded ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-zinc-50 bg-[#FCFCFD] px-6 py-5 space-y-5">
                    {!["delivered", "cancelled"].includes(order.status) && (
                      <div>
                        <p className="font-semibold text-sm text-zinc-700 mb-3">Order Progress</p>
                        <div className="flex items-center gap-1">
                          {statusFlow.map((s, i) => {
                            const stepIdx = stepIndex(order.status);
                            const complete = i <= stepIdx;
                            return (
                              <div key={s} className="flex items-center flex-1">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${complete ? "bg-red-500 text-white" : "bg-zinc-200 text-zinc-400"}`}>
                                  {i + 1}
                                </div>
                                {i < statusFlow.length - 1 && (
                                  <div className={`h-0.5 flex-1 mx-1 rounded ${i < stepIdx ? "bg-red-500" : "bg-zinc-200"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-400 mt-2">
                          {statusFlow.map((s) => (
                            <span key={s} className="capitalize">{statusLabel(s)}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-50">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                          <span className="text-zinc-700">{item.name} × {item.quantity}</span>
                          <span className="font-semibold text-zinc-900">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>

                    {order.delivery_address && (
                      <p className="text-sm text-zinc-500 flex items-start gap-2">
                        <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                        <span>{order.delivery_address}</span>
                      </p>
                    )}

                    <button
                      onClick={() => handleReorder(order.id)}
                      disabled={reordering === order.id}
                      className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
                    >
                      <RefreshCw size={15} className={reordering === order.id ? "animate-spin" : ""} />
                      {reordering === order.id ? "Reordering..." : "Reorder"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}