import { useState, useEffect } from "react";
import { customerApi } from "../../features/api/apiSlice";

const statusColors = { pending: "#f59e0b", confirmed: "#6366f1", preparing: "#3b82f6", out_for_delivery: "#10b981", delivered: "#6b7280", cancelled: "#ef4444" };
const statusLabels = { pending: "Pending", confirmed: "Confirmed", preparing: "Preparing", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled" };
const progressSteps = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    customerApi.getOrders().then((r) => setOrders(r.data.orders)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const currentStepIndex = (status) => { const idx = progressSteps.indexOf(status); return idx >= 0 ? idx : -1; };

  if (loading) return <p className="text-gray-500">Loading orders...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mt-0 mb-4">Order History</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-4xl m-0 mb-3">📦</p>
          <p className="text-gray-500 text-[15px] m-0">No orders yet. Start exploring restaurants!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="font-bold text-gray-900 text-[15px]">{order.restaurant?.restaurant_name || "Restaurant"}</span>
                  <span className="text-gray-400 text-sm ml-2.5">#{order.id}</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${statusColors[order.status]}20`, color: statusColors[order.status] }}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-3">৳{parseFloat(order.total).toFixed(2)} — {new Date(order.created_at).toLocaleDateString()}</div>

              {!["cancelled", "delivered"].includes(order.status) && (
                <div className="flex items-center gap-4 mb-3 text-xs">
                  {progressSteps.slice(0, -1).map((step, i) => {
                    const currentIdx = currentStepIndex(order.status);
                    const done = i <= currentIdx;
                    const color = statusColors[order.status] || "#f59e0b";
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className="w-[10px] h-[10px] rounded-full shrink-0" style={{ background: done ? color : "#e5e7eb" }} />
                        <div className="flex-1 h-0.5" style={{ background: i < currentIdx ? color : "#e5e7eb" }} />
                      </div>
                    );
                  })}
                  <div className="w-[10px] h-[10px] rounded-full" style={{ background: order.status === "delivered" ? "#6b7280" : currentStepIndex(order.status) >= progressSteps.length - 1 ? statusColors[order.status] || "#f59e0b" : "#e5e7eb" }} />
                </div>
              )}

              <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                className="bg-none border-none text-[#ff6b35] text-sm font-semibold cursor-pointer p-0">
                {expandedId === order.id ? "Hide details" : "View details"}
              </button>

              {expandedId === order.id && order.items && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm">
                      <span className="text-gray-700">{item.name} x{item.quantity}</span>
                      <span className="text-gray-500">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.delivery_address && (
                    <p className="text-xs text-gray-400 mt-2 m-0">Deliver to: {order.delivery_address}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
