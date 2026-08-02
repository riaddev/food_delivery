import { TrendingUp, Users, ShoppingBag, Clock3 } from "lucide-react";

const MOCK_INSIGHTS = [
  { title: "Orders Today", value: "18", icon: ShoppingBag, tint: "bg-red-50 text-red-500" },
  { title: "Avg Order Value", value: "৳540", icon: TrendingUp, tint: "bg-emerald-50 text-emerald-500" },
  { title: "New Customers", value: "9", icon: Users, tint: "bg-blue-50 text-blue-500" },
  { title: "Busiest Hour", value: "8PM", icon: Clock3, tint: "bg-amber-50 text-amber-500" },
];

const MOCK_WEEK = [
  { day: "Sun", pct: 62 }, { day: "Mon", pct: 100 }, { day: "Tue", pct: 78 },
  { day: "Wed", pct: 55 }, { day: "Thu", pct: 88 }, { day: "Fri", pct: 70 }, { day: "Sat", pct: 92 },
];

const MOCK_HOURS = [
  { label: "12pm", pct: 35 }, { label: "1pm", pct: 78 }, { label: "2pm", pct: 55 },
  { label: "6pm", pct: 65 }, { label: "7pm", pct: 90 }, { label: "8pm", pct: 100 }, { label: "9pm", pct: 70 },
];

export function Analytics() {
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Analytics</h1>
      <p className="text-zinc-400 mb-8">A snapshot of how your restaurant is performing.</p>

      <div className="flex flex-wrap gap-2.5 mb-8">
        {["Today", "This week", "This month"].map((p, i) => (
          <button key={p} className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${i === 0 ? "bg-zinc-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]" : "bg-white text-zinc-500 hover:text-zinc-900 shadow-sm"}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {MOCK_INSIGHTS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${s.tint}`}>
                <Icon size={22} strokeWidth={2.2} />
              </div>
              <p className="text-sm font-semibold text-zinc-400">{s.title}</p>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-0.5">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 mb-6">Busiest Days</h2>
          <div className="space-y-4">
            {MOCK_WEEK.map((d) => (
              <div key={d.day} className="flex items-center gap-4">
                <span className="w-10 text-xs font-bold text-zinc-500">{d.day}</span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-9 text-right text-xs font-bold text-zinc-700">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <h2 className="text-lg font-extrabold tracking-tight text-zinc-900 mb-6">Orders by Hour</h2>
          <div className="flex items-end gap-3 h-36">
            {MOCK_HOURS.map((h) => (
              <div key={h.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-zinc-100 rounded-full overflow-hidden flex-1 flex items-end">
                  <div className="w-full bg-zinc-900 rounded-full transition-all" style={{ height: `${h.pct}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 whitespace-nowrap">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}