import { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";

export default function ChangePassword() {
  const [form, setForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (form.new_password !== form.new_password_confirmation) {
      setMessage({ type: "error", text: "New passwords do not match." });
      setSaving(false);
      return;
    }

    try {
      const res = await customerApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
        new_password_confirmation: form.new_password_confirmation,
      });
      setMessage({ type: "success", text: res.data.message });
      setForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    }
    setSaving(false);
  };

  const inputCls = "flex-1 bg-transparent outline-none py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-0.5";

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Change Password</h1>
      <p className="text-zinc-400 mb-8">Choose a strong password you don't use elsewhere.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] space-y-7">
        <div>
          <label className={labelCls}>Current Password</label>
          <div className="flex items-center gap-2.5 border-b border-zinc-200 focus-within:border-red-500 transition-colors">
            <Lock size={15} className="text-zinc-300 shrink-0" />
            <input
              type="password" id="current"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              className={inputCls} required
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>New Password</label>
          <div className="flex items-center gap-2.5 border-b border-zinc-200 focus-within:border-red-500 transition-colors">
            <KeyRound size={15} className="text-zinc-300 shrink-0" />
            <input
              type="password" id="new1"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              className={inputCls} required minLength={6}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Confirm New Password</label>
          <div className="flex items-center gap-2.5 border-b border-zinc-200 focus-within:border-red-500 transition-colors">
            <KeyRound size={15} className="text-zinc-300 shrink-0" />
            <input
              type="password" id="new2"
              value={form.new_password_confirmation}
              onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
              className={inputCls} required
            />
          </div>
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-2xl ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-full transition-all hover:-translate-y-0.5 shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
        >
          {saving ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}