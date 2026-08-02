import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Star, Clock, MapPin, Truck, Heart, UtensilsCrossed } from "lucide-react";
import api from "../../features/api/apiSlice";
import { formatPrice, restaurantImage } from "../../utils/foodImages";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "fastest", label: "Fastest Delivery" },
  { id: "rating", label: "Rating 4.0+" },
  { id: "free", label: "Free Delivery" },
  { id: "offers", label: "Offers" },
];

const MOCK_RESTAURANTS = [
  { id: 901, restaurant_name: "Ember Burger Co.", cuisine_type: "Burgers • American", city: "Dhaka" },
  { id: 902, restaurant_name: "Pizzeria Roma", cuisine_type: "Pizza • Italian", city: "Dhaka" },
  { id: 903, restaurant_name: "Haji Biryani House", cuisine_type: "Bangladeshi", city: "Dhaka" },
  { id: 904, restaurant_name: "Green Leaf Kitchen", cuisine_type: "Salads • Healthy", city: "Dhaka" },
  { id: 905, restaurant_name: "Sweet Corner Bakery", cuisine_type: "Desserts • Bakery", city: "Dhaka" },
  { id: 906, restaurant_name: "Wok & Roll Express", cuisine_type: "Chinese • Fast Food", city: "Dhaka" },
];

const hash = (n) => {
  const x = ((n * 9301) + 49297 * 2) % 233280;
  return x;
};

const enrich = (r, idx) => {
  const seed = Number.isFinite(r.id) ? Math.abs(r.id) : idx + 1;
  const h = hash(seed * 31);
  const rating = Math.round((3.8 + (h % 13) / 10) * 10) / 10;
  const eta = 15 + (h % 21);
  const distance = Math.round((0.5 + (h % 28) / 10) * 10) / 10;
  const fee = h % 2 === 0 ? 60 : 0;
  const offers = h % 3 === 0;
  return { ...r, rating, eta, distance, fee, free: fee === 0, offers };
};

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [favs, setFavs] = useState(() => new Set());

  useEffect(() => {
    api.get("/restaurants")
      .then((res) => {
        const list = res.data.restaurants || [];
        if (list.length === 0) setFailed(true);
        setRestaurants(list);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const source = failed || restaurants.length === 0 ? MOCK_RESTAURANTS : restaurants;

  const restaurantsRich = useMemo(() => source.map((r, i) => enrich(r, i)), [source]);

  const results = useMemo(() => {
    let list = restaurantsRich.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchName = !q || (r.restaurant_name || "").toLowerCase().includes(q);
      const matchCuisine = !q || (r.cuisine_type || "").toLowerCase().includes(q);
      if (!matchName && !matchCuisine) return false;
      if (filter === "rating" && r.rating < 4.0) return false;
      if (filter === "free" && !r.free) return false;
      if (filter === "offers" && !r.offers) return false;
      return true;
    });
    if (filter === "fastest") list = [...list].sort((a, b) => a.eta - b.eta);
    return list;
  }, [restaurantsRich, search, filter]);

  const toggleFav = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sticky header & search */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants or dishes"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-300 outline-none text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2.5 py-3.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-100 overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="aspect-[16/10] bg-zinc-100" />
                <div className="p-4">
                  <div className="h-5 bg-zinc-100 rounded w-1/2 mb-2.5" />
                  <div className="h-4 bg-zinc-100 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
              <UtensilsCrossed size={22} />
            </div>
            <p className="text-base font-semibold tracking-tight text-zinc-900 mb-1">No restaurants found in this area</p>
            <p className="text-sm text-zinc-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-5">
              {results.length} {results.length === 1 ? "restaurant" : "restaurants"} near you
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-12">
              {results.map((r) => {
                const isFav = favs.has(r.id);
                return (
                  <Link
                    key={r.id}
                    to={`/restaurants/${r.id}`}
                    className="group bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] hover:bg-zinc-50 transition-all"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={restaurantImage(r.restaurant_name)}
                        alt={r.restaurant_name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      {r.free && (
                        <span className="absolute top-3 left-3 bg-green-500/90 text-white text-xs font-medium px-2 py-1 rounded-md">
                          Free Delivery
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => toggleFav(e, r.id)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors ${
                          isFav ? "text-[#E03546]" : "text-zinc-500 hover:text-[#E03546]"
                        }`}
                        aria-label="Save restaurant"
                      >
                        <Heart size={15} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold tracking-tight text-zinc-900 truncate">
                          {r.restaurant_name}
                        </h3>
                        <span className="shrink-0 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">
                          <Star size={11} fill="currentColor" strokeWidth={0} /> {r.rating.toFixed(1)}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-500 mt-1 truncate">
                        {r.cuisine_type || "Restaurant"}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {r.eta}-{r.eta + 5} mins
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} /> {r.distance.toFixed(1)} km
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Truck size={12} /> {r.free ? "Free Delivery" : `${formatPrice(r.fee)} Delivery`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}