import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { customerApi } from "../../features/api/apiSlice";
import api from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";
import BackToHome from "../../components/BackToHome";

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash on Delivery", desc: "Pay in cash when your order arrives" },
  { id: "bkash", label: "bKash", desc: "Pay instantly with your bKash account" },
  { id: "card", label: "Card", desc: "Visa, Mastercard, or Amex (simulated)" },
];

const ORDER_TYPES = [
  { id: "delivery", label: "Delivery", desc: "We'll bring the food to your address" },
  { id: "dine_in", label: "Dine-In", desc: "Eat at the restaurant — no delivery fee" },
];

export default function Checkout() {
  const { cart, total, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [bkashNumber, setBkashNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [acceptsDineIn, setAcceptsDineIn] = useState(false);
  const [orderType, setOrderType] = useState("delivery");
  const [tableNumber, setTableNumber] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!Number.isInteger(cart.restaurantId) || cart.restaurantId <= 0) return;
    let active = true;
    api.get(`/restaurants/${cart.restaurantId}`)
      .then((res) => {
        if (!active) return;
        setDeliveryFee(parseFloat(res.data.restaurant?.delivery_fee) || 0);
        setAcceptsDineIn(res.data.restaurant?.accepts_dine_in === true);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [cart.restaurantId]);

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
        <Link to="/restaurants" className="text-orange-600 hover:underline">Browse Restaurants</Link>
      </div>
    );
  }

  const subtotal = total;
  const grandTotal = subtotal + (orderType === "dine_in" ? 0 : deliveryFee);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);
    if (orderType !== "dine_in" && !deliveryAddress.trim()) {
      setError("Please enter a delivery address.");
      setPlacing(false);
      return;
    }
    if (paymentMethod === "bkash" && !/^01\d{9}$/.test(bkashNumber.trim())) {
      setError("Enter a valid bKash number (e.g. 01XXXXXXXXX).");
      setPlacing(false);
      return;
    }
    if (paymentMethod === "card" && (cardNumber.replace(/\s/g, "").length < 12 || !cardExpiry || cardCvv.length < 3)) {
      setError("Enter valid card details to continue.");
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
        delivery_address: orderType === "dine_in" ? undefined : deliveryAddress,
        payment_method: paymentMethod,
        order_type: orderType,
        table_number: orderType === "dine_in" ? tableNumber.trim() || null : undefined,
      });
      clearCart();
      navigate(`/customer/dashboard?order=${res.data.order.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BackToHome />
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Order from <span className="text-orange-600">{cart.restaurantName}</span></h2>
            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.menu_item_id} className="flex items-center gap-4 py-3">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-orange-600 text-sm font-medium">৳{parseFloat(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                    >&minus;</button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100"
                    >+</button>
                  </div>
                  <p className="font-semibold text-sm w-20 text-right">৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeItem(item.menu_item_id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >&times;</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Order Type</h2>
            {acceptsDineIn ? (
              <div className="space-y-3">
                {ORDER_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                      orderType === type.id ? "border-orange-400 bg-orange-50/50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === type.id}
                      onChange={() => setOrderType(type.id)}
                      className="mt-1 accent-orange-500"
                    />
                    <span className="flex-1">
                      <span className="block font-semibold text-sm">{type.label}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">{type.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Delivery to your address — <span className="font-medium text-gray-600">{cart.restaurantName}</span> doesn't offer dine-in yet.
              </p>
            )}
          </div>

          {orderType === "dine_in" ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4">Dine-In Details</h2>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Table Number (optional)</label>
              <input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 5, or the table you're sitting at"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-2">The restaurant will bring your order to your table.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4">Delivery Address</h2>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 border rounded-xl px-4 py-3.5 cursor-pointer transition-colors ${
                    paymentMethod === method.id ? "border-orange-400 bg-orange-50/50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                    className="mt-1 accent-orange-500"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold text-sm">{method.label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{method.desc}</span>
                  </span>
                </label>
              ))}
            </div>

            {paymentMethod === "bkash" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">bKash Account Number</label>
                <input
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-2">Simulated payment — no real charge will be made.</p>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry</label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                    placeholder="123"
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 sm:col-span-2">Simulated payment — no real charge will be made.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-semibold">{orderType === "dine_in" ? "Free" : deliveryFee === 0 ? "Free" : `৳${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-orange-600">৳{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-lg transition"
            >
              {placing ? "Placing Order..." : `Place Order · ${orderType === "dine_in" ? "Pay at Restaurant" : paymentMethod === "cash" ? "Cash on Delivery" : paymentMethod.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}