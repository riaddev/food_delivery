import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { adminApi } from "../../features/api/apiSlice";

const tabs = ["Overview", "Users", "Restaurants", "Orders"];

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  active: "bg-emerald-50 text-emerald-600 border-emerald-200",
  suspended: "bg-red-50 text-red-600 border-red-200",
  confirmed: "bg-blue-50 text-blue-600 border-blue-200",
  preparing: "bg-indigo-50 text-indigo-600 border-indigo-200",
  out_for_delivery: "bg-purple-50 text-purple-600 border-purple-200",
  delivered: "bg-emerald-50 text-emerald-600 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

const StatusBadge = ({ status }) => {
  const color = STATUS_COLORS[status] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const SkeletonBlock = ({ className }) => (
  <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
);

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await adminApi.getOverview();
      setOverview(res.data);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data.users);
    } catch {}
  }, []);

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await adminApi.getRestaurants();
      setRestaurants(res.data.restaurants);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await adminApi.getOrders();
      setOrders(res.data.orders);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOverview(), fetchUsers(), fetchRestaurants(), fetchOrders()])
      .finally(() => setLoading(false));
  }, [fetchOverview, fetchUsers, fetchRestaurants, fetchOrders]);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, { role: newRole });
      fetchUsers();
      showToast("User role updated");
    } catch {
      showToast("Failed to update role", "error");
    }
  };

  const handleRestaurantStatus = async (restaurantId, newStatus) => {
    try {
      await adminApi.updateRestaurantStatus(restaurantId, { status: newStatus });
      fetchRestaurants();
      showToast(`Restaurant ${newStatus === "active" ? "approved" : newStatus}`);
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      fetchOrders();
      showToast(`Order marked as ${newStatus.replace(/_/g, " ")}`);
    } catch {
      showToast("Failed to update order", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 right-16 text-6xl transform rotate-12">⚙️</div>
          <div className="absolute bottom-5 left-16 text-5xl transform -rotate-12">📊</div>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 relative z-10">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-[22px] font-extrabold text-white no-underline">
              Swift<span className="text-indigo-200">Bite</span>
              <span className="ml-2.5 bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase align-middle">Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-white/80">{user?.name}</span>
              <button onClick={handleLogout}
                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in-up">
          <div className={`px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 ${
            toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
          }`}>
            <span className="text-lg">{toast.type === "error" ? "✕" : "✓"}</span>
            <span className="font-semibold text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 -mt-3 relative z-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 mb-8 overflow-hidden">
          <div className="flex border-b border-gray-100 px-1">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
                  activeTab === tab
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "Overview" && (
              loading ? <OverviewSkeleton /> :
              <OverviewContent overview={overview} />
            )}
            {activeTab === "Users" && (
              <UsersContent users={users} loading={loading} onRoleChange={handleRoleChange} />
            )}
            {activeTab === "Restaurants" && (
              <RestaurantsContent restaurants={restaurants} loading={loading} onStatusChange={handleRestaurantStatus} />
            )}
            {activeTab === "Orders" && (
              <OrdersContent orders={orders} loading={loading} onStatusChange={handleOrderStatus} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewContent({ overview }) {
  if (!overview) return <p className="text-gray-400 text-center py-12">No data available</p>;

  const cards = [
    { title: "Total Users", value: String(overview.total_users), color: "text-indigo-500", icon: "👥" },
    { title: "Restaurants", value: String(overview.total_restaurants), color: "text-[#ff6b35]", icon: "🍽️",
      sub: ` ${overview.pending_restaurants} pending` },
    { title: "Orders", value: String(overview.total_orders), color: "text-emerald-500", icon: "📦" },
    { title: "Revenue", value: `৳${Number(overview.total_revenue).toLocaleString()}`, color: "text-amber-500", icon: "💰" },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((c) => (
          <div key={c.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{c.title}</span>
              <span className="text-xl">{c.icon}</span>
            </div>
            <p className={`text-[30px] font-extrabold m-0 ${c.color}`}>{c.value}</p>
            {c.sub && <p className="text-xs text-amber-500 mt-1 font-medium">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-0 m-0">Recent Orders</h3>
          {overview.recent_orders?.length === 0 ? (
            <p className="text-gray-400 text-sm px-5 py-8 text-center">No orders yet</p>
          ) : (
            <div className="mt-3">
              {overview.recent_orders?.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 m-0">{o.restaurant?.restaurant_name || "—"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{o.user?.name} · ৳{Number(o.total).toFixed(2)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 px-5 pt-5 pb-0 m-0">Recent Users</h3>
          {overview.recent_users?.length === 0 ? (
            <p className="text-gray-400 text-sm px-5 py-8 text-center">No users yet</p>
          ) : (
            <div className="mt-3">
              {overview.recent_users?.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 m-0">{u.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 capitalize bg-gray-100 px-2.5 py-1 rounded-full">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
            <SkeletonBlock className="h-4 w-24 mb-4" />
            <SkeletonBlock className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-5 animate-pulse">
            <SkeletonBlock className="h-5 w-32 mb-4" />
            {[1, 2, 3].map((j) => (
              <SkeletonBlock key={j} className="h-12 w-full mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersContent({ users, loading, onRoleChange }) {
  if (loading) return <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <SkeletonBlock key={i} className="h-14 w-full" />)}</div>;
  if (users.length === 0) return <p className="text-gray-400 text-center py-12">No users found</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Name</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Email</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Role</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Restaurant</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3.5 font-medium text-gray-900">{u.name}</td>
              <td className="py-3.5 text-gray-500">{u.email}</td>
              <td className="py-3.5">
                <select
                  value={u.role}
                  onChange={(e) => onRoleChange(u.id, e.target.value)}
                  className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  <option value="customer">customer</option>
                  <option value="restaurant">restaurant</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="py-3.5 text-gray-500">{u.has_restaurant || "—"}</td>
              <td className="py-3.5 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RestaurantsContent({ restaurants, loading, onStatusChange }) {
  if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-14 w-full" />)}</div>;
  if (restaurants.length === 0) return <p className="text-gray-400 text-center py-12">No restaurants registered</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Restaurant</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Owner</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cuisine</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Items</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3.5">
                <p className="font-medium text-gray-900 m-0">{r.restaurant_name}</p>
                {r.city && <p className="text-xs text-gray-400 mt-0.5">{r.city}</p>}
              </td>
              <td className="py-3.5">
                <p className="text-gray-700 m-0">{r.owner_name || "—"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.owner_email}</p>
              </td>
              <td className="py-3.5 text-gray-600">{r.cuisine_type || "—"}</td>
              <td className="py-3.5 text-gray-600">{r.menu_items_count}</td>
              <td className="py-3.5"><StatusBadge status={r.status} /></td>
              <td className="py-3.5">
                <div className="flex gap-1.5">
                  {r.status !== "active" && (
                    <button onClick={() => onStatusChange(r.id, "active")}
                      className="text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-emerald-100 transition">
                      Approve
                    </button>
                  )}
                  {r.status !== "suspended" && (
                    <button onClick={() => onStatusChange(r.id, "suspended")}
                      className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-red-100 transition">
                      Suspend
                    </button>
                  )}
                  {r.status === "suspended" && (
                    <span className="text-xs text-gray-400 italic">Suspended</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

function OrdersContent({ orders, loading, onStatusChange }) {
  if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-14 w-full" />)}</div>;
  if (orders.length === 0) return <p className="text-gray-400 text-center py-12">No orders placed yet</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-100">
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Restaurant</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
            <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
              <td className="py-3.5 font-mono text-xs text-gray-500">#{o.id}</td>
              <td className="py-3.5">
                <p className="text-gray-900 font-medium m-0">{o.customer_name}</p>
                {o.delivery_address && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{o.delivery_address}</p>}
              </td>
              <td className="py-3.5 text-gray-700">{o.restaurant_name}</td>
              <td className="py-3.5 font-semibold text-gray-900">৳{Number(o.total).toFixed(2)}</td>
              <td className="py-3.5">
                <select
                  value={o.status}
                  onChange={(e) => onStatusChange(o.id, e.target.value)}
                  className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </td>
              <td className="py-3.5 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
