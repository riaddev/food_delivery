import { TrendingUp, Users, ShoppingBag, Clock3 } from "lucide-react";

const MOCK_INSIGHTS = [
  { title: "Orders Today", value: "18", icon: ShoppingBag, tint: "bg-orange-soft text-orange-deep" },
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
    <div className="max-w-5xl" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.4px]">Analytics</h1>
        <p className="text-[14px] text-text-muted mt-1">A snapshot of how your restaurant is performing.</p>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-8">
        {["Today", "This week", "This month"].map((p, i) => (
          <button key={p} className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${i === 0 ? "bg-orange-primary text-white" : "bg-card text-text-muted border border-border hover:text-text-primary"}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        {MOCK_INSIGHTS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card rounded-[13px] border border-border p-5 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.tint}`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-text-light">{s.title}</p>
                  <p className="text-xl font-bold font-mono tracking-tight text-text-primary mt-1 leading-tight">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="bg-card rounded-[13px] border border-border p-7">
          <h2 className="text-[15px] font-bold text-text-primary mb-6">Busiest Days</h2>
          <div className="space-y-4">
            {MOCK_WEEK.map((d) => (
              <div key={d.day} className="flex items-center gap-4">
                <span className="w-10 text-xs font-bold text-text-muted">{d.day}</span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-primary to-orange-deep rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="w-9 text-right text-xs font-bold font-mono text-text-primary">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-[13px] border border-border p-7">
          <h2 className="text-[15px] font-bold text-text-primary mb-6">Orders by Hour</h2>
          <div className="flex items-end gap-3 h-36">
            {MOCK_HOURS.map((h) => (
              <div key={h.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-zinc-100 rounded-full overflow-hidden flex-1 flex items-end">
                  <div className="w-full bg-orange-primary rounded-full transition-all" style={{ height: `${h.pct}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-text-light whitespace-nowrap">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}