import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, Skeleton } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorBanner } from "../components/States";

export default function Categories({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

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

  useEffect(() => {
    const t = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

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

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm.id)}
        danger
        title="Delete category?"
        message={`"${confirm?.name}" will be deleted and its menu items will be unassigned.`}
        confirmLabel="Delete"
      />
    </div>
  );
}