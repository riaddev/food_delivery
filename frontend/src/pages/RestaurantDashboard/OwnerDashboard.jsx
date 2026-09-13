import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, ClipboardList, CheckCircle2, CalendarClock, Plus, ArrowRight, Bike, AlertTriangle, X } from "lucide-react";
import { restaurantApi, reservationApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const COMPLETED_STATUSES = ["delivered", "served"];
const TERMINAL_STATUSES = ["delivered", "cancelled"];
const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed"];

const STATUS_META = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-600" },
  preparing: { label: "Preparing", color: "bg-purple-50 text-purple-600" },
  ready: { label: "Ready", color: "bg-cyan-50 text-cyan-600" },
  assigned: { label: "Rider Assigned", color: "bg-indigo-50 text-indigo-600" },
  picked_up: { label: "Picked Up", color: "bg-violet-50 text-violet-600" },
  on_the_way: { label: "On the Way", color: "bg-indigo-50 text-indigo-600" },
  near_customer: { label: "Near Customer", color: "bg-amber-50 text-amber-600" },
  served: { label: "Served", color: "bg-emerald-50 text-emerald-600" },
  delivered: { label: "Delivered", color: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-500" },
};

const RESTAURANT_ACTIONABLE = new Set(["pending", "confirmed", "preparing", "ready"]);

const statusColor = (s) => STATUS_META[s]?.color || "bg-zinc-50 text-zinc-500";
const statusLabel = (s) => STATUS_META[s]?.label || s;

const nextAction = (status, orderType) => {
  if (status === "pending") return { to: "confirmed", label: "Accept" };
  if (status === "confirmed") return { to: "preparing", label: "Prepare" };
  if (status === "preparing") return { to: "ready", label: "Ready" };
  if (status === "ready" && orderType === "dine_in") return { to: "served", label: "Served" };
  if (status === "ready" && orderType === "takeout") return { to: "delivered", label: "Picked Up" };
  return null;
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();

function CancelModal({ order, onConfirm, onCancel, loading }) {
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
              Cancel Order #{order.id}?
            </p>
            <p className="text-xs text-text-muted mt-1">
              The customer will be notified.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 pt-1">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:border-zinc-300 hover:text-text-primary transition disabled:opacity-50 cursor-pointer">
            Keep
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 cursor-pointer">
            {loading ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [actingId, setActingId] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);

  useEffect(() => {
    restaurantApi.getOrders()
      .then((r) => setOrders(r.data.orders || []))
      .catch(() => {});
    reservationApi.getForRestaurant()
      .then((r) => setReservations(r.data.reservations || []))
      .catch(() => {});
  }, []);

  const now = new Date();

  const liveOrders = orders.filter(
    (o) => !TERMINAL_STATUSES.includes(o.status)
  );
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const completedToday = orders.filter(
    (o) => COMPLETED_STATUSES.includes(o.status) && sameDay(new Date(o.created_at), now)
  );
  const todayRevenue = completedToday.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const activeReservations = reservations.filter((r) =>
    ACTIVE_RESERVATION_STATUSES.includes(r.status)
  );

  const stats = [
    { title: "Today's Revenue", value: formatPrice(todayRevenue), icon: TrendingUp, tint: "bg-emerald-50 text-emerald-600" },
    { title: "Pending Orders", value: String(pendingOrders.length), icon: ClipboardList, tint: "bg-amber-50 text-amber-600" },
    { title: "Completed Today", value: String(completedToday.length), icon: CheckCircle2, tint: "bg-sky-50 text-sky-600" },
    { title: "Active Reservations", value: String(activeReservations.length), icon: CalendarClock, tint: "bg-orange-soft text-orange-deep" },
  ];

  const handleStatus = async (order, status) => {
    setActingId(order.id);
    try {
      await restaurantApi.updateOrderStatus(order.id, status);
      const r = await restaurantApi.getOrders();
      setOrders(r.data.orders || []);
    } catch {
      // ignore; list refreshes next visit
    }
    setActingId(null);
  };

  const itemSales = {};
  orders.forEach((o) => {
    if (!COMPLETED_STATUSES.includes(o.status)) return;
    (o.items || []).forEach((i) => {
      const key = i.menu_item_id ?? i.name;
      if (!key) return;
      if (!itemSales[key]) itemSales[key] = { name: i.name, qty: 0 };
      itemSales[key].qty += Number(i.quantity) || 0;
    });
  });
  const topItems = Object.values(itemSales)
    .filter((i) => i.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card rounded-[13px] border border-border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${s.tint}`}>
                  <Icon size={17} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-light truncate">{s.title}</p>
                  <p className="text-[17px] font-bold font-mono tracking-tight text-text-primary mt-0.5 leading-tight">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1fr] gap-4 items-start">
        {/* Active Orders */}
        <section className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[15px] font-bold text-text-primary">Active Orders</h2>
            <Link to="/restaurant/dashboard/orders" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-primary no-underline hover:underline">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          {liveOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-orange-soft flex items-center justify-center text-orange-deep mb-3">
                <ClipboardList size={19} />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">No active orders</p>
              <p className="text-xs text-text-muted mb-4">New orders will appear here as they come in.</p>
              <Link to="/restaurant/dashboard/orders" className="text-sm font-medium text-orange-primary no-underline">
                Open Live Orders
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {liveOrders.slice(0, 8).map((order) => {
                const action = nextAction(order.status, order.order_type);
                return (
                  <div key={order.id} className="px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold font-mono text-orange-primary">#{order.id}</span>
                        <span className="text-sm font-medium text-text-primary truncate">{order.customer_name || "Guest"}</span>
                        {order.order_type === "dine_in" && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            Dine-In{order.table_number ? ` · T${order.table_number}` : ""}
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted truncate mb-1.5">
                      {(order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>

                    {order.rider && (
                      <p className="text-[11px] text-indigo-600 mb-1.5 flex items-center gap-1">
                        <Bike size={11} /> {order.rider.name}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold font-mono tracking-tight text-text-primary">{formatPrice(order.total)}</p>
                      <div className="flex items-center gap-2">
                        {RESTAURANT_ACTIONABLE.has(order.status) && action ? (
                          <>
                            <button
                              onClick={() => handleStatus(order, action.to)}
                              disabled={actingId === order.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-primary hover:bg-orange-deep text-white transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                            >
                              {actingId === order.id ? "..." : action.label}
                            </button>
                            <button
                              onClick={() => setCancelModal(order)}
                              disabled={actingId === order.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-text-light italic">
                            {order.status === "ready" && order.order_type === "delivery"
                              ? "Waiting for rider..."
                              : ["assigned", "picked_up", "on_the_way", "near_customer", "served"].includes(order.status)
                                ? "In delivery"
                                : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top selling items */}
        <section className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[15px] font-bold text-text-primary">Top Selling Items</h2>
            <Link to="/restaurant/dashboard/analytics" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange-primary no-underline hover:underline">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          {topItems.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-text-primary mb-1">No sales yet</p>
              <p className="text-xs text-text-muted">Your best sellers will appear once orders are completed.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                  <span className={`text-[13px] font-bold font-mono w-6 ${idx === 0 ? "text-orange-primary" : "text-text-light"}`}>{String(idx + 1).padStart(2, "0")}</span>
                  <p className="flex-1 min-w-0 text-sm font-semibold text-text-primary truncate m-0">{item.name}</p>
                  <span className="text-[11px] font-medium text-text-muted whitespace-nowrap">{item.qty} sold</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-border">
            <button
              onClick={() => navigate("/restaurant/dashboard/menu")}
              className="w-full border border-dashed border-border hover:border-orange-primary hover:text-orange-primary text-text-muted text-sm font-medium py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-outfit"
            >
              <Plus size={14} /> Add Menu Item
            </button>
          </div>
        </section>
      </div>

      <CancelModal
        order={cancelModal}
        loading={actingId === cancelModal?.id}
        onConfirm={async () => {
          if (cancelModal) {
            await handleStatus(cancelModal, "cancelled");
            setCancelModal(null);
          }
        }}
        onCancel={() => setCancelModal(null)}
      />
    </div>
  );
}
