const reviews = [
  { quote: "The inventory management system saved us hours of manual work. Highly recommend for any restaurant in Dhaka looking to go digital.", name: "Tanvir Hasan", role: "Food Blogger Review", initials: "TH", color: "#ff6a2b", rating: 5 },
  { quote: "Fast delivery and the food was still hot. The real-time tracking feature is a game changer for busy professionals like me.", name: "Nusrat Jahan", role: "Verified Customer Review", initials: "NJ", color: "#3b82f6", rating: 5 },
  { quote: "As a restaurant partner, the analytics dashboard helped me understand what dishes perform best. Profits are up 35%!", name: "Shahidul Islam", role: "Restaurant Partner Review", initials: "SI", color: "#22c55e", rating: 5 },
  { quote: "My order arrived over an hour late and the food was completely cold. The tracking kept saying 'On the way' the whole time. Customer support was polite, but the experience was disappointing.", name: "Tasnim", role: "Verified Customer Review", initials: "TS", color: "#f43f5e", rating: 2 },
];

const stars = (rating) => (
  <span className="inline-flex gap-0.5">
    <span className="text-[#ff6a2b] tracking-[2px] text-sm">{"★".repeat(rating)}</span>
    <span className="text-gray-300 tracking-[2px] text-sm">{"★".repeat(5 - rating)}</span>
  </span>
);

const ReviewCard = ({ r }) => (
  <div className="w-[280px] sm:w-[340px] mr-5 shrink-0 bg-[#fafafa] rounded-[14px] p-5 text-left align-top">
    <div className="mb-3.5">{stars(r.rating)}</div>
    <p className="text-[14.5px] leading-relaxed text-[#3a3a3a] mb-5">&ldquo;{r.quote}&rdquo;</p>
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: r.color }}>{r.initials}</div>
      <div>
        <div className="text-sm font-bold">{r.name}</div>
        <div className="text-xs text-[#6b6b6f]">{r.role}</div>
      </div>
    </div>
  </div>
);

const Testimonials = () => (
  <section className="bg-white py-12 text-center overflow-hidden" id="about">
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8">
      <span className="inline-block text-xs font-bold tracking-widest uppercase text-[#ff6a2b] mb-2.5">Real People, Real Reviews</span>
      <h2 className="text-[34px] font-extrabold mt-2 mb-2.5">Trusted by Professionals.</h2>
      <div className="flex items-center justify-center gap-2 text-[#ff6a2b] text-sm mb-8">
        <span className="tracking-[2px]">★★★★★</span>
        <span>4.9</span>
        <span className="text-gray-500 font-medium">12,000+ reviews</span>
      </div>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] items-start">
          {[...reviews, ...reviews].map((r, i) => (
            <ReviewCard key={`${r.name}-${i}`} r={r} />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Testimonials;