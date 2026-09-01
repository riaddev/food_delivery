import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import DetailDrawer from "../components/DetailDrawer";
import { ErrorBanner, LoadingRows } from "../components/States";
import { formatBDT, formatDateTime, ORDER_STATUS_TONE, orderStatusLabel, paymentMethodLabel, PAYMENT_STATUS_TONE } from "./utils";

const STATUSES = ["paid", "pending", "failed", "cancelled"];
const METHODS = ["cash", "bkash", "nagad", "card"];

export default function Payments({ onViewOrder }) {
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPayments({
        page,
        per_page: 20,
        payment_status: status || undefined,
        payment_method: method || undefined,
        search: query || undefined,
      });
      setPayments(res.data.payments || []);
      setMeta(res.data.meta || null);
    } catch {
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [page, status, method, query]);

  useEffect(() => {
    const t = window.setTimeout(fetchPayments, 0);
    return () => window.clearTimeout(t);
  }, [fetchPayments]);

  const selectClass = "appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-semibold bg-[#FAFAFA] border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit";

  return (
    <div>
      <Card pad="0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Payments</div>
            <div className="text-[13px] text-text-muted mt-0.5">Transaction history across all orders</div>
          </div>
          <div className="flex items-center gap-2.5">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All methods</option>
              {METHODS.map((m) => <option key={m} value={m}>{paymentMethodLabel(m)}</option>)}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search order # or txn ID..."
                className="w-full sm:w-52 pl-8 pr-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-5"><ErrorBanner message={error} onRetry={fetchPayments} /></div>
        ) : loading ? (
          <LoadingRows count={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Order", "Customer", "Transaction", "Method", "Amount", "Payment", "Order", "Date"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr
                    key={`${p.order_id}-${i}`}
                    onClick={() => setSelected(p)}
                    className={`hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i < payments.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-text-primary">
                        {p.order_id ? `#${p.order_id}` : "\u2014"}
                      </p>
                      {p.restaurant_name && <p className="text-xs text-text-light mt-0.5 max-w-[160px] truncate">{p.restaurant_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-text-muted max-w-[180px] truncate">{p.customer_name || "\u2014"}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[12.5px] text-text-muted max-w-[200px] truncate" title={p.tran_id}>
                        {p.tran_id || (p.method === "cash" ? "\u2014" : "Not initiated")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 capitalize text-text-muted">
                        {paymentMethodLabel(p.method || "sslcommerz")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-text-primary whitespace-nowrap">{formatBDT(p.amount)}</td>
                    <td className="px-4 py-3">
                      <PillBadge tone={PAYMENT_STATUS_TONE[p.status] || "zinc"}>{p.status || "\u2014"}</PillBadge>
                    </td>
                    <td className="px-4 py-3">
                      <PillBadge tone={ORDER_STATUS_TONE[p.order_status] || "zinc"}>{orderStatusLabel(p.order_status)}</PillBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-light whitespace-nowrap">
                      {p.created_at ? formatDateTime(p.created_at) : "\u2014"}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-light">
                      No transactions match the selected filters.
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
              Page {meta.current_page} of {meta.last_page} · {meta.total} payments
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
        title={selected?.order_id ? `Payment · Order #${selected.order_id}` : "Payment"}
        subtitle={selected?.tran_id || (selected?.method === "cash" ? "Cash on delivery" : undefined)}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <PillBadge tone={PAYMENT_STATUS_TONE[selected.status] || "zinc"}>{selected.status || "\u2014"}</PillBadge>
              <span className="text-[13px] font-mono font-semibold text-text-primary">{formatBDT(selected.amount)}</span>
            </div>
            <div className="border border-border rounded-[10px] divide-y divide-[#F3F4F6] text-[13.5px]">
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-light">Transaction</span>
                <span className="font-mono text-text-primary break-all text-right max-w-[60%]">
                  {selected.tran_id || (selected.method === "cash" ? "\u2014" : "Not initiated")}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-light">Method</span>
                <span className="font-semibold text-text-primary capitalize">{paymentMethodLabel(selected.method || "sslcommerz")}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-light">Customer</span>
                <span className="font-semibold text-text-primary text-right max-w-[55%]">{selected.customer_name || "\u2014"}</span>
              </div>
              {selected.restaurant_name && (
                <div className="flex justify-between px-4 py-3">
                  <span className="text-text-light">Restaurant</span>
                  <span className="text-text-primary text-right max-w-[55%]">{selected.restaurant_name}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-light">Order status</span>
                <span className="text-text-primary">{orderStatusLabel(selected.order_status)}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-text-light">Date</span>
                <span className="text-text-primary">{formatDateTime(selected.created_at)}</span>
              </div>
            </div>
            {onViewOrder && selected.order_id && (
              <button
                onClick={() => {
                  onViewOrder(selected.order_id);
                }}
                className="w-full px-4 py-2.5 rounded-[9px] bg-orange-primary hover:bg-orange-deep text-white text-[13.5px] font-semibold transition-colors cursor-pointer font-outfit"
              >
                View order #{selected.order_id}
              </button>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}