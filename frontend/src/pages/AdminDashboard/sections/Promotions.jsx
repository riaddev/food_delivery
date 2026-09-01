import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorBanner, LoadingRows } from "../components/States";
import { formatDate } from "./utils";

const EMPTY_FORM = {
  code: "",
  type: "percentage",
  value: "",
  min_order_amount: "",
  restaurant_id: "",
  starts_at: "",
  ends_at: "",
  usage_limit: "",
};

export default function Promotions({ showToast }) {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPromoCodes();
      setPromoCodes(res.data.promo_codes || []);
    } catch {
      setError("Failed to load promo codes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

  useEffect(() => {
    adminApi
      .getRestaurants()
      .then((res) => setRestaurants(res.data.restaurants || []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      code: p.code,
      type: p.type,
      value: p.value,
      min_order_amount: p.min_order_amount ?? "",
      restaurant_id: p.restaurant_id ?? "",
      starts_at: p.starts_at ? p.starts_at.slice(0, 10) : "",
      ends_at: p.ends_at ? p.ends_at.slice(0, 10) : "",
      usage_limit: p.usage_limit ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.value,
      min_order_amount: form.min_order_amount || null,
      restaurant_id: form.restaurant_id || null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      usage_limit: form.usage_limit || null,
    };
    try {
      if (editing) {
        await adminApi.updatePromoCode(editing.id, payload);
        showToast("Promo code updated");
      } else {
        await adminApi.createPromoCode(payload);
        showToast("Promo code created");
      }
      setModalOpen(false);
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors)[0]?.[0] : "Failed to save promo code";
      showToast(msg || "Failed to save promo code", "error");
    }
    setBusy(false);
  };

  const handleToggle = async (p) => {
    try {
      await adminApi.togglePromoCode(p.id);
      showToast(p.is_active ? "Promo code deactivated" : "Promo code activated");
      fetchAll();
    } catch {
      showToast("Failed to toggle promo code", "error");
    }
  };

  const handleDelete = async (p) => {
    setConfirm(null);
    try {
      await adminApi.deletePromoCode(p.id);
      showToast("Promo code deleted");
      fetchAll();
    } catch {
      showToast("Failed to delete promo code", "error");
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit";
  const labelClass = "block text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-1.5";

  return (
    <div>
      <Card pad="0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Promotions</div>
            <div className="text-[13px] text-text-muted mt-0.5">Manage promotional codes and discounts.</div>
            <p className="text-[12px] text-text-light mt-1">Customer checkout redemption is not enabled yet.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-orange-primary hover:bg-orange-deep transition-colors cursor-pointer font-outfit"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Promo Code
          </button>
        </div>

        {error ? (
          <div className="p-5"><ErrorBanner message={error} onRetry={fetchAll} /></div>
        ) : loading ? (
          <LoadingRows count={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Code", "Discount", "Min order", "Restaurant", "Window", "Usage", "Status", "Actions"].map((h) => (
                    <th key={h} className={`px-4 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {promoCodes.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-[#FAFAFA] transition-colors ${i < promoCodes.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-soft text-orange-deep font-mono font-bold text-[13px] tracking-wide">
                        {p.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13.5px] font-semibold text-text-primary whitespace-nowrap">
                      {p.type === "percentage" ? `${p.value}%` : `\u09F3${Number(p.value).toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-text-muted whitespace-nowrap">
                      {p.min_order_amount ? `\u09F3${Number(p.min_order_amount).toLocaleString("en-IN")}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-text-muted">{p.restaurant_name || "All restaurants"}</td>
                    <td className="px-4 py-3 text-[12.5px] text-text-light whitespace-nowrap">
                      {p.starts_at ? formatDate(p.starts_at) : "Anytime"}
                      {p.ends_at ? ` \u2192 ${formatDate(p.ends_at)}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13.5px] text-text-primary whitespace-nowrap">
                      {p.usage_limit ? `${p.times_used}/${p.usage_limit}` : p.times_used}
                    </td>
                    <td className="px-4 py-3">
                      <PillBadge tone={p.is_active ? (p.is_valid ? "green" : "amber") : "zinc"}>
                        {p.is_active ? (p.is_valid ? "Active" : "Expired") : "Disabled"}
                      </PillBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(p)}
                          className="w-7 h-7 rounded-lg text-text-light hover:text-text-primary hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleToggle(p)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            p.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          aria-label="Toggle"
                        >
                          <Power size={13} />
                        </button>
                        <button
                          onClick={() => setConfirm({ id: p.id, code: p.code })}
                          className="w-7 h-7 rounded-lg text-text-light hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promoCodes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-light">
                      No promo codes yet. Create your first one to start offering discounts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-[13px] border border-border w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <div className="text-[16px] font-bold text-text-primary">{editing ? "Edit promo code" : "New promo code"}</div>
                <div className="text-[13px] text-text-muted mt-0.5">
                  {editing ? `Editing ${editing.code}` : "Create a discount code for customers"}
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-light hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Code</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. SWIFT25"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (\u09F3)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Value</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={form.type === "percentage" ? 100 : undefined}
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === "percentage" ? "e.g. 25" : "e.g. 100"}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Min order amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Restaurant</label>
                  <select
                    value={form.restaurant_id}
                    onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">All restaurants</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.restaurant_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Starts</label>
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Ends</label>
                  <input
                    type="date"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Usage limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-text-muted bg-[#FAFAFA] border border-border hover:text-text-primary transition-colors cursor-pointer font-outfit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-primary hover:bg-orange-deep disabled:opacity-50 transition-colors cursor-pointer font-outfit"
                >
                  {busy ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : null}
                  {editing ? "Save changes" : "Create promo code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        danger
        title="Delete promo code?"
        message={`"${confirm?.code}" will be permanently deleted.`}
        confirmLabel="Delete"
      />
    </div>
  );
}