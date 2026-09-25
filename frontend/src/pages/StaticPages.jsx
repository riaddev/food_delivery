import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";

const StaticPage = ({ title, eyebrow, intro, sections = [], cta, meta }) => (
  <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-100">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0 outline-none focus:outline-none">
          <Logo
            size={32}
            variant="color"
            swiftClassName="text-[#ff6a2b]"
            biteClassName="text-zinc-900"
            textClassName="text-lg font-extrabold tracking-tight"
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/restaurants" className="hidden sm:inline text-sm font-semibold text-zinc-600 hover:text-[#ff6a2b] transition">
            Browse Food
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-black px-4 py-2 rounded-full transition"
          >
            <ArrowLeft size={14} /> Home
          </Link>
        </div>
      </div>
    </header>

    <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-12">
      {eyebrow && (
        <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#ff6a2b] mb-2.5">{eyebrow}</span>
      )}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
      {intro && <p className="text-[15px] leading-relaxed text-zinc-600 mt-3 max-w-[720px]">{intro}</p>}
      {meta && <p className="text-xs text-zinc-400 mt-3">{meta}</p>}

      <div className="grid gap-6 mt-8">
        {sections.map((s) => (
          <section key={s.heading} className="bg-white border border-zinc-100 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-zinc-600 mb-2 last:mb-0">{p}</p>
            ))}
            {s.list && (
              <ul className="mt-3 space-y-2">
                {s.list.map((li) => (
                  <li key={li} className="text-sm text-zinc-600 flex gap-2">
                    <span className="text-[#ff6a2b] shrink-0">•</span>
                    {li}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {cta && (
        <div className="mt-8 bg-zinc-900 text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold">{cta.title}</h3>
          <p className="text-sm text-zinc-400 mt-1 mb-4">{cta.sub}</p>
          <Link
            to={cta.to}
            className="inline-flex items-center gap-1.5 bg-[#ff6a2b] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#f55d1f] hover:-translate-y-0.5 transition"
          >
            {cta.label} →
          </Link>
        </div>
      )}
    </main>

    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 text-center text-xs text-zinc-500">
        © 2026 Swift Bite Technologies. All rights reserved.
      </div>
    </footer>
  </div>
);

const support = {
  eyebrow: "Help",
  title: "Support",
  intro: "We're here 24/7 for customers, restaurant partners, and riders. Most questions are answered in minutes.",
  sections: [
    {
      heading: "Frequently asked questions",
      list: [
        "Where is my order? — Open the tracking link from your order confirmation; it updates live.",
        "Can I change my order after placing it? — Yes, within 3 minutes of ordering — contact support immediately.",
        "How do refunds work? — Refunds go back to your original payment method within 3–5 business days.",
        "A restaurant is missing from the app — How do I add it? — Partners can apply from the sign-up page.",
      ],
    },
    {
      heading: "Contact us",
      body: [
        "Email support@swiftbite.com or use the chat button in the app. For urgent delivery issues, call our hotline — available 24/7.",
      ],
    },
  ],
  cta: { title: "Hungry?", sub: "Let's fix your order — or just feed you.", label: "Browse Restaurants", to: "/restaurants" },
};

const privacy = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  intro: "This policy explains what information Swift Bite collects, why we collect it, and how you stay in control.",
  meta: "Last updated: August 2026",
  sections: [
    {
      heading: "Information we collect",
      body: [
        "We collect the information you give us — name, email, phone, delivery addresses, and payment details — plus order history and app usage data needed to deliver your food and improve the service.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "Your data powers your orders, live tracking, payments, and personalized recommendations. We never sell your personal information.",
      ],
    },
    {
      heading: "Sharing",
      body: [
        "Restaurants see only what they need to prepare your order; riders see only what they need to deliver it. Payment details are processed by trusted payment providers.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "You can request a copy of your data, correct it, or ask us to delete your account at any time from Support.",
      ],
    },
  ],
};

const terms = {
  eyebrow: "Legal",
  title: "Terms of Service",
  intro: "These terms govern your use of the Swift Bite platform — as a customer, restaurant partner, or rider.",
  meta: "Last updated: August 2026",
  sections: [
    {
      heading: "Using the service",
      body: [
        "You must be at least 13 years old to use Swift Bite, and orders placed on your account are your responsibility. You agree to provide accurate delivery details.",
      ],
    },
    {
      heading: "Orders & payments",
      body: [
        "An order is accepted when the restaurant confirms it. Prices are set by restaurants and shown before checkout. If an item is unavailable, we'll refund or substitute with your approval.",
      ],
    },
    {
      heading: "Restaurant partners",
      body: [
        "Partners commit to accurate menus, availability, and food safety. Swift Bite may suspend accounts that repeatedly fail delivery commitments.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "Swift Bite is a platform connecting customers, restaurants, and riders. We work to resolve every issue fairly but are not the seller of the food itself.",
      ],
    },
  ],
};

const cookies = {
  eyebrow: "Legal",
  title: "Cookie Policy",
  intro: "Cookies help Swift Bite remember your cart, keep you signed in, and make the app faster for everyone.",
  meta: "Last updated: August 2026",
  sections: [
    {
      heading: "What we use cookies for",
      list: [
        "Essential: sign-in sessions, cart contents, and order status.",
        "Performance: page speed and error monitoring.",
        "Preferences: delivery area and language settings.",
      ],
    },
    {
      heading: "Managing cookies",
      body: [
        "You can block cookies in your browser settings, but some features — like keeping you signed in — may stop working. We do not use third-party advertising cookies.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Questions about this policy? Email support@swiftbite.com.",
      ],
    },
  ],
};

export const SupportPage = () => <StaticPage {...support} />;
export const PrivacyPage = () => <StaticPage {...privacy} />;
export const TermsPage = () => <StaticPage {...terms} />;
export const CookiesPage = () => <StaticPage {...cookies} />;