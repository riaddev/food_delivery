import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={44} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-2">
          Your order is confirmed. The restaurant has been notified and will start
          preparing your food shortly.
        </p>
        {orderId && (
          <p className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Package size={14} /> Order #{orderId}
          </p>
        )}
        <div className="space-y-3">
          <Link
            to={orderId ? `/order/tracking/${orderId}` : "/customer/dashboard"}
            className="block w-full bg-[#E03546] hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-colors"
          >
            Track Your Order
          </Link>
          <Link
            to="/restaurants"
            replace
            className="block w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-2xl transition-colors"
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}