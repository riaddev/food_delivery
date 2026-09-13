import { useEffect, useRef, useState } from "react";
import { Save, ImagePlus, X, Undo2 } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { restaurantApi } from "../../features/api/apiSlice";
import { resolveAssetUrl } from "../../utils/foodImages";

const cuisineOptions = ["Bangladeshi", "Fast Food", "Chinese", "Pizza", "Burgers", "Cafe", "Dessert", "Others"];

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const r = user?.restaurant || {};

  const [form, setForm] = useState({
    restaurant_name: r.restaurant_name || "", cuisine_type: r.cuisine_type || "", phone: r.phone || "",
    address: r.address || "", city: r.city || "", opening_hours: r.opening_hours || "", description: r.description || "",
    delivery_time: r.delivery_time || "", delivery_fee: r.delivery_fee ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const coverRef = useRef(null);
  const logoRef = useRef(null);
  const [cover, setCover] = useState({ file: null, preview: resolveAssetUrl(r.cover_image_url || r.cover_image) || null, remove: false });
  const [logo, setLogo] = useState({ file: null, preview: resolveAssetUrl(r.logo_url || r.logo) || null, remove: false });
  const [coverBroken, setCoverBroken] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  // user.restaurant loads async — sync form + image previews once data arrives.
  // Skip sync while user is editing (dirty) to avoid clobbering input.
  const isDirtyRef = useRef(false);
  useEffect(() => {
    if (isDirtyRef.current) return;
    const nr = user?.restaurant || {};
    setForm({
      restaurant_name: nr.restaurant_name || "", cuisine_type: nr.cuisine_type || "", phone: nr.phone || "",
      address: nr.address || "", city: nr.city || "", opening_hours: nr.opening_hours || "", description: nr.description || "",
      delivery_time: nr.delivery_time || "", delivery_fee: nr.delivery_fee ?? "",
    });
    setCover((prev) => prev.file || prev.remove ? prev : { file: null, preview: resolveAssetUrl(nr.cover_image_url || nr.cover_image) || null, remove: false });
    setLogo((prev) => prev.file || prev.remove ? prev : { file: null, preview: resolveAssetUrl(nr.logo_url || nr.logo) || null, remove: false });
    setCoverBroken(false);
    setLogoBroken(false);
  }, [user?.restaurant?.id, user?.restaurant?.updated_at, user?.restaurant?.cover_image_url, user?.restaurant?.logo_url]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => { isDirtyRef.current = true; setForm({ ...form, [e.target.name]: e.target.value }); };

  const handleFile = (kind, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      e.target.value = "";
      return;
    }
    const maxBytes = kind === "cover" ? 4 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setMessage({ type: "error", text: kind === "cover" ? "Cover image must be under 4MB." : "Logo must be under 2MB." });
      e.target.value = "";
      return;
    }
    isDirtyRef.current = true;
    const prev = kind === "cover" ? cover : logo;
    if (prev.preview && prev.preview.startsWith("blob:")) URL.revokeObjectURL(prev.preview);
    setKindState(kind, { file, preview: URL.createObjectURL(file), remove: false });
    if (kind === "cover") setCoverBroken(false);
    else setLogoBroken(false);
  };

  const setKindState = (kind, next) => kind === "cover" ? setCover(next) : setLogo(next);

  const clearKind = (kind) => {
    const state = kind === "cover" ? cover : logo;
    isDirtyRef.current = true;
    setKindState(kind, { file: null, preview: null, remove: true });
    if (state.preview && state.preview.startsWith("blob:")) URL.revokeObjectURL(state.preview);
    const input = kind === "cover" ? coverRef : logoRef;
    if (input.current) input.current.value = "";
  };

  // Undo a pending removal before saving — restores the stored server image.
  const undoKind = (kind) => {
    const nr = user?.restaurant || {};
    isDirtyRef.current = true;
    if (kind === "cover") {
      setCover({ file: null, preview: resolveAssetUrl(nr.cover_image_url || nr.cover_image) || null, remove: false });
      setCoverBroken(false);
    } else {
      setLogo({ file: null, preview: resolveAssetUrl(nr.logo_url || nr.logo) || null, remove: false });
      setLogoBroken(false);
    }
    const input = kind === "cover" ? coverRef : logoRef;
    if (input.current) input.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "" && v != null) fd.append(k, v); });
      if (cover.file) fd.append("cover_image", cover.file);
      else if (cover.remove) fd.append("remove_cover_image", "1");
      if (logo.file) fd.append("logo", logo.file);
      else if (logo.remove) fd.append("remove_logo", "1");
      await restaurantApi.updateProfile(fd);
      await refreshUser();
      isDirtyRef.current = false;
      setMessage({ type: "success", text: "Profile updated!" });
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors)[0]?.[0] || "Failed to save." : err.response?.data?.message || "Failed to save.";
      setMessage({ type: "error", text: msg });
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-transparent border-b border-zinc-200 focus:border-orange-500 outline-none py-2.5 text-sm text-text-primary placeholder:text-text-light transition-colors";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.06em] text-text-light mb-0.5";

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="bg-card rounded-[13px] border border-border p-5 md:p-8 space-y-7">
        {message && (
          <div className={`text-sm px-4 py-3 rounded-2xl ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className={labelCls}>Cover Image</label>
            {cover.remove ? (
              <div className="mt-2 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-medium px-4 py-3 rounded-2xl">
                <span className="flex-1">Cover will be removed when you save.</span>
                <button type="button" onClick={() => undoKind("cover")} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-orange-primary hover:text-orange-deep transition-colors cursor-pointer">
                  <Undo2 size={14} /> Undo
                </button>
              </div>
            ) : cover.preview && !coverBroken ? (
              <div className="relative mt-2">
                <img src={cover.preview} alt="Cover preview" className="w-full h-32 sm:h-44 object-cover rounded-2xl" onError={() => setCoverBroken(true)} />
                <button type="button" onClick={() => clearKind("cover")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer" aria-label="Remove cover image">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mt-2 w-full h-32 sm:h-44 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-1.5 text-text-light">
                <ImagePlus size={22} />
                <span className="text-xs font-semibold">No cover image</span>
              </div>
            )}
            <button type="button" onClick={() => coverRef.current?.click()} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-orange-primary hover:text-orange-deep transition-colors cursor-pointer">
              <ImagePlus size={16} /> {cover.preview ? "Replace cover" : "Upload cover image"}
            </button>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={(e) => handleFile("cover", e)} className="hidden" />
            <p className="text-xs text-text-muted mt-1">Shown as the hero banner on your menu page.</p>
          </div>

          <div>
            <label className={labelCls}>Logo</label>
            {logo.remove ? (
              <div className="mt-2 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-medium px-4 py-3 rounded-2xl">
                <span className="flex-1">Logo will be removed when you save.</span>
                <button type="button" onClick={() => undoKind("logo")} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-orange-primary hover:text-orange-deep transition-colors cursor-pointer">
                  <Undo2 size={14} /> Undo
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-4 mt-2">
              {logo.preview && !logoBroken ? (
                <div className="relative shrink-0">
                  <img src={logo.preview} alt="Logo preview" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-border" onError={() => setLogoBroken(true)} />
                  <button type="button" onClick={() => clearKind("logo")} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer" aria-label="Remove logo">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center text-text-light shrink-0">
                  <ImagePlus size={20} />
                </div>
              )}
              <div>
                <button type="button" onClick={() => logoRef.current?.click()} className="inline-flex items-center gap-2 text-sm font-semibold text-orange-primary hover:text-orange-deep transition-colors cursor-pointer">
                  <ImagePlus size={16} /> {logo.preview ? "Replace logo" : "Upload logo"}
                </button>
                <p className="text-xs text-text-muted mt-1">Shown next to your restaurant name on the menu page.</p>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={(e) => handleFile("logo", e)} className="hidden" />
          </div>
        </div>

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
          <div>
            <label className={labelCls}>Delivery Time</label>
            <input type="text" name="delivery_time" value={form.delivery_time} onChange={handleChange} className={inputCls} placeholder="30-40 min" />
          </div>
          <div>
            <label className={labelCls}>Delivery Fee (&#2547;)</label>
            <input type="number" min="0" step="0.01" name="delivery_fee" value={form.delivery_fee} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${inputCls} resize-y`} placeholder="About your restaurant..." />
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-7 py-3 rounded-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed cursor-pointer font-outfit">
          <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}