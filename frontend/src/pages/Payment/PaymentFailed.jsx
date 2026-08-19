import { Link, useSearchParams } from "react-router-dom";
import { XCircle, RotateCcw } from "lucide-react";

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <XCircle size={44} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-2">
          {cancelled ? "Payment Cancelled" : "Payment Failed. Please try again."}
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          {cancelled
            ? "You closed the payment window before completing the transaction. Your order is still saved — you can retry whenever you're ready."
            : "We couldn't process your payment. No money has been charged. Please double-check your payment details and try again."}
        </p>
        <div className="space-y-3">
          <Link
            to="/checkout"
            replace
            className="inline-flex items-center justify-center gap-2 w-full bg-[#E03546] hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl transition-colors"
          >
            <RotateCcw size={16} /> Try Again
          </Link>
          <Link
            to="/customer/dashboard"
            className="block w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-2xl transition-colors"
          >
            Go to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}