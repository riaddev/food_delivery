const cache = new Map();
const TTL = 5 * 60 * 1000;

export function getCachedRestaurant(id) {
  return cache.get(id)?.data ?? null;
}

export function getRestaurantData(id) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.ts < TTL) return hit.promise;
  const promise = fetch(`/api/restaurants/${id}`, { headers: { Accept: "application/json" } })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      cache.set(id, { data, ts: Date.now(), promise });
      return data;
    })
    .catch((err) => {
      cache.delete(id);
      throw err;
    });
  cache.set(id, { ts: Date.now(), promise });
  return promise;
}

export function prefetchRestaurant(id) {
  if (!id) return;
  getRestaurantData(id).catch(() => {});
}