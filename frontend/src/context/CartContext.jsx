import { createContext, useContext, useReducer, useEffect, useCallback, useState } from "react";
import { ORDER_LIMITS, getEffectiveCap } from "../utils/orderLimits";

const CartContext = createContext();

const STORAGE_KEY = "swiftbite_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : { restaurantId: null, restaurantName: null, restaurant: null, items: [], mode: null };
    // Backfill new fields for carts saved before limits existed.
    return { restaurant: null, ...parsed };
  } catch {
    return { restaurantId: null, restaurantName: null, restaurant: null, items: [], mode: null };
  }
}

function emptyCart() {
  return { restaurantId: null, restaurantName: null, restaurant: null, items: [], mode: null };
}

function clampQty(item, restaurant, qty) {
  const cap = getEffectiveCap(item, restaurant);
  return Math.max(0, Math.min(qty, cap));
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { restaurantId, restaurantName, restaurant, item, mode, quantity = 1 } = action.payload;
      const effectivePrice = item.discount_price != null ? parseFloat(item.discount_price) : parseFloat(item.price);
      const mergedRestaurant = restaurant || state.restaurant || null;
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        const firstQty = Math.min(quantity, getEffectiveCap(item, mergedRestaurant));
        if (firstQty <= 0) return state;
        const cartItem = { ...item, price: effectivePrice, menu_item_id: item.id, quantity: firstQty };
        return {
          restaurantId,
          restaurantName,
          restaurant: mergedRestaurant,
          items: [cartItem],
          mode: mode || "delivery",
        };
      }
      const existing = state.items.find((i) => i.menu_item_id === item.id);
      if (existing) {
        const cap = getEffectiveCap({ ...existing, ...item }, mergedRestaurant);
        const nextQty = Math.min(existing.quantity + quantity, cap);
        if (nextQty === existing.quantity) return state;
        return {
          ...state,
          restaurant: mergedRestaurant,
          mode: mode || state.mode || "delivery",
          items: state.items.map((i) =>
            i.menu_item_id === item.id ? { ...i, ...item, price: effectivePrice, quantity: nextQty } : i
          ),
        };
      }
      if (state.items.length >= ORDER_LIMITS.maxDistinctItems) return state;
      const capped = Math.min(quantity, getEffectiveCap(item, mergedRestaurant));
      if (capped <= 0) return state;
      const cartItem = { ...item, price: effectivePrice, menu_item_id: item.id, quantity: capped };
      return {
        restaurantId,
        restaurantName,
        restaurant: mergedRestaurant,
        items: [...state.items, cartItem],
        mode: mode || state.mode || "delivery",
      };
    }
    case "REMOVE_ITEM": {
      const filtered = state.items.filter((i) => i.menu_item_id !== action.payload);
      return filtered.length === 0
        ? emptyCart()
        : { ...state, items: filtered };
    }
    case "REMOVE_ITEMS": {
      const ids = new Set(action.payload);
      const filtered = state.items.filter((i) => !ids.has(i.menu_item_id));
      return filtered.length === 0
        ? emptyCart()
        : { ...state, items: filtered };
    }
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        const filtered = state.items.filter((i) => i.menu_item_id !== id);
        return filtered.length === 0
          ? emptyCart()
          : { ...state, items: filtered };
      }
      return {
        ...state,
        items: state.items.map((i) => {
          if (i.menu_item_id !== id) return i;
          return { ...i, quantity: Math.min(quantity, getEffectiveCap(i, state.restaurant)) };
        }),
      };
    }
    case "CLAMP_TO_LIMITS": {
      const { limitsById, restaurant } = action.payload;
      const merged = restaurant || state.restaurant || null;
      let items = state.items.map((i) => {
        const server = limitsById?.[i.menu_item_id];
        const mergedItem = server ? { ...i, ...server } : i;
        return { ...mergedItem, quantity: clampQty(mergedItem, merged, mergedItem.quantity) };
      }).filter((i) => i.quantity > 0);
      // Drop sold-out / unavailable lines reported by the server.
      if (limitsById) {
        items = items.filter((i) => {
          const server = limitsById[i.menu_item_id];
          if (!server) return true;
          return server.is_available !== false;
        });
      }
      if (items.length === 0) return emptyCart();
      return { ...state, restaurant: merged, items };
    }
    case "SET_RESTAURANT": {
      return { ...state, restaurant: action.payload, restaurantName: action.payload?.restaurant_name || state.restaurantName };
    }
    case "CLEAR_CART":
      return emptyCart();
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, null, loadCart);
  const [limitNotice, setLimitNotice] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const flashNotice = useCallback((msg) => {
    if (!msg) return;
    setLimitNotice(msg);
    window.clearTimeout(flashNotice._t);
    flashNotice._t = window.setTimeout(() => setLimitNotice(""), 3500);
  }, []);

  const addItem = useCallback((restaurantId, restaurantName, item, mode, quantity = 1, restaurant = null) =>
    dispatch({ type: "ADD_ITEM", payload: { restaurantId, restaurantName, restaurant, item, mode, quantity } }), []);

  const removeItem = useCallback((menuItemId) =>
    dispatch({ type: "REMOVE_ITEM", payload: menuItemId }), []);

  const removeItems = useCallback((menuItemIds) =>
    dispatch({ type: "REMOVE_ITEMS", payload: menuItemIds }), []);

  const updateQuantity = useCallback((menuItemId, quantity) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: menuItemId, quantity } }), []);

  const clampToLimits = useCallback((limitsById, restaurant = null) =>
    dispatch({ type: "CLAMP_TO_LIMITS", payload: { limitsById, restaurant } }), []);

  const setRestaurant = useCallback((restaurant) =>
    dispatch({ type: "SET_RESTAURANT", payload: restaurant }), []);

  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = cart.items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const distinctCount = cart.items.length;
  const overOrderLimit = itemCount > ORDER_LIMITS.maxTotalUnits;

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, removeItems, updateQuantity, clampToLimits, setRestaurant, clearCart, itemCount, distinctCount, overOrderLimit, total, limitNotice, flashNotice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
