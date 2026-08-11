import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Plus, Minus, Loader2, CheckCircle2, MapPin, Pencil, Banknote, ShoppingCart,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../features/auth/AuthContext";
import { customerApi } from "../features/api/apiSlice";

const DELIVERY_FEE = 60;
const FALLBACK_IMG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop";

export default function CartDrawer({ open, onClose }) {
  const { cart, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("cart");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);

  const subtotal = total;
  const grandTotal = subtotal + DELIVERY_FEE;

  const handleClose = () => {
    setStep("cart");
    setError("");
    onClose();
  };

  const handleAddMore = () => {
    onClose();
    navigate(cart.restaurantId ? `/restaurants/${cart.restaurantId}` : "/restaurants");
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      onClose();
      navigate("/login");
      return;
    }
    const validRestaurant = Number.isInteger(cart.restaurantId) && cart.restaurantId > 0;
    const validItems =
      cart.items.length > 0 &&
      cart.items.every((i) => Number.isInteger(i.menu_item_id) && i.menu_item_id > 0);
    if (!validRestaurant || !validItems) {
      clearCart();
      setError("This restaurant's menu isn't available yet. Please browse other restaurants.");
      return;
    }
    setError("");
    setStep("processing");
    try {
      const res = await customerApi.placeOrder({
        restaurant_id: cart.restaurantId,
        items: cart.items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        delivery_address: user?.address || "",
        delivery_instructions: notes,
      });
      clearCart();
      setOrderId(res.data.order.id);
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
      setStep("cart");
    }
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

          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 z-50 h-screen w-[400px] bg-white shadow-2xl flex flex-col"
          >
            <AnimatePresence mode="wait">
              {step === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col items-center justify-center px-8 text-center"
                >
                  <CheckCircle2 size={72} strokeWidth={1.6} className="text-green-500 mb-6" />
                  <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Order Confirmed!</h2>
                  <p className="text-zinc-400 mt-2">Your food is being prepared.</p>
                  <p className="text-xs font-medium text-zinc-400 mt-1">Order #{orderId || "placed"}</p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(orderId ? `/order/tracking/${orderId}` : "/customer/account/orders");
                    }}
                    className="mt-10 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-xl transition-colors"
                  >
                    Track Order
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Your Cart</h2>
                      <p className="text-sm text-zinc-400 mt-0.5">{cart.restaurantName || "SwiftBite"}</p>
                    </div>
                    <button
                      onClick={handleClose}
                      aria-label="Close cart"
                      className="w-9 h-9 rounded-full bg-zinc-100 shadow-sm flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                    >
                      <X size={18} strokeWidth={2.2} />
                    </button>
                  </div>

                  {cart.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                      <ShoppingCart size={48} strokeWidth={1.6} className="text-zinc-300 mb-4" />
                      <p className="text-zinc-500 font-semibold">Your cart is empty</p>
                      <p className="text-sm text-zinc-400 mt-1">Add some food to get started.</p>
                      <Link
                        to="/restaurants"
                        onClick={handleClose}
                        className="mt-5 bg-[#E03546] hover:bg-[#c72e3e] text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                      >
                        Browse Restaurants
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
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
                              <p className="text-[#E03546] font-bold text-sm mt-0.5">৳{parseFloat(item.price).toFixed(2)}</p>
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

                        <div className="bg-white rounded-xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] px-4 py-3.5 space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin size={18} strokeWidth={2.2} className="text-[#E03546] shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-400">Deliver to</p>
                              <p className="text-sm text-zinc-900 font-medium mt-0.5">{user?.address || "Set your delivery address"}</p>
                            </div>
                            <button
                              onClick={() => {
                                onClose();
                                navigate("/customer/account/addresses");
                              }}
                              className="text-xs font-semibold text-[#E03546] hover:underline shrink-0 inline-flex items-center gap-1"
                            >
                              <Pencil size={12} strokeWidth={2.4} />
                              Change
                            </button>
                          </div>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes for rider (e.g., Leave at door)"
                            className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E03546]/30 focus:border-[#E03546] transition"
                          />
                          <label className="flex items-center gap-3 pt-1.5 border-t border-zinc-100 cursor-pointer">
                            <span className="w-5 h-5 rounded-full border-2 border-[#E03546] flex items-center justify-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#E03546]" />
                            </span>
                            <Banknote size={18} strokeWidth={2.2} className="text-zinc-500" />
                            <span className="text-sm font-medium text-zinc-900">Cash on Delivery</span>
                          </label>
                        </div>

                        <button
                          onClick={handleAddMore}
                          className="w-full border-2 border-dashed border-zinc-300 hover:border-[#E03546] hover:text-[#E03546] text-zinc-500 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          <Plus size={16} strokeWidth={2.4} />
                          Add more items
                        </button>
                      </div>

                      <div className="border-t border-zinc-200 bg-[#F8F9FA] rounded-t-2xl px-6 py-5 space-y-4">
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                          </div>
                        )}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-zinc-500">
                            <span>Subtotal</span>
                            <span className="text-zinc-800 font-medium">৳{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>Delivery Fee</span>
                            <span className="text-zinc-800 font-medium">৳{DELIVERY_FEE}.00</span>
                          </div>
                          <div className="flex justify-between items-center text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-100">
                            <span>Total</span>
                            <span className="text-xl">৳{grandTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          onClick={handlePlaceOrder}
                          disabled={step === "processing"}
                          className="w-full bg-[#E03546] hover:bg-[#c72e3e] disabled:opacity-80 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          {step === "processing" ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              Go to Checkout
                              <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-sm">৳{grandTotal.toFixed(2)}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
