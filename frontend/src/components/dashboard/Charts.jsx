import { useRef, useState } from "react";

const ORANGE = "#F97316";

export function DonutChart({ segments = [], size = 120, thickness = 14, center, sub }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const offset = C * (1 - segments.slice(0, i).reduce((sum, x) => sum + x.value, 0) / total) + C / 4;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${C * frac} ${C}`}
              strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}
            />
          );
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[20px] font-extrabold text-text-primary font-mono leading-none">{center}</div>
          {sub && <div className="text-[10px] text-text-light font-semibold tracking-[0.06em] mt-1">{sub}</div>}
        </div>
      )}
    </div>
  );
}

export function Legend({ items = [] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-[14px] text-text-muted flex-1">{item.label}</span>
          <span className="text-[14px] font-bold text-text-primary font-mono">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BarChart({ data = [], labels = [], activeIndex, height = 94, max }) {
  const maxVal = max ?? Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((val, i) => {
        const active = i === activeIndex;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full relative flex-1 flex items-end">
              <div className="absolute inset-0 bg-[#F9FAFB] rounded-t-[5px]" />
              <div
                className="relative w-full rounded-t-[5px] bar-anim"
                style={{
                  height: `${(val / maxVal) * (height - 26)}px`,
                  background: active ? ORANGE : "#FBD5B5",
                }}
              />
            </div>
            <span className={`text-[11px] ${active ? "text-orange-primary font-bold" : "text-text-light"}`}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({ data = [], labels = [], height = 140, width = 460, yFormatter }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  const pad = 8;
  const innerW = width - pad * 2;
  const innerH = height - 34;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((val, i) => ({
    x: pad + stepX * i,
    y: innerH - ((val - minVal) / range) * innerH + 4,
    val,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1]?.x ?? pad},${innerH + 6} L${points[0]?.x ?? pad},${innerH + 6} Z`;

  const onMove = (e) => {
    if (data.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const idx = Math.min(Math.round(frac * (data.length - 1)), data.length - 1);
    setHover(idx);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={width - pad}
            y1={innerH * f + 4}
            y2={innerH * f + 4}
            stroke="#F3F4F6"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={ORANGE} opacity="0.08" />
        <path d={line} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3}
            fill="#fff"
            stroke={ORANGE}
            strokeWidth="2"
            style={{ transition: "r 0.12s ease" }}
          />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="absolute top-0 -translate-x-1/2 bg-[#0F1117] text-white text-[12px] font-semibold px-2.5 py-1 rounded-md pointer-events-none whitespace-nowrap z-10"
          style={{
            left: `${data.length > 1 ? (hover / (data.length - 1)) * 100 : 50}%`,
            marginTop: 4,
          }}
        >
          {labels[hover]}: {yFormatter ? yFormatter(points[hover].val) : points[hover].val}
        </div>
      )}
      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-text-light">{labels[0]}</span>
        <span className="text-[11px] text-text-light">{labels[Math.floor(labels.length / 2)]}</span>
        <span className="text-[11px] text-text-light">{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}
