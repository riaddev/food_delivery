import { useState, useEffect } from "react";
import { customerApi } from "../../features/api/apiSlice";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    customerApi.getFavorites().then((r) => setFavorites(r.data.favorites)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFavorites(); }, []);

  const handleRemove = async (id) => {
    if (!confirm("Remove from favorites?")) return;
    try { await customerApi.removeFavorite(id); fetchFavorites(); } catch { alert("Failed to remove."); }
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
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
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
    </div>
  );
};

export default Favorites;
