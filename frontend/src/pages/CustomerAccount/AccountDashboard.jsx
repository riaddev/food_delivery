import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, HeartPulse, Heart, MapPin, Star, ArrowRight } from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";
import { formatPrice, formatDate, restaurantImage } from "../../utils/foodImages";

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-600",
  preparing: "bg-purple-50 text-purple-600",
  out_for_delivery: "bg-indigo-50 text-indigo-600",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

const statusLabel = (s = "") => s.replace(/_/g, " ");

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

const popular = [
  {
    id: "burger",
    name: "Ember Burger Co.",
    dish: "Flame-Grilled Smash Burger",
    price: 420,
    rating: 4.7,
    eta: "25 min",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "pizza",
    name: "Roma Pizzeria",
    dish: "Wood-Fired Margherita",
    price: 550,
    rating: 4.9,
    eta: "30 min",
    img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "biryani",
    name: "Dhaka Street Kitchen",
    dish: "Mutton Handi Biryani",
    price: 320,
    rating: 4.8,
    eta: "35 min",
    img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  },
];

export default function AccountDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.getOverview()
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const firstName = (user?.name?.split(" ")[0]) || "there";
  const hasOrders = (data?.recent_orders ?? []).length > 0;

  const stats = [
    { title: "Total Orders", count: data?.total_orders ?? 0, sub: "all time", icon: ShoppingCart, tint: "bg-red-50 text-[#E03546]" },
    { title: "Active Orders", count: data?.active_orders ?? 0, sub: "in progress", icon: HeartPulse, tint: "bg-amber-50 text-amber-600" },
    { title: "Favourite Items", count: data?.favorites_count ?? 0, sub: "saved dishes", icon: Heart, tint: "bg-rose-50 text-rose-600" },
    { title: "Saved Addresses", count: data?.addresses_count ?? 0, sub: "on file", icon: MapPin, tint: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{greeting()}, {firstName}</h1>
        <p className="text-sm text-zinc-500 mt-1">What are we eating today?</p>
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
                  <p className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5 leading-tight">{s.count}</p>
                  <p className="text-xs text-zinc-400 mt-1">{s.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-8 animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="h-5 w-32 bg-zinc-100 rounded mb-5" />
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
              <div className="h-4 bg-zinc-100 rounded w-1/2" />
              <div className="h-9 bg-zinc-100 rounded-lg w-44 mt-5" />
            </div>
            <div className="hidden md:block w-64 h-44 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Recent Orders</h2>
            {hasOrders && (
              <Link to="/customer/account/orders" className="inline-flex items-center gap-1 text-sm font-medium text-[#E03546] hover:text-[#C11F31]">
                See all <ArrowRight size={13} />
              </Link>
            )}
          </div>

          {hasOrders ? (
            <div className="divide-y divide-zinc-50">
              {data.recent_orders.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-50 transition-colors">
                  <img src={restaurantImage(order.restaurant?.restaurant_name)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{order.restaurant?.restaurant_name || "—"}</p>
                    <p className="text-xs text-zinc-500">#{order.id} · {formatDate(order.created_at)}</p>
                  </div>
                  <span className={`hidden sm:inline-block px-2.5 py-1 rounded-md text-xs font-medium capitalize ${statusColors[order.status] || "bg-zinc-100 text-zinc-500"}`}>
                    {statusLabel(order.status)}
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-zinc-900">{formatPrice(order.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-10 px-6 py-8">
              <div className="flex-1 text-center md:text-left">
                <p className="text-xl font-bold tracking-tight text-zinc-900 mb-1.5">No orders yet</p>
                <p className="text-sm text-zinc-500 mb-6">
                  Looks like you haven't ordered anything. Let's fix that hunger!
                </p>
                <Link
                  to="/restaurants"
                  className="inline-flex items-center gap-2 bg-[#E03546] hover:bg-[#C11F31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Browse Restaurants <ArrowRight size={15} />
                </Link>
              </div>
              <div className="shrink-0 w-64 h-44 md:w-72 md:h-52 rounded-xl border border-zinc-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
                  alt="A spread of delicious food"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">Popular near you</h2>
          <Link to="/restaurants" className="inline-flex items-center gap-1 text-sm font-medium text-[#E03546] hover:text-[#C11F31]">
            See all <ArrowRight size={13} />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
          {popular.map((place) => (
            <Link
              key={place.id}
              to="/restaurants"
              className="bg-white rounded-xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:bg-zinc-50 transition-colors w-[220px] sm:w-[240px] shrink-0 snap-start overflow-hidden"
            >
              <div className="h-28 overflow-hidden">
                <img src={place.img} alt={place.dish} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-zinc-900 truncate">{place.name}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{place.dish}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                  <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                  <span className="font-medium text-zinc-700">{place.rating}</span>
                  <span className="text-zinc-300">·</span>
                  <span>{place.eta}</span>
                </div>
                <p className="text-sm font-semibold tracking-tight text-zinc-900 mt-2">{formatPrice(place.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}