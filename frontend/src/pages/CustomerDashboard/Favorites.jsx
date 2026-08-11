import { useState, useEffect } from "react";
import { customerApi } from "../../features/api/apiSlice";
import { formatPrice, restaurantImage } from "../../utils/foodImages";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    Promise.all([
      customerApi.getFavorites(),
      customerApi.getWishlistItems(),
    ]).then(([favRes, wishRes]) => {
      setFavorites(favRes.data.favorites);
      setWishlistItems(wishRes.data.wishlist_items);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFavorites(); }, []);

  const handleRemove = async (id) => {
    if (!confirm("Remove from favorites?")) return;
    try { await customerApi.removeFavorite(id); fetchFavorites(); } catch { alert("Failed to remove."); }
  };

  const handleRemoveWishlist = async (menuItemId) => {
    if (!confirm("Remove from wishlist?")) return;
    try { await customerApi.removeWishlistItem(menuItemId); fetchFavorites(); } catch { alert("Failed to remove."); }
  };

  if (loading) return <p className="text-gray-500">Loading favorites...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mt-0 mb-4">Favorite Restaurants</h2>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-4xl m-0 mb-3">❤️</p>
          <p className="text-gray-500 text-[15px] m-0">No favorite restaurants yet. Browse and save your favorites!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {favorites.map((fav) => {
            const r = fav.restaurant;
            return (
              <div key={fav.id} className="bg-white rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 text-[15px] mb-1">{r?.restaurant_name}</div>
                  <div className="flex gap-3 text-sm text-gray-500">
                    {r?.cuisine_type && <span>{r.cuisine_type}</span>}
                    {r?.city && <span>{r.city}</span>}
                    {r?.status && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleRemove(r.id)}
                  className="bg-none border border-red-200 rounded-lg px-3.5 py-1.5 text-xs text-red-600 cursor-pointer hover:bg-red-50">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-bold text-gray-900 mt-8 mb-4">Favorite Menu Items</h2>

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <p className="text-4xl m-0 mb-3">💛</p>
          <p className="text-gray-500 text-[15px] m-0">No favorite dishes yet. Tap the heart on a dish to save it here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {wishlistItems.map((wi) => {
            const item = wi.menu_item;
            const restaurant = item?.restaurant;
            return (
              <div key={wi.id} className="bg-white rounded-2xl px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-4">
                <img src={item?.image_url || restaurantImage(restaurant?.restaurant_name)} alt={item?.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-[15px] truncate">{item?.name}</div>
                  <div className="text-sm text-gray-500 truncate">{restaurant?.restaurant_name}</div>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">{formatPrice(item?.price)}</div>
                </div>
                <button onClick={() => handleRemoveWishlist(wi.menu_item_id)}
                  className="bg-none border border-red-200 rounded-lg px-3.5 py-1.5 text-xs text-red-600 cursor-pointer hover:bg-red-50 shrink-0">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;