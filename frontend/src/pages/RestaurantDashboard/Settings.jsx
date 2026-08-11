import { useState } from "react";
import { Bell, Zap, PackageOpen, Clock, Truck, UtensilsCrossed, Save } from "lucide-react";
import { restaurantApi } from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";

const TOGGLES = [
  { key: "notifications", label: "Order notifications", desc: "Push alerts whenever a new order comes in.", icon: Bell, initial: true },
  { key: "autoConfirm", label: "Auto-accept orders", desc: "Automatically confirm inbound orders.", icon: Zap, initial: false },
  { key: "lowStock", label: "Low-stock alerts", desc: "Get notified when a menu item is nearly sold out.", icon: PackageOpen, initial: true },
];

export function SettingsPage() {
  const { user } = useAuth();
  const [toggles, setToggles] = useState(() =>
    TOGGLES.reduce((acc, t) => { acc[t.key] = t.initial; return acc; }, {})
  );
  const [dineIn, setDineIn] = useState(() => user?.restaurant?.accepts_dine_in === true);
  const [radius, setRadius] = useState(5);
  const [hours, setHours] = useState("10AM - 11PM");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const flip = (key) => setToggles((t) => ({ ...t, [key]: !t[key] }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await restaurantApi.updateProfile({ accepts_dine_in: dineIn });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2800);
    } catch {
      setError("Couldn't save dine-in settings. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Settings</h1>
      <p className="text-zinc-400 mb-8">Tune how your store behaves.</p>

      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <h2 className="font-extrabold tracking-tight text-zinc-900 mb-6">Notifications</h2>
          <div className="space-y-6">
            {TOGGLES.map((t) => {
              const Icon = t.icon;
              const on = toggles[t.key];
              return (
                <div key={t.key} className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${on ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-300"}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900 text-sm">{t.label}</p>
                    <p className="text-xs text-zinc-400">{t.desc}</p>
                  </div>
                  <button onClick={() => flip(t.key)} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${on ? "bg-red-500" : "bg-zinc-200"}`} aria-label={t.label}>
                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <h2 className="font-extrabold tracking-tight text-zinc-900 mb-6">Store</h2>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-900 text-sm mb-1.5">Opening hours</p>
                <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-full bg-transparent border-b border-zinc-200 focus:border-red-500 outline-none py-1.5 text-sm text-zinc-900 transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <Truck size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-zinc-900 text-sm">Delivery radius</p>
                  <span className="text-xs font-bold text-zinc-700">{radius} km</span>
                </div>
                <input type="range" min="1" max="20" value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full accent-red-500" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 text-sm">Accepting dine-in orders</p>
                <p className="text-xs text-zinc-400">Customers can order for dining at your restaurant and the option shows on your public page.</p>
              </div>
              <button onClick={() => setDineIn((v) => !v)} className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${dineIn ? "bg-emerald-500" : "bg-zinc-200"}`} aria-label="Accepting dine-in orders">
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
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white text-sm font-bold px-7 py-3 rounded-full transition-all hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Settings"}
          </button>
          <span className="text-xs text-zinc-400">Dine-in preference is saved to your store.</span>
        </div>
      </div>
    </div>
  );
}