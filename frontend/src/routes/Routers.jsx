import { Routes, Route, Navigate, Link } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import Register from "../pages/Register/Register";
import SignupRestaurant from "../pages/SignupRestaurant/SignupRestaurant";
import SignupRider from "../pages/SignupRider/SignupRider";
import RiderSetup from "../pages/RiderSetup/RiderSetup";
import RestaurantSetup from "../pages/RestaurantSetup/RestaurantSetup";
import CustomerDashboard from "../pages/CustomerDashboard/CustomerDashboard";
import RestaurantDashboard from "../pages/RestaurantDashboard/RestaurantDashboard";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import Restaurants from "../pages/Restaurants/Restaurants";
import RestaurantMenu from "../pages/RestaurantMenu/RestaurantMenu";
import RiderDashboard from "../pages/RiderDashboard/RiderDashboard";
import Checkout from "../pages/Checkout/Checkout";
import PaymentSuccess from "../pages/Payment/PaymentSuccess";
import PaymentFailed from "../pages/Payment/PaymentFailed";
import OrderTracking from "../pages/OrderTracking/OrderTracking";
import PublicTracking from "../pages/PublicTracking/PublicTracking";
import ProtectedRoute from "../components/ProtectedRoute";
import OwnerDashboard from "../pages/RestaurantDashboard/OwnerDashboard";
import { Analytics } from "../pages/RestaurantDashboard/Analytics";
import { SettingsPage } from "../pages/RestaurantDashboard/Settings";
import OrdersManagement from "../pages/RestaurantDashboard/OrdersManagement";
import MenuManagement from "../pages/RestaurantDashboard/MenuManagement";
import EditProfile from "../pages/RestaurantDashboard/EditProfile";
import Reservations from "../pages/RestaurantDashboard/Reservations";
import TableManagement from "../pages/RestaurantDashboard/TableManagement";
import Expenses from "../pages/RestaurantDashboard/Expenses";
import {
  SupportPage, PrivacyPage, TermsPage, CookiesPage,
} from "../pages/StaticPages";
import ChatWidget from "../components/ChatWidget";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-extrabold tracking-tight text-zinc-900">404</p>
      <p className="text-xl font-bold text-zinc-900 mt-2 mb-1">Page not found</p>
      <p className="text-sm text-zinc-500 mb-6">The page you're looking for doesn't exist or was moved.</p>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
        >
          Back to Home
        </Link>
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-semibold px-5 py-2.5 rounded-full border border-zinc-200 transition-colors"
        >
          Browse Food
        </Link>
      </div>
    </div>
  );
}

export default function Routers() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signup/customer" element={<Register />} />
      <Route path="/signup/restaurant" element={<SignupRestaurant />} />
      <Route path="/signup/rider" element={<SignupRider />} />
      <Route path="/restaurant/setup" element={<RestaurantSetup />} />
      <Route path="/rider/setup" element={<RiderSetup />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/restaurants/:id" element={<RestaurantMenu />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/track/:trackingCode" element={<PublicTracking />} />

      {/* Public checkout (soft gate): guests can review their cart; sign-in is
          enforced inside Checkout at Place Order. Cart survives login via localStorage. */}
      <Route path="/checkout" element={<Checkout />} />
      <Route
        path="/order/tracking/:id"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <OrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/dashboard"
        element={
          <ProtectedRoute allowedRoles={["rider"]}>
            <RiderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/account"
        element={<Navigate to="/customer/dashboard" replace />}
      />
      <Route
        path="/customer/account/*"
        element={<Navigate to="/customer/dashboard" replace />}
      />
      <Route
        path="/restaurant/dashboard"
        element={
          <ProtectedRoute allowedRoles={["restaurant"]}>
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<OwnerDashboard />} />
        <Route path="orders" element={<OrdersManagement />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="tables" element={<TableManagement />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="profile" element={<EditProfile />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget />
    </>
  );
}
