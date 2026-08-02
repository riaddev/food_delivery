import { Link } from "react-router-dom";

const features = [
  { icon: "✨", bg: "bg-[#ffe3d3]", title: "AI-Powered Just for You",
    desc: "Our recommendation engine learns your taste and suggests dishes you'll actually love — not just the sponsored ones." },
  { icon: "📍", bg: "bg-[#dbeafe]", title: "Track Your Rider Live",
    desc: "Watch your delivery on a real-time map. No more guessing — you know exactly when to open the door." },
  { icon: "🛡️", bg: "bg-[#d8f5e3]", title: "Secure & Reliable",
    desc: "End-to-end encrypted payments, role-based access, and a support chatbot available 24/7 — your order is in safe hands." },
];

const WhyUs = () => (
  <section className="bg-[#f6f2ec] py-7 md:py-12" id="how-it-works">
    <div className="max-w-[1240px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div className="relative">
        <div className="w-full aspect-[1/0.82] rounded-[20px] bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=900&auto=format&fit=crop)" }} />
        <div className="absolute top-4 right-4 bg-[#0b0b0c] text-white rounded-xl px-3.5 py-2 text-sm font-bold flex items-center gap-1.5">
          ★ 4.9 / 5
          <small className="block font-medium text-[#b7b7b7] text-[10.5px]">12K+ reviews</small>
        </div>
        <div className="absolute bottom-4 left-4 bg-white rounded-xl px-4 py-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#ff6a2b] flex items-center justify-center text-white text-sm">📦</div>
          <div>
            <b className="block text-sm">12,400+</b>
            <span className="text-[11px] text-gray-500">Orders this week</span>
          </div>
        </div>
      </div>

      <div>
        <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#ff6a2b] mb-2.5">Why SwiftBite</span>
        <h2 className="text-4xl font-extrabold leading-tight tracking-tight mb-3">
          Not just another <span className="text-[#ff6a2b]">delivery app.</span>
        </h2>
        <p className="text-[15.5px] leading-relaxed text-gray-500 mb-6 max-w-[480px]">
          SwiftBite is a full ecosystem — smart enough to know what you want before you do, fast enough to get it to you while it's still hot.
        </p>

        {features.map((f) => (
          <div key={f.title} className="flex gap-3.5 mb-4">
            <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg shrink-0 ${f.bg}`}>{f.icon}</div>
            <div>
              <div className="font-bold text-[15px] mb-0.5">{f.title}</div>
              <div className="text-sm text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          </div>
        ))}

        <Link to="/restaurants" className="inline-flex items-center gap-1.5 bg-[#0b0b0c] text-white px-5.5 py-3 rounded-full font-semibold text-sm hover:bg-black hover:-translate-y-0.5 transition">
          Start ordering now →
        </Link>
      </div>
    </div>
  </section>
);

export default WhyUs;
