import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    id: "biryani",
    label: "Biryani",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=800&auto=format&fit=crop",
    featured: true,
  },
  { id: "pizza", label: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop" },
  { id: "burgers", label: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop" },
  { id: "kabab", label: "Kabab", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop" },
  { id: "desserts", label: "Desserts", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400&auto=format&fit=crop" },
];

const PopularCategories = () => (
  <section className="bg-[#fafafa] pt-8 pb-4">
    <div className="max-w-[1240px] mx-auto px-8">
      <div className="flex items-center justify-between mb-9">
        <h2 className="text-[32px] font-extrabold tracking-tight m-0">Popular Categories</h2>
        <Link to="/restaurants" className="text-sm font-medium text-[#F97316] hover:text-[#EA580C] transition whitespace-nowrap">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px] md:auto-rows-[200px]">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/restaurants?category=${c.id}`}
            aria-label={`Browse ${c.label}`}
            className={`group relative rounded-3xl overflow-hidden ${c.featured ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${c.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <span className="text-white text-xl font-bold drop-shadow-lg">{c.label}</span>
              <span className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
                Explore
                <ArrowRight size={14} strokeWidth={2.2} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default PopularCategories;
