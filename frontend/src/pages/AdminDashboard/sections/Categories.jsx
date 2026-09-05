import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Clock, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, Skeleton } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorBanner } from "../components/States";

const statusBadge = (status) => {
  const base = "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide font-outfit border";
  if (status === "pending") return `${base} text-amber-600 bg-amber-50 border-amber-200`;
  if (status === "approved") return `${base} text-emerald-600 bg-emerald-50 border-emerald-200`;
  return `${base} text-rose-600 bg-rose-50 border-rose-200`;
};

export default function Categories({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [confirmReject, setConfirmReject] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data.categories || []);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await adminApi.getCategoryRequests({ status: "pending" });
      setRequests(res.data.requests || []);
    } catch {
      // keep previous state
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => { fetchAll(); fetchRequests(); }, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll, fetchRequests]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const res = await adminApi.createCategory({ name });
      setCategories((prev) => [...prev, res.data.category]);
      setNewName("");
      showToast("Category added");
    } catch {
      showToast("Failed to add category", "error");
    }
    setBusy(false);
  };

  const handleRename = async (id) => {
    const name = draftName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await adminApi.updateCategory(id, { name });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
      setEditingId(null);
      showToast("Category renamed");
    } catch {
      showToast("Failed to rename category", "error");
    }
    setBusy(false);
  };

  const handleDelete = async (id) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    setConfirm(null);
    try {
      await adminApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("Category deleted");
    } catch {
      showToast("Failed to delete category", "error");
    }
  };

  const handleToggle = async (c) => {
    try {
      const res = await adminApi.updateCategory(c.id, { is_active: !c.is_active });
      setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: res.data.category.is_active } : x)));
      showToast(res.data.category.is_active ? "Category enabled" : "Category disabled");
    } catch {
      showToast("Failed to update category", "error");
    }
  };

  const handleMove = async (id, index, direction) => {
    const target = categories[index + direction];
    if (!target) return;
    const next = [...categories];
    next[index] = target;
    next[index + direction] = categories[index];
    setCategories(next);
    try {
      await adminApi.reorderCategories(next.map((c) => c.id));
    } catch {
      setCategories(categories);
      showToast("Failed to reorder", "error");
    }
  };

  const handleApproveRequest = async (id) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await adminApi.approveCategoryRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      fetchAll();
      showToast(res.data.message);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve request", "error");
    }
    setBusy(false);
  };

  const handleRejectRequest = async () => {
    if (busy || !confirmReject) return;
    setBusy(true);
    try {
      await adminApi.rejectCategoryRequest(confirmReject.id, { admin_note: rejectNote.trim() || null });
      setRequests((prev) => prev.filter((r) => r.id !== confirmReject.id));
      setConfirmReject(null);
      setRejectNote("");
      showToast("Request rejected");
    } catch {
      showToast("Failed to reject request", "error");
    }
    setBusy(false);
  };

  return (
    <div>
      <Card className="mb-5">
        <div className="flex items-center gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New category name, e.g. Grills & BBQ"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-text-light font-outfit"
          />
          <button
            onClick={handleAdd}
            disabled={busy || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-primary hover:bg-orange-deep disabled:opacity-50 transition-colors cursor-pointer shrink-0 font-outfit"
          >
            {busy ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Plus size={14} strokeWidth={2.5} />}
            Add Category
          </button>
        </div>
      </Card>

      {error ? (
        <ErrorBanner message={error} onRetry={fetchAll} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : categories.length === 0 ? (
        <Card className="py-14 text-center">
          <p className="font-semibold text-text-primary mb-1">No categories yet</p>
          <p className="text-sm text-text-light">Create your first category above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((c, index) => (
            <Card key={c.id} className={`flex items-center gap-4 ${c.is_active === false ? "opacity-60" : ""}`}>
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-orange-soft text-orange-deep">
                  <UtensilsCrossed size={18} strokeWidth={2} />
                </span>
              )}
              <div className="flex-1 min-w-0">
                {editingId === c.id ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(c.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-300 font-outfit"
                  />
                ) : (
                  <>
                    <p className="font-semibold text-text-primary truncate">{c.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{c.menu_items_count ?? c.count ?? 0} menu items</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {editingId === c.id ? (
                  <button
                    onClick={() => handleRename(c.id)}
                    disabled={busy}
                    className="w-7 h-7 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                    aria-label="Save category"
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggle(c)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer font-outfit border ${
                        c.is_active === false
                          ? "text-text-light bg-[#FAFAFA] border-border"
                          : "text-emerald-600 bg-emerald-50 border-emerald-200"
                      }`}
                      aria-label={`Toggle ${c.name}`}
                    >
                      {c.is_active === false ? "Off" : "On"}
                    </button>
                    <button
                      onClick={() => { setEditingId(c.id); setDraftName(c.name); }}
                      className="w-7 h-7 rounded-lg text-text-light hover:text-text-primary hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label={`Rename ${c.name}`}
                    >
                      <Pencil size={13} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setConfirm({ id: c.id, name: c.name })}
                  disabled={busy}
                  className="w-7 h-7 rounded-lg text-text-light hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 size={13} />
                </button>
                <div className="flex flex-col ml-1">
                  <button
                    onClick={() => handleMove(c.id, index, -1)}
                    disabled={index === 0 || busy}
                    className="w-6 h-4 rounded hover:bg-zinc-100 flex items-center justify-center text-text-light hover:text-text-primary disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Move up"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => handleMove(c.id, index, 1)}
                    disabled={index === categories.length - 1 || busy}
                    className="w-6 h-4 rounded hover:bg-zinc-100 flex items-center justify-center text-text-light hover:text-text-primary disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Move down"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[12.5px] text-text-light mt-4">
        Disabled categories are hidden from customer browsing.
      </p>

      {!requestsLoading && requests.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-text-primary">Pending Requests</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold font-outfit">
              {requests.length}
            </span>
          </div>
          <div className="grid gap-3">
            {requests.map((r) => (
              <Card key={r.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-soft flex items-center justify-center text-orange-deep shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="font-semibold text-text-primary">{r.name}</p>
                    <span className={statusBadge(r.status)}>{r.status}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Requested by <span className="font-medium text-text-primary">{r.restaurant?.restaurant_name}</span>
                    {" \u00b7 "}
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveRequest(r.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      onClick={() => setConfirmReject(r)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X size={13} /> Reject
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm.id)}
        danger
        title="Delete category?"
        message={`"${confirm?.name}" will be deleted and its menu items will be unassigned.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={Boolean(confirmReject)}
        onClose={() => { setConfirmReject(null); setRejectNote(""); }}
        onConfirm={handleRejectRequest}
        danger
        title="Reject category request?"
        message={`"${confirmReject?.name}" requested by ${confirmReject?.restaurant?.restaurant_name}`}
        confirmLabel="Reject"
        extra={
          <input
            type="text"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full mt-3 px-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-300 font-outfit"
          />
        }
      />
    </div>
  );
}
