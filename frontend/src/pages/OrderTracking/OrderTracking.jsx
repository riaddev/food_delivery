import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Utensils, Bike, Home, Headphones, XCircle, Package } from "lucide-react";
import BackToHome from "../../components/BackToHome";
import { customerApi } from "../../features/api/apiSlice";
import { formatPrice, formatDateTime } from "../../utils/foodImages";

const DELIVERY_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing Food", icon: Utensils },
  { key: "on_the_way", label: "On the Way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Home },
];

const DINE_IN_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing Food", icon: Utensils },
  { key: "served", label: "Served", icon: Home },
];

const STEP_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  picked_up: 3,
  on_the_way: 3,
  delivered: 4,
  served: 3,
};

const STATUS_TEXT = {
  pending: "Waiting for the restaurant to confirm your order.",
  confirmed: "The restaurant has confirmed your order.",
  preparing: "The restaurant is preparing your food.",
  ready: "Your order is ready.",
  picked_up: "Your order has been picked up by the rider.",
  on_the_way: "Your order is on the way!",
  delivered: "Your order has been delivered. Enjoy!",
  served: "Your order has been served. Enjoy!",
  cancelled: "This order was cancelled.",
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = () =>
      customerApi
        .getOrder(id)
        .then((res) => {
          if (active) {
            setOrder(res.data.order);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.response?.status === 404 ? "Order not found." : "Couldn't load your order.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

    load();
    const timer = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  const status = order?.status;
  const isDineIn = order?.order_type === "dine_in";
  const steps = isDineIn ? DINE_IN_STEPS : DELIVERY_STEPS;
  const activeStep = status ? STEP_INDEX[status] ?? 0 : 0;
  const isCancelled = status === "cancelled";

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <BackToHome />
          <div className="flex-1 text-center -ml-9">
            <h1 className="font-extrabold tracking-tight text-zinc-900">Order Tracking</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {order ? `#${order.id} · ${formatDateTime(order.created_at)}` : `#${id || ""}`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {loading && (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 rounded-full border-2 border-[#E03546] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && error && (
          <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-10 text-center">
            <XCircle size={40} className="text-rose-400 mx-auto mb-3" />
            <p className="font-bold text-zinc-900">{error}</p>
            <p className="text-sm text-zinc-400 mt-1">
              Make sure you're signed in with the account that placed this order.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 bg-[#E03546] hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Retry
            </button>
          </section>
        )}

        {!loading && order && (
          <>
            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                {isCancelled ? "Order Cancelled" : order.restaurant?.restaurant_name}
              </h2>
              <p className={`text-sm mt-1 ${isCancelled ? "text-rose-600 font-semibold" : "text-zinc-400"}`}>
                {STATUS_TEXT[status] || "Order status is being updated."}
              </p>
            </section>

            {!isCancelled && (
              <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
                <ol className="flex flex-col">
                  {steps.map((step, i) => {
                    const isCompleted = i < activeStep;
                    const isActive = i === activeStep;
                    const iconBg = isCompleted
                      ? "bg-green-100 text-green-600"
                      : isActive
                        ? "bg-[#E03546] text-white"
                        : "bg-zinc-100 text-zinc-400";
                    const hasLine = i < steps.length - 1;
                    const labelColor = isCompleted || isActive ? "text-zinc-900" : "text-zinc-500";
                    const Icon = step.icon;

                    return (
                      <li key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                            <Icon size={20} strokeWidth={2.2} />
                          </div>
                          {hasLine && (
                            <span
                              className={`w-[2px] flex-1 my-1 min-h-8 rounded-full ${isCompleted ? "bg-green-500" : "bg-zinc-200"}`}
                            />
                          )}
                        </div>
                        <div className="pb-6 flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2 pt-2.5">
                            <p className={`font-semibold text-sm ${isActive ? "text-[#E03546]" : labelColor}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold tracking-tight text-zinc-900 text-base">
                  {order.restaurant?.restaurant_name || "Restaurant"}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    order.payment_status === "paid"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {order.payment_status === "paid" ? "Paid" : "Pay on delivery"}
                </span>
              </div>

              <div className="mt-4">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0"
                  >
                    <span className="text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-900 mr-2">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-zinc-600">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.total - order.delivery_fee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>Delivery Fee</span>
                  <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-zinc-800">Total</span>
                  <span className="font-extrabold text-zinc-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Order type</span>
                <span className="font-semibold text-zinc-800">
                  {isDineIn ? "Dine-In" : "Delivery"}
                  {isDineIn && order.table_number ? ` · Table ${order.table_number}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400">Payment</span>
                <span className="font-semibold text-zinc-800 capitalize">
                  {order.payment_method === "cash" ? "Cash on Delivery" : order.payment_method}
                </span>
              </div>
              {!isDineIn && order.delivery_address && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Deliver to</span>
                  <span className="font-semibold text-zinc-800 max-w-[60%] text-right">{order.delivery_address}</span>
                </div>
              )}
            </section>

            <button className="w-full border-2 border-zinc-200 hover:border-[#E03546] hover:text-[#E03546] text-zinc-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Headphones size={18} strokeWidth={2.2} />
              Help &amp; Support
            </button>
          </>
        )}
      </main>
    </div>
  );
}