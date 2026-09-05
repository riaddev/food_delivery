import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Plus, Minus, MapPin, Pencil, ShoppingCart, Store, Utensils, LogIn,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../features/auth/AuthContext";
import api, { customerApi, restaurantApi } from "../features/api/apiSlice";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop";

export default function CartDrawer({ open, onClose, mode: modeProp }) {
  const { cart, updateQuantity, removeItems, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [feeRestaurantId, setFeeRestaurantId] = useState(null);
  const [feeStatus, setFeeStatus] = useState("loading");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [staleNotice, setStaleNotice] = useState("");

  const rawMode = modeProp || cart.mode || "delivery";
  const effectiveMode = rawMode === "pickup" ? "takeout" : rawMode;
  const deliveryAddress = user?.address || savedAddresses[0]?.address || "";
  const missingAddress = effectiveMode === "delivery" && !deliveryAddress;
  const feeState = feeRestaurantId === cart.restaurantId ? feeStatus : "loading";
  const feeReady = effectiveMode !== "delivery" || feeState === "ready";

  useEffect(() => {
    if (!open || effectiveMode !== "delivery" || !user) return;
    let active = true;
    customerApi
      .getAddresses()
      .then((res) => {
        if (active) setSavedAddresses(res.data.addresses || []);
      })
      .catch(() => {
        if (active) setSavedAddresses([]);
      });
    return () => {
      active = false;
    };
  }, [open, effectiveMode, user]);

  useEffect(() => {
    if (!open || effectiveMode !== "delivery") return;
    if (!Number.isInteger(cart.restaurantId) || cart.restaurantId <= 0) return;
    let active = true;
    api
      .get(`/restaurants/${cart.restaurantId}`)
      .then((res) => {
        if (!active) return;
        setFeeRestaurantId(cart.restaurantId);
        setDeliveryFee(parseFloat(res.data.restaurant?.delivery_fee) || 0);
        setFeeStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setFeeRestaurantId(cart.restaurantId);
        setFeeStatus("error");
      });
    return () => {
      active = false;
    };
  }, [open, effectiveMode, cart.restaurantId]);

  const subtotal = total;
  const grandTotal = subtotal + (effectiveMode === "delivery" && feeState === "ready" ? deliveryFee : 0);
  const checkoutDisabled = !feeReady;

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || cart.items.length === 0 || !cart.restaurantId) return;
    let active = true;
    const ids = cart.items.map((i) => i.menu_item_id);
    restaurantApi
      .checkAvailability({ menu_item_ids: ids })
      .then((res) => {
        if (!active) return;
        const unavailable = (res.data.items || []).filter((i) => !i.is_available);
        if (unavailable.length > 0) {
          const removedIds = unavailable.map((i) => i.id);
          removeItems(removedIds);
          setStaleNotice(
            unavailable.length === 1
              ? "1 item was removed — no longer available."
              : `${unavailable.length} items were removed — no longer available.`
          );
          setTimeout(() => setStaleNotice(""), 4000);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [open, cart.items, cart.restaurantId, removeItems]);

  const handleAddMore = () => {
    onClose();
    navigate(cart.restaurantId ? `/restaurants/${cart.restaurantId}` : "/restaurants");
  };

  const handleGoToCheckout = () => {
    if (!user) {
      onClose();
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    onClose();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            key="modal-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="pointer-events-auto w-[94vw] sm:w-[90vw] md:w-[560px] md:max-w-[600px] max-h-[85vh] bg-white shadow-2xl rounded-[22px] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Your Cart</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    {cart.restaurantName || "Swift Bite"} ·{" "}
                    {effectiveMode === "takeout" ? "Takeout" : effectiveMode === "dine_in" ? "Dine-in" : "Delivery"}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close cart"
                  className="w-9 h-9 rounded-full bg-zinc-100 shadow-sm flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>

              {staleNotice && (
                <div className="mx-6 mb-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2.5 rounded-xl">
                  {staleNotice}
                </div>
              )}

              {cart.items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 text-center">
                  <div className="relative w-28 h-28 mb-5">
                    <div className="absolute inset-0 rounded-full bg-orange-50 border-2 border-dashed border-orange-200" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingCart size={44} strokeWidth={1.5} className="text-orange-300" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-zinc-800">Your cart is empty</p>
                  <p className="text-sm text-zinc-400 mt-1.5 max-w-[240px]">Looks like you haven't added anything yet. Find something delicious!</p>
                  <Link
                    to="/restaurants"
                    onClick={handleClose}
                    className="mt-6 w-full max-w-[220px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
                  >
                    Browse Restaurants
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-3">
                    {cart.items.map((item) => (
                      <div
                        key={item.menu_item_id}
                        className="bg-white rounded-xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-4 flex items-center gap-4"
                      >
                        <img
                          src={item.image_url || FALLBACK_IMG}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-zinc-900 truncate">{item.name}</p>
                          <p className="text-[#F97316] font-bold text-sm mt-0.5">৳{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                            aria-label={`Decrease ${item.name} quantity`}
                            className="w-7 h-7 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                          >
                            <Minus size={13} strokeWidth={2.4} />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center text-zinc-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            className="w-7 h-7 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                          >
                            <Plus size={13} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {effectiveMode === "delivery" ? (
                      <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-4 py-3.5 space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin size={18} strokeWidth={2.2} className="text-[#F97316] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-400">Deliver to</p>
                            <p className="text-sm text-zinc-900 font-medium mt-0.5">
                              {user ? (deliveryAddress || "Set your delivery address") : "Log in to add your delivery address"}
                            </p>
                          </div>
                          {user ? (
                            <button
                              onClick={() => {
                                onClose();
                                navigate("/customer/dashboard?tab=addresses");
                              }}
                              className="text-xs font-semibold text-[#F97316] hover:underline shrink-0 inline-flex items-center gap-1"
                            >
                              <Pencil size={12} strokeWidth={2.4} />
                              {missingAddress ? "Add address" : "Change"}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onClose();
                                navigate("/login", { state: { from: pathname } });
                              }}
                              className="text-xs font-semibold text-[#F97316] hover:underline shrink-0 inline-flex items-center gap-1"
                            >
                              <LogIn size={12} strokeWidth={2.4} />
                              Log in
                            </button>
                          )}
                        </div>
                      </div>
                    ) : effectiveMode === "takeout" ? (
                      <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-4 py-3.5 space-y-3">
                        <div className="flex items-start gap-3">
                          <Store size={18} strokeWidth={2.2} className="text-[#F97316] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-400">Pick up from</p>
                            <p className="text-sm text-zinc-900 font-medium mt-0.5 truncate">{cart.restaurantName || "Swift Bite"}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">Order will be ready for pickup</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-4 py-3.5 space-y-3">
                        <div className="flex items-start gap-3">
                          <Utensils size={18} strokeWidth={2.2} className="text-[#F97316] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-400">Dining at</p>
                            <p className="text-sm text-zinc-900 font-medium mt-0.5 truncate">{cart.restaurantName || "Swift Bite"}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">The restaurant will bring your order to your table.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleAddMore}
                      className="w-full border-2 border-dashed border-zinc-300 hover:border-[#F97316] hover:text-[#F97316] text-zinc-500 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus size={16} strokeWidth={2.4} />
                      Add more items
                    </button>
                  </div>

                  <div className="border-t border-zinc-200 bg-[#F8F9FA] rounded-t-2xl px-6 py-5 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal</span>
                        <span className="text-zinc-800 font-medium">৳{subtotal.toFixed(2)}</span>
                      </div>
                      {effectiveMode === "delivery" && (
                        <div className="flex justify-between text-zinc-500">
                          <span>Delivery Fee</span>
                          <span className="text-zinc-800 font-medium">
                            {feeState === "ready" ? `৳${deliveryFee.toFixed(2)}` : feeState === "error" ? "Unavailable" : "—"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-100">
                        <span>Total</span>
                        <span className="text-xl">
                          {effectiveMode === "delivery" && feeState !== "ready" ? "—" : `৳${grandTotal.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleGoToCheckout}
                      disabled={checkoutDisabled}
                      className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:hover:bg-zinc-200 disabled:[&>span]:bg-zinc-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      Go to Checkout
                      <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-sm">
                        {effectiveMode === "delivery" && feeState !== "ready" ? "—" : `৳${grandTotal.toFixed(2)}`}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
