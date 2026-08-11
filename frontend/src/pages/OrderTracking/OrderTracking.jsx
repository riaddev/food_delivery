import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Utensils, Bike, Home, Headphones } from "lucide-react";

const STEPS = [
  { label: "Order Confirmed", time: "12:30 PM", icon: CheckCircle },
  { label: "Preparing Food", time: "12:35 PM", icon: Utensils },
  { label: "On the way", time: null, icon: Bike },
  { label: "Delivered", time: null, icon: Home },
];

const ACTIVE_STEP = 1;

const ITEMS = [
  { name: "Cheeseburger", qty: 1 },
  { name: "Coke", qty: 2 },
];

const TOTAL = 510;

export default function OrderTracking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const orderRef = id || "ORD-1024";

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors shrink-0"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <div className="flex-1 text-center -ml-9">
            <h1 className="font-extrabold tracking-tight text-zinc-900">Order Tracking</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">#{orderRef}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Arriving in 25 mins</h2>
          <p className="text-zinc-400 text-sm mt-1">Restaurant is preparing your food.</p>
        </section>

        <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
          <ol className="flex flex-col">
            {STEPS.map((step, i) => {
              const isCompleted = i < ACTIVE_STEP;
              const isActive = i === ACTIVE_STEP;
              const iconBg = isCompleted
                ? "bg-green-100 text-green-600"
                : isActive
                  ? "bg-[#E03546] text-white"
                  : "bg-zinc-100 text-zinc-400";
              const hasLine = i < STEPS.length - 1;
              const labelColor = isCompleted || isActive ? "text-zinc-900" : "text-zinc-500";
              const Icon = step.icon;

              return (
                <li key={step.label} className="flex gap-4">
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
                      {step.time && <span className="text-xs font-medium text-zinc-400">{step.time}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="bg-white rounded-xl border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-5">
          <h3 className="font-extrabold tracking-tight text-zinc-900 text-base">Burger Republic</h3>
          <div className="mt-4">
            {ITEMS.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0"
              >
                <span className="text-sm text-zinc-700">
                  <span className="font-semibold text-zinc-900 mr-2">{item.qty}x</span>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="font-semibold text-zinc-800">Total</span>
            <span className="font-extrabold text-zinc-900">৳{TOTAL}</span>
          </div>
        </section>

        <button className="w-full border-2 border-zinc-200 hover:border-[#E03546] hover:text-[#E03546] text-zinc-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Headphones size={18} strokeWidth={2.2} />
          Help &amp; Support
        </button>
      </main>
    </div>
  );
}