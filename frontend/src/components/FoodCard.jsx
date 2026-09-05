import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, Plus, Check, Star, Tag } from "lucide-react";
import { formatPrice, restaurantImage } from "../utils/foodImages";
import { prefetchRestaurant } from "../utils/prefetch";

export default function FoodCard({ dish, isFav, onToggleFav, onAdd, offline, canOrder = true }) {
  const [imgSrc, setImgSrc] = useState(() => dish.image_url || restaurantImage(dish.name));
  const [added, setAdded] = useState(false);

  const handleAddClick = () => {
    onAdd(dish);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  const detailPath = `/restaurants/${dish.restaurant_id}?dish=${dish.id}`;
  const deliveryTime = dish.delivery_time || (dish.eta ? `${dish.eta} min` : null);
  const rating = Number.isFinite(Number(dish.rating)) ? Number(dish.rating) : null;

  return (
    <div className="group bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] transition-shadow">
      <Link to={detailPath} onMouseEnter={() => prefetchRestaurant(dish.restaurant_id)} className="block relative">
        <img
          src={imgSrc}
          alt={dish.name}
          loading="lazy"
          onError={() => setImgSrc(restaurantImage(dish.name))}
          className="w-full aspect-[4/3] object-cover"
        />
        {dish.offers && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[#F97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <Tag size={10} strokeWidth={2.5} /> Offers
          </span>
        )}
        <button
          type="button"
          onClick={(e) => onToggleFav(e, dish.id)}
          aria-label={isFav ? `Remove ${dish.name} from saved` : `Save ${dish.name}`}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center justify-center transition-colors cursor-pointer ${
            isFav ? "text-[#F97316]" : "text-zinc-500 hover:text-[#F97316]"
          }`}
        >
          <Heart size={15} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </Link>

      <div className="p-4">
        <Link to={detailPath} onMouseEnter={() => prefetchRestaurant(dish.restaurant_id)}>
          <h3 className="font-bold text-zinc-900 text-sm truncate group-hover:text-[#F97316] transition-colors">
            {dish.name}
          </h3>
        </Link>
        <Link
          to={`/restaurants/${dish.restaurant_id}`}
          onMouseEnter={() => prefetchRestaurant(dish.restaurant_id)}
          className="text-zinc-500 text-xs truncate mt-0.5 block hover:text-[#F97316] transition-colors"
        >
          {dish.restaurant_name}
        </Link>
        {(rating !== null || deliveryTime) && (
          <div className="flex items-center gap-2 mt-1">
            {rating !== null && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-zinc-600">
                <Star size={11} className="text-amber-400" fill="currentColor" /> {rating.toFixed(1)}
              </span>
            )}
            {deliveryTime && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400">
                <Clock size={11} /> {deliveryTime}
              </span>
            )}
          </div>
        )}
        <p className="font-bold text-zinc-900 mt-1.5">
          {dish.discount_price != null ? (
            <>
              <span className="text-zinc-400 line-through font-normal mr-1.5">{formatPrice(dish.price)}</span>
              {formatPrice(dish.discount_price)}
            </>
          ) : (
            formatPrice(dish.price)
          )}
        </p>

        {canOrder ? (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={offline}
            className={`mt-3 inline-flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              added
                ? "bg-emerald-600"
                : "bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {added ? (
              <>
                <Check size={14} strokeWidth={2.5} /> Added
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={2.5} /> Add to Cart
              </>
            )}
          </button>
        ) : (
          <span className="mt-3 inline-block text-xs font-medium text-zinc-400 px-4 py-2">
            View Only
          </span>
        )}
      </div>
    </div>
  );
}
