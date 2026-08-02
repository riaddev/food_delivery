const cuisines = [
  { icon: "🍔", label: "American" }, { icon: "🍝", label: "Italian" }, { icon: "🍱", label: "Japanese" },
  { icon: "🌮", label: "Mexican" }, { icon: "🥟", label: "Chinese" }, { icon: "🍛", label: "Indian" },
  { icon: "🥗", label: "Healthy" }, { icon: "🍗", label: "Chicken" }, { icon: "🍖", label: "BBQ" },
  { icon: "🍰", label: "Desserts" }, { icon: "🥤", label: "Drinks" },
];

const CuisineStrip = () => (
  <section className="bg-[#fafafa] py-5.5 text-center">
    <div className="max-w-[1240px] mx-auto px-8">
      <div className="text-xs font-bold tracking-widest uppercase text-[#a3a3a3] mb-3.5">Serving all your favourite cuisines</div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {cuisines.map((c) => (
          <span key={c.label} className="inline-flex items-center gap-[7px] bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-[#383838]">
            <span>{c.icon}</span>
            {c.label}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default CuisineStrip;
