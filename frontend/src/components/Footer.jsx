const columns = [
  { title: "Company", links: ["About", "Careers", "Press", "Blog"] },
  { title: "Customers", links: ["Browse Restaurants", "Track Order", "Promotions", "Gift Cards"] },
  { title: "Restaurants", links: ["Partner Portal", "Dashboard", "Analytics", "Support"] },
  { title: "Riders", links: ["Become a Rider", "Rider App", "Earnings", "Community"] },
];

const Footer = () => (
  <footer className="bg-[#0b0b0c] text-white pt-9">
    <div className="max-w-[1240px] mx-auto px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pb-9">
        <div className="col-span-2 md:col-span-1">
          <a href="/" className="flex items-center gap-2 font-extrabold text-xl text-[#ff6b35]">
            <span className="w-[34px] h-[34px] rounded-lg bg-[#ff6a2b] flex items-center justify-center text-base">🍔</span>
            Swift<span className="text-white">Bite</span>
          </a>
          <p className="text-[#a3a3a6] text-sm leading-relaxed mt-2.5 mb-3.5 max-w-[260px]">
            Smart food delivery connecting customers, restaurants, and riders — powered by AI.
          </p>
          <div className="flex gap-2.5">
            {["𝕏", "in", "f", "▶"].map((s, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-xs hover:bg-white/20">{s}</a>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11.5px] tracking-widest uppercase text-[#8b8b8e] mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-[#d4d4d6] text-sm hover:text-white">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 flex flex-wrap justify-between gap-2.5 text-xs text-[#8b8b8e]">
        <span>© 2026 SwiftBite Technologies. All rights reserved.</span>
        <div className="flex gap-5">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
            <a key={t} href="#" className="hover:text-white">{t}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
