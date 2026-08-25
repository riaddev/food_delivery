export const RESERVATION_DURATION_MINUTES = 120;

export function timeToMinutes(value) {
  const m = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function reservationWindowsOverlap(timeA, timeB) {
  const a = timeToMinutes(timeA);
  const b = timeToMinutes(timeB);
  if (a == null || b == null) return false;
  return a < b + RESERVATION_DURATION_MINUTES && b < a + RESERVATION_DURATION_MINUTES;
}

export function formatTime12h(value) {
  if (!value) return "";
  const m = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(value);
  let h = Number(m[1]);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
}
