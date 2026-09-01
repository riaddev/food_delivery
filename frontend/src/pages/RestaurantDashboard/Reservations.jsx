import { useEffect, useState } from "react";
import { Armchair, CalendarClock, RefreshCw, Phone, MessageSquareText, X, XCircle } from "lucide-react";
import { reservationApi, restaurantApi } from "../../features/api/apiSlice";
import { formatTime12h, reservationWindowsOverlap } from "../../utils/reservationConfig";

const STATUS_META = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-500" },
  no_show: { label: "No Show", color: "bg-zinc-100 text-zinc-500" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-500" },
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

const partySizeLabel = (size) => {
  const s = String(size ?? "");
  if (!s) return "—";
  return s === "8+ Guests" ? s : `${s} Guests`;
};

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-5 right-5 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold ${
        isError ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-700"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-red-500" : "bg-emerald-500"}`} />
      {toast.msg}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-[13px] text-text-muted shrink-0">{label}</span>
      <span className="text-[13px] font-semibold text-text-primary text-right">{children}</span>
    </div>
  );
}

export function ReservationDetailsModal({ reservation, onClose }) {
  if (!reservation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[17px] font-bold text-text-primary m-0">
                Reservation #{reservation.id}
              </h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(reservation.status)}`}>
                {statusLabel(reservation.status)}
              </span>
            </div>
            <p className="text-[13px] text-text-muted mt-0.5 mb-0">Reservation details</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-surface rounded-[13px] border border-border p-3.5 mt-4 divide-y divide-border">
          <DetailRow label="Reservation ID">#{reservation.id}</DetailRow>
          <DetailRow label="Customer">{reservation.guest_name || "Guest"}</DetailRow>
          <DetailRow label="Phone">
            <span className="inline-flex items-center gap-1.5">
              <Phone size={12} className="text-orange-primary" /> {reservation.guest_phone}
            </span>
          </DetailRow>
          <DetailRow label="Date">{formatDate(reservation.reservation_date)}</DetailRow>
          <DetailRow label="Time">{formatTime12h(reservation.reservation_time)}</DetailRow>
          <DetailRow label="Guests">{partySizeLabel(reservation.party_size)}</DetailRow>
          {reservation.table_number && (
            <DetailRow label="Table">
              <span className="inline-flex items-center gap-1.5 text-orange-deep">
                <Armchair size={12} /> Table {reservation.table_number}
                {reservation.table_seats ? ` · ${reservation.table_seats} seats` : ""}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Status">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(reservation.status)}`}>
              {statusLabel(reservation.status)}
            </span>
          </DetailRow>
        </div>

        {reservation.special_requests && (
          <div className="mt-3.5">
            <p className="text-[12.5px] font-semibold text-text-muted m-0 mb-1">Special Requests</p>
            <p className="text-[13px] text-text-primary bg-surface border border-border rounded-[10px] px-3.5 py-2.5 m-0 leading-relaxed flex items-start gap-1.5">
              <MessageSquareText size={13} className="text-orange-primary shrink-0 mt-0.5" />
              "{reservation.special_requests}"
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold border border-border text-text-muted hover:text-text-primary hover:border-zinc-300 transition-colors cursor-pointer font-outfit bg-none"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function RejectReservationModal({ reservation, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  if (!reservation) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reservation);
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-sm shadow-2xl">
        <div className="w-11 h-11 rounded-full bg-red-50 text-danger flex items-center justify-center mb-3">
          <XCircle size={20} strokeWidth={2} />
        </div>
        <h3 className="text-[16px] font-bold text-text-primary mb-1">Reject Reservation?</h3>
        <p className="text-[13px] text-text-muted mb-5">
          Are you sure you want to reject this reservation?
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit disabled:opacity-50"
          >
            Keep Reservation
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 bg-danger hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
          >
            {busy ? "Rejecting..." : "Reject Reservation"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignTableModal({ reservation, reservations = [], onClose, onAssign, onUnassign }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reservation) return undefined;
    restaurantApi.getTables()
      .then((r) => setTables(r.data.tables || []))
      .catch(() => setError("Failed to load tables"))
      .finally(() => setLoading(false));
    return undefined;
  }, [reservation]);

  if (!reservation) return null;

  const guests = parseInt(reservation.party_size, 10) || 0;
  const available = tables.filter((t) => t.status === "available");

  // Tables already holding an overlapping confirmed reservation on this date.
  const bookedTableIds = new Set(
    reservations
      .filter((r) =>
        r.status === "confirmed" &&
        r.id !== reservation.id &&
        r.restaurant_table_id &&
        r.reservation_date === reservation.reservation_date &&
        reservationWindowsOverlap(r.reservation_time, reservation.reservation_time)
      )
      .map((r) => r.restaurant_table_id)
  );

  const openTables = available.filter((t) => !bookedTableIds.has(t.id));
  const fitting = openTables
    .filter((t) => Number(t.seats) >= guests)
    .sort((a, b) => Number(a.seats) - Number(b.seats) || a.name.localeCompare(b.name));
  const booked = available.filter((t) => bookedTableIds.has(t.id));
  const tooSmall = openTables
    .filter((t) => Number(t.seats) < guests)
    .sort((a, b) => Number(b.seats) - Number(a.seats));

  const runAction = async (action, key) => {
    setBusyId(key);
    setError("");
    try {
      await action();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Failed to assign the table.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-[17px] font-bold text-text-primary m-0">Assign Table</h3>
            <p className="text-[13px] text-text-muted mt-0.5 mb-0">
              Reservation #{reservation.id} · {reservation.guest_name} · {guests} guest{guests === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mt-4">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2.5 mt-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-surface border border-border rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {fitting.length > 0 ? (
              <div className="mt-5 space-y-2.5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-text-light m-0">
                  Available for {guests} guest{guests === 1 ? "" : "s"}
                </p>
                {fitting.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => runAction(() => onAssign(table), table.id)}
                    disabled={busyId !== null}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border text-left transition-colors cursor-pointer disabled:opacity-60 ${
                      reservation.restaurant_table_id === table.id
                        ? "border-orange-primary bg-orange-soft/40"
                        : "border-border hover:border-orange-primary hover:bg-orange-soft/20"
                    }`}
                  >
                    <Armchair size={17} className="text-orange-deep shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-text-primary truncate">{table.name}</span>
                      <span className="block text-xs text-text-muted">{table.seats} seats</span>
                    </span>
                    {reservation.restaurant_table_id === table.id && (
                      <span className="text-[11px] font-bold text-orange-primary whitespace-nowrap">Current</span>
                    )}
                    <span className="text-xs font-semibold text-orange-primary whitespace-nowrap">
                      {busyId === table.id ? "Assigning..." : "Assign"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-[10px] px-3.5 py-3 mt-5 text-sm text-text-muted">
                No available table fits {guests} guest{guests === 1 ? "" : "s"}. Add or re-enable larger tables first.
              </div>
            )}

            {tooSmall.length > 0 && (
              <details className="mt-3">
                <summary className="text-[12px] font-semibold text-text-light cursor-pointer">
                  Tables too small for this party ({tooSmall.length})
                </summary>
                <p className="text-xs text-text-light mt-1.5 mb-0">
                  {tooSmall.map((t) => `${t.name} (${t.seats})`).join(", ")}
                </p>
              </details>
            )}

            {booked.length > 0 && (
              <details className="mt-2">
                <summary className="text-[12px] font-semibold text-text-light cursor-pointer">
                  Booked around this time ({booked.length})
                </summary>
                <p className="text-xs text-text-light mt-1.5 mb-0">
                  {booked.map((t) => `${t.name} (${t.seats})`).join(", ")}
                </p>
              </details>
            )}

            {tables.some((t) => t.status === "disabled") && (
              <details className="mt-2">
                <summary className="text-[12px] font-semibold text-text-light cursor-pointer">
                  Disabled tables
                </summary>
                <p className="text-xs text-text-light mt-1.5 mb-0">
                  {tables.filter((t) => t.status === "disabled").map((t) => `${t.name} (${t.seats})`).join(", ")}
                </p>
              </details>
            )}

            {reservation.table_number && (
              <button
                onClick={() => runAction(onUnassign, "unassign")}
                disabled={busyId !== null}
                className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer font-outfit bg-none disabled:opacity-50"
              >
                {busyId === "unassign" ? "Unassigning..." : `Unassign Table ${reservation.table_number}`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CancelReservationModal({ reservation, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);

  if (!reservation) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reservation);
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-sm shadow-2xl">
        <div className="w-11 h-11 rounded-full bg-red-50 text-danger flex items-center justify-center mb-3">
          <XCircle size={20} strokeWidth={2} />
        </div>
        <h3 className="text-[16px] font-bold text-text-primary mb-1">Cancel this reservation?</h3>
        <p className="text-[13px] text-text-muted mb-5">
          Are you sure you want to cancel the reservation for {reservation.guest_name || "this guest"}? The table
          will be released and the customer will see the cancelled status.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit disabled:opacity-50"
          >
            Keep Reservation
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 bg-danger hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
          >
            {busy ? "Cancelling..." : "Cancel Reservation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [rejectReservation, setRejectReservation] = useState(null);
  const [cancelReservation, setCancelReservation] = useState(null);
  const [assignReservation, setAssignReservation] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const load = () => {
    reservationApi.getForRestaurant()
      .then((r) => setReservations(r.data.reservations))
      .catch(() => setError("Failed to load reservations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (reservation, status) => {
    setUpdatingId(reservation.id);
    try {
      await reservationApi.updateStatus(reservation.id, status);
      load();
      showToast(`Reservation #${reservation.id} ${statusLabel(status).toLowerCase()}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast(errors?.status?.[0] || err.response?.data?.message || `Failed to update reservation #${reservation.id}`, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssign = async (table) => {
    await restaurantApi.assignReservationTable(assignReservation.id, table.id);
    showToast(`Table ${table.name} assigned successfully.`);
    load();
  };

  const handleUnassign = async () => {
    await restaurantApi.assignReservationTable(assignReservation.id, null);
    showToast(`Table unassigned from reservation #${assignReservation.id}`);
    load();
  };

  const filtered = filter === "all"
    ? reservations
    : reservations.filter((r) => r.status === filter);

  const filters = ["all", "pending", "confirmed", "completed", "cancelled", "no_show", "rejected"];

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-[13px] border border-border p-6 animate-pulse">
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
      <Toast toast={toast} />

      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${filter === "all" ? "bg-orange-primary text-white" : "bg-card text-text-muted border border-border hover:text-text-primary"}`}>
          All ({reservations.length})
        </button>
        {filters.filter((f) => f !== "all").map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap capitalize transition-all cursor-pointer ${filter === f ? "bg-orange-primary text-white" : "bg-card text-text-muted border border-border hover:text-text-primary"}`}>
            {statusLabel(f)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }} className="inline-flex items-center gap-1.5 font-semibold hover:text-red-700 cursor-pointer"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card rounded-[13px] border border-border py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-soft flex items-center justify-center text-orange-deep mb-4">
            <CalendarClock size={26} />
          </div>
          <p className="font-semibold text-text-primary mb-1">No reservations yet</p>
          <p className="text-sm text-text-muted">When guests book a table at your restaurant, they'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((reservation) => (
            <div key={reservation.id} className="bg-card rounded-[13px] border border-border p-4 md:p-6 max-w-2xl transition-all duration-300 hover:border-zinc-300">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="font-bold text-text-primary">Reservation #{reservation.id}</span>
                    {reservation.status === "pending" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-dot" />
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(reservation.status)}`}>
                      {statusLabel(reservation.status)}
                    </span>
                    {reservation.table_number && (
                      <span className="inline-flex items-center gap-1 bg-orange-soft text-orange-deep text-xs font-bold px-2.5 py-0.5 rounded-full">
                        <Armchair size={11} /> Table {reservation.table_number}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{reservation.guest_name}</p>
                  <p className="text-sm text-text-muted">
                    {formatDate(reservation.reservation_date)} · {formatTime12h(reservation.reservation_time)} · {partySizeLabel(reservation.party_size)}
                  </p>
                  <p className="text-xs text-text-light mt-2 inline-flex items-center gap-1.5">
                    <Phone size={11} /> {reservation.guest_phone}
                  </p>
                  {reservation.special_requests && (
                    <p className="text-xs text-text-muted mt-2 inline-flex items-start gap-1.5 bg-surface border border-border rounded-lg px-3 py-2">
                      <MessageSquareText size={12} className="text-orange-primary shrink-0 mt-0.5" /> {reservation.special_requests}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setDetailsReservation(reservation)}
                  disabled={updatingId === reservation.id}
                  className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-muted hover:border-zinc-300 hover:text-text-primary transition disabled:opacity-50 cursor-pointer"
                >
                  View Details
                </button>

                {reservation.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatus(reservation, "confirmed")}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-primary text-white hover:bg-orange-deep transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-outfit"
                    >
                      {updatingId === reservation.id ? "Updating..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setRejectReservation(reservation)}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}

                {reservation.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => setAssignReservation(reservation)}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-orange-primary text-white hover:bg-orange-deep transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-outfit inline-flex items-center gap-1.5"
                    >
                      <Armchair size={14} /> {reservation.table_number ? "Change Table" : "Assign Table"}
                    </button>
                    <button
                      onClick={() => handleStatus(reservation, "completed")}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {updatingId === reservation.id ? "Updating..." : "Mark Completed"}
                    </button>
                    <button
                      onClick={() => handleStatus(reservation, "no_show")}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-muted hover:border-zinc-300 hover:text-text-primary transition disabled:opacity-50 cursor-pointer"
                    >
                      No Show
                    </button>
                    <button
                      onClick={() => setCancelReservation(reservation)}
                      disabled={updatingId === reservation.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ReservationDetailsModal
        reservation={detailsReservation}
        onClose={() => setDetailsReservation(null)}
      />
      <RejectReservationModal
        reservation={rejectReservation}
        onClose={() => setRejectReservation(null)}
        onConfirm={(r) => handleStatus(r, "rejected")}
      />
      <CancelReservationModal
        reservation={cancelReservation}
        onClose={() => setCancelReservation(null)}
        onConfirm={(r) => handleStatus(r, "cancelled")}
      />
      <AssignTableModal
        reservation={assignReservation}
        reservations={reservations}
        onClose={() => setAssignReservation(null)}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </div>
  );
}
