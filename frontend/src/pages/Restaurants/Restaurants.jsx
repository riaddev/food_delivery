import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Search, SearchX, LayoutGrid, ChevronDown, WifiOff,
  Bike, ShoppingBag, Utensils, ShoppingCart,
} from "lucide-react";
import api from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../features/auth/AuthContext";
import FoodCard from "../../components/FoodCard";
import { formatPrice } from "../../utils/foodImages";

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Rating" },
  { id: "eta", label: "Delivery Time" },
  { id: "fee", label: "Delivery Fee" },
];

const MODES = [
  { id: "delivery", label: "Delivery", icon: Bike },
  { id: "pickup", label: "Takeout", icon: ShoppingBag },
  { id: "dine_in", label: "Dine-in", icon: Utensils },
];

const FILTERS_BY_MODE = {
  delivery: [
    { id: "all", label: "All" },
    { id: "fastest", label: "Fastest Delivery" },
    { id: "rating", label: "Rating 4.0+" },
    { id: "offers", label: "Offers" },
  ],
  pickup: [
    { id: "all", label: "All" },
    { id: "ready", label: "Ready in 15 mins" },
    { id: "rating", label: "Rating 4.0+" },
  ],
  dine_in: [
    { id: "all", label: "All" },
    { id: "top", label: "Top Rated" },
    { id: "tables", label: "Available Tables" },
  ],
};

const CATEGORIES = [
  { id: "all", label: "All", keyword: null, heading: "All Dishes" },
  { id: "biryani", label: "Biryani", keyword: "biryani", heading: "Biryani Dishes", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=200&auto=format&fit=crop" },
  { id: "pizza", label: "Pizza", keyword: "pizza", heading: "Pizza Dishes", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop" },
  { id: "burgers", label: "Burgers", keyword: "burger", heading: "Burger Dishes", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop" },
  { id: "kabab", label: "Kabab", keyword: "kabab", heading: "Kabab Dishes", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=200&auto=format&fit=crop" },
  { id: "fastfood", label: "Fast Food", keyword: "fast food", heading: "Fast Food Dishes", image: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=200&auto=format&fit=crop" },
  { id: "desserts", label: "Desserts", keyword: "dessert", heading: "Dessert Dishes", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=200&auto=format&fit=crop" },
];

const MOCK_RESTAURANTS = [
  { id: 901, restaurant_name: "Ember Burger Co.", cuisine_type: "Burgers • American", city: "Dhaka", accepts_dine_in: true, menu_items: [
    { id: 9101, name: "Classic Cheeseburger", price: 450, category: "Burgers", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop" },
    { id: 9102, name: "Double Smokehouse Burger", price: 620, category: "Burgers", image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop" },
    { id: 9103, name: "Loaded Cheese Fries", price: 190, category: "Burgers", image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop" },
  ] },
  { id: 902, restaurant_name: "Pizzeria Roma", cuisine_type: "Pizza • Italian", city: "Dhaka", accepts_dine_in: true, menu_items: [
    { id: 9201, name: "Pepperoni Pizza", price: 550, category: "Pizza", image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop" },
    { id: 9202, name: "Margherita Pizza", price: 450, category: "Pizza", image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=400&auto=format&fit=crop" },
  ] },
  { id: 903, restaurant_name: "Haji Biryani House", cuisine_type: "Bangladeshi", city: "Dhaka", accepts_dine_in: false, menu_items: [
    { id: 9301, name: "Mutton Kacchi", price: 350, category: "Biryani", image_url: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=400&auto=format&fit=crop" },
    { id: 9302, name: "Morog Polao", price: 280, category: "Biryani", image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop" },
  ] },
  { id: 904, restaurant_name: "Star Kabab", cuisine_type: "Kabab • Grill", city: "Dhaka", accepts_dine_in: true, menu_items: [
    { id: 9401, name: "Beef Seekh Kabab", price: 180, category: "Kabab", image_url: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop" },
    { id: 9402, name: "Chicken Tikka", price: 200, category: "Kabab", image_url: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=400&auto=format&fit=crop" },
  ] },
  { id: 905, restaurant_name: "Sweet Corner Bakery", cuisine_type: "Desserts • Bakery", city: "Dhaka", accepts_dine_in: true, menu_items: [
    { id: 9501, name: "Chocolate Brownie", price: 280, category: "Desserts", image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400&auto=format&fit=crop" },
    { id: 9502, name: "Vanilla Ice Cream", price: 180, category: "Desserts", image_url: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400&auto=format&fit=crop" },
  ] },
  { id: 906, restaurant_name: "Wok & Roll Express", cuisine_type: "Chinese • Fast Food", city: "Dhaka", accepts_dine_in: true, menu_items: [
    { id: 9601, name: "Crispy Fried Chicken", price: 320, category: "Fast Food", image_url: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=400&auto=format&fit=crop" },
    { id: 9602, name: "Spicy Chicken Wings", price: 290, category: "Fast Food", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop" },
  ] },
];

const hash = (n) => {
  const x = ((n * 9301) + 49297 * 2) % 233280;
  return x;
};

const enrich = (r, idx) => {
  const seed = Number.isFinite(r.id) ? Math.abs(r.id) : idx + 1;
  const h = hash(seed * 31);
  const rating = r.avg_rating ?? Math.round((3.8 + (h % 13) / 10) * 10) / 10;
  const reviewCount = r.review_count ?? 0;
  const eta = 28 + (h % 6);
  const readyIn = 10 + (h % 11);
  const distance = Math.round((0.5 + (h % 28) / 10) * 10) / 10;
  const fee = r.delivery_fee !== undefined && Number(r.delivery_fee) > 0 ? Number(r.delivery_fee) : 60;
  const offers = h % 3 === 0;
  const tableFor = h % 2 === 0 ? "2-4" : "4-6";
  const tablesAvailable = h % 4 !== 0;
  return {
    ...r,
    rating,
    reviewCount,
    eta,
    readyIn,
    distance,
    fee,
    offers,
    accepts_dine_in: !!r.accepts_dine_in,
    tableFor,
    tablesAvailable,
  };
};

export default function Restaurants() {
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();
  const { addItem, cart, itemCount, total } = useCart();
  const canOrder = !user || isCustomer;
  const [restaurants, setRestaurants] = useState([]);
  const [failed, setFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("delivery");
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [saved, setSaved] = useState(() => new Set());

  useEffect(() => {
    api.get("/restaurants")
      .then((res) => {
        const list = res.data.restaurants || [];
        if (list.length === 0) setFailed(true);
        setRestaurants(list);
      })
      .catch(() => setFailed(true))
      .finally(() => setIsLoading(false));
  }, []);

  const source = failed || restaurants.length === 0 ? MOCK_RESTAURANTS : restaurants;

  const restaurantsRich = useMemo(() => source.map((r, i) => enrich(r, i)), [source]);

  const dishes = useMemo(() => (
    restaurantsRich.flatMap((r) =>
      (r.menu_items || []).map((item) => ({
        ...item,
        restaurant_id: r.id,
        restaurant_name: r.restaurant_name,
        cuisine_type: r.cuisine_type,
        rating: r.rating,
        reviewCount: r.reviewCount,
        eta: r.eta,
        readyIn: r.readyIn,
        distance: r.distance,
        fee: r.fee,
        offers: r.offers,
        accepts_dine_in: r.accepts_dine_in,
        tableFor: r.tableFor,
        tablesAvailable: r.tablesAvailable,
      }))
    )
  ), [restaurantsRich]);

  const results = useMemo(() => {
    const activeCat = CATEGORIES.find((c) => c.id === activeCategory);
    const q = search.trim().toLowerCase();
    let list = dishes.filter((d) => {
      if (q) {
        const inName = (d.name || "").toLowerCase().includes(q);
        const inRest = (d.restaurant_name || "").toLowerCase().includes(q);
        const inCuisine = (d.cuisine_type || "").toLowerCase().includes(q);
        const inCat = (d.category || "").toLowerCase().includes(q);
        if (!inName && !inRest && !inCuisine && !inCat) return false;
      }
      if (mode === "dine_in" && !d.accepts_dine_in) return false;
      if (activeCat?.keyword) {
        const k = activeCat.keyword.toLowerCase();
        const inCat = (d.category || "").toLowerCase().includes(k);
        const inName = (d.name || "").toLowerCase().includes(k);
        if (!inCat && !inName) return false;
      }
      if (filter === "rating" && d.rating < 4.0) return false;
      if (filter === "offers" && !d.offers) return false;
      if (filter === "ready" && d.readyIn > 15) return false;
      if (filter === "tables" && !d.tablesAvailable) return false;
      return true;
    });
    if (filter === "fastest") list = [...list].sort((a, b) => a.eta - b.eta);
    if (filter === "top") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sortBy === "eta") list = [...list].sort((a, b) => a.eta - b.eta);
    if (sortBy === "fee") list = [...list].sort((a, b) => a.fee - b.fee);
    return list;
  }, [dishes, search, filter, mode, activeCategory, sortBy]);

  const changeMode = (next) => {
    setMode(next);
    setFilter("all");
  };

  const activeHeading = CATEGORIES.find((c) => c.id === activeCategory).heading;
  const activeSortLabel = SORT_OPTIONS.find((s) => s.id === sortBy).label;

  const toggleSaved = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAdd = (dish) => {
    addItem(dish.restaurant_id, dish.restaurant_name, dish);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Search (70%) + Order mode toggle (30%) on the same row */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-10 gap-2 sm:gap-3">
              <div className="relative sm:col-span-7">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search restaurants or dishes"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-300 outline-none text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 bg-zinc-100 rounded-full p-1 sm:col-span-3">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const isActive = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => changeMode(m.id)}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-zinc-900 text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Icon size={14} strokeWidth={2} className="shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mode-specific filter pills */}
          <div className="flex gap-2 mt-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS_BY_MODE[mode].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filter === f.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category carousel */}
          <div className="flex gap-3 mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c) => {
              const isActive = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                >
                  <span className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                    isActive
                      ? "ring-2 ring-[#E03546] ring-offset-2"
                      : "ring-1 ring-zinc-200 group-hover:ring-zinc-300"
                  }`}>
                    {c.image ? (
                      <img src={c.image} alt={c.label} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full bg-zinc-900 flex items-center justify-center text-white">
                        <LayoutGrid size={16} strokeWidth={2} />
                      </span>
                    )}
                  </span>
                  <span className={`text-xs transition-colors ${isActive ? "text-zinc-900 font-medium" : "text-zinc-500"}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pb-24">
        {failed && (
          <div className="mb-5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg">
              <WifiOff size={13} /> Backend offline — showing demo data. Start it with <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">php artisan serve</code>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-100 overflow-hidden animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <div className="aspect-[4/3] bg-zinc-200" />
                <div className="p-4">
                  <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-zinc-200 rounded w-1/3 mb-3" />
                  <div className="h-8 bg-zinc-200 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
              <SearchX size={22} />
            </div>
            <p className="text-base font-semibold tracking-tight text-zinc-900 mb-1">No dishes found</p>
            <p className="text-sm text-zinc-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">{activeHeading}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {results.length} {results.length === 1 ? "dish" : "dishes"} near you
                </p>
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                >
                  Sort: {activeSortLabel}
                  <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-white rounded-xl border border-zinc-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] p-1">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            sortBy === opt.id
                              ? "text-[#E03546] font-semibold bg-[#E03546]/5"
                              : "text-zinc-600 hover:bg-zinc-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pb-12">
              {results.map((dish) => (
                <FoodCard
                  key={dish.id}
                  dish={dish}
                  isFav={saved.has(dish.id)}
                  onToggleFav={toggleSaved}
                  onAdd={handleAdd}
                  offline={failed}
                  canOrder={canOrder}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {canOrder && itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-extrabold text-zinc-900">
                {itemCount} {itemCount === 1 ? "Item" : "Items"} <span className="text-zinc-300">|</span> {formatPrice(total)}
              </p>
              <p className="text-xs text-zinc-400 truncate">{cart.restaurantName}</p>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-[0_12px_30px_-10px_rgba(239,68,68,0.7)] transition-all hover:-translate-y-0.5 shrink-0"
            >
              <ShoppingCart size={17} /> View Cart
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">{itemCount}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
