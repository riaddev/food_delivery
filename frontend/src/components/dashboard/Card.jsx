import { TrendingDown, TrendingUp } from "lucide-react";

export function KpiCard({ label, value, change, up = true, mono = true }) {
  return (
    <div className="bg-card rounded-[13px] border border-border px-5 py-[18px]">
      <div className="text-[13px] text-text-light font-semibold uppercase tracking-[0.04em] mb-2.5">
        {label}
      </div>
      <div
        className={`text-[26px] font-bold text-text-primary tracking-[-0.5px] leading-none ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
      {change && (
        <div
          className={`text-[13px] font-semibold mt-1.5 flex items-center gap-1 ${
            up ? "text-success" : "text-danger"
          }`}
        >
          {up ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
          {change}
        </div>
      )}
    </div>
  );
}

export function HeroCard({ label, value, change, up = true }) {
  return (
    <div className="rounded-[13px] px-6 py-[22px] relative overflow-hidden" style={{ background: "#0F1117" }}>
      <div className="absolute -right-6 -bottom-6 w-[130px] h-[130px] rounded-full bg-orange-primary/15 pointer-events-none" />
      <div className="text-[12px] text-[#4B5563] font-semibold uppercase tracking-[0.06em] mb-3">
        {label}
      </div>
      <div className="text-[32px] font-extrabold text-white tracking-[-1px] font-mono leading-none">
        {value}
      </div>
      {change && (
        <div className="flex items-center gap-1.5 mt-2.5 text-[13px] font-semibold text-[#4ADE80]">
          {up ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
          {change}
        </div>
      )}
    </div>
  );
}

export function Card({ children, className = "", pad = "22px 24px" }) {
  return (
    <div className={`bg-card rounded-[13px] border border-border ${className}`} style={{ padding: pad }}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="text-[15px] font-bold text-text-primary">{title}</div>
        {subtitle && <div className="text-[13px] text-text-muted mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function PillBadge({ children, tone = "zinc" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    orange: "bg-orange-soft text-orange-deep",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-semibold whitespace-nowrap ${tones[tone] || tones.zinc}`}
    >
      {children}
    </span>
  );
}

export function DotStatus({ label, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold whitespace-nowrap" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

export function EmptyState({ message = "No data yet" }) {
  return (
    <div className="text-center py-8 text-text-light text-[14px]">{message}</div>
  );
}

export function Skeleton({ className = "h-24" }) {
  return <div className={`rounded-lg bg-zinc-100 animate-pulse ${className}`} />;
}
