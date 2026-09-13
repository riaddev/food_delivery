import { useEffect, useState } from "react";
import { publicApi } from "../../features/api/apiSlice";

// Kept verbatim — these are the original homepage reviews. They now also
// live in the DB as curated featured reviews (see HomepageReviewsSeeder)
// so admin can manage them, but they remain here as the offline fallback
// so the homepage never renders empty.
const FALLBACK_REVIEWS = [
  { quote: "The inventory management system saved us hours of manual work. Highly recommend for any restaurant in Dhaka looking to go digital.", name: "Tanvir Hasan", role: "Food Blogger Review", initials: "TH", color: "#ff6a2b", rating: 5 },
  { quote: "Fast delivery and the food was still hot. The real-time tracking feature is a game changer for busy professionals like me.", name: "Nusrat Jahan", role: "Verified Customer Review", initials: "NJ", color: "#3b82f6", rating: 5 },
  { quote: "As a restaurant partner, the analytics dashboard helped me understand what dishes perform best. Profits are up 35%!", name: "Shahidul Islam", role: "Restaurant Partner Review", initials: "SI", color: "#22c55e", rating: 5 },
  { quote: "My order arrived over an hour late and the food was completely cold. The tracking kept saying 'On the way' the whole time. Customer support was polite, but the experience was disappointing.", name: "Tasnim", role: "Verified Customer Review", initials: "TS", color: "#f43f5e", rating: 2 },
];

const FALLBACK_STATS = { avg: "4.9", count: "12,000+ reviews" };

const AVATAR_COLORS = ["#ff6a2b", "#3b82f6", "#22c55e", "#f43f5e", "#a855f7", "#eab308"];

const initialsOf = (name = "") =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

const colorFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const roleFor = (r) => {
  const dish = r.menu_item?.name;
  const rest = r.restaurant?.restaurant_name;
  if (dish && rest) return `Verified order \u2022 ${dish} @ ${rest}`;
  if (dish) return `Verified order \u2022 ${dish}`;
  if (rest) return `Verified Customer \u2022 ${rest}`;
  if (r.source === "curated") return "Featured Review";
  return "Verified Customer Review";
};

const toCard = (r) => ({
  quote: r.comment,
  name: r.user?.name || "Customer",
  role: roleFor(r),
  initials: initialsOf(r.user?.name),
  color: colorFor(r.user?.name || ""),
  rating: r.rating,
});

const stars = (rating) => (
  <span className="inline-flex gap-0.5">
    <span className="text-[#ff6a2b] tracking-[2px] text-sm">{"\u2605".repeat(rating)}</span>
    <span className="text-gray-300 tracking-[2px] text-sm">{"\u2605".repeat(5 - rating)}</span>
  </span>
);

const ReviewCard = ({ r }) => (
  <div className="w-[280px] sm:w-[340px] mr-5 shrink-0 bg-[#fafafa] rounded-[14px] p-5 text-left align-top">
    <div className="mb-3.5">{stars(r.rating)}</div>
    <p className="text-[14.5px] leading-relaxed text-[#3a3a3a] mb-5">&ldquo;{r.quote}&rdquo;</p>
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: r.color }}>{r.initials}</div>
      <div className="min-w-0">
        <div className="text-sm font-bold truncate">{r.name}</div>
        <div className="text-xs text-[#6b6b6f] truncate">{r.role}</div>
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="w-[280px] sm:w-[340px] mr-5 shrink-0 bg-[#fafafa] rounded-[14px] p-5 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
    <div className="h-3.5 bg-gray-200 rounded w-full mb-2" />
    <div className="h-3.5 bg-gray-200 rounded w-5/6 mb-5" />
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full bg-gray-200" />
      <div>
        <div className="h-3.5 bg-gray-200 rounded w-24 mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
    </div>
  </div>
);

const formatCount = (n) => (typeof n === "number" ? `${n.toLocaleString()}+ reviews` : FALLBACK_STATS.count);

const Testimonials = () => {
  const [cards, setCards] = useState(null); // null = loading
  const [stats, setStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    let active = true;
    publicApi.getFeaturedReviews(10)
      .then((res) => {
        if (!active) return;
        const list = res.data.reviews || [];
        if (list.length > 0) {
          setCards(list.map(toCard));
        } else {
          setCards(FALLBACK_REVIEWS);
        }
        if (typeof res.data.review_count === "number" && res.data.review_count > 0) {
          setStats({
            avg: res.data.avg_rating ? Number(res.data.avg_rating).toFixed(1) : FALLBACK_STATS.avg,
            count: formatCount(res.data.review_count),
          });
        }
      })
      .catch(() => {
        if (active) setCards(FALLBACK_REVIEWS);
      });
    return () => { active = false; };
  }, []);

  const list = cards || FALLBACK_REVIEWS;
  const loading = cards === null;

  return (
    <section className="bg-white py-12 text-center overflow-hidden" id="about">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
        <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#ff6a2b] mb-2.5">Real People, Real Reviews</span>
        <h2 className="text-[34px] font-extrabold mt-2 mb-2.5">Trusted by Professionals.</h2>
        <div className="flex items-center justify-center gap-2 text-[#ff6a2b] text-sm mb-8">
          <span className="tracking-[2px]">{"\u2605\u2605\u2605\u2605\u2605"}</span>
          <span>{stats.avg}</span>
          <span className="text-gray-500 font-medium">{stats.count}</span>
        </div>
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused] items-start">
            {loading
              ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
              : [...list, ...list].map((r, i) => (
                <ReviewCard key={`${r.name}-${i}`} r={r} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
