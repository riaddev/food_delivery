import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Banknote, CreditCard, Landmark, Lock, LogIn, MapPin, Pencil, Plus,
  Smartphone, Store, Truck, UserPlus, Utensils,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { customerApi, paymentApi, restaurantApi } from "../../features/api/apiSlice";
import api from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";
import BackToHome from "../../components/BackToHome";
import { toNumber } from "../../utils/foodImages";
import { ORDER_LIMITS, formatLimitError, getEffectiveCap } from "../../utils/orderLimits";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash on Delivery", desc: "Pay in cash when your order arrives", icon: Banknote },
  { id: "bkash", label: "bKash", desc: "Pay instantly with your bKash account", icon: Smartphone },
  { id: "nagad", label: "Nagad", desc: "Pay instantly with your Nagad account", icon: Landmark },
  { id: "card", label: "Card", desc: "Visa, Mastercard, or Amex", icon: CreditCard },
];

const ORDER_TYPES = [
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "takeout", label: "Takeout", icon: Store },
  { id: "dine_in", label: "Dine-in", icon: Utensils },
];

// Mirrors backend Order::COD_STRIKE_THRESHOLD. COD no-show strikes restrict
// cash only — the account and online methods keep working.
const COD_STRIKE_THRESHOLD = 3;
const COD_DISABLED_MESSAGE = "COD temporarily disabled due to repeated missed deliveries — please pay online";

const modeDesc = (id, restaurantName) => {
  if (id === "takeout") return `Pick up from ${restaurantName}`;
  if (id === "dine_in") return `Dine at ${restaurantName}`;
  return "Deliver to your saved address";
};

const formatAddress = (addr) => [addr.address, addr.city].filter(Boolean).join(", ");

export default function Checkout() {
  const { cart, total, itemCount, updateQuantity, removeItem, removeItems, clampToLimits, setRestaurant, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [addressSnapshot, setAddressSnapshot] = useState("");
  // Start open when there is no address yet so the editor doesn't depend on
  // `!deliveryAddress` to show (that coupling closed the editor on 1st keystroke).
  const [addressEditorOpen, setAddressEditorOpen] = useState(() => !user?.address);
  const deliveryRef = useRef(deliveryAddress);
  useEffect(() => {
    deliveryRef.current = deliveryAddress;
  }, [deliveryAddress]);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [feeStatus, setFeeStatus] = useState("loading");
  const [acceptsDineIn, setAcceptsDineIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [typeEditorOpen, setTypeEditorOpen] = useState(false);
  const [orderType, setOrderType] = useState(
    cart.mode === "takeout" || cart.mode === "dine_in" ? cart.mode : "delivery"
  );
  const [tableNumber, setTableNumber] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [feeReloadKey, setFeeReloadKey] = useState(0);

  const codDisabled = Number(user?.cod_strikes || 0) >= COD_STRIKE_THRESHOLD;
  // Never submit cash when disabled (backend rejects it too) — fall through
  // to the first online method without mutating the selected option.
  const methodInUse = codDisabled && paymentMethod === "cash" ? "bkash" : paymentMethod;

  useEffect(() => {
    if (!Number.isInteger(cart.restaurantId) || cart.restaurantId <= 0) return;
    let active = true;
    api.get(`/restaurants/${cart.restaurantId}`, { skipAuthRedirect: true })
      .then((res) => {
        if (!active) return;
        setDeliveryFee(parseFloat(res.data.restaurant?.delivery_fee) || 0);
        setAcceptsDineIn(res.data.restaurant?.accepts_dine_in === true);
        setRestaurant(res.data.restaurant || null);
        setFeeStatus("ready");
      })
      .catch(() => {
        if (active) setFeeStatus("error");
      });
    return () => { active = false; };
  }, [cart.restaurantId, setRestaurant, feeReloadKey]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    customerApi.getAddresses()
      .then((res) => {
        if (!active) return;
        const list = res.data.addresses || [];
        setSavedAddresses(list);
        if (list.length > 0) {
          const primary = list.find((a) => a.is_default) || list[0];
          const formatted = formatAddress(primary);
          // Only prefill if the user hasn't typed anything yet (read latest
          // value via ref to avoid overwriting in-progress typing).
          if (formatted && !deliveryRef.current?.trim()) {
            setDeliveryAddress(formatted);
            setAddressEditorOpen(false);
          }
        }
      })
      .catch(() => {
        if (active) setSavedAddresses([]);
      });
    return () => { active = false; };
  }, [user]);

  // Sync late-loading profile address (user is null on first render).
  useEffect(() => {
    if (user?.address && !deliveryRef.current?.trim()) {
      setDeliveryAddress(user.address);
      setAddressEditorOpen(false);
    }
  }, [user?.address]);

  useEffect(() => {
    if (cart.items.length === 0 || !cart.restaurantId) return;
    let active = true;
    const ids = cart.items.map((i) => i.menu_item_id);
    restaurantApi
      .checkAvailability({ menu_item_ids: ids })
      .then((res) => {
        if (!active) return;
        const serverItems = res.data.items || [];
        const byId = Object.fromEntries(serverItems.map((i) => [i.id, i]));
        const unavailable = serverItems.filter((i) => !i.is_available);
        const overLimit = cart.items.some((line) => {
          const server = byId[line.menu_item_id];
          if (!server) return false;
          return line.quantity > getEffectiveCap({ ...line, ...server }, cart.restaurant);
        });
        if (unavailable.length > 0 || overLimit) {
          clampToLimits(byId, cart.restaurant);
          if (unavailable.length > 0) {
            const removedIds = unavailable.map((i) => i.id);
            removeItems(removedIds);
          }
          setError(
            unavailable.length > 0
              ? unavailable.length === 1
                ? "1 item was removed — no longer available."
                : `${unavailable.length} items were removed — no longer available.`
              : "Some quantities were adjusted to the store's per-order / stock limits."
          );
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [cart.items, cart.restaurantId, cart.restaurant, removeItems, clampToLimits]);

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
        <Link to="/restaurants" className="text-orange-600 hover:underline">Browse Restaurants</Link>
      </div>
    );
  }

  const subtotal = total;
  const feeReady = orderType !== "delivery" || feeStatus === "ready";
  const grandTotal = subtotal + (orderType === "delivery" && feeStatus === "ready" ? deliveryFee : 0);
  const availableOrderTypes = ORDER_TYPES.filter((t) => t.id !== "dine_in" || acceptsDineIn);
  const activeType = availableOrderTypes.find((t) => t.id === orderType) || availableOrderTypes[0];
  const ActiveTypeIcon = activeType.icon;
  const primarySaved = savedAddresses.find((a) => a.is_default) || savedAddresses[0] || null;
  const isPrimarySaved = Boolean(primarySaved) && deliveryAddress === formatAddress(primarySaved);

  const handleOpenAddressEditor = () => {
    setAddressSnapshot(deliveryAddress);
    setAddressEditorOpen(true);
  };

  const handleAddNewAddress = () => {
    setAddressSnapshot(deliveryAddress);
    setDeliveryAddress("");
    setAddressEditorOpen(true);
  };

  const handleUseAddress = () => {
    if (!deliveryAddress?.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    setError(null);
    setAddressEditorOpen(false);
  };

  const handleCancelAddressEditor = () => {
    setDeliveryAddress(addressSnapshot);
    // If there was nothing to go back to, stay in the editor.
    if (addressSnapshot?.trim()) {
      setAddressEditorOpen(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Soft gate: guests can review everything on this page; sign-in is only
    // required when actually placing the order. Cart is preserved in
    // localStorage so it survives the login round-trip.
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    if (user.role !== "customer") {
      setError("Please use a customer account to place orders.");
      return;
    }
    setPlacing(true);
    setError(null);
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      setError("Please enter a delivery address.");
      setPlacing(false);
      return;
    }
    const validRestaurant = Number.isInteger(cart.restaurantId) && cart.restaurantId > 0;
    const validItems =
      cart.items.length > 0 &&
      cart.items.every((i) => Number.isInteger(i.menu_item_id) && i.menu_item_id > 0);
    if (!validRestaurant || !validItems) {
      clearCart();
      setError("This restaurant's menu isn't available yet. Please browse other restaurants.");
      setPlacing(false);
      return;
    }
    try {
      const res = await customerApi.placeOrder({
        restaurant_id: cart.restaurantId,
        items: cart.items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
        })),
        delivery_address: orderType === "delivery" ? deliveryAddress : undefined,
        delivery_instructions: orderType === "delivery" ? deliveryNotes : undefined,
        payment_method: methodInUse,
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber.trim() || null : undefined,
      });

      if (methodInUse !== "cash") {
        const pay = await paymentApi.initiatePayment({
          order_id: res.data.order.id,
          amount: toNumber(res.data.order.total),
        });
        const gatewayUrl = pay.data?.url;
        if (!gatewayUrl) {
          setError("Payment gateway did not return a redirect URL. Your order is saved — please retry from My Orders or choose Cash on Delivery.");
          setPlacing(false);
          return;
        }
        window.location.replace(gatewayUrl);
        return;
      }

      clearCart();
      navigate(`/order/tracking/${res.data.order.id}`, { replace: true });
    } catch (err) {
      setError(formatLimitError(err));
      setPlacing(false);
    }
  };

  const buttonLabel = !user ? "Sign in to Place Order" : methodInUse === "cash" ? "Place Order" : "Pay";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BackToHome />
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Checkout</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Review your order and pay</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] items-start">
          <div className="space-y-6 min-w-0">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-lg text-zinc-900">Your Order</h2>
                <span className="text-sm font-semibold text-[#F97316]">{cart.restaurantName || "Swift Bite"}</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {itemCount > ORDER_LIMITS.reviewAtUnits && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-3">
                    Large order ({itemCount} units) — the restaurant will confirm it before preparing. For catering, consider contacting them directly.
                  </div>
                )}
                {cart.items.map((item) => {
                  const cap = getEffectiveCap(item, cart.restaurant);
                  const atMax = item.quantity >= cap;
                  return (
                  <div key={item.menu_item_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[#F97316] text-sm font-medium mt-0.5">৳{parseFloat(item.price).toFixed(2)}</p>
                      {cap <= 20 && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">Max {cap} per order</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="w-7 h-7 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                      >&minus;</button>
                      <span className="text-sm font-semibold w-6 text-center text-zinc-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        disabled={atMax}
                        title={atMax ? `Max ${cap} per order` : "Increase quantity"}
                        aria-label={`Increase ${item.name} quantity`}
                        className="w-7 h-7 rounded-full border border-zinc-300 bg-white flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                      >+</button>
                    </div>
                    <p className="font-semibold text-sm text-zinc-900 w-20 text-right shrink-0">
                      ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.menu_item_id)}
                      aria-label={`Remove ${item.name}`}
                      className="text-zinc-400 hover:text-red-500 ml-1 shrink-0"
                    >&times;</button>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
              <h2 className="font-extrabold text-lg text-zinc-900 mb-4">Order Type</h2>
              {!typeEditorOpen ? (
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#F97316] shrink-0">
                    <ActiveTypeIcon size={20} strokeWidth={2.2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-900">{activeType.label}</p>
                    <p className="text-sm text-zinc-500 truncate">{modeDesc(activeType.id, cart.restaurantName || "Swift Bite")}</p>
                  </div>
                  <button
                    onClick={() => setTypeEditorOpen(true)}
                    className="text-xs font-semibold text-[#F97316] hover:underline shrink-0"
                  >Change</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableOrderTypes.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-start gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                        orderType === type.id ? "border-orange-400 bg-orange-50/50" : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        checked={orderType === type.id}
                        onChange={() => {
                          setOrderType(type.id);
                          setTypeEditorOpen(false);
                        }}
                        className="mt-1 accent-orange-500"
                      />
                      <span className="flex-1">
                        <span className="block font-semibold text-sm text-zinc-900">{type.label}</span>
                        <span className="block text-xs text-zinc-400 mt-0.5">{modeDesc(type.id, cart.restaurantName || "Swift Bite")}</span>
                      </span>
                    </label>
                  ))}
                  <button
                    onClick={() => setTypeEditorOpen(false)}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                  >Cancel</button>
                </div>
              )}
            </div>

            {orderType === "delivery" ? (
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
                <h2 className="font-extrabold text-lg text-zinc-900 mb-4">Delivery Address</h2>
                {addressEditorOpen ? (
                  <div className="space-y-3">
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      rows={2}
                      autoComplete="off"
                      autoFocus
                      className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleUseAddress}
                        className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                      >Use this address</button>
                      {addressSnapshot?.trim() ? (
                        <button
                          onClick={handleCancelAddressEditor}
                          className="text-sm font-semibold text-zinc-500 hover:text-zinc-800"
                        >Cancel</button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} strokeWidth={2.2} className="text-[#F97316] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-400">Delivery address</p>
                      <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">{isPrimarySaved ? primarySaved.label : "Custom address"}</p>
                      <p className="text-sm text-zinc-600 mt-0.5">{deliveryAddress}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={handleOpenAddressEditor}
                        className="text-xs font-semibold text-[#F97316] hover:underline inline-flex items-center gap-1"
                      >
                        <Pencil size={12} strokeWidth={2.4} />Change
                      </button>
                      <button
                        onClick={handleAddNewAddress}
                        className="text-xs font-semibold text-[#F97316] hover:underline inline-flex items-center gap-1"
                      >
                        <Plus size={12} strokeWidth={2.4} />Add new address
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-6">
                  <h3 className="font-bold text-sm text-zinc-900 mb-2">Rider Notes</h3>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Add notes for rider (e.g., Leave at door)"
                    className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>
            ) : orderType === "takeout" ? (
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
                <h2 className="font-extrabold text-lg text-zinc-900 mb-4">Pickup</h2>
                <div className="flex items-start gap-3">
                  <Store size={18} strokeWidth={2.2} className="text-[#F97316] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-400">Pick up from</p>
                    <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">{cart.restaurantName || "Swift Bite"}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Order will be ready for pickup</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
                <h2 className="font-extrabold text-lg text-zinc-900 mb-4">Dine-in</h2>
                <div className="flex items-start gap-3 mb-6">
                  <Utensils size={18} strokeWidth={2.2} className="text-[#F97316] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-400">Dining at</p>
                    <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">{cart.restaurantName || "Swift Bite"}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">The restaurant will bring your order to your table.</p>
                  </div>
                </div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Table Number (optional)</label>
                <input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 5, or the table you're sitting at"
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none"
                />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6">
              <h2 className="font-extrabold text-lg text-zinc-900 mb-1">Payment Method</h2>
              <p className="text-sm text-zinc-500 mb-4">Choose how you want to pay</p>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const disabled = method.id === "cash" && codDisabled;
                  return (
                    <label
                      key={method.id}
                      title={disabled ? COD_DISABLED_MESSAGE : undefined}
                      className={`flex items-center gap-3 border rounded-xl px-4 py-3.5 transition-colors ${
                        disabled
                          ? "border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed"
                          : paymentMethod === method.id
                            ? "border-orange-400 bg-orange-50/50 cursor-pointer"
                            : "border-zinc-200 hover:border-zinc-300 cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        disabled={disabled}
                        className="mt-1 accent-orange-500 disabled:cursor-not-allowed"
                      />
                      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        paymentMethod === method.id && !disabled ? "bg-orange-100 text-[#F97316]" : "bg-zinc-100 text-zinc-500"
                      }`}>
                        <Icon size={18} strokeWidth={2.2} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-sm text-zinc-900">{method.label}</span>
                        <span className={`block text-xs mt-0.5 ${disabled ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                          {disabled ? COD_DISABLED_MESSAGE : method.desc}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {methodInUse !== "cash" && (
                <p className="text-xs text-zinc-400 mt-4">
                  You'll be redirected to the SSLCOMMERZ secure gateway to complete your payment.
                </p>
              )}
            </div>
          </div>

          <aside className="bg-white rounded-2xl border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 md:sticky md:top-6">
            <h2 className="font-extrabold text-lg text-zinc-900">Order Summary</h2>
            <p className="text-sm font-semibold text-zinc-900 mt-3 mb-3 truncate">{cart.restaurantName || "Swift Bite"}</p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 mb-4">
              {cart.items.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between text-sm">
                  <span className="text-zinc-600 truncate">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-medium text-zinc-900 shrink-0 ml-3">
                    ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Delivery Fee</span>
                <span className="font-semibold text-zinc-900">
                  {orderType !== "delivery"
                    ? "Free"
                    : feeStatus === "ready"
                      ? deliveryFee === 0 ? "Free" : `৳${deliveryFee.toFixed(2)}`
                      : feeStatus === "error" ? "Unavailable" : "—"}
                </span>
              </div>
              {orderType === "delivery" && feeStatus === "error" && (
                <button
                  onClick={() => { setFeeStatus("loading"); setFeeReloadKey((k) => k + 1); }}
                  className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer"
                >
                  Retry loading delivery fee
                </button>
              )}
              <div className="flex justify-between items-center border-t border-zinc-100 pt-3">
                <span className="text-base font-extrabold text-zinc-900">Total</span>
                <span className="text-2xl font-extrabold text-[#F97316]">
                  {feeReady ? `৳${grandTotal.toFixed(2)}` : "—"}
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {!user && (
              <div className="mt-4 bg-orange-50 border border-orange-200 px-4 py-3.5 rounded-xl">
                <p className="text-sm font-bold text-zinc-900">Sign in to complete your order</p>
                <p className="text-xs text-zinc-500 mt-1">Your cart is saved — you'll return here after signing in.</p>
                <div className="flex gap-2 mt-3">
                  <Link
                    to="/login"
                    state={{ from: "/checkout" }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <LogIn size={14} strokeWidth={2.4} /> Sign In
                  </Link>
                  <Link
                    to="/register"
                    state={{ from: "/checkout" }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-orange-300 text-[#EA580C] hover:bg-orange-100/50 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <UserPlus size={14} strokeWidth={2.4} /> Sign Up
                  </Link>
                </div>
              </div>
            )}
            {user && user.role !== "customer" && (
              <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
                You're signed in as {user.role}. Please use a customer account to place orders.
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !feeReady || (user && user.role !== "customer")}
              className="w-full mt-5 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:hover:bg-zinc-200 disabled:[&>span]:bg-zinc-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {placing ? "Placing Order..." : buttonLabel}
              <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-sm">
                {feeReady ? `৳${grandTotal.toFixed(2)}` : "—"}
              </span>
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-zinc-400">
              <Lock size={12} strokeWidth={2.2} />
              Secure checkout
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
