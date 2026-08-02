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
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  registerCustomer: (data) => api.post("/register/customer", data),
  registerRestaurant: (data) => api.post("/register/restaurant", data),
  login: (data) => api.post("/login", data),
  logout: () => api.post("/logout"),
  user: () => api.get("/user"),
};

export const customerApi = {
  updateProfile: (data) => api.post("/customer/profile", data),
  changePassword: (data) => api.put("/customer/change-password", data),
  getOverview: () => api.get("/customer/overview"),
  getOrders: () => api.get("/customer/orders"),
  getOrder: (id) => api.get(`/customer/orders/${id}`),
  placeOrder: (data) => api.post("/customer/orders", data),
  reorder: (id) => api.post(`/customer/orders/${id}/reorder`),
  getFavorites: () => api.get("/customer/favorites"),
  addFavorite: (restaurantId) => api.post("/customer/favorites", { restaurant_id: restaurantId }),
  removeFavorite: (restaurantId) => api.delete(`/customer/favorites/${restaurantId}`),
  getWishlistItems: () => api.get("/customer/wishlist-items"),
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
  getOverview: () => api.get("/admin/overview"),
  getUsers: () => api.get("/admin/users"),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  getRestaurants: () => api.get("/admin/restaurants"),
  updateRestaurantStatus: (id, data) => api.put(`/admin/restaurants/${id}/status`, data),
  getOrders: () => api.get("/admin/orders"),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};

export default api;
