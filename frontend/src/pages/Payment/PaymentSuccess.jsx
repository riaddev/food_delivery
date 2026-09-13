import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, Printer, ReceiptText } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { customerApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [qrHidden, setQrHidden] = useState(false);

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderId) return;
    customerApi.getOrder(orderId).then((res) => setOrder(res.data.order)).catch(() => {});
  }, [orderId]);

  const trackingCode = order?.tracking_code || null;
  const trackUrl = trackingCode
    ? `${window.location.origin}/track/${trackingCode}`
    : orderId
      ? `${window.location.origin}/order/tracking/${orderId}`
      : null;
  const qrSrc = trackUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackUrl)}`
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-5 p-6 py-10">
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
            to={orderId ? `/customer/dashboard?tab=orders&trackOrder=${orderId}` : "/customer/dashboard?tab=orders"}
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

      {order && (
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] text-left">
          <div className="flex items-center gap-2 mb-4">
            <ReceiptText size={18} className="text-zinc-700" />
            <h2 className="font-extrabold text-zinc-900">Receipt</h2>
            {trackingCode && (
              <span className="ml-auto text-xs font-mono font-semibold text-zinc-500">{trackingCode}</span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-zinc-600">
                  <b className="text-zinc-900 mr-2">{item.quantity}x</b>
                  {item.name}
                </span>
                <span className="font-semibold text-zinc-800">
                  {formatPrice(Number(item.price) * Number(item.quantity))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Total paid</span>
            <span className="font-extrabold text-zinc-900">{formatPrice(Number(order.total || 0))}</span>
          </div>
          {qrSrc && !qrHidden && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <img
                src={qrSrc}
                alt="Tracking QR code"
                width={160}
                height={160}
                loading="lazy"
                onError={() => setQrHidden(true)}
                className="rounded-xl border border-zinc-100"
              />
              <p className="text-xs text-zinc-400">Scan to open live tracking</p>
            </div>
          )}
          <button
            onClick={() => window.print()}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 border-2 border-zinc-200 hover:border-zinc-900 text-zinc-700 font-semibold py-3 rounded-2xl transition-colors cursor-pointer"
          >
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      )}
    </div>
  );
}