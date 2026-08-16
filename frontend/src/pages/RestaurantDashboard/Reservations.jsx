import { useState, useEffect } from "react";
import { CalendarClock, RefreshCw, Phone, MessageSquareText } from "lucide-react";
import { reservationApi } from "../../features/api/apiSlice";

const STATUS_META = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-500" },
  no_show: { label: "No Show", color: "bg-zinc-100 text-zinc-500" },
};

const statusColor = (status) => STATUS_META[status]?.color || "bg-zinc-50 text-zinc-500";
const statusLabel = (status) => STATUS_META[status]?.label || status;

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => {
    reservationApi.getForRestaurant()
      .then((r) => setReservations(r.data.reservations))
      .catch(() => setError("Failed to load reservations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (reservation, status) => {
    setUpdatingId(reservation.id);
    setError(null);
    try {
      await reservationApi.updateStatus(reservation.id, status);
      load();
    } catch {
      setError("Failed to update reservation status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === "all"
    ? reservations
    : reservations.filter((r) => r.status === filter);

  const filters = ["all", "pending", "confirmed", "completed", "cancelled", "no_show"];

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
            <div className="h-5 bg-zinc-100 rounded w-40 mb-3" />
            <div className="h-4 bg-zinc-100 rounded w-full mb-2" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Reservations</h1>
      <p className="text-zinc-400 mb-6">Confirm, complete or no-show every table booking.</p>

      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filter === "all" ? "bg-zinc-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]" : "bg-white text-zinc-500 hover:text-zinc-900 shadow-sm"}`}>
          All ({reservations.length})
        </button>
        {filters.filter((f) => f !== "all").map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap capitalize transition-all ${filter === f ? "bg-zinc-900 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]" : "bg-white text-zinc-500 hover:text-zinc-900 shadow-sm"}`}>
            {statusLabel(f)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }} className="inline-flex items-center gap-1.5 font-semibold hover:text-red-700"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl py-20 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
            <CalendarClock size={26} />
          </div>
          <p className="font-semibold text-zinc-700 mb-1">No reservations yet</p>
          <p className="text-sm text-zinc-400">When guests book a table at your restaurant, they'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((reservation) => {
            const actionable = reservation.status === "pending" || reservation.status === "confirmed";
            return (
              <div key={reservation.id} className="bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-extrabold text-zinc-900">Reservation #{reservation.id}</span>
                      {reservation.status === "pending" && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(reservation.status)}`}>
                        {statusLabel(reservation.status)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-800">{reservation.guest_name}</p>
                    <p className="text-sm text-zinc-500">
                      {formatDate(reservation.reservation_date)} · {reservation.reservation_time} · {reservation.party_size} {reservation.party_size === "8+ Guests" ? "" : "Guests"}
                    </p>
                    {reservation.special_requests && (
                      <p className="text-xs text-zinc-500 mt-2 inline-flex items-start gap-1.5 bg-[#F8F9FA] border border-zinc-100 rounded-lg px-3 py-2">
                        <MessageSquareText size={12} className="text-red-500 shrink-0 mt-0.5" /> {reservation.special_requests}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-2 inline-flex items-center gap-1.5">
                      <Phone size={11} /> {reservation.guest_phone}
                    </p>
                  </div>
                </div>

                {actionable && (
                  <div className="flex flex-wrap gap-2.5">
                    {reservation.status === "pending" ? (
                      <button
                        onClick={() => handleStatus(reservation, "confirmed")}
                        disabled={updatingId === reservation.id}
                        className="text-sm font-semibold px-4 py-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === reservation.id ? "Updating..." : "Confirm Booking"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatus(reservation, "completed")}
                          disabled={updatingId === reservation.id}
                          className="text-sm font-semibold px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingId === reservation.id ? "Updating..." : "Mark Completed"}
                        </button>
                        <button
                          onClick={() => handleStatus(reservation, "no_show")}
                          disabled={updatingId === reservation.id}
                          className="text-sm font-semibold px-4 py-2 rounded-full border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition disabled:opacity-50"
                        >
                          No Show
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleStatus(reservation, "cancelled")}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}