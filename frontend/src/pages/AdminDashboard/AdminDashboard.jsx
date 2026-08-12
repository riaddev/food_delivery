import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Store, Users, UtensilsCrossed, ShoppingCart, LogOut,
  Menu, X, Wallet, ShoppingBag, UserRound, Clock, TrendingUp, Search,
  Check, ChevronDown, ChevronUp, Pencil, Trash2, Plus,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { adminApi } from "../../features/api/apiSlice";
import BackToHome from "../../components/BackToHome";

/* ------------------------------------------------------------------ */
/*  Helpers & mock data                                                */
/* ------------------------------------------------------------------ */

const formatBDT = (value) => `\u09F3${Number(value || 0).toLocaleString("en-IN")}`;

const MOCK_STATS = {
  total_revenue: 124500,
  revenue_delta: "+12% vs yesterday",
  active_orders: 45,
  active_orders_sub: "Across 12 restaurants",
  total_users: 8420,
  total_users_sub: "120 new this week",
  pending_approvals: 3,
  pending_approvals_sub: "Requires action",
};

const MOCK_PENDING = [
  { id: 1, restaurant_name: "Dhaka Biryani House", cuisine_type: "Biryani", owner_name: "Rahim", applied_date: "Oct 24" },
  { id: 2, restaurant_name: "Kacchi Bhai", cuisine_type: "Kacchi", owner_name: "Farhan", applied_date: "Oct 23" },
  { id: 3, restaurant_name: "Burger Republic", cuisine_type: "Fast Food", owner_name: "Nusrat", applied_date: "Oct 22" },
];

const MOCK_CATEGORIES = [
  { id: 1, name: "Biryani & Kacchi", count: 42, color: "bg-rose-50 text-rose-600" },
  { id: 2, name: "Fast Food", count: 87, color: "bg-amber-50 text-amber-600" },
  { id: 3, name: "Sweets & Desserts", count: 36, color: "bg-emerald-50 text-emerald-600" },
  { id: 4, name: "Chinese", count: 54, color: "bg-sky-50 text-sky-600" },
  { id: 5, name: "Beverages", count: 29, color: "bg-indigo-50 text-indigo-600" },
  { id: 6, name: "Bakery & Cafe", count: 23, color: "bg-violet-50 text-violet-600" },
];

const TONE_DOT = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
};

const ACTIVITY_TONES = {
  restaurant_approved: "green",
  restaurant_rejected: "red",
  user_registered: "green",
  order_placed: "yellow",
};

const ORDER_STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  preparing: "bg-indigo-50 text-indigo-600",
  out_for_delivery: "bg-purple-50 text-purple-600",
  delivered: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-zinc-100 text-zinc-500",
};

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "approvals", label: "Restaurant Approvals", icon: Store },
  { key: "users", label: "User Management", icon: Users },
  { key: "categories", label: "Categories", icon: UtensilsCrossed },
  { key: "orders", label: "All Orders", icon: ShoppingCart },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ title, action }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
    <h2 className="text-sm font-semibold tracking-tight text-zinc-900">{title}</h2>
    {action}
  </div>
);

const StatusBadge = ({ status }) => {
  const tone = ORDER_STATUS_COLORS[status] || "bg-zinc-100 text-zinc-600";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${tone}`}>
      {String(status || "—").replace(/_/g, " ")}
    </span>
  );
};

const Skeleton = ({ className }) => (
  <div className={`bg-zinc-100 rounded-lg animate-pulse ${className}`} />
);

/* ------------------------------------------------------------------ */
/*  Overview section                                                    */
/* ------------------------------------------------------------------ */

function Overview({ stats, pending, activity, onApprove, onReject, onNavigate, actingId }) {
  const statCards = [
    {
      label: "Total Revenue (Today)",
      value: formatBDT(stats.today_revenue ?? MOCK_STATS.total_revenue),
      icon: Wallet,
      tint: "bg-emerald-50 text-emerald-600",
      sub: stats.revenue_delta || "+12% vs yesterday",
      subTone: "text-emerald-600",
    },
    {
      label: "Active Orders",
      value: String(stats.active_orders ?? MOCK_STATS.active_orders),
      icon: ShoppingBag,
      tint: "bg-sky-50 text-sky-600",
      sub: stats.active_orders_sub || "Across 12 restaurants",
      subTone: "text-zinc-500",
    },
    {
      label: "Total Users",
      value: String(stats.total_users ?? MOCK_STATS.total_users),
      icon: UserRound,
      tint: "bg-indigo-50 text-indigo-600",
      sub: stats.total_users_sub || "120 new this week",
      subTone: "text-zinc-500",
    },
    {
      label: "Pending Approvals",
      value: String(stats.pending_approvals ?? MOCK_STATS.pending_approvals),
      icon: Clock,
      tint: "bg-amber-50 text-amber-600",
      sub: stats.pending_approvals_sub || "Requires action",
      subTone: "text-amber-600",
    },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-500 truncate">{s.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1.5 leading-tight">{s.value}</p>
                  <p className={`text-xs font-medium mt-1.5 ${s.subTone}`}>{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.tint}`}>
                  <Icon size={18} strokeWidth={2} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.85fr_1fr] gap-6 items-start">
        {/* Pending Restaurant Approvals */}
        <Card>
          <SectionTitle
            title="Pending Restaurant Approvals"
            action={
              <button
                onClick={() => onNavigate("approvals")}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                View all
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-zinc-100">
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Restaurant Name</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Cuisine</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Owner</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Applied Date</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-zinc-900">{r.restaurant_name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">{r.cuisine_type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{r.owner_name}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">{r.applied_date}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onApprove(r)}
                          disabled={actingId === r.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {actingId === r.id ? (
                            <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          ) : (
                            <Check size={13} strokeWidth={2.5} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(r)}
                          disabled={actingId === r.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <X size={13} strokeWidth={2.5} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Platform Activity */}
        <Card>
          <SectionTitle title="Recent Platform Activity" />
          <div className="px-5 py-4">
            <div className="relative space-y-5">
              {activity.length === 0 && (
                <p className="text-sm text-zinc-400">No recent activity.</p>
              )}
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3.5 relative">
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${TONE_DOT[ACTIVITY_TONES[item.type] || "green"]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 leading-snug">{item.description}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Approvals section                                                   */
/* ------------------------------------------------------------------ */

function Approvals({ restaurants, loading, onApprove, onReject, actingId }) {
  const pending = restaurants.filter((r) => r.status === "pending");

  if (loading) {
    return (
      <Card className="p-5 space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="Restaurant Approvals" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-zinc-100">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Restaurant</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Owner</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Cuisine</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-zinc-900">{r.restaurant_name}</p>
                  {r.city && <p className="text-xs text-zinc-400 mt-0.5">{r.city}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-zinc-700">{r.owner_name || "—"}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{r.owner_email}</p>
                </td>
                <td className="px-5 py-3.5 text-zinc-600">{r.cuisine_type || "—"}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onApprove(r)}
                      disabled={actingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {actingId === r.id ? (
                        <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      ) : (
                        <Check size={13} strokeWidth={2.5} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(r)}
                      disabled={actingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X size={13} strokeWidth={2.5} />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-400">
                  No pending approvals — you're all caught up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Users section                                                       */
/* ------------------------------------------------------------------ */

function UsersSection({ users, loading, onRoleChange }) {
  const [query, setQuery] = useState("");

  const filtered = users.filter(
    (u) =>
      !query ||
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase())
  );

  const ROLE_TONES = {
    admin: "bg-indigo-50 text-indigo-600",
    restaurant: "bg-amber-50 text-amber-600",
    customer: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">User Management</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-56 pl-8 pr-3 py-2 rounded-lg text-sm bg-zinc-50 border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-zinc-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-zinc-100">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">User</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Email</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Role</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Joined</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 text-right">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                        {u.name?.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
                      </span>
                      <p className="font-medium text-zinc-900">{u.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${ROLE_TONES[u.role] || "bg-zinc-100 text-zinc-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      <div className="relative">
                        <select
                          value={u.role}
                          onChange={(e) => onRoleChange(u.id, e.target.value)}
                          className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold bg-zinc-50 border border-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200"
                        >
                          <option value="customer">customer</option>
                          <option value="restaurant">restaurant</option>
                          <option value="admin">admin</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Categories section                                                  */
/* ------------------------------------------------------------------ */

function Categories({ categories, loading, onAdd, onRename, onDelete, onMove }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    const ok = await onAdd(name);
    setBusy(false);
    if (ok) setNewName("");
  };

  const handleRename = async (id) => {
    const name = draftName.trim();
    if (!name || busy) return;
    setBusy(true);
    const ok = await onRename(id, name);
    setBusy(false);
    if (ok) setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Food Categories</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Curate how dishes are organised across the platform.</p>
        </div>
      </div>

      {/* Add new category */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New category name, e.g. Grills & BBQ"
            className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
          <button
            onClick={handleAdd}
            disabled={busy || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
          >
            {busy ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Plus size={14} strokeWidth={2.5} />}
            Add Category
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : categories.length === 0 ? (
        <Card className="py-14 text-center">
          <p className="font-semibold text-zinc-700 mb-1">No categories yet</p>
          <p className="text-sm text-zinc-400">Create your first category above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((c, index) => (
            <Card key={c.id} className="p-5 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-zinc-100 text-zinc-500">
                <UtensilsCrossed size={18} strokeWidth={2} />
              </span>
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
                    className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                ) : (
                  <>
                    <p className="font-semibold text-zinc-900 truncate">{c.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{c.menu_items_count ?? c.count ?? 0} menu items</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
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
                  <button
                    onClick={() => { setEditingId(c.id); setDraftName(c.name); }}
                    className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label={`Rename ${c.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <button
                  onClick={() => onDelete(c.id)}
                  disabled={busy}
                  className="w-7 h-7 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 size={13} />
                </button>
                <div className="flex flex-col ml-1">
                  <button
                    onClick={() => onMove(c.id, index, -1)}
                    disabled={index === 0 || busy}
                    className="w-6 h-4 rounded hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="Move up"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => onMove(c.id, index, 1)}
                    disabled={index === categories.length - 1 || busy}
                    className="w-6 h-4 rounded hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Orders section                                                      */
/* ------------------------------------------------------------------ */

function OrdersSection({ orders, loading, onStatusChange }) {
  const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "served", "cancelled"];
  const paymentMethodLabel = (method) => {
    if (method === "bkash") return "bKash";
    if (method === "card") return "Card";
    return "COD";
  };

  return (
    <Card>
      <SectionTitle title="All Orders" />
      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-zinc-100">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Order</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Customer</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Restaurant</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Total</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Payment</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">#{o.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900">{o.customer_name}</p>
                    {o.order_type === "dine_in" ? (
                      <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                        Dine-In{o.table_number ? ` · Table ${o.table_number}` : ""}
                      </p>
                    ) : o.delivery_address ? (
                      <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[180px]">{o.delivery_address}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">{o.restaurant_name}</td>
                  <td className="px-5 py-3.5 font-semibold text-zinc-900">{formatBDT(o.total)}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-zinc-900">{paymentMethodLabel(o.payment_method)}</p>
                    <p className={`text-xs font-medium mt-0.5 ${o.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                      {o.payment_status === "paid" ? "Paid" : "Pay on delivery"}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="relative inline-block">
                      <select
                        value={o.status}
                        onChange={(e) => onStatusChange(o.id, e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold bg-zinc-50 border border-zinc-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-200 capitalize"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-400">
                    {o.created_at
                      ? new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-zinc-400">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast notification                                                  */
/* ------------------------------------------------------------------ */

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in-up">
      <div className={`px-5 py-3 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center gap-2.5 ${
        toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
      }`}>
        <span className="text-sm font-semibold">{toast.msg}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                      */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getPendingRestaurants(),
        adminApi.getActivityLog(),
        adminApi.getUsers(),
        adminApi.getOrders(),
        adminApi.getCategories(),
      ]);
      if (results[0].status === "fulfilled") setStats(results[0].value.data);
      if (results[1].status === "fulfilled") setPendingRestaurants(results[1].value.data.restaurants || []);
      if (results[2].status === "fulfilled") setActivityLogs(results[2].value.data.activity || []);
      if (results[3].status === "fulfilled") setUsers(results[3].value.data.users || []);
      if (results[4].status === "fulfilled") setOrders(results[4].value.data.orders || []);
      if (results[5].status === "fulfilled") setCategories(results[5].value.data.categories || []);
      const failed = results.some((r) => r.status === "rejected");
      setError(failed ? "Some dashboard data failed to load." : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshActivity = useCallback(async () => {
    try {
      const res = await adminApi.getActivityLog();
      setActivityLogs(res.data.activity || []);
    } catch {
      // keep previous logs
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleApprove = async (rest) => {
    setActingId(rest.id);
    try {
      await adminApi.approveRestaurant(rest.id);
      setPendingRestaurants((prev) => prev.filter((r) => r.id !== rest.id));
      setStats((prev) => (prev ? { ...prev, pending_approvals: Math.max(0, (prev.pending_approvals || 1) - 1) } : prev));
      refreshActivity();
      showToast(`${rest.restaurant_name} approved`);
    } catch {
      showToast("Failed to approve", "error");
    }
    setActingId(null);
  };

  const handleReject = async (rest) => {
    setActingId(rest.id);
    try {
      await adminApi.rejectRestaurant(rest.id);
      setPendingRestaurants((prev) => prev.filter((r) => r.id !== rest.id));
      setStats((prev) => (prev ? { ...prev, pending_approvals: Math.max(0, (prev.pending_approvals || 1) - 1) } : prev));
      refreshActivity();
      showToast(`${rest.restaurant_name} rejected`);
    } catch {
      showToast("Failed to reject", "error");
    }
    setActingId(null);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, { role: newRole });
      const res = await adminApi.getUsers();
      setUsers(res.data.users || []);
      showToast("User role updated");
    } catch {
      showToast("Failed to update role", "error");
    }
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      const res = await adminApi.getOrders();
      setOrders(res.data.orders || []);
      showToast(`Order marked as ${newStatus.replace(/_/g, " ")}`);
    } catch {
      showToast("Failed to update order", "error");
    }
  };

  const handleAddCategory = async (name) => {
    try {
      const res = await adminApi.createCategory({ name });
      setCategories((prev) => [...prev, res.data.category]);
      showToast("Category added");
      return true;
    } catch {
      showToast("Failed to add category", "error");
      return false;
    }
  };

  const handleRenameCategory = async (id, name) => {
    try {
      await adminApi.updateCategory(id, { name });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
      showToast("Category renamed");
      return true;
    } catch {
      showToast("Failed to rename category", "error");
      return false;
    }
  };

  const handleDeleteCategory = async (id) => {
    const category = categories.find((c) => c.id === id);
    if (!window.confirm(`Delete category "${category?.name}"? Menu items will be unassigned.`)) return;
    try {
      await adminApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("Category deleted");
    } catch {
      showToast("Failed to delete category", "error");
    }
  };

  const handleMoveCategory = async (id, index, direction) => {
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

  /* Merge real data with mock fallbacks for the overview */
  const mergedStats = {
    ...MOCK_STATS,
    ...(stats || {}),
  };

  /* Build pending list: use real data if available, otherwise mock */
  const pendingApprovals = pendingRestaurants.length > 0
    ? pendingRestaurants.map((r) => ({
        id: r.id,
        restaurant_name: r.restaurant_name,
        cuisine_type: r.cuisine_type || "—",
        owner_name: r.owner_name || "—",
        applied_date: r.created_at
          ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "—",
      }))
    : error
      ? MOCK_PENDING
      : [];

  /* ---- Render ---- */
  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FA] flex">
      <Toast toast={toast} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ============= SIDEBAR ============= */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-zinc-900 z-40 flex flex-col shrink-0 border-r border-zinc-800 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5 text-xl tracking-tight font-bold">
            <span className="w-9 h-9 rounded-lg bg-[#E03546] flex items-center justify-center text-white">
              <ShoppingBag size={18} strokeWidth={2} />
            </span>
            <span className="text-white">Swift<span className="text-[#E03546]">Bite</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Profile header */}
        <div className="mx-5 mb-6 rounded-xl bg-zinc-800/60 p-4 flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#E03546] to-rose-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-sm">
                SA
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white text-sm truncate">Super Admin</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-[#FFB0B5] bg-[#E03546]/20 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-[#FF8A90]" /> Staff
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActive(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E03546]" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-[#FFB0B5] hover:bg-[#E03546]/10 transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={17} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* ============= MAIN CONTENT ============= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="bg-[#F8F9FA]/80 backdrop-blur-md border-b border-zinc-100 px-4 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-700 bg-white w-10 h-10 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.06)] flex items-center justify-center">
              <Menu size={20} />
            </button>
            <span className="lg:hidden">
              <BackToHome />
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] px-4 py-2 rounded-lg hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <TrendingUp size={15} className="text-[#E03546]" />
              View site
            </a>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E03546] to-rose-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#E03546]">
                {user?.name?.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "SA"}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
          {/* Page heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Platform Overview</h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time metrics for Swift Bite.</p>
            {error && (
              <p className="mt-3 inline-block text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
                {error}
              </p>
            )}
          </div>

          {active === "overview" && (
            <Overview
              stats={mergedStats}
              pending={pendingApprovals}
              activity={activityLogs}
              onApprove={handleApprove}
              onReject={handleReject}
              onNavigate={setActive}
              actingId={actingId}
            />
          )}
          {active === "approvals" && (
            <Approvals
              restaurants={pendingRestaurants}
              loading={loading}
              onApprove={handleApprove}
              onReject={handleReject}
              actingId={actingId}
            />
          )}
          {active === "users" && (
            <UsersSection
              users={users}
              loading={loading}
              onRoleChange={handleRoleChange}
            />
          )}
          {active === "categories" && (
            <Categories
              categories={categories.length > 0 ? categories : (error ? MOCK_CATEGORIES.map((c) => ({ ...c, menu_items_count: c.count })) : [])}
              loading={loading}
              onAdd={handleAddCategory}
              onRename={handleRenameCategory}
              onDelete={handleDeleteCategory}
              onMove={handleMoveCategory}
            />
          )}
          {active === "orders" && (
            <OrdersSection
              orders={orders}
              loading={loading}
              onStatusChange={handleOrderStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
