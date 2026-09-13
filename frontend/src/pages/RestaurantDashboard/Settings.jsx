import { useEffect, useState } from "react";
import { Bell, Zap, PackageOpen, Clock, Truck, UtensilsCrossed, Save } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";

const TOGGLES = [
  { key: "notifications", label: "Order notifications", desc: "Push alerts whenever a new order comes in.", icon: Bell, initial: true },
  { key: "autoConfirm", label: "Auto-accept orders", desc: "Automatically confirm inbound orders.", icon: Zap, initial: false },
  { key: "lowStock", label: "Low-stock alerts", desc: "Get notified when a menu item is nearly sold out.", icon: PackageOpen, initial: true },
];

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [toggles, setToggles] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("restaurant_settings") || "{}");
      return TOGGLES.reduce((acc, t) => { acc[t.key] = saved[t.key] ?? t.initial; return acc; }, {});
    } catch {
      return TOGGLES.reduce((acc, t) => { acc[t.key] = t.initial; return acc; }, {});
    }
  });
  const [dineIn, setDineIn] = useState(() => user?.restaurant?.accepts_dine_in === true);
  const [radius, setRadius] = useState(() => {
    try {
      return Number(JSON.parse(window.localStorage.getItem("restaurant_settings") || "{}").radius) || 5;
    } catch { return 5; }
  });
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
    }
  }, [user?.restaurant?.id, user?.restaurant?.accepts_dine_in, user?.restaurant?.opening_hours]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (key) => setToggles((t) => {
    const next = { ...t, [key]: !t[key] };
    try {
      const saved = JSON.parse(window.localStorage.getItem("restaurant_settings") || "{}");
      window.localStorage.setItem("restaurant_settings", JSON.stringify({ ...saved, [key]: next[key] }));
    } catch { /* storage unavailable */ }
    return next;
  });

  const handleRadius = (v) => {
    setRadius(v);
    try {
      const saved = JSON.parse(window.localStorage.getItem("restaurant_settings") || "{}");
      window.localStorage.setItem("restaurant_settings", JSON.stringify({ ...saved, radius: v }));
    } catch { /* storage unavailable */ }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await restaurantApi.updateProfile({ accepts_dine_in: dineIn, opening_hours: hours });
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
          <h2 className="text-[15px] font-bold text-text-primary mb-6">Notifications</h2>
          <div className="space-y-6">
            {TOGGLES.map((t) => {
              const Icon = t.icon;
              const on = toggles[t.key];
              return (
                <div key={t.key} className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${on ? "bg-orange-soft text-orange-deep" : "bg-zinc-50 text-zinc-300"}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">{t.label}</p>
                    <p className="text-xs text-text-muted">{t.desc}</p>
                  </div>
                  <button onClick={() => flip(t.key)} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 cursor-pointer ${on ? "bg-orange-primary" : "bg-zinc-200"}`} aria-label={t.label}>
                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

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
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-text-primary text-sm">Delivery radius</p>
                  <span className="text-xs font-bold text-text-primary font-mono">{radius} km</span>
                </div>
                <input type="range" min="1" max="20" value={radius} onChange={(e) => handleRadius(e.target.value)} className="w-full accent-orange-500" />
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
          <span className="text-xs text-text-muted">Opening hours &amp; dine-in preference are saved to your store. Notification toggles &amp; delivery radius are kept on this device.</span>
        </div>
      </div>
    </div>
  );
}