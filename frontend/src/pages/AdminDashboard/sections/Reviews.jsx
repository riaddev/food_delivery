import { useCallback, useEffect, useState } from "react";
import { Check, Search, Star, Trash2, X } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorBanner, LoadingRows } from "../components/States";
import { capitalize, formatDateTime } from "./utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "featured", label: "Homepage" },
  { key: "curated", label: "Curated" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_TONE = { pending: "amber", approved: "green", rejected: "red" };

const Stars = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={12} className={s <= value ? "text-amber-400" : "text-zinc-200"} fill="currentColor" />
    ))}
  </span>
);

export default function Reviews({ showToast }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [reviews, setReviews] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getReviews();
      setReviews(res.data.reviews || []);
      setPendingCount(res.data.pending_count || 0);
    } catch {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

  const act = async (fn, successMsg) => {
    setActingId(confirm?.id ?? null);
    try {
      await fn();
      showToast(successMsg);
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    }
    setActingId(null);
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    const { action, id } = confirm;
    setConfirm(null);
    if (action === "reject") await act(() => adminApi.rejectReview(id), "Review rejected");
    else if (action === "delete") await act(() => adminApi.deleteReview(id), "Review deleted");
  };

  const filtered = reviews.filter((r) => {
    if (tab === "pending" && r.status !== "pending") return false;
    if (tab === "approved" && r.status !== "approved") return false;
    if (tab === "rejected" && r.status !== "rejected") return false;
    if (tab === "featured" && !(r.status === "approved" && r.is_featured)) return false;
    if (tab === "curated" && r.source !== "curated") return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.comment?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.restaurant?.restaurant_name?.toLowerCase().includes(q) ||
      r.menu_item?.name?.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    featured: reviews.filter((r) => r.status === "approved" && r.is_featured).length,
    curated: reviews.filter((r) => r.source === "curated").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const FeatureButton = ({ r }) => {
    if (r.status !== "approved") return null;
    const hasText = r.comment && r.comment.trim() !== "";
    return (
      <button
        onClick={() => act(() => adminApi.setReviewFeatured(r.id, !r.is_featured), r.is_featured ? "Removed from homepage" : "Will now show on homepage")}
        disabled={actingId === r.id || !hasText}
        title={!hasText ? "Reviews without text cannot be featured" : r.is_featured ? "Remove from homepage" : "Show on homepage"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 cursor-pointer font-outfit ${
          r.is_featured
            ? "text-violet-600 bg-violet-50 border-violet-200 hover:bg-violet-100"
            : "text-orange-primary bg-orange-soft border-orange-soft hover:bg-orange-soft/70"
        }`}
      >
        <Star size={13} strokeWidth={2.5} fill={r.is_featured ? "currentColor" : "none"} />
        {r.is_featured ? "Featured" : "Feature"}
      </button>
    );
  };

  return (
    <div>
      <Card pad="0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Reviews</div>
            <div className="text-[13px] text-text-muted mt-0.5">
              Approve customer reviews for restaurant / dish pages, and feature the best ones on the homepage
              {pendingCount > 0 && <span className="font-semibold text-amber-600"> — {pendingCount} pending</span>}
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews, people, dishes..."
              className="w-full sm:w-64 pl-8 pr-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer font-outfit border ${
                tab === t.key
                  ? "bg-orange-primary text-white border-orange-primary"
                  : "bg-[#FAFAFA] text-text-muted border-border hover:text-text-primary"
              }`}
            >
              {t.label} <span className="opacity-70">({counts[t.key]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingRows rows={5} />
        ) : error ? (
          <div className="p-5">
            <ErrorBanner message={error} onRetry={fetchAll} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-text-muted">
            No reviews here yet. New customer reviews appear under Pending after a delivered order.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li key={r.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars value={r.rating} />
                    <PillBadge tone={STATUS_TONE[r.status] || "zinc"}>{capitalize(r.status)}</PillBadge>
                    {r.is_featured && <PillBadge tone="purple">Homepage</PillBadge>}
                    {r.source === "curated" && <PillBadge tone="blue">Curated</PillBadge>}
                    {r.menu_item && <PillBadge tone="orange">{r.menu_item.name}</PillBadge>}
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-text-primary leading-relaxed">“{r.comment}”</p>}
                  <p className="mt-2 text-xs text-text-muted">
                    {r.user?.name || "Customer"}
                    {r.restaurant?.restaurant_name && <> · {r.restaurant.restaurant_name}</>}
                    {r.order_id && <> · order #{r.order_id} (verified purchase)</>}
                    {!r.order_id && r.source === "customer" && <> · no order proof</>}
                    <> · {formatDateTime(r.created_at)}</>
                  </p>
                </div>
                <div className="flex lg:flex-col items-center lg:items-end gap-2 shrink-0">
                  <FeatureButton r={r} />
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => act(() => adminApi.approveReview(r.id), "Review approved")}
                        disabled={actingId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                      >
                        <Check size={13} strokeWidth={2.5} /> Approve
                      </button>
                      <button
                        onClick={() => setConfirm({ action: "reject", id: r.id })}
                        disabled={actingId === r.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                      >
                        <X size={13} strokeWidth={2.5} /> Reject
                      </button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <button
                      onClick={() => setConfirm({ action: "reject", id: r.id })}
                      disabled={actingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                    >
                      <X size={13} strokeWidth={2.5} /> Reject
                    </button>
                  )}
                  {r.status === "rejected" && (
                    <button
                      onClick={() => act(() => adminApi.approveReview(r.id), "Review approved")}
                      disabled={actingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                    >
                      <Check size={13} strokeWidth={2.5} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => setConfirm({ action: "delete", id: r.id })}
                    disabled={actingId === r.id}
                    title="Delete permanently"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 bg-[#FAFAFA] border border-border hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === "delete" ? "Delete review?" : "Reject review?"}
        message={confirm?.action === "delete" ? "This permanently removes the review everywhere, including the homepage." : "The review will be hidden from the restaurant, dish and homepage."}
        confirmLabel={confirm?.action === "delete" ? "Delete" : "Reject"}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirmed}
      />
    </div>
  );
}
