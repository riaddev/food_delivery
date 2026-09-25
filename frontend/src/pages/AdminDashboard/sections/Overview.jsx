import { useEffect, useState } from "react";
import { Card, DotStatus, EmptyState, HeroCard, KpiCard, SectionTitle, Skeleton } from "../../../components/dashboard/Card";
import { DonutChart, Legend, LineChart } from "../../../components/dashboard/Charts";
import { ErrorBanner } from "../components/States";
import { adminApi } from "../../../features/api/apiSlice";
import { formatBDT, ORDER_STATUS_COLOR, orderStatusLabel, restaurantImage, timeAgo } from "./utils";

export default function Overview({ stats, activity, loading, error, onRetry, onNavigate }) {
  const [topRestaurants, setTopRestaurants] = useState([]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getAnalytics({ range: "30" })
      .then((res) => {
        if (!cancelled) setTopRestaurants(res.data.revenue.by_restaurant || []);
      })
      .catch(() => {
        if (!cancelled) setTopRestaurants([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trend = stats?.revenue_trend_7d || { labels: [], values: [] };
  const weekTotal = trend.values.reduce((a, b) => a + Number(b || 0), 0);

  const breakdown = stats?.order_status_breakdown || {};
  const breakdownEntries = Object.entries(breakdown)
    .map(([status, count]) => ({
      status,
      label: orderStatusLabel(status),
      count,
      color: ORDER_STATUS_COLOR[status] || "#9CA3AF",
    }))
    .sort((a, b) => b.count - a.count);

  const totalOrders = breakdownEntries.reduce((sum, e) => sum + e.count, 0);
  const donutSegments = breakdownEntries.length
    ? breakdownEntries.map((e) => ({ label: e.label, value: e.count, color: e.color }))
    : [{ label: "No orders yet", value: 1, color: "#E5E7EB" }];

  const liveOrders = stats?.active_orders_list || [];

  const delta = stats?.revenue_delta;
  const todayRevenue = Number(stats?.today_revenue ?? 0);
  const deltaText = todayRevenue === 0
    ? "No completed orders today"
    : delta === null || delta === undefined
      ? "First completed order today"
      : `${delta > 0 ? "+" : ""}${delta}% vs yesterday`;

  const riders = [
    { label: "Active", value: stats?.riders_active ?? 0, color: "#16A34A" },
    { label: "Delivering", value: stats?.riders_delivering ?? 0, color: "#F97316" },
    { label: "Idle", value: stats?.riders_idle ?? 0, color: "#2563EB" },
    { label: "Suspended", value: stats?.riders_suspended ?? 0, color: "#9CA3AF" },
  ];

  if (error) {
    return (
      <div>
        <ErrorBanner message="Could not load dashboard stats." onRetry={onRetry} />
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
        <Skeleton className="h-[240px]" />
        <Skeleton className="h-[260px]" />
      </div>
    );
  }

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr] gap-3.5 mb-5">
        <HeroCard
          label="Today's Revenue"
          value={formatBDT(todayRevenue)}
          change={deltaText}
          up={todayRevenue > 0}
        />
        <KpiCard
          label="Active Orders"
          value={Number(stats.active_orders ?? 0).toLocaleString("en-IN")}
          change="Orders currently being processed"
          up
        />
        <KpiCard
          label="Total Users"
          value={Number(stats.total_users ?? 0).toLocaleString("en-IN")}
          change={stats.new_users_this_week ? `${stats.new_users_this_week} new this week` : "No new users this week"}
          up={Boolean(stats.new_users_this_week)}
        />
        <button
          onClick={() => onNavigate("restaurants")}
          className="text-left cursor-pointer border-none bg-none p-0 font-outfit hover:opacity-90 transition-opacity"
          aria-label="View pending approvals"
        >
          <KpiCard
            label="Pending Approvals"
            value={String(stats.pending_approvals ?? 0)}
            change={`Restaurants: ${stats.pending_restaurants ?? 0} \u00B7 Riders: ${stats.pending_riders ?? 0}`}
            up={Boolean(stats.pending_approvals)}
          />
        </button>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-3.5 mb-5">
        <Card>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[15px] font-bold text-text-primary">Weekly Revenue</div>
              <div className="text-[13px] text-text-muted mt-1">Last 7 days · completed orders only</div>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-bold text-orange-primary font-mono">
                {formatBDT(weekTotal)}
              </div>
              <div className="text-[12px] text-text-light font-semibold mt-1">7-day total</div>
            </div>
          </div>
          {weekTotal > 0 ? (
            <LineChart
              data={trend.values}
              labels={trend.labels}
              height={132}
              yFormatter={(v) => formatBDT(v)}
            />
          ) : (
            <EmptyState message="No completed orders in the last 7 days." />
          )}
        </Card>

        <Card>
          <div className="text-[15px] font-bold text-text-primary mb-1">Order Status</div>
          <div className="text-[13px] text-text-muted mb-5">All-time breakdown</div>
          <div className="flex justify-center mb-5">
            <DonutChart
              segments={donutSegments}
              center={totalOrders.toLocaleString("en-IN")}
              sub="ORDERS"
            />
          </div>
          <Legend
            items={breakdownEntries.length
              ? breakdownEntries.map((e) => ({ label: e.label, value: e.count, color: e.color }))
              : [{ label: "No orders yet", value: "\u2014", color: "#E5E7EB" }]}
          />
        </Card>
      </div>

      {/* Live orders + Top restaurants */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-3.5 mb-5 items-start">
        <div className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="text-[15px] font-bold text-text-primary">Live Orders</span>
              {liveOrders.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-success font-bold tracking-[0.05em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block pulse-dot" /> LIVE
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate("orders")}
              className="text-[13px] text-orange-primary font-semibold bg-none border-none cursor-pointer font-outfit"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Order", "Customer", "Restaurant", "Items", "Amount", "Time", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3.5 py-10 text-center text-text-light text-sm">
                      No active orders right now.
                    </td>
                  </tr>
                )}
                {liveOrders.map((o, i) => {
                  const color = ORDER_STATUS_COLOR[o.status] || "#9CA3AF";
                  return (
                    <tr key={o.id} className={`hover:bg-[#FAFAFA] transition-colors ${i < liveOrders.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                      <td className="px-3.5 py-3 font-mono text-[13px] text-orange-primary font-semibold whitespace-nowrap">#{o.id}</td>
                      <td className="px-3.5 py-3 text-[15px] font-medium text-text-primary whitespace-nowrap">{o.customer_name}</td>
                      <td className="px-3.5 py-3 text-[14.5px] text-text-muted">{o.restaurant_name}</td>
                      <td className="px-3.5 py-3 text-[14px] text-text-muted max-w-[140px] truncate">
                        {o.order_type === "dine_in" ? `Dine-In${o.table_number ? ` \u00B7 Table ${o.table_number}` : ""}` : o.delivery_address || "\u2014"}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[14px] font-bold text-text-primary whitespace-nowrap">{formatBDT(o.total)}</td>
                      <td className="px-3.5 py-3 text-[13.5px] text-text-light whitespace-nowrap">{timeAgo(o.created_at)}</td>
                      <td className="px-3.5 py-3">
                        <DotStatus label={orderStatusLabel(o.status)} color={color} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top restaurants */}
        <div className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-[15px] font-bold text-text-primary">Top Restaurants</div>
            <div className="text-[13px] text-text-muted mt-1">By revenue, last 30 days</div>
          </div>
          <div className="px-3.5 py-2">
            {topRestaurants.length === 0 && <EmptyState message="No restaurant revenue yet" />}
            {topRestaurants.map((r, i) => (
              <div
                key={r.restaurant_name || i}
                className="flex items-center gap-2.5 px-1 py-2.5 cursor-pointer hover:opacity-75 transition-opacity"
                style={{ borderBottom: i < topRestaurants.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                <span className={`text-[11px] font-bold w-4 text-center font-mono shrink-0 ${i === 0 ? "text-orange-primary" : "text-text-light"}`}>
                  {i + 1}
                </span>
                <img
                  src={restaurantImage(r.restaurant_name)}
                  alt={r.restaurant_name}
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold text-text-primary truncate">{r.restaurant_name}</div>
                  <div className="text-[13px] text-text-light mt-0.5">Revenue</div>
                </div>
                <div className="text-[13.5px] font-bold text-text-primary font-mono shrink-0">{formatBDT(r.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery agents */}
      <div className="mb-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[15px] font-bold text-text-primary">Delivery Agents</div>
            <button
              onClick={() => onNavigate("agents")}
              className="text-[13px] text-orange-primary font-semibold bg-none border-none cursor-pointer font-outfit"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-2.5">
            {riders.map((a) => (
              <div key={a.label} className="bg-[#FAFAFA] rounded-[10px] py-3.5 text-center border border-border">
                <div className="text-[26px] font-extrabold font-mono leading-none" style={{ color: a.color }}>
                  {a.value}
                </div>
                <div className="text-[13px] text-text-muted mt-1.5 font-medium">{a.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <SectionTitle title="Recent Platform Activity" />
        {activity.length === 0 ? (
          <EmptyState message="No recent activity" />
        ) : (
          <div className="flex flex-col gap-4">
            {activity.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.type?.includes("reject") || item.type?.includes("suspend") ? "bg-danger" : item.type?.includes("order") ? "bg-warning" : "bg-success"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-text-primary leading-snug">{item.description}</p>
                  <p className="text-[12px] text-text-light mt-0.5">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}