import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";
import { useCart } from "../../context/CartContext";
import { formatPrice, restaurantImage } from "../../utils/foodImages";

export default function Wishlist() {
  const [favorites, setFavorites] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, cart } = useCart();

  const load = () => {
    Promise.all([
      customerApi.getFavorites(),
      customerApi.getWishlistItems(),
    ]).then(([favRes, wishRes]) => {
      setFavorites(favRes.data.favorites);
      setWishlistItems(wishRes.data.wishlist_items);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemoveFavorite = async (restaurantId) => {
    await customerApi.removeFavorite(restaurantId);
    load();
  };

  const handleRemoveWishlist = async (menuItemId) => {
    await customerApi.removeWishlistItem(menuItemId);
    load();
  };

  const handleAddToCart = (item) => {
    const restaurant = item.menu_item?.restaurant;
    addItem(restaurant?.id, restaurant?.restaurant_name, item.menu_item);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-3xl overflow-hidden animate-pulse">
            <div className="h-40 bg-zinc-100" />
            <div className="bg-white p-5">
              <div className="h-4 bg-zinc-100 rounded w-32 mb-2" />
              <div className="h-3 bg-zinc-100 rounded w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-8">Your Wishlist</h1>

      <section className="mb-12">
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 mb-5">Favourite Restaurants</h2>
        {favorites.length === 0 ? (
          <div className="bg-white rounded-3xl py-16 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <Heart size={28} />
            </div>
            <p className="font-semibold text-zinc-700 mb-1">No favourite restaurants yet</p>
            <p className="text-sm text-zinc-400 mb-5">Tap the heart on a restaurant to save it here.</p>
            <Link to="/restaurants" className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all">
              Browse Restaurants <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
                <div className="relative h-40">
                  <img src={restaurantImage(fav.restaurant?.restaurant_name)} alt={fav.restaurant?.restaurant_name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent" />
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                    <Heart size={17} fill="currentColor" />
                  </div>
                  {fav.restaurant?.cuisine_type && (
                    <span className="absolute bottom-3 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-zinc-700">
                      {fav.restaurant.cuisine_type}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveFavorite(fav.restaurant_id)}
                    className="absolute bottom-3 right-3 text-white/90 hover:text-white text-[11px] font-semibold underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
                <div className="p-5">
                  <p className="font-extrabold tracking-tight text-zinc-900 truncate">{fav.restaurant?.restaurant_name}</p>
                  <p className="text-sm text-zinc-400 truncate">{fav.restaurant?.description || fav.restaurant?.city || "Local favourite"}</p>
                  <Link to={`/restaurants/${fav.restaurant_id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 mt-3 transition-colors">
                    View Menu <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 mb-5">Favourite Menu Items</h2>
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-3xl py-12 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
              <ShoppingBag size={26} />
            </div>
            <p className="font-semibold text-zinc-700 mb-1">No favourite items yet</p>
            <p className="text-sm text-zinc-400">Browse a restaurant and add dishes to your wishlist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlistItems.map((wi) => {
              const item = wi.menu_item;
              const restaurant = item?.restaurant;
              const disabled = cart.restaurantId && cart.restaurantId !== restaurant?.id;
              return (
                <div key={wi.id} className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
                  <div className="flex gap-4">
                    <img src={item?.image_url || restaurantImage(restaurant?.restaurant_name)} alt={item?.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-900 text-sm truncate">{item?.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{restaurant?.restaurant_name}</p>
                      <p className="font-extrabold text-zinc-900 mt-1.5">{formatPrice(item?.price)}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveWishlist(wi.menu_item_id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors self-start"
                      title="Remove"
                    >
                      <Heart size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleAddToCart(wi)}
                    disabled={disabled}
                    className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-semibold py-2.5 rounded-full transition-all"
                  >
                    Add to Cart{disabled ? " · Different Restaurant" : ""}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}