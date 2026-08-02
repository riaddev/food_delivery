import { createContext, useContext, useReducer, useEffect } from "react";

const CartContext = createContext();

const STORAGE_KEY = "swiftbite_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { restaurantId: null, restaurantName: null, items: [] };
  } catch {
    return { restaurantId: null, restaurantName: null, items: [] };
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { restaurantId, restaurantName, item } = action.payload;
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        return {
          restaurantId,
          restaurantName,
          items: [{ ...item, menu_item_id: item.id, quantity: 1 }],
        };
      }
      const existing = state.items.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        restaurantId,
        restaurantName,
        items: [...state.items, { ...item, menu_item_id: item.id, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM": {
      const filtered = state.items.filter((i) => i.menu_item_id !== action.payload);
      return filtered.length === 0
        ? { restaurantId: null, restaurantName: null, items: [] }
        : { ...state, items: filtered };
    }
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        const filtered = state.items.filter((i) => i.menu_item_id !== id);
        return filtered.length === 0
          ? { restaurantId: null, restaurantName: null, items: [] }
          : { ...state, items: filtered };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menu_item_id === id ? { ...i, quantity } : i
        ),
      };
    }
    case "CLEAR_CART":
      return { restaurantId: null, restaurantName: null, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, null, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (restaurantId, restaurantName, item) =>
    dispatch({ type: "ADD_ITEM", payload: { restaurantId, restaurantName, item } });

  const removeItem = (menuItemId) =>
    dispatch({ type: "REMOVE_ITEM", payload: menuItemId });

  const updateQuantity = (menuItemId, quantity) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: menuItemId, quantity } });

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = cart.items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
