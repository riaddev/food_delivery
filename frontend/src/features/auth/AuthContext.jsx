/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally colocated (same pattern across the app) */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, setNavigate } from "../api/apiSlice";

const AuthContext = createContext(null);

const getTokenKey = (role) => `token_${role}`;
const getCurrentRole = () => sessionStorage.getItem("currentRole");

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNavigate(navigate);
    localStorage.removeItem("token");
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    const role = getCurrentRole();
    if (!role) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem(getTokenKey(role));
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.user();
      setUser(res.data);
    } catch {
      localStorage.removeItem(getTokenKey(role));
      sessionStorage.removeItem("currentRole");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch-on-mount: syncs the persisted session with the auth server (external system).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount sync with auth server
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const role = res.data.user.role;
    localStorage.setItem(getTokenKey(role), res.data.token);
    sessionStorage.setItem("currentRole", role);
    setUser(res.data.user);
    return res.data;
  };

  const registerCustomer = async (name, email, password, phone) => {
    const res = await authApi.registerCustomer({ name, email, password, phone });
    const role = res.data.user.role;
    localStorage.setItem(getTokenKey(role), res.data.token);
    sessionStorage.setItem("currentRole", role);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    const role = getCurrentRole();
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    if (role) {
      localStorage.removeItem(getTokenKey(role));
    }
    sessionStorage.removeItem("currentRole");
    setUser(null);
    // Guest cart is shared via localStorage — clear it on logout so a shared
    // device doesn't leak the previous customer's items. CartContext listens
    // for this event and resets its in-memory state too.
    localStorage.removeItem("swiftbite_cart");
    window.dispatchEvent(new Event("swiftbite:clear-cart"));
  };

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, isCustomer: user?.role === "customer", login, registerCustomer, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
