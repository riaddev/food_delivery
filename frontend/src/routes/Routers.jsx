import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
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
import {
  AboutPage, CareersPage, PressPage, BlogPage, GiftCardsPage,
  BecomeRiderPage, RiderAppPage, EarningsPage, CommunityPage,
  SupportPage, PrivacyPage, TermsPage, CookiesPage,
} from "../pages/StaticPages";
import ChatWidget from "../components/ChatWidget";

export default function Routers() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signup/customer" element={<Register />} />
      <Route path="/signup/restaurant" element={<SignupRestaurant />} />
      <Route path="/signup/rider" element={<SignupRider />} />
      <Route path="/restaurant/setup" element={<RestaurantSetup />} />
      <Route path="/rider/setup" element={<RiderSetup />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/restaurants/:id" element={<RestaurantMenu />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/press" element={<PressPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/gift-cards" element={<GiftCardsPage />} />
      <Route path="/become-a-rider" element={<BecomeRiderPage />} />
      <Route path="/rider-app" element={<RiderAppPage />} />
      <Route path="/earnings" element={<EarningsPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/track/:trackingCode" element={<PublicTracking />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Checkout />
          </ProtectedRoute>
        }
      />
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
      </Routes>
      <ChatWidget />
    </>
  );
}
