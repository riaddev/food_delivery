import { useEffect, useState } from "react";
import { Armchair, Pencil, Plus, Power, RefreshCw, X } from "lucide-react";
import { reservationApi, restaurantApi } from "../../features/api/apiSlice";
import { RESERVATION_DURATION_MINUTES, formatTime12h } from "../../utils/reservationConfig";
import { ReservationDetailsModal } from "./Reservations";

const partySizeLabel = (size) => {
  const s = String(size ?? "");
  if (!s) return "—";
  return s === "8+ Guests" ? s : `${s} Guests`;
};

const tableDisplayName = (name) => {
  const s = String(name ?? "").trim();
  if (!s) return "Table";
  return /^table\b/i.test(s) ? s : `Table ${s}`;
};

const assignmentWhen = (r) => {
  const start = new Date(`${r.reservation_date}T${String(r.reservation_time || "00:00").slice(0, 5)}:00`);
  const time = formatTime12h(r.reservation_time);
  if (Number.isNaN(start.getTime())) return time;
  const day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day}, ${time}`;
};

const inputCls =
  "w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-light outline-none focus:border-orange-primary transition-colors";

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

function TableFormModal({ table, onClose, onSave }) {
  const [name, setName] = useState(table?.name || "");
  const [seats, setSeats] = useState(String(table?.seats ?? ""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(table);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a table number.");
      return;
    }
    const seatCount = Number(seats);
    if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 100) {
      setError("Seats must be a whole number between 1 and 100.");
      return;
    }

    setBusy(true);
    try {
      await onSave({ name: name.trim(), seats: seatCount });
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Failed to save the table.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-[16px] border border-border p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-[17px] font-bold text-text-primary m-0">
            {isEdit ? "Edit Table" : "Add Table"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-light hover:text-text-primary cursor-pointer border-none bg-none shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-[13px] text-text-muted mt-0.5 mb-4">Guests never pick tables — you assign them later.</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="table-name" className="block text-[13px] font-semibold text-text-muted mb-1.5">
              Table Number *
            </label>
            <input
              id="table-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Table 1, Window Booth"
              maxLength={50}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="table-seats" className="block text-[13px] font-semibold text-text-muted mb-1.5">
              Seats *
            </label>
            <input
              id="table-seats"
              type="number"
              min="1"
              max="100"
              step="1"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              onBlur={() => seats && setSeats(String(Math.min(100, Math.max(1, Math.round(Number(seats) || 1)))))}
              required
              className={inputCls}
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 text-text-muted hover:text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-zinc-300 cursor-pointer font-outfit disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-4 py-2.5 rounded-lg cursor-pointer font-outfit"
            >
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Add Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formTable, setFormTable] = useState(null); // null | "new" | table object
  const [updatingId, setUpdatingId] = useState(null);
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [toast, setToast] = useState(null);
  const [nowTs, setNowTs] = useState(0);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2800);
  };

  const load = () => {
    Promise.all([
      restaurantApi.getTables(),
      reservationApi.getForRestaurant().catch(() => null),
    ])
      .then(([tablesRes, reservationsRes]) => {
        setTables(tablesRes.data.tables || []);
        if (reservationsRes) setReservations(reservationsRes.data.reservations || []);
        setNowTs(Date.now());
      })
      .catch(() => setError("Failed to load tables"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Upcoming confirmed assignments per table: dining windows (start + duration) that haven't fully passed.
  const assignmentsByTableId = (() => {
    const map = new Map();
    reservations
      .filter((r) => r.status === "confirmed" && r.restaurant_table_id)
      .forEach((r) => {
        const start = new Date(`${r.reservation_date}T${String(r.reservation_time || "00:00").slice(0, 5)}:00`);
        if (Number.isNaN(start.getTime())) return;
        const end = start.getTime() + RESERVATION_DURATION_MINUTES * 60000;
        if (nowTs && end <= nowTs) return;
        const list = map.get(r.restaurant_table_id) || [];
        list.push({ reservation: r, start });
        map.set(r.restaurant_table_id, list);
      });
    map.forEach((list) => list.sort((a, b) => a.start - b.start));
    return map;
  })();

  const handleSave = async ({ name, seats }) => {
    if (formTable === "new") {
      await restaurantApi.createTable({ name, seats });
      showToast(`Table "${name}" added`);
    } else {
      await restaurantApi.updateTable(formTable.id, { name, seats });
      showToast(`Table "${name}" updated`);
    }
    load();
  };

  const handleToggleStatus = async (table) => {
    const next = table.status === "available" ? "disabled" : "available";
    setUpdatingId(table.id);
    try {
      await restaurantApi.updateTableStatus(table.id, next);
      load();
      showToast(`Table "${table.name}" ${next === "available" ? "enabled" : "disabled"}`);
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast(errors?.status?.[0] || err.response?.data?.message || "Failed to update the table", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-[13px] border border-border p-6 animate-pulse">
            <div className="h-5 bg-zinc-100 rounded w-40 mb-3" />
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <Toast toast={toast} />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <p className="text-[13px] font-semibold text-text-muted m-0">
          {tables.length} Table{tables.length === 1 ? "" : "s"} ·{" "}
          {tables.filter((t) => t.status === "available" && !(assignmentsByTableId.get(t.id) || []).length).length} Available ·{" "}
          {tables.filter((t) => (assignmentsByTableId.get(t.id) || []).length > 0).length} Reserved ·{" "}
          {tables.filter((t) => t.status === "disabled").length} Disabled
        </p>
        <button
          onClick={() => setFormTable("new")}
          className="inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5 cursor-pointer font-outfit"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm mb-5 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); load(); }} className="inline-flex items-center gap-1.5 font-semibold hover:text-red-700 cursor-pointer"><RefreshCw size={14} /> Retry</button>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="bg-card rounded-[13px] border border-border py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-soft flex items-center justify-center text-orange-deep mb-4">
            <Armchair size={26} />
          </div>
          <p className="font-semibold text-text-primary mb-1">No tables yet</p>
          <p className="text-sm text-text-muted">
            Add your restaurant's tables here, then assign them to confirmed reservations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((table) => {
            const available = table.status === "available";
            const assignments = assignmentsByTableId.get(table.id) || [];
            const reserved = assignments.length > 0;
            return (
              <div key={table.id} className="bg-card rounded-[13px] border border-border p-6 transition-all duration-300 hover:border-zinc-300">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      reserved ? "bg-red-50 text-red-500" : available ? "bg-orange-soft text-orange-deep" : "bg-zinc-100 text-zinc-400"
                    }`}>
                      <Armchair size={20} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary truncate m-0">{tableDisplayName(table.name)}</p>
                      <p className="text-sm text-text-muted m-0">{table.seats} seat{Number(table.seats) === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    reserved ? "bg-red-50 text-red-500" : available ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${reserved ? "bg-red-500" : available ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {reserved ? "Reserved" : available ? "Available" : "Disabled"}
                  </span>
                </div>

                {reserved && (
                  <div className="-mx-1 mb-4">
                    {assignments.map(({ reservation }) => (
                      <button
                        key={reservation.id}
                        onClick={() => setDetailsReservation(reservation)}
                        aria-label={`View reservation for ${reservation.guest_name}`}
                        className="w-full flex items-center justify-between gap-2 px-1 py-1.5 rounded-lg hover:bg-orange-soft/30 transition-colors cursor-pointer bg-none border-none text-left"
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-text-primary truncate">
                            {reservation.guest_name}
                          </span>
                          <span className="block text-[11px] text-text-muted truncate">
                            {partySizeLabel(reservation.party_size)} · {assignmentWhen(reservation)}
                          </span>
                        </span>
                        <span className="text-[11px] font-bold text-orange-primary whitespace-nowrap shrink-0">
                          View ›
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-2.5">
                  {!reserved && (
                    <>
                      {available && (
                        <button
                          onClick={() => setFormTable(table)}
                          disabled={updatingId === table.id}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border border-border text-text-muted hover:border-orange-primary hover:text-orange-primary transition disabled:opacity-50 cursor-pointer"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(table)}
                        disabled={updatingId === table.id}
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition disabled:opacity-50 cursor-pointer ${
                          available
                            ? "border-red-200 text-red-500 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <Power size={13} /> {available ? "Disable" : "Enable"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formTable && (
        <TableFormModal
          table={formTable === "new" ? null : formTable}
          onClose={() => setFormTable(null)}
          onSave={handleSave}
        />
      )}

      <ReservationDetailsModal
        reservation={detailsReservation}
        onClose={() => setDetailsReservation(null)}
      />
    </div>
  );
}
