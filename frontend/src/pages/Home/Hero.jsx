import { useState, useEffect, useRef } from "react";

const stats = [
  { num: 500, suffix: "+", label: "Restaurants" },
  { num: 10000, suffix: "+", label: "Happy Customers" },
  { num: 49, suffix: "★", label: "App Rating", prefix: "", decimal: true },
  { num: 28, suffix: "min", label: "Avg. Delivery" },
];

const popularTags = ["🍔 Burger", "🍕 Pizza", "🍣 Sushi", "🌮 Tacos", "🍜 Ramen"];

const AnimatedStat = ({ stat }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const target = stat.decimal ? stat.num : stat.num;
          const duration = 1500;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.num, stat.decimal]);

  const display = stat.decimal ? (count / 10).toFixed(1) : count;

  return (
    <div className="text-center relative" ref={ref}>
      <div className="text-2xl font-extrabold">{stat.prefix || ""}{display}{stat.suffix}</div>
      <div className="text-xs text-[#9c9c9f] mt-0.5">{stat.label}</div>
    </div>
  );
};

const Hero = () => (
  <section className="bg-[#0b0b0c] text-white relative overflow-hidden" id="home">
    <div className="max-w-[1240px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] items-center gap-8 py-10 relative">
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-[rgba(255,106,43,0.12)] border border-[rgba(255,106,43,0.35)] text-[#ff6a2b] text-xs font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full mb-4 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6a2b]" />
          Delivering in your city now
        </div>

        <h1 className="text-[clamp(42px,5.4vw,68px)] leading-[1.02] font-extrabold tracking-tight mb-3.5 animate-slide-left">
          Cravings<br /><span className="text-[#ff6a2b]">Delivered.</span>
        </h1>

        <p className="text-lg leading-relaxed text-[#b8b8bb] max-w-[460px] mb-4 animate-slide-left" style={{ animationDelay: "0.15s" }}>
          Browse hundreds of restaurants, order your favorite food, and track delivery live — all powered by smart AI.
        </p>

        <div className="flex items-stretch bg-white rounded-2xl p-[5px] max-w-[580px] shadow-[0_20px_40px_rgba(0,0,0,0.35)] animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2 px-4 text-gray-900 text-sm font-semibold whitespace-nowrap cursor-pointer hover:opacity-70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6a2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            My Location
          </div>
          <div className="w-px bg-gray-200 my-2 shrink-0" />
          <div className="flex-1 flex items-center gap-2.5 px-3.5 text-[#9a9a9a] text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search restaurants or dishes...
          </div>
          <button className="w-[38px] h-[38px] rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0 mr-1" title="Filters">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </button>
          <button className="bg-gradient-to-br from-[#ff6a2b] to-[#d94a12] text-white px-5.5 py-2.5 rounded-xl font-semibold text-sm shadow-[0_3px_12px_rgba(255,106,43,0.3)] hover:from-[#f55d1f] hover:to-[#c94410] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,106,43,0.45)] transition inline-flex items-center gap-1.5">
            Search
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 mt-4 text-sm text-[#9c9c9f] animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
          Popular:
          {popularTags.map((tag) => (
            <span key={tag} className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] px-3.5 py-1.5 rounded-full text-sm text-[#e6e6e6]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-h-[420px] animate-slide-right">
        <div
          className="absolute inset-0 rounded-[20px] bg-cover bg-[65%_center] animate-float-burger"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop)",
            maskImage: "linear-gradient(to left, black 85%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 85%, transparent 100%)",
          }}
        />
      </div>
    </div>

    <div className="max-w-[1240px] mx-auto px-8 border-t border-white/10 py-5 grid grid-cols-2 md:grid-cols-4">
      {stats.map((s, i) => (
        <AnimatedStat key={s.label} stat={s} />
      ))}
    </div>
  </section>
);

export default Hero;
