import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import DetailDrawer from "../components/DetailDrawer";
import { ErrorBanner, LoadingRows } from "../components/States";
import { formatBDT, formatDate, formatDateTime, initials, ORDER_STATUS_TONE, orderStatusLabel, USER_STATUS_TONE } from "./utils";

export default function Customers({ showToast }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [acting, setActing] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCustomers({ page, per_page: 20, search: query || undefined, status: status || undefined });
      setCustomers(res.data.customers || []);
      setMeta(res.data.meta || null);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    const t = window.setTimeout(fetchCustomers, 0);
    return () => window.clearTimeout(t);
  }, [fetchCustomers]);

  const openDetail = async (c) => {
    setSelected(c);
    setDetail(null);
    try {
      const res = await adminApi.getCustomer(c.id);
      setDetail(res.data);
    } catch {
      setDetail({});
    }
  };

  const toggleSuspend = async (c) => {
    if (acting) return;
    setActing(true);
    try {
      if (c.status === "suspended") {
        await adminApi.activateCustomer(c.id);
        showToast(`${c.name} reactivated`);
      } else {
        await adminApi.suspendCustomer(c.id);
        showToast(`${c.name} suspended`);
      }
      fetchCustomers();
      if (selected?.id === c.id) {
        const res = await adminApi.getCustomer(c.id);
        setDetail(res.data);
      }
    } catch {
      showToast("Action failed", "error");
    }
    setActing(false);
  };

  const requestSuspend = (c) => {
    setConfirm({ id: c.id, name: c.name });
  };

  const selectClass = "appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-semibold bg-[#FAFAFA] border border-border cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200 font-outfit";

  return (
    <div>
      <Card pad="0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Customers</div>
            <div className="text-[13px] text-text-muted mt-0.5">Manage customer accounts and access</div>
          </div>
          <div className="flex items-center gap-2.5">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search name, email, phone..."
                className="w-full sm:w-64 pl-8 pr-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-5"><ErrorBanner message={error} onRetry={fetchCustomers} /></div>
        ) : loading ? (
          <LoadingRows count={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Customer", "Contact", "Orders", "Spending", "Status", "Joined", "Action"].map((h) => (
                    <th key={h} className={`px-4 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => openDetail(c)}
                    className={`hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i < customers.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-orange-soft flex items-center justify-center text-xs font-bold text-orange-deep shrink-0">
                          {initials(c.name)}
                        </span>
                        <p className="font-medium text-text-primary">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-muted">{c.email}</p>
                      {c.phone && <p className="text-xs text-text-light mt-0.5">{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13.5px] text-text-primary">{c.total_orders}</td>
                    <td className="px-4 py-3 font-mono text-[13.5px] font-semibold text-text-primary whitespace-nowrap">{formatBDT(c.total_spending)}</td>
                    <td className="px-4 py-3">
                      <PillBadge tone={USER_STATUS_TONE[c.status] || "zinc"}>{c.status}</PillBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-light whitespace-nowrap">
                      {c.created_at ? formatDate(c.created_at) : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {c.status === "suspended" ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSuspend(c); }}
                            disabled={acting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                          >
                            <ShieldCheck size={13} strokeWidth={2.5} />
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); requestSuspend(c); }}
                            disabled={acting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                          >
                            <ShieldOff size={13} strokeWidth={2.5} />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-text-light">
                      No customers found.
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
              Page {meta.current_page} of {meta.last_page} · {meta.total} customers
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
        title={selected?.name || ""}
        subtitle={selected?.email || ""}
      >
        {detail?.customer ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <PillBadge tone={USER_STATUS_TONE[detail.customer.status] || "zinc"}>{detail.customer.status}</PillBadge>
              {detail.customer.status === "suspended" ? (
                <button
                  onClick={() => toggleSuspend(detail.customer)}
                  disabled={acting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                >
                  <ShieldCheck size={13} strokeWidth={2.5} /> Activate
                </button>
              ) : (
                <button
                  onClick={() => requestSuspend(detail.customer)}
                  disabled={acting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                >
                  <ShieldOff size={13} strokeWidth={2.5} /> Suspend
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">{detail.total_orders ?? 0}</div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Total orders</div>
              </div>
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">{formatBDT(detail.total_spending)}</div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Spending</div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Contact</div>
              <p className="text-[14px] text-text-primary">{detail.customer.email}</p>
              {detail.customer.phone && <p className="text-[13px] text-text-muted mt-0.5">{detail.customer.phone}</p>}
              {detail.customer.address && <p className="text-[13px] text-text-muted">{detail.customer.address}</p>}
              <p className="text-[12.5px] text-text-light mt-2">Joined {formatDateTime(detail.customer.created_at)}</p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Recent orders</div>
              <div className="border border-border rounded-[10px] divide-y divide-[#F3F4F6] max-h-56 overflow-y-auto">
                {(detail.orders || []).map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-text-primary">#{o.id} · {o.restaurant?.restaurant_name || "\u2014"}</p>
                      <p className="text-[12px] text-text-light mt-0.5">{formatDate(o.created_at)} · {o.items?.length ?? 0} items</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-mono font-semibold text-text-primary">{formatBDT(o.total)}</p>
                      <PillBadge tone={ORDER_STATUS_TONE[o.status] || "zinc"}>{orderStatusLabel(o.status)}</PillBadge>
                    </div>
                  </div>
                ))}
                {(detail.orders || []).length === 0 && (
                  <div className="px-3.5 py-4 text-center text-[13px] text-text-light">No orders yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <LoadingRows count={5} />
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) toggleSuspend({ id: confirm.id, name: confirm.name, status: "active" });
          setConfirm(null);
        }}
        danger
        title="Suspend customer?"
        message={`${confirm?.name} will lose access to the platform immediately. They can be reactivated at any time.`}
        confirmLabel="Suspend"
      />
    </div>
  );
}