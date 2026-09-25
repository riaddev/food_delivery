import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const inputCls =
  "w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-light outline-none focus:border-orange-primary transition-colors";

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold ${
        isError
          ? "bg-red-50 border-red-100 text-red-600"
          : "bg-emerald-50 border-emerald-100 text-emerald-700"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-red-500" : "bg-emerald-500"}`} />
      {toast.msg}
    </div>
  );
}

function ExpenseFormModal({ expense, onClose, onSave }) {
  const [title, setTitle] = useState(expense?.title || "");
  const [amount, setAmount] = useState(expense?.amount != null ? String(expense.amount) : "");
  const [note, setNote] = useState(expense?.note || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(expense);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    const value = Number(amount);
    if (amount === "" || Number.isNaN(value) || value < 0) {
      setError("Amount must be a number of 0 or more.");
      return;
    }

    setBusy(true);
    try {
      await onSave({ title: title.trim(), amount: value, note: note.trim() || null });
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors)[0]?.[0]
          : err.response?.data?.message || "Failed to save the expense."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-[17px] font-bold text-text-primary m-0">
            {isEdit ? "Edit Expense" : "Add Expense"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-[13px] text-text-muted mt-0.5 mb-4">
          Track rent, salaries, ingredients and other running costs.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="expense-title" className="block text-[13px] font-semibold text-text-muted mb-1.5">
              Title *
            </label>
            <input
              id="expense-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly rent, Staff salary"
              maxLength={255}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="expense-amount" className="block text-[13px] font-semibold text-text-muted mb-1.5">
              Amount (৳) *
            </label>
            <input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="expense-note" className="block text-[13px] font-semibold text-text-muted mb-1.5">
              Note
            </label>
            <textarea
              id="expense-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional details about this expense…"
              maxLength={1000}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
            >
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ expense, busy, onConfirm, onCancel }) {
  if (!expense) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary text-lg m-0">Delete Expense</h3>
          <button
            onClick={onCancel}
            className="text-text-light hover:text-text-primary cursor-pointer bg-none border-none"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-text-muted m-0">
          Delete <span className="font-semibold text-text-primary">“{expense.title}”</span> (
          {formatPrice(expense.amount)})? This cannot be undone.
        </p>
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-muted hover:border-zinc-300 hover:text-text-primary transition disabled:opacity-50 cursor-pointer"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [formExpense, setFormExpense] = useState(null); // null | "new" | expense object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const load = () => {
    Promise.all([
      restaurantApi.getExpenses(),
      restaurantApi.getExpenseTotal().catch(() => null),
      restaurantApi.getOrders().catch(() => null),
    ])
      .then(([listRes, totalRes, ordersRes]) => {
        const list = listRes.data.expenses || [];
        setExpenses(list);
        const serverTotal = totalRes?.data?.total_expenses;
        setTotal(
          serverTotal != null
            ? Number(serverTotal) || 0
            : list.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        );
        const orders = ordersRes?.data?.orders || [];
        setRevenue(
          orders
            .filter((o) => ["delivered", "served"].includes(o.status))
            .reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
        );
      })
      .catch(() => setError("Failed to load expenses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses.reduce((s, e) => {
      const d = new Date(e.created_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        return s + (Number(e.amount) || 0);
      }
      return s;
    }, 0);
  }, [expenses]);

  const avgExpense = expenses.length > 0 ? total / expenses.length : 0;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? expenses.filter(
          (e) =>
            String(e.title || "").toLowerCase().includes(q) ||
            String(e.note || "").toLowerCase().includes(q)
        )
      : [...expenses];
    filtered.sort((a, b) => {
      if (sort === "amount-desc") return Number(b.amount || 0) - Number(a.amount || 0);
      if (sort === "amount-asc") return Number(a.amount || 0) - Number(b.amount || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return filtered;
  }, [expenses, search, sort]);

  const handleSave = async (payload) => {
    if (formExpense === "new") {
      await restaurantApi.createExpense(payload);
      showToast(`Expense "${payload.title}" added`);
    } else {
      await restaurantApi.updateExpense(formExpense.id, payload);
      showToast(`Expense "${payload.title}" updated`);
    }
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActing(true);
    try {
      await restaurantApi.deleteExpense(deleteTarget.id);
      showToast(`Expense "${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete the expense", "error");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-[13px] border border-border p-6 animate-pulse">
            <div className="h-5 bg-zinc-100 rounded w-40 mb-3" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { title: "Total Spent", value: formatPrice(total), icon: Wallet, tint: "bg-red-50 text-red-500" },
    { title: "Spent This Month", value: formatPrice(thisMonthTotal), icon: TrendingDown, tint: "bg-orange-soft text-orange-deep" },
    { title: "Entries", value: String(expenses.length), icon: Receipt, tint: "bg-sky-50 text-sky-600" },
  ];

  const netProfit = revenue - total;

  return (
    <div className="max-w-5xl">
      <Toast toast={toast} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card rounded-[13px] border border-border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${s.tint}`}>
                  <Icon size={17} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-light truncate m-0">
                    {s.title}
                  </p>
                  <p className="text-[17px] font-bold font-mono tracking-tight text-text-primary mt-0.5 leading-tight m-0">
                    {s.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-[13px] border px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-2 text-[13px] font-semibold ${netProfit < 0 ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
        <span>
          {formatPrice(revenue)} revenue − {formatPrice(total)} expenses = {formatPrice(netProfit)} net profit
        </span>
        <span className="text-[12px] font-medium opacity-80">Revenue from delivered / served orders</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[13px] font-semibold text-text-muted m-0">
          {visible.length} of {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
          {expenses.length > 0 && (
            <span className="text-text-light"> · Avg {formatPrice(avgExpense)}</span>
          )}
        </p>
        <button
          onClick={() => setFormExpense("new")}
          className="inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5 cursor-pointer font-outfit border-none"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or note…"
            className={`${inputCls} pl-10`}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={`${inputCls} sm:w-48 cursor-pointer`}
          aria-label="Sort expenses"
        >
          <option value="newest">Newest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => { setLoading(true); setError(null); load(); }}
            className="inline-flex items-center gap-1.5 font-semibold hover:text-red-700 cursor-pointer bg-none border-none text-red-600"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="bg-card rounded-[13px] border border-border py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-soft flex items-center justify-center text-orange-deep mb-4">
            <Wallet size={26} />
          </div>
          <p className="font-semibold text-text-primary mb-1 m-0">
            {expenses.length === 0 ? "No expenses yet" : "No matches found"}
          </p>
          <p className="text-sm text-text-muted m-0">
            {expenses.length === 0
              ? "Record rent, salaries and daily costs to keep track of spending."
              : "Try a different search term."}
          </p>
          {expenses.length === 0 && (
            <button
              onClick={() => setFormExpense("new")}
              className="mt-5 inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-6 py-2.5 rounded-lg cursor-pointer font-outfit border-none"
            >
              <Plus size={15} /> Add Your First Expense
            </button>
          )}
        </div>
      ) : (
        <section className="bg-card rounded-[13px] border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {visible.map((expense) => (
              <div key={expense.id} className="px-5 py-4 hover:bg-[#FAFAFA] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                      <Receipt size={17} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary text-sm truncate m-0">{expense.title}</p>
                      {expense.note && (
                        <p className="text-[13px] text-text-muted truncate mt-0.5 mb-0">{expense.note}</p>
                      )}
                      <p className="text-[11px] text-text-light mt-1 mb-0">
                        {expense.created_at
                          ? new Date(expense.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-bold font-mono tracking-tight text-text-primary m-0">
                      {formatPrice(expense.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => setFormExpense(expense)}
                        aria-label={`Edit ${expense.title}`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:border-orange-primary hover:text-orange-primary transition cursor-pointer bg-card"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(expense)}
                        aria-label={`Delete ${expense.title}`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition cursor-pointer bg-card"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(formExpense === "new" || (formExpense && formExpense !== "new")) && (
        <ExpenseFormModal
          expense={formExpense === "new" ? null : formExpense}
          onClose={() => setFormExpense(null)}
          onSave={handleSave}
        />
      )}

      <DeleteModal
        expense={deleteTarget}
        busy={acting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
