import { useState } from "react";
import { Calendar, CheckCircle, X, Loader2 } from "lucide-react";
import { reservationApi } from "../features/api/apiSlice";

const PARTY_SIZES = ["2", "4", "6", "8", "8+ Guests"];

const inputClass =
  "w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#E03546] focus:ring-2 focus:ring-[#E03546]/15 transition-colors bg-white placeholder:text-zinc-400";

const fieldLabel = "block text-sm font-semibold text-zinc-700 mb-1.5";

export default function ReservationModal({ open, onClose, restaurant, user }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await reservationApi.create({
        restaurant_id: restaurant.id,
        guest_name: name,
        guest_phone: phone,
        reservation_date: date,
        reservation_time: time,
        party_size: partySize,
        special_requests: specialRequests.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setSubmitted(false);
      setError("");
      setDate("");
      setTime("");
      setPartySize("2");
      setSpecialRequests("");
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close reservation"
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
        >
          <X size={19} strokeWidth={2} />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <span className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle size={40} strokeWidth={2} />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-6">Reservation Requested!</h1>
            <p className="text-zinc-500 text-sm mt-2.5 leading-relaxed">
              The restaurant will confirm your booking shortly.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 w-full py-3 rounded-xl font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-[#E03546]/10 text-[#E03546] flex items-center justify-center">
                <Calendar size={20} strokeWidth={2} />
              </span>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Reserve a Table</h1>
                <p className="text-xs text-zinc-500">at {restaurant?.restaurant_name}</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mt-5">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Party Size</label>
                <div className="flex flex-wrap gap-2">
                  {PARTY_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPartySize(size)}
                      aria-pressed={partySize === size}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                        partySize === size
                          ? "bg-[#E03546] text-white border-[#E03546]"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-[#E03546] hover:text-[#E03546]"
                      }`}
                    >
                      {size} {size !== "8+ Guests" && "Guests"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Special Requests</label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests? (e.g., Window seat, birthday cake)"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Requesting...
                  </>
                ) : (
                  "Request Reservation"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}