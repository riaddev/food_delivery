import { useState, useRef } from "react";
import { Camera, Mail, ShieldCheck } from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", email: user?.email || "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      if (avatarFile) fd.append("avatar", avatarFile);

      await customerApi.updateProfile(fd);
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setAvatarFile(null);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    }
    setSaving(false);
  };

  const inputCls = "w-full bg-transparent border-b border-zinc-200 focus:border-red-500 outline-none py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-0.5";

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-8">Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] space-y-8">
        <div className="flex items-center gap-5">
          <div className="relative">
            {preview ? (
              <img src={preview} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-zinc-50" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-400 text-white flex items-center justify-center text-3xl font-extrabold ring-4 ring-zinc-50">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-zinc-900 hover:bg-zinc-800 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors"
              title="Upload photo"
            >
              <Camera size={15} />
            </button>
            <input type="file" ref={fileRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-zinc-900">{user?.name}</p>
            <p className="text-sm text-zinc-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
          <div>
            <label className={labelCls}>Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <div className="flex items-center gap-2 border-b border-zinc-100 py-2.5">
            <Mail size={16} className="text-zinc-400 shrink-0" />
            <span className="text-sm text-zinc-500">{form.email}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck size={11} /> Verified
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">Email cannot be changed.</p>
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-2xl ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold px-7 py-3 rounded-full transition-all hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}