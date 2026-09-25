import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import DetailDrawer from "../components/DetailDrawer";
import { ErrorBanner, LoadingRows } from "../components/States";
import { capitalize, formatBDT, formatDateTime, ORDER_STATUS_COLOR, ORDER_STATUS_TONE, orderStatusLabel, paymentMethodLabel, PAYMENT_STATUS_TONE } from "./utils";

const ORDER_TYPES = ["delivery", "takeout", "dine_in"];
const PAYMENT_METHODS = ["cash", "bkash", "nagad", "card"];
const PAYMENT_STATUSES = ["paid", "pending", "failed", "cancelled", "refund_pending", "refunded"];

export default function Orders({ focusOrderId, onFocusHandled, showToast }) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [riders, setRiders] = useState([]);
  const [acting, setActing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrders({ page, per_page: 20, ...filters });
      setOrders(res.data.orders || []);
      setMeta(res.data.meta || null);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    const t = window.setTimeout(fetchOrders, 0);
    return () => window.clearTimeout(t);
  }, [fetchOrders]);

  useEffect(() => {
    adminApi
      .getRiders()
      .then((res) => setRiders(res.data.riders || []))
      .catch(() => {});
  }, []);

  const openDetail = async (order) => {
    setSelected(order);
    setDetail(null);
    try {
      const res = await adminApi.getOrder(order.id);
      setDetail(res.data.order);
    } catch {
      setDetail({});
    }
  };

  useEffect(() => {
    if (!focusOrderId) return;
    const t = window.setTimeout(() => {
      openDetail({ id: focusOrderId });
      onFocusHandled();
    }, 0);
    return () => window.clearTimeout(t);
  }, [focusOrderId, onFocusHandled]);

  const assignRider = async (riderId) => {
    if (!selected || acting) return;
    setActing(true);
    try {
      await adminApi.assignRider(selected.id, riderId ?? null);
      showToast(riderId ? `Rider assigned to order #${selected.id}` : `Rider unassigned from order #${selected.id}`);
      const res = await adminApi.getOrder(selected.id);
      setDetail(res.data.order);
      fetchOrders();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update rider assignment", "error");
    }
    setActing(false);
  };

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({});
  };

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  const availableRiders = riders.filter(
    (r) => r.status === "approved" && r.is_online && !r.is_delivering
  );
  const busyRiders = riders.filter((r) => r.status === "approved" && r.is_delivering);

  const isTerminal = (status) => ["delivered", "served", "cancelled", "failed_delivery"].includes(status);

  const selectClass = "appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-semibold bg-[#FAFAFA] border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit";
  const inputClass = "pl-8 pr-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit";

  return (
    <div>
      <Card pad="0" className="mb-4">
        <div className="px-5 py-4 border-b border-border">
          <div className="text-[15px] font-bold text-text-primary">All Orders</div>
          <div className="text-[13px] text-text-muted mt-0.5">Track and manage every order on the platform</div>
        </div>
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              value={filters.search || ""}
              onChange={(e) => setFilter("search", e.target.value)}
              placeholder="Search order #, customer, phone, restaurant, txn ID"
              className={inputClass}
            />
          </div>
          <select value={filters.status || ""} onChange={(e) => setFilter("status", e.target.value)} className={selectClass}>
            <option value="">All statuses</option>
            {Object.entries(ORDER_STATUS_TONE).map(([s]) => <option key={s} value={s}>{orderStatusLabel(s)}</option>)}
          </select>
          <select value={filters.order_type || ""} onChange={(e) => setFilter("order_type", e.target.value)} className={selectClass}>
            <option value="">All types</option>
            {ORDER_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filters.payment_method || ""} onChange={(e) => setFilter("payment_method", e.target.value)} className={selectClass}>
            <option value="">All payment methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
          </select>
          <select value={filters.payment_status || ""} onChange={(e) => setFilter("payment_status", e.target.value)} className={selectClass}>
            <option value="">All payment statuses</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-[12.5px] font-semibold text-text-muted">
            From
            <input
              type="date"
              value={filters.date_from || ""}
              onChange={(e) => setFilter("date_from", e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit"
            />
          </label>
          <label className="flex items-center gap-2 text-[12.5px] font-semibold text-text-muted">
            To
            <input
              type="date"
              value={filters.date_to || ""}
              onChange={(e) => setFilter("date_to", e.target.value)}
              className="px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit"
            />
          </label>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-orange-primary bg-orange-soft border border-orange-soft hover:bg-orange-soft/70 transition-colors cursor-pointer font-outfit"
            >
              Clear filters
            </button>
          )}
        </div>
        {error ? (
          <div className="p-5"><ErrorBanner message={error} onRetry={fetchOrders} /></div>
        ) : loading ? (
          <LoadingRows count={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Order", "Customer", "Restaurant", "Rider", "Total", "Payment", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr
                    key={o.id}
                    onClick={() => openDetail(o)}
                    className={`hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i < orders.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-orange-primary font-semibold whitespace-nowrap">#{o.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{o.customer_name}</p>
                      {o.order_type === "dine_in" ? (
                        <p className="text-xs font-semibold text-success mt-0.5">
                          Dine-In{o.table_number ? ` · Table ${o.table_number}` : ""}
                        </p>
                      ) : o.delivery_address ? (
                        <p className="text-xs text-text-light mt-0.5 truncate max-w-[160px]">{o.delivery_address}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{o.restaurant_name}</td>
                    <td className="px-4 py-3">
                      {o.rider_name ? (
                        <span className="inline-flex items-center gap-1.5 text-text-muted">
                          {o.rider_name}
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-text-light">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-text-primary whitespace-nowrap">{formatBDT(o.total)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">{paymentMethodLabel(o.payment_method)}</p>
                      <PillBadge tone={PAYMENT_STATUS_TONE[o.payment_status] || "zinc"}>{o.payment_status || "\u2014"}</PillBadge>
                    </td>
                    <td className="px-4 py-3">
                      <PillBadge tone={ORDER_STATUS_TONE[o.status] || "zinc"}>{orderStatusLabel(o.status)}</PillBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-light whitespace-nowrap">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-light">
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[13px] text-text-light">
              Page {meta.current_page} of {meta.last_page} · {meta.total} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-default"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-default"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order #${selected.id}` : ""}
        subtitle={selected ? `${selected.restaurant_name} · ${formatDateTime(selected.created_at)}` : ""}
      >
        {detail ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <PillBadge tone={ORDER_STATUS_TONE[detail.status] || "zinc"}>{orderStatusLabel(detail.status)}</PillBadge>
              <div className="text-[13px] text-text-muted">
                {detail.delivered_at ? `Delivered ${formatDateTime(detail.delivered_at)}` : "Not delivered yet"}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Customer</div>
              <p className="text-[15px] font-semibold text-text-primary">{detail.user?.name || "\u2014"}</p>
              <p className="text-[13px] text-text-muted mt-0.5">{detail.user?.email}</p>
              <p className="text-[13px] text-text-muted">{detail.user?.phone || ""}</p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Restaurant</div>
              <p className="text-[15px] font-semibold text-text-primary">{detail.restaurant?.restaurant_name || "\u2014"}</p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Order type</div>
              <p className="text-[14px] font-semibold text-text-primary">
                {detail.order_type === "dine_in"
                  ? `Dine-In${detail.table_number ? ` · Table ${detail.table_number}` : ""}`
                  : capitalize(detail.order_type || "delivery")}
              </p>
              {detail.order_type === "delivery" && detail.delivery_address && (
                <div className="mt-2">
                  <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-1">Delivery address</div>
                  <p className="text-[14px] text-text-primary">{detail.delivery_address}</p>
                  {detail.delivery_instructions && (
                    <p className="text-[13px] text-text-muted mt-1">{detail.delivery_instructions}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Items</div>
              <div className="border border-border rounded-[10px] divide-y divide-[#F3F4F6]">
                {(detail.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[12px] font-bold text-orange-primary font-mono shrink-0">x{item.quantity}</span>
                      <span className="text-[14px] font-medium text-text-primary truncate">{item.name}</span>
                    </div>
                    <span className="text-[13.5px] font-mono font-semibold text-text-primary shrink-0">{formatBDT(item.price * item.quantity)}</span>
                  </div>
                ))}
                {(detail.items || []).length === 0 && (
                  <div className="px-3.5 py-4 text-center text-[13px] text-text-light">No items.</div>
                )}
              </div>
            </div>

            <div className="flex justify-between text-[14px]">
              <span className="text-text-muted">Subtotal</span>
              <span className="font-mono font-semibold text-text-primary">{formatBDT(Number(detail.total || 0) - Number(detail.delivery_fee || 0))}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-text-muted">Delivery fee</span>
              <span className="font-mono font-semibold text-text-primary">{formatBDT(detail.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-[15px] border-t border-border pt-3">
              <span className="font-bold text-text-primary">Total</span>
              <span className="font-mono font-extrabold text-orange-primary">{formatBDT(detail.total)}</span>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Payment</div>
              <div className="flex items-center gap-2">
                <PillBadge tone="blue">{paymentMethodLabel(detail.payment_method)}</PillBadge>
                <PillBadge tone={PAYMENT_STATUS_TONE[detail.payment_status] || "zinc"}>{detail.payment_status || "\u2014"}</PillBadge>
              </div>
              <p className="text-[12.5px] text-text-light mt-2 font-mono">
                Txn: {detail.tran_id || (detail.payment_method === "cash" ? "\u2014" : "Not initiated")}
              </p>
            </div>

            {!isTerminal(detail.status) && detail.order_type !== "takeout" && (
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Assign delivery rider</div>
                <div className="flex items-center gap-2.5">
                  <select
                    value={detail.rider_id || ""}
                    onChange={(e) => e.target.value && assignRider(Number(e.target.value))}
                    disabled={acting}
                    className="flex-1 appearance-none pl-3 pr-8 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit"
                  >
                    <option value="">{detail.rider ? `${detail.rider.user?.name} (current)` : "Select a rider..."}</option>
                    {detail.rider && (
                      <option value={detail.rider_id} disabled>
                        {detail.rider.user?.name} (current)
                      </option>
                    )}
                    {availableRiders
                      .filter((r) => r.id !== detail.rider_id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.rider_name} (available)</option>
                      ))}
                    {busyRiders
                      .filter((r) => r.id !== detail.rider_id)
                      .map((r) => (
                        <option key={r.id} value={r.id} disabled>{r.rider_name} (busy)</option>
                      ))}
                  </select>
                  {detail.rider && (
                    <button
                      onClick={() => assignRider(null)}
                      disabled={acting}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-text-light mt-2">
                  Only approved riders who are online and not currently delivering can be assigned.
                </p>
              </div>
            )}

            {!isTerminal(detail.status) && detail.order_type === "takeout" && (
              <p className="text-[12.5px] text-text-muted bg-[#FAFAFA] border border-border rounded-lg px-3 py-2.5">
                Takeout order — self-pickup, no rider needed. Restaurant marks it Picked Up.
              </p>
            )}

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Status</div>
              <p className="text-[13px] text-text-muted">
                Status is managed by the restaurant and rider. See the timeline below for progress.
              </p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-3">Timeline</div>
              {(detail.status_histories || []).length === 0 ? (
                <p className="text-[13px] text-text-muted">Order placed · {formatDateTime(detail.created_at)}</p>
              ) : (
                <div className="flex flex-col">
                  {(detail.status_histories || []).map((h, i, arr) => {
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                            style={{ background: ORDER_STATUS_COLOR[h.status] || "#9CA3AF" }}
                          />
                          {!isLast && <span className="w-px flex-1 bg-[#E5E7EB] my-0.5" />}
                        </div>
                        <div className="pb-4 min-w-0">
                          <p className="text-[14px] font-semibold text-text-primary">{orderStatusLabel(h.status)}</p>
                          <p className="text-[12px] text-text-light mt-0.5">{formatDateTime(h.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <LoadingRows count={5} />
        )}
      </DetailDrawer>
    </div>
  );
}