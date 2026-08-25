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

const about = {
  eyebrow: "Our Story",
  title: "About Swift Bite",
  intro:
    "Swift Bite is a food delivery platform built for Dhaka — connecting hungry customers, local restaurants, and riders on a single smart platform.",
  sections: [
    {
      heading: "Who we are",
      body: [
        "Swift Bite started with a simple frustration: ordering food in the city meant juggling phone calls, paper menus, and hour-long waits. We set out to fix that with a platform that is fast, transparent, and built for how Bangladesh actually eats.",
      ],
    },
    {
      heading: "What we do",
      body: [
        "We partner with hundreds of local restaurants — from kacchi houses to late-night burger joints — and bring their full menus online. Customers browse, pay securely (cash, bKash, Nagad, or card), and track every order live from the kitchen to their door.",
      ],
    },
    {
      heading: "Our values",
      list: [
        "Local first — we champion neighborhood restaurants, not just big chains.",
        "Radical transparency — live tracking, honest reviews, real ratings.",
        "Speed with care — hot food, cold drinks, and riders who treat every order like their own.",
      ],
    },
  ],
  cta: { title: "Taste the difference", sub: "Order from hundreds of restaurants across Dhaka.", label: "Start Ordering", to: "/restaurants" },
};

const careers = {
  eyebrow: "Join Us",
  title: "Careers at Swift Bite",
  intro: "We're a small, fast-moving team shipping a product millions of people will use. If you like ownership, speed, and good food, we want to meet you.",
  sections: [
    {
      heading: "Why work with us",
      list: [
        "Own real problems end to end — no red tape.",
        "Work across engineering, operations, and design.",
        "Free lunch from our partner restaurants, obviously.",
      ],
    },
    {
      heading: "Open roles",
      list: [
        "Senior Full-Stack Engineer — Dhaka (hybrid)",
        "Product Designer — Dhaka (hybrid)",
        "Restaurant Operations Lead — Dhaka (on-site)",
        "Community & Rider Manager — Dhaka (on-site)",
      ],
    },
    {
      heading: "Hiring process",
      body: [
        "Apply with a short email, complete a take-home task, then meet the team over two rounds. We aim to respond within five working days.",
      ],
    },
  ],
  cta: { title: "Don't see your role?", sub: "Send us a note and we'll keep you in mind for future openings.", label: "Contact Support", to: "/support" },
};

const press = {
  eyebrow: "Media",
  title: "Press & Media",
  intro: "News, announcements, and resources for journalists covering Swift Bite.",
  sections: [
    {
      heading: "Recent announcements",
      list: [
        "Aug 2026 — Swift Bite launches live order tracking across all partner restaurants.",
        "Jun 2026 — New rider app with earnings dashboard ships to 400+ riders in Dhaka.",
        "Apr 2026 — Swift Bite crosses 1,000 partner restaurants and 12,000 weekly orders.",
      ],
    },
    {
      heading: "Media kit",
      body: [
        "For logos, brand assets, and interview requests, contact our press desk. We respond to media inquiries within one business day.",
      ],
    },
  ],
  cta: { title: "Want to partner with us?", sub: "Learn more about who we are and what we build.", label: "Read Our Story", to: "/about" },
};

const blog = {
  eyebrow: "Blog",
  title: "The Swift Bite Blog",
  intro: "Stories from the kitchen, the road, and the office.",
  sections: [
    {
      heading: "Latest posts",
      list: [
        "Behind the scenes: how our riders beat Dhaka traffic (Aug 2026)",
        "5 restaurants in Old Dhaka serving legendary kacchi (Jul 2026)",
        "What 12,000 weekly orders taught us about delivery (Jun 2026)",
        "A day in the life of a Swift Bite rider (May 2026)",
      ],
    },
    {
      heading: "Write for us",
      body: [
        "We feature guest posts from restaurant owners, riders, and food writers. Pitch us a story about Dhaka's food scene.",
      ],
    },
  ],
  cta: { title: "Get the full story", sub: "Learn how Swift Bite became Dhaka's favorite delivery app.", label: "Read Our Story", to: "/about" },
};

const giftCards = {
  eyebrow: "Gifts",
  title: "Gift Cards",
  intro: "Give the gift of great food. Swift Bite gift cards work on any restaurant in the app — no expiry, no hassle.",
  sections: [
    {
      heading: "How it works",
      list: [
        "Pick an amount — from 200 to 5,000 taka.",
        "Choose delivery by email or as a printable code.",
        "The recipient redeems it at checkout on any order.",
      ],
    },
    {
      heading: "Good to know",
      list: [
        "Gift cards never expire.",
        "Balances are tracked in the customer account.",
        "Cards can be used with cash or split across multiple orders.",
      ],
    },
  ],
  cta: { title: "Hungry for more?", sub: "Browse restaurants and treat someone today.", label: "Browse Restaurants", to: "/restaurants" },
};

const becomeRider = {
  eyebrow: "Riders",
  title: "Become a Rider",
  intro: "Earn on your own schedule with transparent payouts, live order routing, and a team that actually answers when you call.",
  sections: [
    {
      heading: "Why ride with Swift Bite",
      list: [
        "Earn per delivery plus peak-hour bonuses.",
        "Flexible hours — dash when you want.",
        "Weekly payouts straight to your bKash or bank account.",
        "In-app map routing built for Dhaka's roads.",
      ],
    },
    {
      heading: "Requirements",
      list: [
        "You own (or can rent) a motorcycle with valid papers.",
        "A smartphone with an internet connection.",
        "You know Dhaka's roads — or you're ready to learn fast.",
      ],
    },
    {
      heading: "Getting started",
      body: [
        "Apply in the rider app, complete a quick orientation and document check, and you can start accepting deliveries within a week.",
      ],
    },
  ],
  cta: { title: "Ready to ride?", sub: "Apply today — your account goes live after admin approval.", label: "Apply as a Rider", to: "/signup/rider" },
};

const riderApp = {
  eyebrow: "Riders",
  title: "Rider App",
  intro: "Everything a rider needs — order pickup, live navigation, and your earnings — in one app built for Dhaka.",
  sections: [
    {
      heading: "Features",
      list: [
        "Smart dispatch with batched orders on busy routes.",
        "Turn-by-turn navigation tuned for motorcycles.",
        "Instant earnings dashboard with weekly summaries.",
        "One-tap support chat and issue reporting.",
      ],
    },
    {
      heading: "Availability",
      body: [
        "The rider app is available for Android. Riders are onboarded by our operations team in Dhaka.",
      ],
    },
  ],
  cta: { title: "Get on the road", sub: "Apply to become a Swift Bite rider today.", label: "Apply as a Rider", to: "/signup/rider" },
};

const earnings = {
  eyebrow: "Riders",
  title: "Rider Earnings",
  intro: "Transparent pay — know exactly what you'll earn before you accept a delivery.",
  sections: [
    {
      heading: "How you earn",
      list: [
        "Base fee per delivery, shown upfront before you accept.",
        "Peak-hour multipliers during lunch, dinner, and rainy days.",
        "Distance top-ups for longer routes.",
        "Weekly bonuses for completing 40+ deliveries.",
      ],
    },
    {
      heading: "Payouts",
      list: [
        "Payouts are processed every Sunday.",
        "Withdraw to bKash, Nagad, or any local bank.",
        "Every trip's earnings are itemized in your dashboard.",
      ],
    },
  ],
  cta: { title: "Start earning today", sub: "Join hundreds of riders across Dhaka.", label: "Apply as a Rider", to: "/signup/rider" },
};

const community = {
  eyebrow: "Riders",
  title: "Rider Community",
  intro: "12,000+ weekly orders move through our network — and the riders who deliver them are the heart of it.",
  sections: [
    {
      heading: "What the community offers",
      list: [
        "Monthly meetups in Dhaka with food, prizes, and workshops.",
        "A private group for route tips and road updates.",
        "Rider of the Month recognition and bonuses.",
        "Direct line to our operations team for feedback.",
      ],
    },
    {
      heading: "Join in",
      body: [
        "Every active rider is automatically part of the community. New riders get a welcome kit and a mentor from day one.",
      ],
    },
  ],
  cta: { title: "Become part of the family", sub: "Ride with Swift Bite and join the community.", label: "Apply as a Rider", to: "/signup/rider" },
};

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

export const AboutPage = () => <StaticPage {...about} />;
export const CareersPage = () => <StaticPage {...careers} />;
export const PressPage = () => <StaticPage {...press} />;
export const BlogPage = () => <StaticPage {...blog} />;
export const GiftCardsPage = () => <StaticPage {...giftCards} />;
export const BecomeRiderPage = () => <StaticPage {...becomeRider} />;
export const RiderAppPage = () => <StaticPage {...riderApp} />;
export const EarningsPage = () => <StaticPage {...earnings} />;
export const CommunityPage = () => <StaticPage {...community} />;
export const SupportPage = () => <StaticPage {...support} />;
export const PrivacyPage = () => <StaticPage {...privacy} />;
export const TermsPage = () => <StaticPage {...terms} />;
export const CookiesPage = () => <StaticPage {...cookies} />;