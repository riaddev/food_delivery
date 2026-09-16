// Shared cart / order guardrails. Mirrors backend config/order.php defaults.
// Per-item caps can be overridden by the API (max_per_order, stock_quantity).

export const ORDER_LIMITS = {
  defaultMaxPerItem: 10,
  maxDistinctItems: 20,
  maxTotalUnits: 50,
  hardMaxPerItem: 100,
  hardMaxTotalUnits: 200,
  reviewAtUnits: 20,
};

export function getItemCap(item, restaurant) {
  const candidates = [
    item?.max_per_order,
    item?.maxPerOrder,
    restaurant?.default_max_per_item,
    ORDER_LIMITS.defaultMaxPerItem,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isInteger(n) && n >= 1) {
      return Math.min(n, ORDER_LIMITS.hardMaxPerItem);
    }
  }
  return ORDER_LIMITS.defaultMaxPerItem;
}

export function getStockCap(item) {
  if (item?.stock_quantity === null || item?.stock_quantity === undefined || item?.stock_quantity === "") {
    return null;
  }
  const n = Number(item.stock_quantity);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function getEffectiveCap(item, restaurant, alreadyInCart = 0) {
  const perOrder = getItemCap(item, restaurant);
  const stock = getStockCap(item);
  const remainingDaily =
    item?.remaining_daily === null || item?.remaining_daily === undefined
      ? null
      : Number(item.remaining_daily);
  let cap = perOrder;
  if (stock !== null) cap = Math.min(cap, Math.max(0, stock));
  if (remainingDaily !== null && Number.isFinite(remainingDaily)) cap = Math.min(cap, Math.max(0, remainingDaily));
  void alreadyInCart;
  return Math.max(0, cap);
}

export function isSoldOut(item) {
  if (item?.is_sold_out === true) return true;
  const stock = getStockCap(item);
  if (stock !== null && stock <= 0) return true;
  if (item?.is_available === false) return true;
  if (Number(item?.remaining_daily) === 0) return true;
  return false;
}

export function formatLimitError(err) {
  const data = err?.response?.data;
  if (!data) return "Failed to place order";
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  const errors = data.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find(Boolean);
    if (first) return String(first);
  }
  return "Failed to place order";
}
