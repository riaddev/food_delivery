import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, Minus, Plus, Truck, X } from "lucide-react";
import { formatPrice, restaurantImage } from "../utils/foodImages";
import { getEffectiveCap, isSoldOut } from "../utils/orderLimits";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop";

export default function DishDetailModal({
  item,
  restaurantName,
  restaurantInfo,
  canOrder = true,
  onClose,
  onConfirm,
  isSaved = false,
  onToggleFav,
  favBusy = false,
  relatedItems = [],
  onSelectRelated,
  crossRestaurantItems = [],
  onSelectCrossRestaurant,
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const orderable = canOrder && typeof onConfirm === "function";
  const showFav = typeof onToggleFav === "function";
  const showRelated = relatedItems.length > 0 && typeof onSelectRelated === "function";
  const showCross = crossRestaurantItems.length > 0 && typeof onSelectCrossRestaurant === "function";
  const soldOut = isSoldOut(item);
  const maxQty = Math.max(1, getEffectiveCap(item, restaurantInfo));
  const cappedQty = Math.min(qty, maxQty);
  const deliveryFee = restaurantInfo?.delivery_fee;
  const deliveryLabel =
    deliveryFee == null ? null : parseFloat(deliveryFee) === 0 ? "Free delivery" : `${formatPrice(deliveryFee)} delivery`;
  const effectivePrice = item.discount_price != null ? parseFloat(item.discount_price) : parseFloat(item.price);
  const totalPrice = formatPrice(effectivePrice * cappedQty);

  const handleConfirm = () => {
    if (soldOut) return;
    onConfirm(item, cappedQty);
    setAdded(true);
  };

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          <div className="relative">
            <img
              src={item.image_url || restaurantImage(item.name)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMG;
              }}
              alt={item.name}
              className="aspect-[16/10] sm:aspect-[4/3] w-full object-cover"
            />
            {item.is_bestseller && (
              <span className="absolute top-3 left-3 bg-[#F97316] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                Bestseller
              </span>
            )}
            {showFav && (
              <button
                type="button"
                onClick={() => onToggleFav(item)}
                disabled={favBusy}
                aria-label={isSaved ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
                className={`absolute top-3 right-14 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer ${
                  isSaved ? "text-[#F97316]" : "text-zinc-500 hover:text-[#F97316]"
                }`}
              >
                {favBusy ? (
                  <span className="w-3 h-3 rounded-full border-2 border-[#F97316] border-t-transparent animate-spin" />
                ) : (
                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} strokeWidth={2} />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="p-5 pb-6">
            <h3 className="text-lg font-extrabold tracking-tight text-zinc-900">{item.name}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {restaurantName && <p className="text-xs text-zinc-400">from {restaurantName}</p>}
              {item.category && (
                <span className="text-[11px] font-bold bg-orange-50 text-[#F97316] px-2 py-0.5 rounded-full">
                  {item.category}
                </span>
              )}
            </div>
            {restaurantInfo && (restaurantInfo.delivery_time || deliveryLabel) && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-500">
                <Truck size={13} strokeWidth={2} />
                {[restaurantInfo.delivery_time, deliveryLabel].filter(Boolean).join(" • ")}
              </p>
            )}
            {item.description && (
              <p className="text-sm text-zinc-500 mt-2.5 leading-relaxed">{item.description}</p>
            )}
            {soldOut ? (
              <p className="mt-3 text-sm font-bold text-red-500">Sold out right now</p>
            ) : (
              (item.stock_quantity != null || item.max_per_order != null) && (
                <p className="mt-3 text-xs font-semibold text-zinc-500">
                  {item.stock_quantity != null && <>Only {item.stock_quantity} left · </>}
                  Max {maxQty} per order
                </p>
              )
            )}

            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-lg font-extrabold text-zinc-900">
                {item.discount_price != null ? (
                  <>
                    <span className="text-zinc-400 line-through font-normal mr-1.5">{formatPrice(item.price)}</span>
                    {formatPrice(item.discount_price)}
                  </>
                ) : (
                  formatPrice(item.price)
                )}
              </span>
              {orderable && !soldOut && (
                <div className="flex items-center gap-1 border border-zinc-200 rounded-lg px-1 py-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                    className="w-7 h-7 rounded-md text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-zinc-900">{cappedQty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={cappedQty >= maxQty}
                    aria-label="Increase quantity"
                    title={cappedQty >= maxQty ? `Max ${maxQty} per order` : "Increase quantity"}
                    className="w-7 h-7 rounded-md text-[#F97316] hover:bg-orange-50 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            {showRelated && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-900 mb-2.5">Goes well with</p>
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {relatedItems.map((dish) => (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => onSelectRelated(dish)}
                      aria-label={`View ${dish.name}`}
                      className="shrink-0 w-[104px] text-left border border-zinc-100 rounded-xl overflow-hidden hover:border-[#F97316]/60 hover:shadow-sm transition-all cursor-pointer bg-white"
                    >
                      <img
                        src={dish.image_url || restaurantImage(dish.name)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                        alt={dish.name}
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-cover"
                      />
                      <div className="p-1.5">
                        <p className="text-[11px] font-semibold text-zinc-800 leading-snug">{dish.name}</p>
                        <p className="text-[11px] font-extrabold text-[#F97316]">{formatPrice(dish.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showCross && (
              <div className="mt-4">
                <p className="text-xs font-bold text-zinc-900 mb-2.5">Popular from other kitchens</p>
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {crossRestaurantItems.map((dish) => (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => onSelectCrossRestaurant(dish)}
                      aria-label={`View ${dish.name} from ${dish.restaurant_name}`}
                      className="shrink-0 w-[104px] text-left border border-zinc-100 rounded-xl overflow-hidden hover:border-[#F97316]/60 hover:shadow-sm transition-all cursor-pointer bg-white"
                    >
                      <img
                        src={dish.image_url || restaurantImage(dish.name)}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMG;
                        }}
                        alt={dish.name}
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-cover"
                      />
                      <div className="p-1.5">
                        <p className="text-[11px] font-semibold text-zinc-800 leading-snug">{dish.name}</p>
                        <p className="text-[11px] font-extrabold text-[#F97316]">{formatPrice(dish.price)}</p>
                        <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{dish.restaurant_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 bg-white border-t border-zinc-100 px-5 py-4 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] rounded-b-3xl">
          {added ? (
            <div className="flex items-center gap-2.5">
              <span className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-sm py-3 rounded-2xl">
                <Check size={16} strokeWidth={2.5} /> Added to cart
              </span>
              <Link
                to="/checkout"
                onClick={onClose}
                className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm px-4 py-3 rounded-2xl transition-colors cursor-pointer shrink-0"
              >
                View Cart
              </Link>
            </div>
          ) : orderable ? (
            soldOut ? (
              <span className="block w-full text-center bg-zinc-100 text-zinc-400 font-semibold text-sm py-3 rounded-2xl select-none">
                Sold out
              </span>
            ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm py-3 rounded-2xl transition-colors cursor-pointer"
            >
              Add {cappedQty} to Cart • {totalPrice}
            </button>
            )
          ) : (
            <span className="block w-full text-center border border-zinc-200 text-zinc-300 font-semibold text-sm py-3 rounded-2xl select-none">
              View Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
