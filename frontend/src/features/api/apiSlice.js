import axios from "axios";

let navigateFn = null;
let isRedirectingToLogin = false;

export const setNavigate = (fn) => {
  navigateFn = fn;
};

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const role = sessionStorage.getItem("currentRole");
  const token = role ? localStorage.getItem(`token_${role}`) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    isRedirectingToLogin = false;
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect && window.location.pathname !== "/login" && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      const role = sessionStorage.getItem("currentRole");
      if (role) {
        localStorage.removeItem(`token_${role}`);
      }
      sessionStorage.removeItem("currentRole");
      if (navigateFn) {
        navigateFn("/login", { replace: true });
      } else {
        window.location.href = "/login";
      }
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
  forgotPassword: (data) => api.post("/password/forgot", data),
  verifyResetOtp: (data) => api.post("/password/verify-otp", data),
  resetPassword: (data, token) =>
    api.post("/password/reset", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      skipAuthRedirect: true,
    }),
  login: (data) => api.post("/login", data),
  logout: () => api.post("/logout"),
  user: () => api.get("/user"),
};

export const publicApi = {
  getRestaurantReviews: (id) => api.get(`/restaurants/${id}/reviews`, { skipAuthRedirect: true }),
  getFeaturedReviews: (limit = 10) => api.get("/reviews/featured", { params: { limit }, skipAuthRedirect: true }),
  getMenuItemReviews: (id) => api.get(`/menu-items/${id}/reviews`, { skipAuthRedirect: true }),
};

export const reservationApi = {
  create: (data) => api.post("/reservations", data),
  getMine: () => api.get("/customer/reservations"),
  cancel: (id) => api.post(`/customer/reservations/${id}/cancel`),
  getForRestaurant: () => api.get("/restaurant/reservations"),
  updateStatus: (id, status) => api.put(`/restaurant/reservations/${id}/status`, { status }),
};

export const customerApi = {
  // JSON object -> PUT; FormData (avatar upload) -> POST + _method=PUT
  // (PHP/Laravel can't parse multipart on PUT, and the route is PUT-only).
  updateProfile: (data) => {
    if (data instanceof FormData) {
      if (!data.has("_method")) data.append("_method", "PUT");
      return api.post("/customer/profile", data);
    }
    return api.put("/customer/profile", data);
  },
  changePassword: (data) => api.put("/customer/change-password", data),
  getOverview: () => api.get("/customer/overview"),
  getOrders: () => api.get("/customer/orders"),
  getOrder: (id) => api.get(`/customer/orders/${id}`),
  placeOrder: (data) => api.post("/customer/orders", data),
  cancelOrder: (id) => api.post(`/customer/orders/${id}/cancel`),
  reorder: (id) => api.post(`/customer/orders/${id}/reorder`),
  submitReview: (data) => api.post("/customer/reviews", data),
  getFavorites: () => api.get("/customer/favorites"),
  addFavorite: (restaurantId) => api.post("/customer/favorites", { restaurant_id: restaurantId }),
  removeFavorite: (restaurantId) => api.delete(`/customer/favorites/${restaurantId}`),
  getWishlistItems: () => api.get("/customer/wishlist-items", { skipAuthRedirect: true }),
  addWishlistItem: (menuItemId) => api.post("/customer/wishlist-items", { menu_item_id: menuItemId }),
  removeWishlistItem: (menuItemId) => api.delete(`/customer/wishlist-items/${menuItemId}`),
  getAddresses: () => api.get("/customer/addresses"),
  createAddress: (data) => api.post("/customer/addresses", data),
  updateAddress: (id, data) => api.put(`/customer/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/customer/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/customer/addresses/${id}/default`),
  getComplaints: () => api.get("/customer/complaints"),
  fileComplaint: (data) => api.post("/customer/complaints", data),
};

export const paymentApi = {
  initiatePayment: (data) => api.post("/customer/payment/initiate", data),
};

export const restaurantApi = {
  // JSON object -> PUT; FormData (cover/logo upload) -> POST + _method=PUT
  // (PHP/Laravel can't parse multipart on PUT, and the route is PUT-only).
  updateProfile: (data) => {
    if (data instanceof FormData) {
      if (!data.has("_method")) data.append("_method", "PUT");
      return api.post("/restaurant/profile", data);
    }
    return api.put("/restaurant/profile", data);
  },
  getOrders: () => api.get("/restaurant/orders"),
  updateOrderStatus: (id, status) => api.put(`/restaurant/orders/${id}/status`, { status }),
  getAvailableRiders: () => api.get("/restaurant/riders"),
  assignRider: (orderId, riderId) =>
    api.post(`/restaurant/orders/${orderId}/assign-rider`, { rider_id: riderId }),
  getMenuItems: () => api.get("/restaurant/menu-items"),
  createMenuItem: (data) => api.post("/restaurant/menu-items", data),
  updateMenuItem: (id, data) => {
    if (data instanceof FormData) {
      if (!data.has("_method")) data.append("_method", "PUT");
      return api.post(`/restaurant/menu-items/${id}`, data);
    }
    return api.put(`/restaurant/menu-items/${id}`, data);
  },
  deleteMenuItem: (id) => api.delete(`/restaurant/menu-items/${id}`),
  toggleAvailability: (id, data) => api.patch(`/restaurant/menu-items/${id}/availability`, data),
  checkAvailability: (data) => api.post("/menu-items/check-availability", data, { skipAuthRedirect: true }),
  getTables: () => api.get("/restaurant/tables"),
  createTable: (data) => api.post("/restaurant/tables", data),
  updateTable: (id, data) => api.put(`/restaurant/tables/${id}`, data),
  updateTableStatus: (id, status) => api.put(`/restaurant/tables/${id}/status`, { status }),
  assignReservationTable: (id, restaurantTableId) =>
    api.put(`/restaurant/reservations/${id}/table`, { restaurant_table_id: restaurantTableId }),
  storeCategoryRequest: (data) => api.post("/restaurant/category-requests", data),
  getCategoryRequests: () => api.get("/restaurant/category-requests"),
  getExpenses: () => api.get("/restaurant/expenses"),
  getExpenseTotal: () => api.get("/restaurant/expenses/count"),
  createExpense: (data) => api.post("/restaurant/expenses", data),
  updateExpense: (id, data) => api.put(`/restaurant/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/restaurant/expenses/${id}`),
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
  requeueRider: (id) => api.post(`/admin/riders/${id}/requeue`),
  getActivityLog: () => api.get("/admin/activity-log"),
  getOrders: (params) => api.get("/admin/orders", { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  assignRider: (id, riderId) => api.post(`/admin/orders/${id}/assign-rider`, { rider_id: riderId }),
  markRefunded: (id) => api.post(`/admin/orders/${id}/mark-refunded`),
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
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data) => api.post("/admin/categories", data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  reorderCategories: (ids) => api.put("/admin/categories/reorder", { ids }),
  getCategoryRequests: (params) => api.get("/admin/category-requests", { params }),
  approveCategoryRequest: (id) => api.post(`/admin/category-requests/${id}/approve`),
  rejectCategoryRequest: (id, data) => api.post(`/admin/category-requests/${id}/reject`, data),
  getReviews: (params) => api.get("/admin/reviews", { params }),
  approveReview: (id) => api.post(`/admin/reviews/${id}/approve`),
  rejectReview: (id) => api.post(`/admin/reviews/${id}/reject`),
  setReviewFeatured: (id, is_featured) => api.post(`/admin/reviews/${id}/feature`, { is_featured }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getComplaints: (params) => api.get("/admin/complaints", { params }),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  resolveComplaint: (id, data) => api.put(`/admin/complaints/${id}/resolve`, data),
};

export const riderApi = {
  setAvailability: (isOnline) => api.put("/rider/availability", { is_online: isOnline }),
  updateLocation: (data) => api.post("/rider/location", data),
  getOrders: () => api.get("/rider/orders"),
  getEarnings: (params) => api.get("/rider/earnings", { params }),
  acceptOrder: (id) => api.post(`/rider/orders/${id}/accept`),
  updateOrderStatus: (id, status) => api.put(`/rider/orders/${id}/status`, { status }),
};

export const chatApi = {
  send: (message, history, signal) => api.post("/chat", { message, history }, { skipAuthRedirect: true, signal }),
};

export const trackingApi = {
  track: (trackingCode) => api.get(`/track/${trackingCode}`, { skipAuthRedirect: true }),
  getRoute: (trackingCode) => api.get(`/track/${trackingCode}/route`, { skipAuthRedirect: true }),
};

export default api;
