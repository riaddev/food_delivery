import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { formatPrice, restaurantImage } from "../utils/foodImages";

export default function FoodCard({ dish, isFav, onToggleFav, onAdd, offline }) {
  const [imgSrc, setImgSrc] = useState(() => dish.image_url || restaurantImage(dish.name));

  return (
    <div className="group bg-white rounded-xl border border-zinc-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] transition-shadow">
      <Link to={`/restaurants/${dish.restaurant_id}`} className="block relative">
        <img
          src={imgSrc}
          alt={dish.name}
          loading="lazy"
          onError={() => setImgSrc(restaurantImage(dish.name))}
          className="w-full aspect-[4/3] object-cover"
        />
        <button
          type="button"
          onClick={(e) => onToggleFav(e, dish.id)}
          aria-label={isFav ? `Remove ${dish.name} from saved` : `Save ${dish.name}`}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center justify-center transition-colors cursor-pointer ${
            isFav ? "text-[#E03546]" : "text-zinc-500 hover:text-[#E03546]"
          }`}
        >
          <Heart size={15} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </Link>

      <div className="p-4">
        <Link to={`/restaurants/${dish.restaurant_id}`}>
          <h3 className="font-bold text-zinc-900 text-sm truncate group-hover:text-[#E03546] transition-colors">
            {dish.name}
          </h3>
        </Link>
        <p className="text-zinc-500 text-xs truncate mt-0.5">{dish.restaurant_name}</p>
        <p className="font-bold text-zinc-900 mt-2">{formatPrice(dish.price)}</p>

        <button
          type="button"
          onClick={() => onAdd(dish)}
          disabled={offline}
          className="mt-3 inline-flex items-center gap-1.5 bg-[#E03546] hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
