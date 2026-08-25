import { useState } from "react";
import { Calendar, CheckCircle, Minus, Plus, X, Loader2 } from "lucide-react";
import { reservationApi } from "../features/api/apiSlice";

const MIN_PARTY = 1;
const MAX_PARTY = 20;

const inputClass =
  "w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15 transition-colors bg-white placeholder:text-zinc-400";

const fieldLabel = "block text-sm font-semibold text-zinc-700 mb-1.5";

const stepButtonClass = (disabled) =>
  `w-11 h-11 shrink-0 border border-zinc-200 flex items-center justify-center transition-colors cursor-pointer ${
    disabled
      ? "text-zinc-300 cursor-not-allowed"
      : "text-zinc-600 hover:border-[#F97316] hover:text-[#F97316]"
  }`;

const formatDateLong = (value) => {
  if (!value) return "";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

const formatTime12h = (value) => {
  if (!value) return "";
  const m = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return value;
  let h = Number(m[1]);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
};

export default function ReservationModal({ open, onClose, restaurant, user }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");
  const [typedName, setTypedName] = useState("");
  const [typedPhone, setTypedPhone] = useState("");
  const name = typedName || user?.name || "";
  const phone = typedPhone || user?.phone || "";
  const [error, setError] = useState("");
  const [partyError, setPartyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  if (!open) return null;

  const partyNum = parseInt(partySize, 10);
  const partyValid = Number.isInteger(partyNum) && partyNum >= MIN_PARTY && partyNum <= MAX_PARTY;

  const changePartySize = (delta) => {
    setPartyError("");
    const current = partyValid ? partyNum : MIN_PARTY;
    const next = Math.min(MAX_PARTY, Math.max(MIN_PARTY, current + delta));
    setPartySize(String(next));
  };

  const handlePartySizeInput = (value) => {
    setPartySize(value.replace(/\D/g, "").slice(0, 3));
    setPartyError("");
  };

  const normalizePartySize = () => {
    if (!partySize) {
      setPartySize(String(MIN_PARTY));
      return;
    }
    if (!partyValid) {
      setPartySize(String(Math.min(MAX_PARTY, Math.max(MIN_PARTY, partyNum || MIN_PARTY))));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Please select a reservation date.");
      return;
    }
    if (!time) {
      setError("Please select a reservation time.");
      return;
    }
    if (!Number.isInteger(partyNum) || partyNum < MIN_PARTY || partyNum > MAX_PARTY) {
      setPartyError(`Please enter a party size between ${MIN_PARTY} and ${MAX_PARTY} guests.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await reservationApi.create({
        restaurant_id: restaurant.id,
        guest_name: name,
        guest_phone: phone,
        reservation_date: date,
        reservation_time: time,
        party_size: partyNum,
        special_requests: specialRequests.trim() || null,
      });
      setConfirmedReservation(res.data?.reservation || null);
      setSubmitted(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.party_size) {
        setPartyError(errors.party_size[0]);
      } else {
        setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setSubmitted(false);
      setError("");
      setPartyError("");
      setDate("");
      setTime("");
      setPartySize("2");
      setSpecialRequests("");
      setConfirmedReservation(null);
    }, 200);
  };

  const reservationDetails = confirmedReservation;
  const detailRestaurantName =
    reservationDetails?.restaurant?.restaurant_name || restaurant?.restaurant_name || "";
  const detailDate = formatDateLong(reservationDetails?.reservation_date || date);
  const detailTime = formatTime12h(reservationDetails?.reservation_time || time);
  const detailGuests = parseInt(reservationDetails?.party_size ?? partySize, 10);

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
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-6">Reservation Request Sent</h1>
            {detailRestaurantName && (
              <p className="text-sm font-semibold text-[#F97316] mt-1.5">{detailRestaurantName}</p>
            )}

            <div className="mt-6 bg-zinc-50 rounded-xl px-4 py-3.5 text-left text-sm space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Date</span>
                <span className="font-semibold text-zinc-900">{detailDate}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Time</span>
                <span className="font-semibold text-zinc-900">{detailTime}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500">Guests</span>
                <span className="font-semibold text-zinc-900">{detailGuests}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-0.5">
                <span className="text-zinc-500">Status</span>
                <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#F97316] text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]" /> Pending
                </span>
              </div>
            </div>

            <p className="text-zinc-500 text-sm mt-5 leading-relaxed">
              Your reservation request has been sent to the restaurant. The restaurant will review your request and
              assign a table if approved.
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
              <span className="w-10 h-10 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center">
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

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Date *</label>
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
                  <label className={fieldLabel}>Time *</label>
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
                <label htmlFor="reservation-party-size" className={fieldLabel}>Party Size *</label>
                <div className="inline-flex items-stretch">
                  <button
                    type="button"
                    onClick={() => changePartySize(-1)}
                    disabled={!partyValid || partyNum <= MIN_PARTY}
                    aria-label="Decrease party size"
                    className={`${stepButtonClass(!partyValid || partyNum <= MIN_PARTY)} rounded-l-xl`}
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>
                  <input
                    id="reservation-party-size"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={partySize}
                    onChange={(e) => handlePartySizeInput(e.target.value)}
                    onBlur={normalizePartySize}
                    aria-label="Number of guests"
                    aria-invalid={!partyValid}
                    className={`w-14 border-y border-zinc-200 py-2.5 text-sm font-bold text-center text-zinc-900 outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15 transition-colors bg-white ${
                      partyError ? "border-red-300" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => changePartySize(1)}
                    disabled={!partyValid || partyNum >= MAX_PARTY}
                    aria-label="Increase party size"
                    className={`${stepButtonClass(!partyValid || partyNum >= MAX_PARTY)} rounded-r-xl`}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>
                {partyError && <p className="text-xs text-red-500 mt-1.5">{partyError}</p>}
              </div>

              <div>
                <label className={fieldLabel}>Special Requests</label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests? e.g. window seat, birthday cake"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setTypedPhone(e.target.value)}
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
