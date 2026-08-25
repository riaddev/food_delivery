import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, ClipboardList, CheckCircle2, CalendarClock, Plus, ArrowRight } from "lucide-react";
import { restaurantApi, reservationApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const COMPLETED_STATUSES = ["delivered", "served"];
const ACTIVE_RESERVATION_STATUSES = ["pending", "confirmed"];

const sameDay = (a, b) => a.toDateString() === b.toDateString();

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    restaurantApi.getOrders()
      .then((r) => setOrders(r.data.orders || []))
      .catch(() => {});
    reservationApi.getForRestaurant()
      .then((r) => setReservations(r.data.reservations || []))
      .catch(() => {});
  }, []);

  const now = new Date();

  const liveOrders = orders.filter((o) => o.status === "pending");
  const completedToday = orders.filter(
    (o) => COMPLETED_STATUSES.includes(o.status) && sameDay(new Date(o.created_at), now)
  );
  const todayRevenue = completedToday.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const activeReservations = reservations.filter((r) =>
    ACTIVE_RESERVATION_STATUSES.includes(r.status)
  );

  const stats = [
    { title: "Today's Revenue", value: formatPrice(todayRevenue), icon: TrendingUp, tint: "bg-emerald-50 text-emerald-600" },
    { title: "Pending Orders", value: String(liveOrders.length), icon: ClipboardList, tint: "bg-amber-50 text-amber-600" },
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
    <div className="max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3.5 items-start">
        {/* Live Orders */}
        <section className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-[15px] font-bold text-text-primary">Live Orders</h2>
            <Link to="/restaurant/dashboard/orders" className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange-primary no-underline">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          {liveOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-orange-soft flex items-center justify-center text-orange-deep mb-3">
                <ClipboardList size={19} />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">No pending orders</p>
              <p className="text-xs text-text-muted mb-4">New orders will appear here as they come in.</p>
              <Link to="/restaurant/dashboard/orders" className="text-sm font-medium text-orange-primary no-underline">
                Open Live Orders
              </Link>
            </div>
          ) : (
            <div>
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-border text-[11px] font-semibold uppercase tracking-[0.04em] text-text-light">
                <span className="col-span-3">Order</span>
                <span className="col-span-4">Items</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              <div className="divide-y divide-[#F3F4F6]">
                {liveOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-3 gap-y-2 items-center px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors">
                    <div className="col-span-1 md:col-span-3 min-w-0">
                      <p className="text-sm font-semibold font-mono text-orange-primary">#{order.id}</p>
                      <p className="text-xs text-text-muted truncate flex items-center gap-1.5">
                        {order.customer_name || "Guest"}
                        {order.order_type === "dine_in" && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Dine-In{order.table_number ? ` · T${order.table_number}` : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="col-span-1 md:col-span-4 text-xs text-text-muted truncate">
                      {(order.items || []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <span className="hidden md:inline-block col-span-1 md:col-span-2 justify-self-start">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-dot" /> Pending
                      </span>
                    </span>
                    <p className="col-span-1 md:col-span-1 text-sm font-bold font-mono tracking-tight text-text-primary text-right justify-self-end">{formatPrice(order.total)}</p>
                    <div className="col-span-2 md:col-span-2 flex justify-end gap-2 md:justify-self-end">
                      <button
                        onClick={() => handleStatus(order, "confirmed")}
                        disabled={actingId === order.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-primary hover:bg-orange-deep text-white transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                      >
                        {actingId === order.id ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => handleStatus(order, "cancelled")}
                        disabled={actingId === order.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-text-muted hover:border-zinc-300 hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Top selling items */}
        <section className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-[15px] font-bold text-text-primary">Top Selling Items</h2>
            <Link to="/restaurant/dashboard/analytics" className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange-primary no-underline">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          {topItems.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-text-primary mb-1">No sales yet</p>
              <p className="text-xs text-text-muted">Your best sellers will appear once orders are completed.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                  <span className={`text-xs font-bold font-mono w-5 ${idx === 0 ? "text-orange-primary" : "text-text-light"}`}>{idx + 1}</span>
                  <p className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate m-0">{item.name}</p>
                  <span className="text-xs font-semibold text-text-muted whitespace-nowrap">{item.qty} sold</span>
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
    </div>
  );
}
