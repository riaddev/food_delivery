import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import RegisterRestaurant from "../pages/RegisterRestaurant/RegisterRestaurant";
import CustomerDashboard from "../pages/CustomerDashboard/CustomerDashboard";
import RestaurantDashboard from "../pages/RestaurantDashboard/RestaurantDashboard";
import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import Restaurants from "../pages/Restaurants/Restaurants";
import RestaurantMenu from "../pages/RestaurantMenu/RestaurantMenu";
import Checkout from "../pages/Checkout/Checkout";
import AccountLayout from "../pages/CustomerAccount/AccountLayout";
import AccountDashboard from "../pages/CustomerAccount/AccountDashboard";
import MyOrders from "../pages/CustomerAccount/MyOrders";
import Wishlist from "../pages/CustomerAccount/Wishlist";
import SavedAddresses from "../pages/CustomerAccount/SavedAddresses";
import Profile from "../pages/CustomerAccount/Profile";
import ChangePassword from "../pages/CustomerAccount/ChangePassword";
import ProtectedRoute from "../components/ProtectedRoute";
import OwnerDashboard from "../pages/RestaurantDashboard/OwnerDashboard";
import { Analytics } from "../pages/RestaurantDashboard/Analytics";
import { SettingsPage } from "../pages/RestaurantDashboard/Settings";
import OrdersManagement from "../pages/RestaurantDashboard/OrdersManagement";
import MenuManagement from "../pages/RestaurantDashboard/MenuManagement";
import EditProfile from "../pages/RestaurantDashboard/EditProfile";

export default function Routers() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/restaurant" element={<RegisterRestaurant />} />
      <Route path="/restaurants" element={<Restaurants />} />
      <Route path="/restaurants/:id" element={<RestaurantMenu />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Checkout />
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
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <AccountLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AccountDashboard />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="addresses" element={<SavedAddresses />} />
        <Route path="profile" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>
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
  );
}
