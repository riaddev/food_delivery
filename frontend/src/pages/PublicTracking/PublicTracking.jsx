import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Utensils, Bike, Home, Package, ArrowLeft, RefreshCw } from "lucide-react";
import { trackingApi } from "../../features/api/apiSlice";

const DELIVERY_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing Food", icon: Utensils },
  { key: "ready", label: "Ready for Pickup", icon: Package },
  { key: "assigned", label: "Rider Assigned", icon: Bike },
  { key: "picked_up", label: "Picked Up", icon: Bike },
  { key: "on_the_way", label: "On the Way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Home },
];

const STEP_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  assigned: 4,
  picked_up: 5,
  on_the_way: 6,
  delivered: 7,
};

const STATUS_TEXT = {
  pending: "Waiting for the restaurant to confirm your order.",
  confirmed: "The restaurant has confirmed your order.",
  preparing: "The restaurant is preparing your food.",
  ready: "Your order is ready for pickup.",
  assigned: "A rider has been assigned to your order.",
  picked_up: "Your order has been picked up by the rider.",
  on_the_way: "Your order is on the way!",
  delivered: "Your order has been delivered. Enjoy!",
  cancelled: "This order was cancelled.",
};

export default function PublicTracking() {
  const { trackingCode } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = () =>
      trackingApi
        .track(trackingCode)
        .then((res) => {
          if (active) {
            setOrder(res.data);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setError(err.response?.status === 404 ? "Tracking code not found." : "Couldn't load tracking info.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

    load();
    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [trackingCode]);

  const status = order?.status;
  const activeStep = status ? STEP_INDEX[status] ?? 0 : 0;
  const isCancelled = status === "cancelled";

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 no-underline">
            <ArrowLeft size={18} /> Home
          </Link>
          <div className="flex-1 text-center -ml-9">
            <h1 className="font-extrabold tracking-tight text-zinc-900">Track Order</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{trackingCode}</p>
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
            <p className="font-bold text-zinc-900">{error}</p>
            <p className="text-sm text-zinc-400 mt-1">Please check the tracking code and try again.</p>
          </section>
        )}

        {!loading && order && (
          <>
            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                    {isCancelled ? "Order Cancelled" : order.restaurant?.name}
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    {STATUS_TEXT[status] || "Order status is being updated."}
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </section>

            {!isCancelled && (
              <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
                <ol className="flex flex-col">
                  {DELIVERY_STEPS.map((step, i) => {
                    const isCompleted = i < activeStep;
                    const isActive = i === activeStep;
                    const iconBg = isCompleted
                      ? "bg-green-100 text-green-600"
                      : isActive
                        ? "bg-[#E03546] text-white"
                        : "bg-zinc-100 text-zinc-400";
                    const hasLine = i < DELIVERY_STEPS.length - 1;
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

            {order.rider && (
              <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
                <h3 className="text-sm font-bold text-zinc-900 mb-3">Your Rider</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {(order.rider.name || "R").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{order.rider.name}</p>
                    {order.rider.phone && (
                      <a href={`tel:${order.rider.phone}`} className="text-xs text-indigo-600 no-underline">
                        {order.rider.phone}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5 text-sm">
              {order.delivery_address && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Deliver to</span>
                  <span className="font-semibold text-zinc-800 max-w-[60%] text-right">{order.delivery_address}</span>
                </div>
              )}
              {order.restaurant?.address && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400">Restaurant</span>
                  <span className="font-semibold text-zinc-800 max-w-[60%] text-right">{order.restaurant.address}</span>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
