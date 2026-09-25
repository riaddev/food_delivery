import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, SectionTitle } from "../../../components/dashboard/Card";
import DetailDrawer from "../components/DetailDrawer";
import ConfirmDialog from "../components/ConfirmDialog";
import Lightbox from "../../../components/Lightbox";
import { ErrorBanner, LoadingRows } from "../components/States";
import { formatDateTime, orderStatusLabel } from "./utils";

const TYPE_LABELS = {
  rider_no_show: "Rider did not arrive",
  wrong_food: "Wrong food",
  missing_items: "Missing items",
  bad_quality: "Bad food quality",
  rotten_food: "Rotten/spoiled food",
  late_delivery: "Late delivery",
  other: "Other",
};

const STATUS_FILTERS = ["all", "open", "investigating", "resolved", "rejected"];

const STATUS_TONE = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  investigating: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const complaintTypeLabel = (t) => TYPE_LABELS[t] || t;

export default function Complaints({ showToast }) {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [resolution, setResolution] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [flagRefund, setFlagRefund] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = { page, per_page: 20 };
      if (status !== "all") params.status = status;
      const res = await adminApi.getComplaints(params);
      setList(res.data.complaints || []);
      setMeta(res.data.meta || null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial queue fetch on mount / filter change
    fetchList();
  }, [fetchList]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setResolution("");
    setAdminNote("");
    setFlagRefund(false);
    setDetailLoading(true);
    try {
      const res = await adminApi.getComplaint(id);
      setDetail(res.data);
    } catch {
      showToast?.("Couldn't load complaint details.", "error");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setConfirm(null);
  };

  const runResolve = async (target) => {
    if (target === "resolved" && !resolution.trim()) {
      showToast?.("Add a resolution note before resolving.", "error");
      return;
    }
    setResolving(true);
    try {
      await adminApi.resolveComplaint(selectedId, {
        status: target,
        resolution: resolution.trim() || null,
        admin_note: adminNote.trim() || null,
        flag_refund: target === "resolved" ? flagRefund : false,
      });
      showToast?.(`Complaint marked as ${target}.`);
      closeDetail();
      fetchList();
    } catch (err) {
      const data = err.response?.data || {};
      const firstValidation = data.errors ? Object.values(data.errors)[0]?.[0] : null;
      showToast?.(firstValidation || data.message || "Failed to update complaint.", "error");
    } finally {
      setResolving(false);
    }
  };

  const c = detail?.complaint || null;
  const order = c?.order || null;
  const gpsTrail = detail?.gps_trail || [];
  const canRefund = c?.status !== "resolved" && c?.status !== "rejected"
    && order?.payment_method !== "cash" && order?.payment_status === "paid";

  return (
    <div>
      <Card className="overflow-hidden">
        <SectionTitle title="Disputes" subtitle="Customer reports: no-shows, wrong food, quality issues" />
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer font-outfit ${
                status === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorBanner message="Couldn't load complaints." onRetry={fetchList} />
        ) : loading ? (
          <LoadingRows count={5} />
        ) : list.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No complaints in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-light border-b border-border">
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Order</th>
                  <th className="py-2.5 pr-3">Customer</th>
                  <th className="py-2.5 pr-3">Type</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openDetail(row.id)}
                    className="border-b border-border last:border-b-0 hover:bg-zinc-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono font-bold text-text-primary">#{row.id}</td>
                    <td className="py-3 pr-3 font-mono text-text-muted">#{row.order?.id ?? "—"}</td>
                    <td className="py-3 pr-3 text-text-primary font-medium">{row.customer?.name || "—"}</td>
                    <td className="py-3 pr-3 text-text-muted">{complaintTypeLabel(row.type)}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${STATUS_TONE[row.status] || STATUS_TONE.rejected}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-text-light text-xs whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-text-muted">Page {meta.current_page} of {meta.last_page}</span>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
              aria-label="Next page"
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </Card>

      <DetailDrawer
        open={selectedId !== null}
        title={c ? `Complaint #${c.id}` : "Complaint"}
        subtitle={c ? `${complaintTypeLabel(c.type)} · Order #${c.order_id}` : ""}
        onClose={closeDetail}
      >
        {detailLoading || !c ? (
          <LoadingRows count={4} />
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-light mb-1.5">Customer report</p>
              <p className="text-sm text-text-primary leading-relaxed">{c.description}</p>
              {((c.photo_urls || c.photos) || []).length > 0 && (
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {(c.photo_urls || c.photos).map((src, i, arr) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox({ images: arr, index: i })}
                      aria-label={`Preview evidence ${i + 1}`}
                      className="w-20 h-20 rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity cursor-pointer p-0 bg-white"
                    >
                      <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-light mb-1.5">Order</p>
              <div className="text-sm space-y-1">
                <p><b>#{order?.id}</b> · {orderStatusLabel(order?.status)} · {order?.payment_method} · {order?.payment_status}</p>
                <p className="text-text-muted">{order?.restaurant?.restaurant_name} · {order?.delivery_address || "—"}</p>
                <p className="text-text-muted">Customer: {order?.user?.name} ({order?.user?.phone || "no phone"})</p>
                {order?.rider?.user && <p className="text-text-muted">Rider: {order.rider.user.name}</p>}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-light mb-1.5">
                Status timeline {order?.status_histories?.length ? `(${order.status_histories.length})` : ""}
              </p>
              {(order?.status_histories || []).length === 0 ? (
                <p className="text-xs text-text-light">No history recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {order.status_histories.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-text-primary">{h.status}</span>
                      <span className="text-text-light">by {h.changed_by} · {formatDateTime(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-muted mt-2">
                GPS fixes on this order: <b className="text-text-primary">{gpsTrail.length}</b>
                {gpsTrail.length > 0 && (
                  <> · last <span className="font-mono">{Number(gpsTrail[0].latitude).toFixed(4)}, {Number(gpsTrail[0].longitude).toFixed(4)}</span> at {formatDateTime(gpsTrail[0].created_at)}</>
                )}
              </p>
            </div>

            {(c.status === "open" || c.status === "investigating") && (
              <div className="border-t border-border pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">Resolution note (required to resolve)</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="What was decided and why"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none placeholder:text-text-light box-border resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">Internal admin note (optional)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Private context for the team"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none placeholder:text-text-light box-border resize-none"
                  />
                </div>
                {canRefund ? (
                  <label className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                    <input type="checkbox" checked={flagRefund} onChange={(e) => setFlagRefund(e.target.checked)} className="accent-orange-500" />
                    Flag paid amount for manual refund (refund_pending)
                  </label>
                ) : (
                  <p className="text-[11px] text-text-light">
                    {order?.payment_method === "cash"
                      ? "COD order — nothing was collected, so there is nothing to refund."
                      : "Refund flag available only on paid, non-cash orders."}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {c.status === "open" && (
                    <button
                      onClick={() => runResolve("investigating")}
                      disabled={resolving}
                      className="text-xs font-bold px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 cursor-pointer font-outfit"
                    >
                      {resolving ? "Saving..." : "Mark Investigating"}
                    </button>
                  )}
                  <button
                    onClick={() => setConfirm({ action: "resolved" })}
                    disabled={resolving}
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 cursor-pointer font-outfit"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => setConfirm({ action: "rejected" })}
                    disabled={resolving}
                    className="text-xs font-bold px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer font-outfit"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {c.resolution && (
              <div className="bg-[#FAFAFA] border border-border rounded-lg px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-light mb-1">Resolution</p>
                <p className="text-sm text-text-primary">{c.resolution}</p>
                {c.admin_note && <p className="text-xs text-text-muted mt-1.5">Note: {c.admin_note}</p>}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.action === "rejected" ? "Reject complaint?" : "Resolve complaint?"}
        message={confirm?.action === "rejected"
          ? "The complaint will be closed as rejected. The customer will see this status."
          : "The complaint will be closed as resolved with your note."}
        confirmLabel={confirm?.action === "rejected" ? "Reject" : "Resolve"}
        danger={confirm?.action === "rejected"}
        onClose={() => setConfirm(null)}
        onConfirm={() => { const a = confirm?.action; setConfirm(null); if (a) runResolve(a); }}
      />
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          title="Complaint evidence"
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
