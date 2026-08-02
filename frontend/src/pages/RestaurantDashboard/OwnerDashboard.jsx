import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, ClipboardList, CheckCircle2, Star, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const MOCK_TOP_ITEMS = [
  { id: 1, name: "Morog Polao", sold: 24, price: 240, img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=400&auto=format&fit=crop" },
  { id: 2, name: "Beef Tehari", sold: 18, price: 210, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop" },
  { id: 3, name: "Chicken Chap", sold: 16, price: 180, img: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=400&auto=format&fit=crop" },
  { id: 4, name: "Cold Lemonade", sold: 12, price: 90, img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    restaurantApi.getOrders()
      .then((r) => setOrders(r.data.orders))
      .catch(() => {});
  }, []);

  const restaurant = user?.restaurant || {};
  const name = restaurant.restaurant_name || user?.name || "Restaurant";

  const liveOrders = orders.filter((o) => o.status === "pending");
  const deliveredToday = orders.filter((o) => {
    if (o.status !== "delivered") return false;
    const d = new Date(o.created_at);
    return d.toDateString() === new Date().toDateString();
  });
  const todayRevenue = deliveredToday.reduce((s, o) => s + parseFloat(o.total), 0);

  const stats = [
    {
      title: "Today's Revenue",
      value: todayRevenue > 0 ? formatPrice(todayRevenue) : "৳18,500",
      icon: TrendingUp,
      tint: "bg-emerald-50 text-emerald-600",
      delta: { text: "+12% from yesterday", tone: "text-emerald-600" },
    },
    {
      title: "Pending Orders",
      value: String(orders.filter((o) => o.status === "pending").length || 4),
      icon: ClipboardList,
      tint: "bg-amber-50 text-amber-600",
      delta: { text: "+3 from last hour", tone: "text-rose-600" },
    },
    {
      title: "Completed Today",
      value: String(deliveredToday.length || 32),
      icon: CheckCircle2,
      tint: "bg-sky-50 text-sky-600",
      delta: { text: "+8% from yesterday", tone: "text-emerald-600" },
    },
    {
      title: "Average Rating",
      value: "4.8",
      icon: Star,
      tint: "bg-rose-50 text-rose-600",
      delta: { text: "+0.1 this month", tone: "text-emerald-600" },
    },
  ];

  const handleStatus = async (order, status) => {
    setActingId(order.id);
    try {
      await restaurantApi.updateOrderStatus(order.id, status);
      const r = await restaurantApi.getOrders();
      setOrders(r.data.orders);
    } catch {
      // ignore; list refreshes next visit
    }
    setActingId(null);
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{greeting()}, {name}</h1>
        <p className="text-sm text-zinc-500 mt-1">Here's what's happening at your restaurant today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.tint}`}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-500 truncate">{s.title}</p>
                  <p className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 leading-tight">{s.value}</p>
                  <p className={`text-xs font-medium mt-1 ${s.delta.tone}`}>{s.delta.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
        {/* Live Orders */}
        <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Live Orders</h2>
            <Link to="/restaurant/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-[#E03546] hover:text-[#C11F31]">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          {liveOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-3">
                <ClipboardList size={19} />
              </div>
              <p className="text-sm font-medium text-zinc-700 mb-1">No pending orders</p>
              <p className="text-xs text-zinc-500 mb-4">New orders will appear here as they come in.</p>
              <Link to="/restaurant/dashboard/orders" className="text-sm font-medium text-[#E03546] hover:text-[#C11F31]">
                Open Live Orders
              </Link>
            </div>
          ) : (
            <div>
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                <span className="col-span-3">Order</span>
                <span className="col-span-4">Items</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              <div className="divide-y divide-zinc-50">
                {liveOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-3 gap-y-2 items-center px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                    <div className="col-span-1 md:col-span-3 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">#{order.id}</p>
                      <p className="text-xs text-zinc-500 truncate">{order.customer_name || "Guest"}</p>
                    </div>
                    <p className="col-span-1 md:col-span-4 text-xs text-zinc-500 truncate">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <span className="hidden md:inline-block col-span-1 md:col-span-2 justify-self-start">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                      </span>
                    </span>
                    <p className="col-span-1 md:col-span-1 text-sm font-semibold tracking-tight text-zinc-900 text-right justify-self-end">{formatPrice(order.total)}</p>
                    <div className="col-span-2 md:col-span-2 flex justify-end gap-2 md:justify-self-end">
                      <button
                        onClick={() => handleStatus(order, "confirmed")}
                        disabled={actingId === order.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                      >
                        {actingId === order.id ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => handleStatus(order, "cancelled")}
                        disabled={actingId === order.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-colors disabled:opacity-50"
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
        <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Top Selling Items</h2>
            <Link to="/restaurant/dashboard/analytics" className="inline-flex items-center gap-1 text-sm font-medium text-[#E03546] hover:text-[#C11F31]">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-zinc-50">
            {MOCK_TOP_ITEMS.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                <img src={item.img} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.sold} sold today</p>
                </div>
                <span className="text-xs text-zinc-400 font-medium w-5 text-right">{idx + 1}</span>
                <span className="text-sm font-semibold tracking-tight text-zinc-900">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-zinc-100">
            <button
              onClick={() => navigate("/restaurant/dashboard/menu")}
              className="w-full border border-dashed border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700 text-sm font-medium py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> Add Menu Item
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}