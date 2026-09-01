import { Link } from "react-router-dom";
import Logo from "./Logo";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Customers",
    links: [
      { label: "Browse Restaurants", to: "/restaurants" },
      { label: "Track Order", to: "/customer/dashboard?order=1" },
      { label: "Promotions", to: "/restaurants?filter=offers" },
      { label: "Gift Cards", to: "/gift-cards" },
    ],
  },
  {
    title: "Restaurants",
    links: [
      { label: "Partner Portal", to: "/signup/restaurant" },
      { label: "Dashboard", to: "/restaurant/dashboard" },
      { label: "Analytics", to: "/restaurant/dashboard/analytics" },
      { label: "Support", to: "/support" },
    ],
  },
  {
    title: "Riders",
    links: [
      { label: "Become a Rider", to: "/signup/rider" },
      { label: "Rider App", to: "/rider-app" },
      { label: "Rider Dashboard", to: "/rider/dashboard" },
      { label: "Earnings", to: "/earnings" },
      { label: "Community", to: "/community" },
    ],
  },
];

const Footer = () => (
  <footer className="bg-[#0b0b0c] text-white pt-9">
    <div className="max-w-[1240px] mx-auto px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 pb-9">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo
              size={34}
              variant="color"
              swiftClassName="text-[#ff6b35]"
              biteClassName="text-white"
              textClassName="text-xl font-extrabold tracking-tight"
            />
          </Link>
          <p className="text-[#a3a3a6] text-sm leading-relaxed mt-2.5 mb-3.5 max-w-[260px]">
            Smart food delivery connecting customers, restaurants, and riders — powered by AI.
          </p>
          <div className="flex gap-2.5">
            {["𝕏", "in", "f", "▶"].map((s, i) => (
              <span key={i} className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-xs cursor-default">{s}</span>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-[11.5px] tracking-widest uppercase text-[#8b8b8e] mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-[#d4d4d6] text-sm hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 flex flex-wrap justify-between gap-2.5 text-xs text-[#8b8b8e]">
        <span>© 2026 Swift Bite Technologies. All rights reserved.</span>
        <div className="flex gap-5">
          <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white">Terms of Service</Link>
          <Link to="/cookies" className="hover:text-white">Cookie Policy</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;