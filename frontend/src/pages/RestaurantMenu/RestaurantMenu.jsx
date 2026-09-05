import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Star, Clock, Truck, ArrowLeft, Calendar, UtensilsCrossed,
  Plus, Minus, ShoppingCart, Heart, X,
} from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../features/auth/AuthContext";
import ReservationModal from "../../components/ReservationModal";
import DishDetailModal from "../../components/DishDetailModal";
import { formatPrice, restaurantImage } from "../../utils/foodImages";
import { getCachedRestaurant, getRestaurantData, getAllRestaurants } from "../../utils/prefetch";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop";

const MOCK_RESTAURANT = {
  id: "mock-1",
  restaurant_name: "The Burger Republic",
  cuisine_type: "Burgers",
  city: "Dhaka",
  address: "Dhanmondi 27, Road 6",
  description: "Hand-picked smash burgers, flame-grilled wings and loaded fries — cooked fresh to order since 2019.",
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
  cover_image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
  logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop",
  rating: 4.8,
  delivery_time: "25-30 mins",
  delivery_fee: 60,
  accepts_dine_in: true,
};

const MOCK_MENU_ITEMS = [
  { id: 101, name: "Classic Cheeseburger", description: "Flame-grilled beef patty, melted cheddar, crisp lettuce & our secret sauce.", price: 450, category: "Burgers", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop", is_bestseller: true },
  { id: 102, name: "Spicy Chicken Wings", description: "Crispy wings tossed in our signature chilli-garlic glaze.", price: 320, category: "Recommended", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" },
  { id: 103, name: "Double Smokehouse Burger", description: "Two beef patties, smoky bacon, onion rings & BBQ mayo.", price: 620, category: "Burgers", image_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop", is_bestseller: true },
  { id: 104, name: "Loaded Cheese Fries", description: "Crispy fries smothered in molten cheese sauce & spring onions.", price: 190, category: "Sides", image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=800&auto=format&fit=crop" },
  { id: 105, name: "Crispy Garden Salad", description: "Fresh greens, cherry tomatoes, olives, grilled chicken & ranch.", price: 150, category: "Sides", image_url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop" },
  { id: 106, name: "Chilled Coca-Cola", description: "An ice-cold 300ml can to wash it all down.", price: 55, category: "Drinks", image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800&auto=format&fit=crop" },
  { id: 107, name: "Molten Chocolate Lava", description: "Warm chocolate cake with a gooey centre, served with a scoop of ice cream.", price: 280, category: "Desserts", image_url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop", is_bestseller: true },
];

const MOCK_REVIEWS = [
  { name: "Riad Hossain", rating: 5, comment: "The Classic Cheeseburger is insanely juicy. It arrived in 22 minutes flat!" },
  { name: "Nabila Rahman", rating: 4, comment: "Crispy wings and great value. Just wish there were a few more drink options." },
  { name: "Tanvir Ahmed", rating: 5, comment: "Easily the best smash burger in Dhanmondi. The loaded fries are addictive." },
];

const AVATAR_COLORS = ["from-red-500 to-rose-400", "from-amber-500 to-orange-400", "from-emerald-500 to-teal-400", "from-violet-500 to-purple-400"];

const initials = (name = "") =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const handleImgError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMG;
};

export default function RestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isCustomer } = useAuth();
  const { addItem, removeItem, updateQuantity, cart, itemCount, total } = useCart();
  const canOrder = !user || isCustomer;
  const [payload, setPayload] = useState(() => getCachedRestaurant(id));
  const [failed, setFailed] = useState(false);
  const [activeCat, setActiveCat] = useState("");
  const [highlightId, setHighlightId] = useState(() => searchParams.get("dish"));
  const [wishlist, setWishlist] = useState(() => new Set());
  const [wishlistBusy, setWishlistBusy] = useState(() => new Set());
  const [wishlistMsg, setWishlistMsg] = useState("");
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMsg, setRatingMsg] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState(() => searchParams.get("dish"));
  const [allRestaurants, setAllRestaurants] = useState([]);

  useEffect(() => {
    let active = true;
    getRestaurantData(id)
      .then((res) => { if (active) setPayload(res); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!sessionStorage.getItem("currentRole")) return;
    let active = true;
    customerApi.getWishlistItems()
      .then((res) => {
        if (active) setWishlist(new Set((res.data.wishlist_items || []).map((wi) => wi.menu_item_id)));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedDishId) return undefined;
    let active = true;
    getAllRestaurants()
      .then((list) => { if (active) setAllRestaurants(list); })
      .catch(() => {});
    return () => { active = false; };
  }, [selectedDishId]);

  useEffect(() => {
    if (!highlightId || !payload) return;
    const el = document.getElementById(`dish-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = window.setTimeout(() => setHighlightId(null), 2400);
    return () => window.clearTimeout(t);
  }, [highlightId, payload]);

  const loading = !payload && !failed;
  const useMock = failed;
  const demoTarget = useMock || loading;

  const restaurant = {
    ...MOCK_RESTAURANT,
    ...(demoTarget ? {} : payload.restaurant),
  };

  const tagline = demoTarget
    ? "Burgers • American • Fast Food"
    : [payload.restaurant.cuisine_type, payload.restaurant.city].filter(Boolean).join(" • ");

  const menuItems = demoTarget
    ? MOCK_MENU_ITEMS
    : payload.menu_items.filter((i) => i.is_available !== false);

  const selectedDish = menuItems.find((i) => String(i.id) === String(selectedDishId)) || null;

  const relatedDishes = selectedDish
    ? menuItems
        .filter((i) => i.id !== selectedDish.id && (i.category || "Recommended") === (selectedDish.category || "Recommended"))
        .slice(0, 6)
    : [];

  const crossRestaurantDishes = (() => {
    if (!selectedDish || demoTarget || allRestaurants.length === 0) return [];
    const LIMIT = 6;
    const tag = (m, r) => ({ ...m, restaurant_id: r.id, restaurant_name: r.restaurant_name });
    const others = allRestaurants
      .filter((r) => r.id !== restaurant.id)
      .map((r) => ({ r, items: r.menu_items || [] }));
    if (others.length === 0) return [];
    const interleave = (lists) => {
      const out = [];
      const maxLen = Math.max(0, ...lists.map((l) => l.length));
      for (let i = 0; i < maxLen; i += 1) {
        lists.forEach((l) => { if (l[i]) out.push(l[i]); });
      }
      return out;
    };
    const sameCat = interleave(
      others.map(({ r, items }) =>
        items.filter((m) => m.category && m.category === selectedDish.category).map((m) => tag(m, r))
      )
    );
    const usedIds = new Set(sameCat.map((m) => m.id));
    const fill = interleave(
      others.map(({ r, items }) => items.filter((m) => !usedIds.has(m.id)).map((m) => tag(m, r)))
    );
    return [...sameCat, ...fill].slice(0, LIMIT);
  })();

  const displayRating = demoTarget
    ? MOCK_RESTAURANT.rating
    : (payload.restaurant.avg_rating ?? MOCK_RESTAURANT.rating);

  const reviewCount = demoTarget
    ? MOCK_REVIEWS.length
    : (payload.restaurant.review_count ?? 0);

  const coverSrc = restaurant.cover_image_url || restaurant.cover_image || restaurant.image_url || restaurant.image || restaurantImage(restaurant.restaurant_name);
  const logoSrc = restaurant.logo_url || restaurant.logo || restaurant.image_url || restaurant.image || restaurantImage(restaurant.restaurant_name);

  const displayReviews = demoTarget
    ? MOCK_REVIEWS
    : (payload.reviews || []).map((r) => ({
        name: r.user?.name || "Customer",
        rating: r.rating,
        comment: r.comment || "",
        userId: r.user?.id || null,
      }));

  const existingReview = user && !demoTarget
    ? (payload.reviews || []).find((r) => r.user?.id === user.id)
    : null;
  const hasUserReview = !!existingReview;

  const handleSubmitReview = async () => {
    if (ratingValue < 1 || ratingValue > 5) return;
    setRatingBusy(true);
    setRatingError("");
    try {
      const res = await customerApi.submitReview({
        restaurant_id: payload.restaurant.id,
        rating: ratingValue,
        comment: ratingComment.trim() || null,
      });
      setRatingOpen(false);
      setRatingComment("");
      setRatingValue(5);
      if (res.data.avg_rating) {
        setPayload((prev) => {
          if (!prev) return prev;
          const reviews = hasUserReview
            ? (prev.reviews || []).map((r) => r.user?.id === user?.id ? res.data.review : r)
            : [...(prev.reviews || []), res.data.review];
          return {
            ...prev,
            restaurant: {
              ...prev.restaurant,
              avg_rating: res.data.avg_rating,
              review_count: res.data.review_count ?? prev.restaurant.review_count,
            },
            reviews,
          };
        });
      }
      setRatingMsg("Thanks for your review!");
      window.setTimeout(() => setRatingMsg(""), 2800);
    } catch (err) {
      setRatingError(err.response?.data?.message || "Failed to submit review.");
    }
    setRatingBusy(false);
  };

  const categories = (() => {
    const seen = [];
    menuItems.forEach((i) => {
      const cat = i.category || "Recommended";
      const key = cat.toLowerCase();
      if (!seen.some((c) => c.toLowerCase() === key)) seen.push(cat);
    });
    return seen;
  })();

  const qtyOf = (item) =>
    cart.items.find((i) => i.menu_item_id === item.id)?.quantity || 0;

  const handleAdd = (item) => {
    if (cart.restaurantId && cart.restaurantId !== restaurant.id) {
      const ok = window.confirm(
        `Your cart has items from ${cart.restaurantName || "another restaurant"}. Add items from ${restaurant.restaurant_name} and replace the cart?`
      );
      if (!ok) return;
    }
    addItem(restaurant.id, restaurant.restaurant_name, item);
  };

  const handleDishConfirm = (item, qty) => {
    const before = qtyOf(item);
    handleAdd(item);
    if (qty > 1) updateQuantity(item.id, before + qty);
  };

  const toggleWishlist = async (item) => {
    const isSaved = wishlist.has(item.id);
    setWishlistMsg("");
    setWishlistBusy((prev) => new Set(prev).add(item.id));

    const rollback = () => {
      setWishlist((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(item.id); else next.delete(item.id);
        return next;
      });
    };

    setWishlist((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(item.id); else next.add(item.id);
      return next;
    });

    try {
      if (isSaved) {
        await customerApi.removeWishlistItem(item.id);
      } else {
        await customerApi.addWishlistItem(item.id);
      }
    } catch {
      rollback();
      setWishlistMsg("Sign in to save items to your wishlist.");
      window.setTimeout(() => setWishlistMsg(""), 2800);
    } finally {
      setWishlistBusy((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const scrollToCat = (cat) => {
    setActiveCat(cat);
    const el = document.getElementById(`menu-${cat.toLowerCase()}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] pb-28">
        <div className="h-48 w-full bg-zinc-200 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
          <div className="bg-white rounded-2xl p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-200 animate-pulse shrink-0" />
              <div className="flex-1 pt-1 space-y-3">
                <div className="h-6 w-56 max-w-full bg-zinc-200 rounded-lg animate-pulse" />
                <div className="h-4 w-40 bg-zinc-200 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="h-8 w-24 bg-zinc-200 rounded-lg animate-pulse" />
              <div className="h-8 w-28 bg-zinc-200 rounded-lg animate-pulse" />
              <div className="h-8 w-32 bg-zinc-200 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="mt-10 mb-6 space-y-3">
            <div className="h-7 w-40 bg-zinc-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                  <div className="aspect-[4/3] bg-zinc-200 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 bg-zinc-200 rounded animate-pulse" />
                    <div className="h-3 w-full bg-zinc-200 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-zinc-200 rounded animate-pulse" />
                    <div className="flex items-center justify-between pt-3">
                      <div className="h-4 w-14 bg-zinc-200 rounded animate-pulse" />
                      <div className="h-7 w-16 bg-zinc-200 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">
      {/* Cover image */}
      <div className="relative h-48 w-full overflow-hidden">
        <img src={coverSrc} onError={handleImgError} fetchPriority="high" alt={restaurant.restaurant_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-transparent to-transparent" />
        <button
          onClick={() => navigate("/restaurants", { replace: true })}
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/90 hover:bg-white text-zinc-900 text-sm font-semibold px-3.5 py-2 rounded-full shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      {/* Overlapping info card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] p-5">
          <div className="flex items-start gap-4">
            <img
              src={logoSrc}
              onError={handleImgError}
              alt={restaurant.restaurant_name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md shrink-0"
            />
            <div className="min-w-0 pt-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 truncate">{restaurant.restaurant_name}</h1>
              {tagline && <p className="text-sm text-zinc-500 mt-0.5 truncate">{tagline}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {displayRating > 0 && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                {displayRating}{reviewCount > 0 && <span className="text-green-600/70 font-medium">({reviewCount})</span>}
              </span>
            )}
            {restaurant.delivery_time && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 text-sm font-medium px-3 py-1.5 rounded-lg">
                <Clock size={14} className="text-zinc-500" /> {restaurant.delivery_time}
              </span>
            )}
            {restaurant.delivery_fee !== undefined && (
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 text-sm font-medium px-3 py-1.5 rounded-lg">
                <Truck size={14} className="text-zinc-500" /> {formatPrice(restaurant.delivery_fee)} delivery
              </span>
            )}
          </div>

          {restaurant.accepts_dine_in && (
            <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-zinc-100">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                <UtensilsCrossed size={14} /> Dine-In Available
              </span>
              <button
                onClick={() => setReserveOpen(true)}
                className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-5 py-2 rounded-xl shadow-[0_8px_20px_rgba(249,115,22,0.3)] transition-colors cursor-pointer"
              >
                <Calendar size={15} /> Reserve a Table
              </button>
            </div>
          )}
        </div>

        {/* Sticky category nav */}
        {categories.length > 0 && (
          <nav className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 mt-6 bg-white border-b border-zinc-100 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-7">
              {categories.map((cat) => {
                const isActive = activeCat.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => scrollToCat(cat)}
                    className={`relative shrink-0 py-3 whitespace-nowrap text-sm font-medium transition-colors duration-200 cursor-pointer ${isActive ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
                  >
                    {cat}
                    <span className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#F97316] transition-all duration-200 ${isActive ? "opacity-100" : "opacity-0"}`} />
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Menu sections */}
        {wishlistMsg && (
          <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
            <Heart size={13} /> {wishlistMsg}
          </p>
        )}

        {menuItems.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 px-6 mt-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Menu coming soon</p>
            <p className="text-zinc-400">Check back a little later for the full menu.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const key = cat.toLowerCase();
            const items = menuItems.filter((i) => (i.category || "Recommended").toLowerCase() === key);
            return (
              <section key={cat} id={`menu-${key}`} className="scroll-mt-14">
                <h2 className="text-2xl font-bold text-zinc-900 mt-10 mb-6">{cat}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((item) => {
                    const qty = qtyOf(item);
                    return (
                      <div
                        key={item.id}
                        id={`dish-${item.id}`}
                        onClick={() => setSelectedDishId(item.id)}
                        className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col scroll-mt-24 transition-shadow cursor-pointer ${
                          highlightId === String(item.id)
                            ? "border-[#F97316] ring-2 ring-[#F97316]/40 shadow-[0_10px_30px_-12px_rgba(249,115,22,0.45)]"
                            : "border-zinc-100"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={item.image_url || restaurantImage(item.name)}
                            onError={handleImgError}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/3] w-full object-cover"
                          />
                          {!useMock && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(item);
                              }}
                              disabled={wishlistBusy.has(item.id)}
                              aria-label={wishlist.has(item.id) ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
                              className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer ${
                                wishlist.has(item.id) ? "text-[#F97316]" : "text-zinc-500 hover:text-[#F97316]"
                              }`}
                            >
                              {wishlistBusy.has(item.id) ? (
                                <span className="w-3 h-3 rounded-full border-2 border-[#F97316] border-t-transparent animate-spin" />
                              ) : (
                                <Heart size={14} fill={wishlist.has(item.id) ? "currentColor" : "none"} strokeWidth={2} />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-zinc-900 text-base">{item.name}</h3>
                          {item.description && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="mt-auto pt-3 flex items-center justify-between">
                            <span className="font-bold text-zinc-900">
                              {item.discount_price != null ? (
                                <>
                                  <span className="text-zinc-400 line-through font-normal mr-1.5">{formatPrice(item.price)}</span>
                                  {formatPrice(item.discount_price)}
                                </>
                              ) : (
                                formatPrice(item.price)
                              )}
                            </span>
                            {canOrder && !useMock && (qty === 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdd(item);
                                }}
                                aria-label={`Add ${item.name} to cart`}
                                className="border border-zinc-200 rounded-lg px-3 py-1 text-sm font-bold text-[#F97316] hover:bg-orange-50 hover:border-[#F97316] transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={14} strokeWidth={2.5} /> ADD
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 border border-zinc-200 rounded-lg px-1 py-1">
                                <button onClick={(e) => { e.stopPropagation(); qty === 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1); }} className="w-6 h-6 rounded-md text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer" aria-label="Decrease">
                                  <Minus size={13} strokeWidth={2.5} />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-zinc-900">{qty}</span>
                                <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, qty + 1); }} className="w-6 h-6 rounded-md text-[#F97316] hover:bg-orange-50 flex items-center justify-center transition-colors cursor-pointer" aria-label="Increase">
                                  <Plus size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {/* Reviews */}
        <section className="mt-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">What people are saying</h2>
            {!useMock && user && (
              <button
                onClick={() => {
                  if (hasUserReview) {
                    setRatingValue(existingReview.rating);
                    setRatingComment(existingReview.comment || "");
                  } else {
                    setRatingValue(5);
                    setRatingComment("");
                  }
                  setRatingError("");
                  setRatingOpen(true);
                }}
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-colors ml-auto cursor-pointer"
              >
                <Star size={13} className="text-amber-400" fill="currentColor" /> {hasUserReview ? "Edit your review" : "Rate this restaurant"}
              </button>
            )}
            {!useMock && !user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-colors ml-auto"
              >
                <Star size={13} className="text-amber-400" fill="currentColor" /> Log in to review
              </Link>
            )}
          </div>

          {ratingMsg && (
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
              <Star size={13} /> {ratingMsg}
            </p>
          )}

          {displayReviews.length === 0 ? (
            <div className="bg-white rounded-2xl py-12 px-6 mt-4 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
              <p className="text-zinc-500 text-sm">No reviews yet. Be the first to rate this restaurant!</p>
            </div>
          ) : (
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              {displayReviews.map((review, i) => (
                <div key={review.name + i} className="bg-white rounded-2xl p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] w-[300px] sm:w-[340px] shrink-0 snap-start flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {initials(review.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 text-sm truncate">{review.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={12} className={star <= review.rating ? "text-amber-400" : "text-zinc-200"} fill="currentColor" />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-zinc-500 leading-relaxed">"{review.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reservation modal */}
      <ReservationModal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        restaurant={restaurant}
        user={user}
      />

      {/* Dish detail modal */}
      <DishDetailModal
        key={selectedDish?.id ?? "closed"}
        item={selectedDish}
        restaurantName={restaurant.restaurant_name}
        restaurantInfo={restaurant}
        canOrder={canOrder && !useMock}
        isSaved={selectedDish ? wishlist.has(selectedDish.id) : false}
        favBusy={selectedDish ? wishlistBusy.has(selectedDish.id) : false}
        onToggleFav={!useMock ? toggleWishlist : undefined}
        relatedItems={relatedDishes}
        onSelectRelated={(dish) => setSelectedDishId(dish.id)}
        crossRestaurantItems={crossRestaurantDishes}
        onSelectCrossRestaurant={(dish) => {
          setSelectedDishId(null);
          navigate(`/restaurants/${dish.restaurant_id}?dish=${dish.id}`);
        }}
        onClose={() => setSelectedDishId(null)}
        onConfirm={handleDishConfirm}
      />

      {/* Review modal */}
      {ratingOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRatingOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-xl font-extrabold tracking-tight text-zinc-900">Rate {restaurant.restaurant_name}</h3>
              <button onClick={() => setRatingOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-5">Only available after a delivered order.</p>

            <div className="flex items-center justify-center gap-1.5 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    size={34}
                    className={star <= ratingValue ? "text-amber-400" : "text-zinc-200"}
                    fill={star <= ratingValue ? "currentColor" : "none"}
                    strokeWidth={1.8}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Share your feedback (optional)..."
              rows={3}
              className="w-full border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 placeholder:text-zinc-400 resize-none"
            />

            {ratingError && (
              <p className="mt-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">{ratingError}</p>
            )}

            <button
              onClick={handleSubmitReview}
              disabled={ratingBusy}
              className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors cursor-pointer"
            >
              {ratingBusy ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}

      {/* Floating cart bar */}
      {canOrder && itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-extrabold text-zinc-900">
                {itemCount} {itemCount === 1 ? "Item" : "Items"} <span className="text-zinc-300">|</span> {formatPrice(total)}
              </p>
              <p className="text-xs text-zinc-400 truncate">{cart.restaurantName}</p>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-[0_12px_30px_-10px_rgba(249,115,22,0.7)] transition-all hover:-translate-y-0.5 shrink-0"
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