import { Link } from "react-router-dom";

const foodIcons = ["🍔", "🍕", "🍣", "🌮", "🍜", "🥗", "🍰", "🥤", "🍗", "🍝"];

const CTABanner = () => (
  <section className="bg-[#ff6a2b] text-white py-11 text-center relative overflow-hidden">
    <div className="absolute w-[260px] h-[260px] rounded-full bg-white/8 -top-[120px] -right-[60px]" />
    <div className="absolute w-[180px] h-[180px] rounded-full bg-black/8 -bottom-[100px] -left-[40px]" />
    <div className="absolute inset-0 pointer-events-none z-0">
      {foodIcons.map((icon, i) => (
        <span
          key={i}
          className="absolute animate-float-cta opacity-25"
          style={{
            left: `${5 + (i * 9.5) % 90}%`,
            top: `${10 + (i * 13 + 7) % 75}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + (i % 3)}s`,
            fontSize: `${20 + (i % 4) * 4}px`,
          }}
        >{icon}</span>
      ))}
    </div>
    <div className="max-w-[1240px] mx-auto px-8 relative z-10">
      <h2 className="text-[34px] font-extrabold mb-3">Your first delivery is on us.</h2>
      <p className="text-[15.5px] text-white/90 max-w-[480px] mx-auto mb-5">
        Sign up today and get free delivery on your first 3 orders. No promo code needed.
      </p>
      <div className="flex gap-2.5 justify-center">
        <Link to="/register" className="inline-flex items-center gap-1.5 bg-white text-[#e6551a] px-5.5 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition">Create Free Account →</Link>
        <Link to="/restaurants" className="inline-flex items-center gap-1.5 bg-transparent border border-white/70 text-white px-5.5 py-3 rounded-full font-semibold text-sm hover:bg-white/12 transition">Browse Restaurants</Link>
      </div>
    </div>
  </section>
);

export default CTABanner;
