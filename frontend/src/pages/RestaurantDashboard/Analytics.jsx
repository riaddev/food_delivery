import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ShoppingBag, Receipt, Clock3 } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const REVENUE_STATUSES = ["delivered", "served"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PERIODS = [
  { key: "today", label: "Today", days: 1 },
  { key: "week", label: "This week", days: 7 },
  { key: "month", label: "This month", days: 30 },
];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;

export function Analytics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    restaurantApi.getOrders()
      .then((r) => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const windowed = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)?.days ?? 1;
    const start = period === "today"
      ? startOfDay(new Date())
      : new Date(startOfDay(new Date()).getTime() - (days - 1) * 86400000);
    return orders.filter((o) => new Date(o.created_at) >= start);
  }, [orders, period]);

  const completedOrders = windowed.filter((o) => REVENUE_STATUSES.includes(o.status));
  const revenue = completedOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
  const avgValue = completedOrders.length > 0 ? revenue / completedOrders.length : 0;

  const stats = [
    { title: "Orders", value: String(windowed.length), icon: ShoppingBag, tint: "bg-orange-soft text-orange-deep" },
    { title: "Revenue", value: formatPrice(revenue), icon: TrendingUp, tint: "bg-emerald-50 text-emerald-600" },
    { title: "Avg Order Value", value: formatPrice(avgValue), icon: Receipt, tint: "bg-sky-50 text-sky-600" },
    { title: "Pending Orders", value: String(windowed.filter((o) => o.status === "pending").length), icon: Clock3, tint: "bg-amber-50 text-amber-600" },
  ];

  const counted = windowed.filter((o) => o.status !== "cancelled");

  const byDay = WEEKDAYS.map((label, idx) => ({
    label,
    count: counted.filter((o) => new Date(o.created_at).getDay() === idx).length,
  }));
  const maxDay = Math.max(1, ...byDay.map((d) => d.count));

  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: counted.filter((o) => new Date(o.created_at).getHours() === hour).length,
  }));
  const maxHour = Math.max(1, ...byHour.map((h) => h.count));

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-[13px] border border-border p-5 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-zinc-100 mb-3" />
              <div className="h-3 bg-zinc-100 rounded w-20 mb-2" />
              <div className="h-5 bg-zinc-100 rounded w-14" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-[13px] border border-border p-7 animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap gap-2.5 mb-8">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            aria-pressed={period === p.key}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer font-outfit ${
              period === p.key
                ? "bg-orange-primary text-white"
                : "bg-card text-text-muted border border-border hover:text-text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card rounded-[13px] border border-border p-5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.tint}`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-text-light">{s.title}</p>
                  <p className="text-xl font-bold font-mono tracking-tight text-text-primary mt-1 leading-tight">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="bg-card rounded-[13px] border border-border py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-soft flex items-center justify-center text-orange-deep mb-4">
            <ShoppingBag size={26} />
          </div>
          <p className="font-semibold text-text-primary mb-1">No orders yet</p>
          <p className="text-sm text-text-muted">Analytics will appear once customers start ordering.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <div className="bg-card rounded-[13px] border border-border p-7">
            <h2 className="text-[15px] font-bold text-text-primary mb-6">Busiest Days</h2>
            <div className="space-y-4">
              {byDay.map((d) => (
                <div key={d.label} className="flex items-center gap-4">
                  <span className="w-10 text-xs font-bold text-text-muted">{d.label}</span>
                  <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-primary to-orange-deep rounded-full transition-all"
                      style={{ width: `${Math.round((d.count / maxDay) * 100)}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-bold font-mono text-text-primary">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-[13px] border border-border p-7 overflow-hidden">
            <h2 className="text-[15px] font-bold text-text-primary mb-6">Orders by Hour</h2>
            <div className="overflow-x-auto pb-1">
              <div className="flex items-end gap-1.5 h-36 min-w-[430px]">
                {byHour.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <div className="w-full bg-zinc-100 rounded-full overflow-hidden flex-1 flex items-end">
                      <div
                        className="w-full bg-orange-primary rounded-full transition-all"
                        style={{ height: `${Math.round((h.count / maxHour) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-text-light whitespace-nowrap">
                      {h.hour % 3 === 0 ? hourLabel(h.hour) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
