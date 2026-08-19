import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  registerCustomer: (data) => api.post("/register/customer", data),
  applyRestaurant: (data) => api.post("/apply/restaurant", data),
  applyRider: (data) => api.post("/apply/rider", data),
  verifySetupOtp: (data) => api.post("/owner/verify-otp", data),
  resendSetupOtp: (data) => api.post("/owner/resend-otp", data),
  setSetupPassword: (data) => api.post("/owner/set-password", data),
  login: (data) => api.post("/login", data),
  logout: () => api.post("/logout"),
  user: () => api.get("/user"),
};

export const publicApi = {
  getRestaurantReviews: (id) => api.get(`/restaurants/${id}/reviews`),
};

export const reservationApi = {
  create: (data) => api.post("/reservations", data),
  getMine: () => api.get("/customer/reservations"),
  cancel: (id) => api.post(`/customer/reservations/${id}/cancel`),
  getForRestaurant: () => api.get("/restaurant/reservations"),
  updateStatus: (id, status) => api.put(`/restaurant/reservations/${id}/status`, { status }),
};

export const customerApi = {
  updateProfile: (data) => api.post("/customer/profile", data),
  changePassword: (data) => api.put("/customer/change-password", data),
  getOverview: () => api.get("/customer/overview"),
  getOrders: () => api.get("/customer/orders"),
  getOrder: (id) => api.get(`/customer/orders/${id}`),
  placeOrder: (data) => api.post("/customer/orders", data),
  cancelOrder: (id) => api.post(`/customer/orders/${id}/cancel`),
  reorder: (id) => api.post(`/customer/orders/${id}/reorder`),
  submitReview: (data) => api.post("/customer/reviews", data),
  getFavorites: () => api.get("/customer/favorites"),
  removeFavorite: (restaurantId) => api.delete(`/customer/favorites/${restaurantId}`),
  getWishlistItems: () => api.get("/customer/wishlist-items", { skipAuthRedirect: true }),
  addWishlistItem: (menuItemId) => api.post("/customer/wishlist-items", { menu_item_id: menuItemId }),
  removeWishlistItem: (menuItemId) => api.delete(`/customer/wishlist-items/${menuItemId}`),
  getAddresses: () => api.get("/customer/addresses"),
  createAddress: (data) => api.post("/customer/addresses", data),
  updateAddress: (id, data) => api.put(`/customer/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/customer/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/customer/addresses/${id}/default`),
};

export const paymentApi = {
  initiatePayment: (data) => api.post("/customer/payment/initiate", data),
};

export const restaurantApi = {
  updateProfile: (data) => api.put("/restaurant/profile", data),
  getOrders: () => api.get("/restaurant/orders"),
  updateOrderStatus: (id, status) => api.put(`/restaurant/orders/${id}/status`, { status }),
  getMenuItems: () => api.get("/restaurant/menu-items"),
  createMenuItem: (data) => api.post("/restaurant/menu-items", data),
  updateMenuItem: (id, data) => api.put(`/restaurant/menu-items/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/restaurant/menu-items/${id}`),
};

export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getOverview: () => api.get("/admin/overview"),
  getUsers: () => api.get("/admin/users"),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  getRestaurants: (params) => api.get("/admin/restaurants", { params }),
  getRestaurant: (id) => api.get(`/admin/restaurants/${id}`),
  getPendingRestaurants: () => api.get("/admin/restaurants/pending"),
  approveRestaurant: (id) => api.post(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id) => api.post(`/admin/restaurants/${id}/reject`),
  suspendRestaurant: (id) => api.post(`/admin/restaurants/${id}/suspend`),
  activateRestaurant: (id) => api.post(`/admin/restaurants/${id}/activate`),
  updateRestaurantStatus: (id, data) => api.put(`/admin/restaurants/${id}/status`, data),
  getRiders: () => api.get("/admin/riders"),
  getRider: (id) => api.get(`/admin/riders/${id}`),
  getPendingRiders: () => api.get("/admin/riders/pending"),
  approveRider: (id) => api.post(`/admin/riders/${id}/approve`),
  rejectRider: (id) => api.post(`/admin/riders/${id}/reject`),
  suspendRider: (id) => api.post(`/admin/riders/${id}/suspend`),
  activateRider: (id) => api.post(`/admin/riders/${id}/activate`),
  getActivityLog: () => api.get("/admin/activity-log"),
  getOrders: (params) => api.get("/admin/orders", { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  assignRider: (id, riderId) => api.post(`/admin/orders/${id}/assign-rider`, { rider_id: riderId }),
  getCustomers: (params) => api.get("/admin/customers", { params }),
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  suspendCustomer: (id) => api.post(`/admin/customers/${id}/suspend`),
  activateCustomer: (id) => api.post(`/admin/customers/${id}/activate`),
  getPayments: (params) => api.get("/admin/payments", { params }),
  getAnalytics: (params) => api.get("/admin/analytics", { params }),
  getNotifications: () => api.get("/admin/notifications"),
  markAllNotificationsRead: () => api.post("/admin/notifications/read-all"),
  markNotificationRead: (id) => api.post(`/admin/notifications/${id}/read`),
  getSettings: () => api.get("/admin/settings"),
  updatePlatformSettings: (data) => api.put("/admin/settings/platform", data),
  updateProfile: (data) => api.put("/admin/profile", data),
  changePassword: (data) => api.put("/admin/change-password", data),
  getPromoCodes: () => api.get("/admin/promo-codes"),
  createPromoCode: (data) => api.post("/admin/promo-codes", data),
  updatePromoCode: (id, data) => api.put(`/admin/promo-codes/${id}`, data),
  togglePromoCode: (id) => api.post(`/admin/promo-codes/${id}/toggle`),
  deletePromoCode: (id) => api.delete(`/admin/promo-codes/${id}`),
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data) => api.post("/admin/categories", data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  reorderCategories: (ids) => api.put("/admin/categories/reorder", { ids }),
};

export const riderApi = {
  setAvailability: (isOnline) => api.put("/rider/availability", { is_online: isOnline }),
};

export default api;
