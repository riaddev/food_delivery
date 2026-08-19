import { restaurantImage } from "../../../utils/foodImages";

export const formatBDT = (value) => `\u09F3${Number(value || 0).toLocaleString("en-IN")}`;

export const capitalize = (str = "") =>
  String(str)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const timeAgo = (dateStr) => {
  if (!dateStr) return "\u2014";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const formatDate = (dateStr, opts = {}) => {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...opts });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  served: "Served",
  cancelled: "Cancelled",
};

export const orderStatusLabel = (status) => ORDER_STATUS_LABELS[status] || capitalize(status);

export const ORDER_STATUS_COLOR = {
  pending: "#D97706",
  confirmed: "#2563EB",
  preparing: "#7C3AED",
  ready: "#0D9488",
  picked_up: "#0284C7",
  on_the_way: "#9333EA",
  delivered: "#16A34A",
  served: "#16A34A",
  cancelled: "#71717A",
};

export const ORDER_STATUS_TONE = {
  pending: "amber",
  confirmed: "blue",
  preparing: "violet",
  ready: "teal",
  picked_up: "sky",
  on_the_way: "purple",
  delivered: "green",
  served: "green",
  cancelled: "zinc",
};

export const ORDER_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked_up", "served", "on_the_way"],
  picked_up: ["on_the_way", "delivered"],
  on_the_way: ["delivered"],
  delivered: [],
  served: [],
  cancelled: [],
};

export const nextOrderStatuses = (status) => ORDER_TRANSITIONS[status] || [];

export const ACTIVE_ORDER_STATUSES = ["pending", "confirmed", "preparing", "ready", "picked_up", "on_the_way"];

export const COMPLETED_ORDER_STATUSES = ["delivered", "served"];

export const RESTAURANT_STATUS_TONE = {
  pending: "amber",
  approved: "green",
  rejected: "red",
  suspended: "red",
};

export const RIDER_STATUS_TONE = RESTAURANT_STATUS_TONE;

export const RIDER_STATE_TONE = {
  offline: "zinc",
  available: "green",
  delivering: "orange",
};

export const USER_STATUS_TONE = {
  active: "green",
  suspended: "red",
};

export const PAYMENT_STATUS_TONE = {
  paid: "green",
  pending: "amber",
  failed: "red",
  cancelled: "zinc",
  refunded: "purple",
};

export const paymentMethodLabel = (method) => {
  if (method === "bkash") return "bKash";
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  return capitalize(method);
};

export const initials = (name = "U") =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export { restaurantImage };