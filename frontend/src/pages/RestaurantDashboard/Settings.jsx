import { useEffect, useState } from "react";
import { PackageOpen, Clock, UtensilsCrossed, Save } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [dineIn, setDineIn] = useState(() => user?.restaurant?.accepts_dine_in === true);
  const [defaultMaxPerItem, setDefaultMaxPerItem] = useState(() => user?.restaurant?.default_max_per_item ?? "");
  const [allowBulk, setAllowBulk] = useState(() => user?.restaurant?.allow_bulk_orders === true);
  const [hours, setHours] = useState(() => user?.restaurant?.opening_hours || "10AM - 11PM");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // user.restaurant loads async — sync server-backed fields once available.
  useEffect(() => {
    if (user?.restaurant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDineIn(user.restaurant.accepts_dine_in === true);
      if (user.restaurant.opening_hours) setHours(user.restaurant.opening_hours);
      setDefaultMaxPerItem(user.restaurant.default_max_per_item ?? "");
      setAllowBulk(user.restaurant.allow_bulk_orders === true);
    }
  }, [user?.restaurant?.id, user?.restaurant?.accepts_dine_in, user?.restaurant?.opening_hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const maxN = defaultMaxPerItem === "" || defaultMaxPerItem === null ? null : Number(defaultMaxPerItem);
      if (maxN !== null && (!Number.isInteger(maxN) || maxN < 1 || maxN > 100)) {
        setError("Max per item must be between 1 and 100 (or blank for platform default of 10).");
        setSaving(false);
        return;
      }
      await restaurantApi.updateProfile({
        accepts_dine_in: dineIn,
        opening_hours: hours,
        default_max_per_item: maxN,
        allow_bulk_orders: allowBulk,
      });
      await refreshUser?.();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2800);
    } catch {
      setError("Couldn't save store settings. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="space-y-5">
        <div className="bg-card rounded-[13px] border border-border p-5 md:p-7">
          <h2 className="text-[15px] font-bold text-text-primary mb-6">Store</h2>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary text-sm mb-1.5">Opening hours</p>
                <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-full bg-transparent border-b border-zinc-200 focus:border-orange-500 outline-none py-1.5 text-sm text-text-primary transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm">Accepting dine-in orders</p>
                <p className="text-xs text-text-muted">Customers can order for dining at your restaurant and the option shows on your public page.</p>
              </div>
              <button onClick={() => setDineIn((v) => !v)} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 cursor-pointer ${dineIn ? "bg-orange-primary" : "bg-zinc-200"}`} aria-label="Accepting dine-in orders">
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${dineIn ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <PackageOpen size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm">Order limits</p>
                <p className="text-xs text-text-muted">Cap how many of one dish a customer can order. Blank = platform default (10). Stock / daily caps are set per dish in Menu.</p>
                <div className="flex items-center gap-3 mt-2.5">
                  <label className="text-xs font-semibold text-text-muted" htmlFor="default-max">Max per item</label>
                  <input
                    id="default-max"
                    type="number"
                    min="1"
                    max="100"
                    value={defaultMaxPerItem}
                    onChange={(e) => setDefaultMaxPerItem(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="10"
                    className="w-24 bg-transparent border-b border-zinc-200 focus:border-orange-500 outline-none py-1.5 text-sm text-text-primary transition-colors"
                  />
                </div>
                <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none">
                  <button onClick={() => setAllowBulk((v) => !v)} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 cursor-pointer ${allowBulk ? "bg-orange-primary" : "bg-zinc-200"}`} aria-label="Allow bulk orders">
                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${allowBulk ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                  <span className="text-xs text-text-muted">Allow bulk / catering orders over 50 units (still flagged for your review)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
        )}

        {saved && (
          <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-2xl">Settings saved.</div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-deep disabled:opacity-60 text-white text-sm font-bold px-7 py-3 rounded-lg transition-all hover:-translate-y-0.5 cursor-pointer font-outfit"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Settings"}
          </button>
          <span className="text-xs text-text-muted">Opening hours, dine-in preference &amp; order limits are saved to your store.</span>
        </div>
      </div>
    </div>
  );
}