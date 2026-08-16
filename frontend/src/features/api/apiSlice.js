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
  getUsers: () => api.get("/admin/users"),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  getPendingRestaurants: () => api.get("/admin/restaurants/pending"),
  approveRestaurant: (id) => api.post(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id) => api.post(`/admin/restaurants/${id}/reject`),
  getActivityLog: () => api.get("/admin/activity-log"),
  getOrders: () => api.get("/admin/orders"),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data) => api.post("/admin/categories", data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  reorderCategories: (ids) => api.put("/admin/categories/reorder", { ids }),
};

export default api;
