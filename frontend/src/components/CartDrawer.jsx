import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ open, onClose }) {
  const { cart, updateQuantity, removeItem, itemCount, total } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-bold">Your Cart ({itemCount})</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
          </div>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Your cart is empty</div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <p className="text-sm text-gray-500 font-medium">From: <span className="text-gray-800">{cart.restaurantName}</span></p>
                {cart.items.map((item) => (
                  <div key={item.menu_item_id} className="flex gap-3 items-start pb-4 border-b last:border-0">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-orange-600 font-bold text-sm">৳{parseFloat(item.price).toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
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
                    </div>
                    <button
                      onClick={() => removeItem(item.menu_item_id)}
                      className="text-gray-400 hover:text-red-500 text-lg"
                    >&times;</button>
                  </div>
                ))}
              </div>

              <div className="border-t px-6 py-4 space-y-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { onClose(); navigate("/checkout"); }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
