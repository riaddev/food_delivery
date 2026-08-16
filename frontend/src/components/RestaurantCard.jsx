import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, UtensilsCrossed, Calendar } from "lucide-react";
import { restaurantImage } from "../utils/foodImages";
import { prefetchRestaurant } from "../utils/prefetch";

export default function RestaurantCard({ restaurant, onReserve, offline }) {
  const [imgSrc, setImgSrc] = useState(() => restaurant.image || restaurantImage(restaurant.restaurant_name));

  const tagline = [restaurant.cuisine_type, restaurant.city].filter(Boolean).join(" • ");

  return (
    <div className="group bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] transition-shadow">
      <Link to={`/restaurants/${restaurant.id}`} onMouseEnter={() => prefetchRestaurant(restaurant.id)} className="block relative">
        <img
          src={imgSrc}
          alt={restaurant.restaurant_name}
          loading="lazy"
          onError={() => setImgSrc(restaurantImage(restaurant.restaurant_name))}
          className="w-full aspect-[4/3] object-cover"
        />
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <UtensilsCrossed size={12} /> Dine-In
        </span>
      </Link>

      <div className="p-4">
        <Link to={`/restaurants/${restaurant.id}`} onMouseEnter={() => prefetchRestaurant(restaurant.id)}>
          <h3 className="font-bold text-zinc-900 text-sm truncate group-hover:text-[#E03546] transition-colors">
            {restaurant.restaurant_name}
          </h3>
        </Link>
        {tagline && <p className="text-zinc-500 text-xs truncate mt-0.5">{tagline}</p>}

        <div className="flex items-center gap-1.5 mt-2">
          <Star size={14} className="text-amber-400" fill="currentColor" />
          <span className="text-sm font-bold text-zinc-900">{restaurant.rating}</span>
          {restaurant.reviewCount > 0 && (
            <span className="text-xs text-zinc-400 font-medium">({restaurant.reviewCount})</span>
          )}
        </div>

        <button
          type="button"
          onClick={onReserve}
          disabled={offline}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-[#E03546] hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Calendar size={14} strokeWidth={2.5} /> Reserve a Table
        </button>
      </div>
    </div>
  );
}