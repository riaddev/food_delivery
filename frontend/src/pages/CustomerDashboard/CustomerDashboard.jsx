import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { customerApi } from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import CustomerEditProfile from "./CustomerEditProfile";
import OrderHistory from "./OrderHistory";
import Favorites from "./Favorites";

const tabs = ["Overview", "Edit Profile", "Order History", "Favorites"];

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [ordersCount, setOrdersCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    if (searchParams.get("order")) setActiveTab("Order History");
  }, [searchParams]);

  useEffect(() => {
    customerApi.getOrders().then((r) => setOrdersCount(r.data.orders.length)).catch(() => {});
    customerApi.getFavorites().then((r) => setFavoritesCount(r.data.favorites.length)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-[#f6f2ec]">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="text-[22px] font-extrabold text-[#ff6b35] no-underline">
            Swift<span className="text-gray-900">Bite</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/restaurants" className="text-[#ff6b35] text-sm no-underline">Restaurants</Link>
            {itemCount > 0 && (
              <Link to="/checkout" className="relative text-xl no-underline">
                🛒
                <span className="absolute -top-2 -right-2 bg-[#ff6b35] text-white text-[11px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">{itemCount}</span>
              </Link>
            )}
            <span className="text-sm font-semibold text-gray-600">{user?.name}</span>
            <button onClick={handleLogout}
              className="bg-none border border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 cursor-pointer hover:border-gray-400">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-[28px] font-extrabold text-gray-900 mt-0 mb-2">My Dashboard</h1>
        <p className="text-gray-500 text-[15px] mb-8">Welcome back, {user?.name}!</p>

        <div className="flex gap-2 mb-8 border-b-2 border-gray-200 pb-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 border-none bg-none text-sm whitespace-nowrap cursor-pointer border-b-2 -mb-[2px] transition ${
                activeTab === tab ? "font-bold text-[#ff6b35] border-[#ff6b35]" : "font-medium text-gray-500 border-transparent"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-6">
              <h2 className="text-lg font-bold text-gray-900 mt-0 mb-4">Account Info</h2>
              <div className="grid gap-3">
                {[
                  { label: "Name", value: user?.name },
                  { label: "Email", value: user?.email },
                  { label: "Phone", value: user?.phone },
                  { label: "Address", value: user?.address },
                ].map((r) => (
                  <div key={r.label} className="flex gap-2 text-sm">
                    <span className="font-semibold text-gray-700 min-w-[120px]">{r.label}:</span>
                    <span className="text-gray-500">{r.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Orders", count: String(ordersCount), color: "text-[#ff6b35]" },
                { title: "Favorites", count: String(favoritesCount), color: "text-emerald-500" },
              ].map((c) => (
                <div key={c.title} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mt-0 mb-2">{c.title}</p>
                  <p className={`text-[32px] font-extrabold m-0 ${c.color}`}>{c.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Edit Profile" && <CustomerEditProfile />}
        {activeTab === "Order History" && <OrderHistory />}
        {activeTab === "Favorites" && <Favorites />}
      </div>
    </div>
  );
};

export default CustomerDashboard;
