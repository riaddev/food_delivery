import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, KpiCard, Skeleton } from "../../../components/dashboard/Card";
import { DonutChart, Legend, LineChart } from "../../../components/dashboard/Charts";
import { ErrorBanner } from "../components/States";
import { formatBDT, ORDER_STATUS_COLOR, orderStatusLabel } from "./utils";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7", label: "7 Days" },
  { key: "30", label: "30 Days" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const EmptyHint = () => <div className="py-8 text-center text-[13px] text-text-light">No data for this period yet.</div>;

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { range };
      if (range === "custom") {
        params.from = from || undefined;
        params.to = to || undefined;
      }
      const res = await adminApi.getAnalytics(params);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [range, from, to]);

  useEffect(() => {
    const t = window.setTimeout(fetchAnalytics, 0);
    return () => window.clearTimeout(t);
  }, [fetchAnalytics]);

  const selectRange = (key) => {
    if (key === "custom") {
      setRange("custom");
      fetchAnalytics();
    } else {
      setRange(key);
    }
  };

  const inputClass = "px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit";

  if (error) {
    return <ErrorBanner message={error} onRetry={fetchAnalytics} />;
  }

  if (loading || !data) {
    return (
      <div className="space-y-3.5">
        <Skeleton className="h-12 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
        <Skeleton className="h-[280px]" />
        <Skeleton className="h-[280px]" />
      </div>
    );
  }

  const revenue = data.revenue || {};
  const orders = data.orders || {};
  const customers = data.customers || {};
  const delivery = data.delivery || {};

  const statusSegments = Object.entries(orders.by_status || {})
    .map(([status, count]) => ({
      label: orderStatusLabel(status),
      value: count,
      color: ORDER_STATUS_COLOR[status] || "#9CA3AF",
    }))
    .sort((a, b) => b.value - a.value);

  const typeSegments = Object.entries(orders.by_type || {})
    .map(([type, count]) => ({
      label: orderStatusLabel(type),
      value: count,
      color: ORDER_STATUS_COLOR[type] || "#9CA3AF",
    }))
    .sort((a, b) => b.value - a.value);

  const byRestaurant = revenue.by_restaurant || [];
  const maxRestaurantRevenue = byRestaurant.length ? Math.max(...byRestaurant.map((r) => r.revenue)) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[15px] font-bold text-text-primary">Analytics</div>
          <div className="text-[13px] text-text-muted mt-0.5">
            {data.range ? `${data.range.from} \u2192 ${data.range.to}` : "Orders, revenue and delivery performance"}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => selectRange(r.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer font-outfit border ${
                range === r.key
                  ? "bg-orange-primary text-white border-orange-primary"
                  : "bg-[#FAFAFA] text-text-muted border-border hover:text-text-primary"
              }`}
            >
              {r.label}
            </button>
          ))}
          {range === "custom" && (
            <>
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-text-muted">
                From
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
              </label>
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-text-muted">
                To
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
              </label>
              <button
                onClick={fetchAnalytics}
                className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-orange-primary hover:bg-orange-deep transition-colors cursor-pointer font-outfit"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KpiCard label="Total orders" value={Number(orders.total ?? 0).toLocaleString("en-IN")} mono />
        <KpiCard
          label="Completed orders"
          value={Number(orders.completed ?? 0).toLocaleString("en-IN")}
          change="Delivered + served"
          up
        />
        <KpiCard label="Total revenue" value={formatBDT(revenue.total)} mono />
        <KpiCard label="Avg order value" value={formatBDT(revenue.avg_order_value)} mono />
        <KpiCard
          label="Cancellation rate"
          value={`${(orders.cancellation_rate ?? 0).toFixed(1)}%`}
          change={`${orders.cancelled_count ?? 0} of ${orders.total ?? 0} orders cancelled`}
          up={false}
        />
        <KpiCard
          label="New customers"
          value={Number(customers.new ?? 0).toLocaleString("en-IN")}
          change={`${customers.active ?? 0} active in period`}
          up={Boolean(customers.active)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-3.5">
        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-1">Revenue trend</div>
          <div className="text-[13px] text-text-muted mb-5">Completed orders only \u00B7 {revenue.completed_orders ?? 0} orders</div>
          {revenue.trend?.values?.some((v) => v > 0) ? (
            <LineChart
              data={revenue.trend.values}
              labels={revenue.trend.labels}
              height={220}
              yFormatter={(v) => formatBDT(v)}
            />
          ) : (
            <EmptyHint />
          )}
        </Card>
        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-1">Orders by status</div>
          <div className="text-[13px] text-text-muted mb-5">Selected period</div>
          {statusSegments.length ? (
            <>
              <div className="flex justify-center mb-5">
                <DonutChart
                  segments={statusSegments}
                  size={150}
                  thickness={18}
                  center={Number(orders.total ?? 0).toLocaleString("en-IN")}
                  sub="ORDERS"
                />
              </div>
              <Legend items={statusSegments} />
            </>
          ) : (
            <EmptyHint />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3.5">
        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-1">Orders per day</div>
          <div className="text-[13px] text-text-muted mb-5">Selected period</div>
          {orders.per_day_values?.some((v) => v > 0) ? (
            <LineChart data={orders.per_day_values} labels={orders.per_day_labels} height={200} />
          ) : (
            <EmptyHint />
          )}
        </Card>
        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-1">Orders by type</div>
          <div className="text-[13px] text-text-muted mb-5">Selected period</div>
          {typeSegments.length ? (
            <>
              <div className="flex justify-center mb-5">
                <DonutChart
                  segments={typeSegments}
                  size={140}
                  thickness={16}
                  center={Number(orders.total ?? 0).toLocaleString("en-IN")}
                  sub="ORDERS"
                />
              </div>
              <Legend items={typeSegments} />
            </>
          ) : (
            <EmptyHint />
          )}
        </Card>
        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-1">Customer growth</div>
          <div className="text-[13px] text-text-muted mb-5">New customers per day</div>
          {customers.growth?.values?.some((v) => v > 0) ? (
            <LineChart data={customers.growth.values} labels={customers.growth.labels} height={200} />
          ) : (
            <EmptyHint />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-4">Revenue by restaurant</div>
          {byRestaurant.length ? (
            <div className="divide-y divide-[#F3F4F6]">
              {byRestaurant.map((r) => {
                const pct = maxRestaurantRevenue ? (r.revenue / maxRestaurantRevenue) * 100 : 0;
                return (
                  <div key={r.restaurant_name} className="flex items-center gap-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[13.5px] font-semibold text-text-primary truncate" title={r.restaurant_name}>
                          {r.restaurant_name}
                        </span>
                        <span className="text-[13px] font-mono font-semibold text-text-primary shrink-0 ml-3">{formatBDT(r.revenue)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-soft to-orange-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyHint />
          )}
        </Card>

        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-4">Top rated restaurants</div>
          {(data.restaurants?.ratings || []).length ? (
            <div className="divide-y divide-[#F3F4F6]">
              {(data.restaurants.ratings || []).slice(0, 5).map((r) => (
                <div key={r.restaurant_name} className="flex items-center justify-between py-3">
                  <span className="text-[13.5px] font-semibold text-text-primary truncate">{r.restaurant_name}</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0 ml-3">
                    <span className="text-[13px] font-mono font-bold text-amber-500">{r.rating != null ? r.rating.toFixed(1) : "\u2014"}</span>
                    <span className="text-[11px] text-text-light">({r.reviews_count ?? 0})</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint />
          )}
        </Card>
      </div>

      <Card>
        <div className="text-[15px] font-bold text-text-primary mb-4">Rider delivery performance</div>
        {(delivery.by_rider || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Rider", "Deliveries", "Avg delivery time"].map((h) => (
                    <th key={h} className={`px-5 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap ${h === "Avg delivery time" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(delivery.by_rider || []).map((r, i) => (
                  <tr key={`${r.rider_name}-${i}`} className={i < delivery.by_rider.length - 1 ? "border-b border-[#F3F4F6]" : ""}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-text-primary">{r.rider_name || "\u2014"}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-[13.5px] text-text-primary">{r.deliveries ?? 0}</td>
                    <td className="px-5 py-3 font-mono text-[13.5px] text-text-primary text-right">
                      {r.avg_delivery_minutes != null ? `${r.avg_delivery_minutes}m` : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyHint />
        )}
      </Card>
    </div>
  );
}