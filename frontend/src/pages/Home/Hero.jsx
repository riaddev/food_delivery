import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, ArrowRight } from "lucide-react";
import api from "../../features/api/apiSlice";
import { formatPrice, restaurantImage } from "../../utils/foodImages";

const BG = "https://images.unsplash.com/photo-1577308856961-8e9ec50d0c67?q=80&w=1920&auto=format&fit=crop";

const STATS = [
  { val: "500+", label: "Restaurants" },
  { val: "10K+", label: "Happy Customers" },
  { val: "4.9 ★", label: "Rating" },
  { val: "28 min", label: "Avg. Delivery" },
];

const POPULAR = [
  { label: "Biryani", icon: "\uD83C\uDF5B" },
  { label: "Pizza", icon: "\uD83C\uDF55" },
  { label: "Burgers", icon: "\uD83C\uDF54" },
  { label: "Chicken", icon: "\uD83C\uDF57" },
];

const DEBOUNCE_MS = 250;

const FOOD_FALLBACK = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=200&auto=format&fit=crop";

const Hero = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get("/restaurants", { skipAuthRedirect: true })
      .then((res) => { if (alive) setRestaurants(res.data.restaurants || []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedQuery(query); setActiveIdx(-1); }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const q = debouncedQuery.trim().toLowerCase();

  const restaurantMatches = useMemo(() => {
    if (!q) return [];
    return restaurants
      .filter(
        (r) =>
          (r.restaurant_name || "").toLowerCase().includes(q) ||
          (r.cuisine_type || "").toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [restaurants, q]);

  const dishMatches = useMemo(() => {
    if (!q) return [];
    return restaurants
      .flatMap((r) =>
        (r.menu_items || []).map((m) => ({
          ...m,
          restaurant_id: r.id,
          restaurant_name: r.restaurant_name,
        }))
      )
      .filter(
        (m) =>
          (m.name || "").toLowerCase().includes(q) ||
          (m.category || "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [restaurants, q]);

  const hasResults = restaurantMatches.length > 0 || dishMatches.length > 0;

  const suggestions = useMemo(() => {
    const items = [];
    restaurantMatches.forEach((r) => items.push({ type: "restaurant", id: r.id, name: r.restaurant_name, sub: r.cuisine_type }));
    dishMatches.forEach((d) => items.push({ type: "dish", id: d.id, restaurantId: d.restaurant_id, name: d.name, sub: d.restaurant_name, price: d.price }));
    return items;
  }, [restaurantMatches, dishMatches]);

  const goRestaurant = (id) => {
    setOpen(false);
    setQuery("");
    navigate(`/restaurants/${id}`);
  };

  const goDish = (restaurantId, dishId) => {
    setOpen(false);
    setQuery("");
    navigate(`/restaurants/${restaurantId}?dish=${dishId}`);
  };

  const goSearch = () => {
    setOpen(false);
    navigate(debouncedQuery.trim() ? `/restaurants?search=${encodeURIComponent(debouncedQuery.trim())}` : "/restaurants");
  };

  const selectSuggestion = (item) => {
    if (item.type === "restaurant") goRestaurant(item.id);
    else goDish(item.restaurantId, item.id);
  };

  const submit = (e) => {
    e.preventDefault();
    if (activeIdx >= 0 && activeIdx < suggestions.length) {
      selectSuggestion(suggestions[activeIdx]);
      return;
    }
    goSearch();
  };

  const handleKeyDown = (e) => {
    if (!open || (!q && !loading)) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = open;

  return (
    <section className="relative flex flex-col min-h-[100svh] lg:min-h-[100vh]" id="home">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG})` }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.26) 60%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.48) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.48) 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-[3]"
        style={{
          background: "radial-gradient(ellipse 52% 44% at 50% 44%, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-[4] pointer-events-none w-[900px] max-w-full h-[70%]"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 55%, transparent 78%)",
        }}
      />

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center pt-[150px] lg:pt-[170px] pb-10 lg:pb-14 px-4 sm:px-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-9"
          style={{
            background: "rgba(255,107,0,0.12)",
            border: "1px solid rgba(255,107,0,0.28)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
          <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#FF9A3C]">
            Now delivering in your city
          </span>
        </div>

        <h1 className="text-white text-[clamp(38px,5.4vw,75px)] font-black leading-[1.08] tracking-[-2px] mb-[12px] max-w-[620px]">
          Every craving,<br />
          <span
            style={{
              background: "linear-gradient(90deg, #FF6B00, #FFB347)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            delivered.
          </span>
        </h1>

        <p className="text-white/60 text-base leading-[1.72] mb-[20px] max-w-[420px]">
          Browse 500+ restaurants, order your favourites, and track delivery live — all in one place.
        </p>

        <div ref={wrapRef} className="relative w-full max-w-[560px]">
          <form
            onSubmit={submit}
            className="flex items-stretch bg-white rounded-[18px] p-[3px] sm:p-[5px] shadow-[0_20px_70px_rgba(0,0,0,0.45)]"
          >
            <div className="flex-1 flex items-center gap-2 px-4 min-w-0 text-[#9a9a9a]">
              <Search size={14} strokeWidth={2.2} className="text-[#CCC] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search restaurants or dishes..."
                className="flex-1 min-w-0 bg-transparent outline-none text-[#111] text-sm placeholder:text-[#CCC]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="w-[22px] h-[22px] rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 flex items-center justify-center shrink-0 cursor-pointer transition"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-[14px] bg-gradient-to-br from-[#FF6B00] to-[#E05500] text-white font-bold text-sm shadow-[0_4px_18px_rgba(255,107,0,0.38)] inline-flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer shrink-0 whitespace-nowrap"
            >
              Find Food
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          </form>

          {showDropdown && (
            <div
              ref={listRef}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden z-20 text-left max-h-[420px] overflow-y-auto max-w-full box-border"
              role="listbox"
              aria-expanded={showDropdown}
            >
              {q && loading && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>
              )}

              {!q && !loading && (
                <>
                  <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest uppercase text-gray-400">Popular Searches</div>
                  <div className="flex flex-wrap gap-2 px-4 py-3">
                    {POPULAR.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setQuery(p.label); setOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-orange-50 text-sm font-medium text-gray-700 hover:text-[#FF6B00] transition cursor-pointer"
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {q && !loading && (
                <>
                  {restaurantMatches.length > 0 && (
                    <>
                      <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest uppercase text-gray-400">Restaurants</div>
                      {restaurantMatches.map((r, i) => (
                        <button
                          key={`r-${r.id}`}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === i}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => goRestaurant(r.id)}
                          onMouseEnter={() => setActiveIdx(i)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${activeIdx === i ? "bg-orange-50" : "hover:bg-orange-50"}`}
                        >
                          <img
                            src={r.logo || r.image || restaurantImage(r.restaurant_name)}
                            alt=""
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = restaurantImage(r.restaurant_name); }}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-gray-900 truncate">{r.restaurant_name}</span>
                            <span className="block text-xs text-gray-500 truncate">{r.cuisine_type}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {dishMatches.length > 0 && (
                    <>
                      <div className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-widest uppercase text-gray-400">Dishes</div>
                      {dishMatches.map((m, i) => {
                        const idx = restaurantMatches.length + i;
                        return (
                          <button
                            key={`d-${m.restaurant_id}-${m.id}-${i}`}
                            type="button"
                            role="option"
                            aria-selected={activeIdx === idx}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goDish(m.restaurant_id, m.id)}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${activeIdx === idx ? "bg-orange-50" : "hover:bg-orange-50"}`}
                          >
                            <img
                              src={m.image_url || FOOD_FALLBACK}
                              alt=""
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FOOD_FALLBACK; }}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold text-gray-900 truncate">{m.name}</span>
                              <span className="block text-xs text-gray-500 truncate">{m.restaurant_name}</span>
                            </span>
                            <span className="text-sm font-extrabold text-[#FF6B00] shrink-0">{formatPrice(m.price)}</span>
                          </button>
                        );
                      })}
                    </>
                  )}

                  {!hasResults && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm font-medium text-gray-500">No restaurants or dishes found</p>
                      <p className="text-xs text-gray-400 mt-1">Try searching for another dish or restaurant.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={goSearch}
                    className="w-full flex items-center gap-2.5 px-4 py-3 border-t border-gray-100 text-sm font-semibold text-[#FF6B00] hover:bg-orange-50 transition"
                  >
                    <Search size={15} />
                    See all results for &ldquo;{debouncedQuery.trim()}&rdquo; &rarr;
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="relative z-10 w-full mt-8 sm:mt-12"
        style={{
          background: "rgba(6,4,2,0.82)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-4 sm:py-[20px] grid grid-cols-1 sm:flex sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:items-center sm:justify-between sm:gap-6">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && <div className="hidden sm:block w-px h-[30px] bg-white/12 mx-[10px] sm:mx-[22px]" />}
                <div className="flex flex-col items-start text-left">
                  <span className="text-[16.8px] font-extrabold text-white tracking-[-0.3px] leading-[1.2]">
                    {s.val}
                  </span>
                  <span className="text-[10.9px] text-white/45 font-medium leading-[1.3]">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-[7px] sm:pl-5 sm:border-l border-white/10">
            <MapPin size={13} className="text-[#FF6B00] shrink-0" />
            <span className="text-[12px] font-medium text-white/60 whitespace-nowrap">
              Live GPS tracking on every order
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
