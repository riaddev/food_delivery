import { useState } from "react";
import { Store, Save } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { restaurantApi } from "../../features/api/apiSlice";

const cuisineOptions = ["Bangladeshi", "Fast Food", "Chinese", "Pizza", "Burgers", "Cafe", "Dessert", "Others"];

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const r = user?.restaurant || {};

  const [form, setForm] = useState({
    restaurant_name: r.restaurant_name || "", cuisine_type: r.cuisine_type || "", phone: r.phone || "",
    address: r.address || "", city: r.city || "", opening_hours: r.opening_hours || "", description: r.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await restaurantApi.updateProfile(form);
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated!" });
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors)[0]?.[0] || "Failed to save." : err.response?.data?.message || "Failed to save.";
      setMessage({ type: "error", text: msg });
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-transparent border-b border-zinc-200 focus:border-red-500 outline-none py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-0.5";

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Restaurant Profile</h1>
      <p className="text-zinc-400 mb-8">Keep your storefront details fresh for customers.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] space-y-7">
        <div className="flex items-center gap-4 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <Store size={22} />
          </div>
          <p className="font-bold text-zinc-900">{form.restaurant_name || "Your restaurant"}</p>
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-2xl ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className={labelCls}>Restaurant Name *</label>
            <input type="text" name="restaurant_name" required value={form.restaurant_name} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Cuisine Type</label>
            <select name="cuisine_type" value={form.cuisine_type} onChange={handleChange} className={`${inputCls} bg-transparent cursor-pointer`}>
              <option value="">Select cuisine type</option>
              {cuisineOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="+880..." />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input type="text" name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="Dhaka" />
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input type="text" name="address" value={form.address} onChange={handleChange} className={inputCls} placeholder="Road, area" />
          </div>
          <div>
            <label className={labelCls}>Opening Hours</label>
            <input type="text" name="opening_hours" value={form.opening_hours} onChange={handleChange} className={inputCls} placeholder="Mon-Sun 10AM-11PM" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputCls} resize-y`} placeholder="About your restaurant..." />
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold px-7 py-3 rounded-full shadow-[0_12px_30px_-10px_rgba(239,68,68,0.7)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed">
          <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}