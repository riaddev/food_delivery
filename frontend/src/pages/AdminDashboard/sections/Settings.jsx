import { useCallback, useEffect, useState } from "react";
import { CreditCard, KeyRound, Mail, Save } from "lucide-react";
import { useAuth } from "../../../features/auth/AuthContext";
import { adminApi } from "../../../features/api/apiSlice";
import { Card } from "../../../components/dashboard/Card";
import { ErrorBanner } from "../components/States";

export default function Settings({ showToast }) {
  const { user } = useAuth();
  const [readOnly, setReadOnly] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [pwdBusy, setPwdBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSettings();
      const p = res.data.platform || {};
      setReadOnly(res.data.read_only || null);
      setForm(p);
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

  const savePlatform = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await adminApi.updatePlatformSettings(form);
      setForm(res.data.platform);
      showToast("Platform settings saved");
    } catch {
      showToast("Failed to save settings", "error");
    }
    setSaving(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateProfile(profile);
      showToast("Profile updated");
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwdBusy) return;
    setPwdBusy(true);
    try {
      await adminApi.changePassword(pwd);
      setPwd({ current_password: "", new_password: "", new_password_confirmation: "" });
      showToast("Password changed");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password";
      showToast(msg, "error");
    }
    setPwdBusy(false);
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit";
  const labelClass = "block text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-1.5";

  const serviceBadge = (configured) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${configured ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${configured ? "bg-emerald-500" : "bg-zinc-400"}`} />
      {configured ? "Configured" : "Not configured"}
    </span>
  );

  if (loading) return <Card className="py-16 text-center text-sm text-text-light">Loading settings...</Card>;
  if (error) return <ErrorBanner message={error} onRetry={fetchAll} />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
      <Card title="Platform settings" pad="5">
        <form onSubmit={savePlatform} className="space-y-4">
          <div>
            <label className={labelClass}>Brand name</label>
            <input required value={form.brand_name ?? ""} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Brand email</label>
            <input type="email" required value={form.brand_email ?? ""} onChange={(e) => setForm({ ...form, brand_email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Support email</label>
            <input type="email" required value={form.support_email ?? ""} onChange={(e) => setForm({ ...form, support_email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact phone</label>
            <input value={form.brand_phone ?? ""} onChange={(e) => setForm({ ...form, brand_phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input value={form.brand_address ?? ""} onChange={(e) => setForm({ ...form, brand_address: e.target.value })} placeholder="Shop address shown to customers" className={inputClass} />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-primary hover:bg-orange-deep disabled:opacity-50 transition-colors cursor-pointer font-outfit"
            >
              {saving ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save size={13} strokeWidth={2.5} />}
              Save settings
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-5">
        <Card title="Services" pad="5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-4 flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-orange-soft text-orange-deep flex items-center justify-center shrink-0">
                <CreditCard size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text-light">Payment gateway</p>
                <p className="text-[14px] font-semibold text-text-primary mt-1 truncate">{readOnly?.payment_gateway || "SSLCommerz"}</p>
                <p className="text-[12px] text-text-muted">{readOnly?.payment_gateway_mode || "Live"} mode</p>
                <p className="mt-1.5">{serviceBadge(readOnly?.payment_gateway_configured)}</p>
              </div>
            </div>
            <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-4 flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-orange-soft text-orange-deep flex items-center justify-center shrink-0">
                <Mail size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-text-light">Email service</p>
                <p className="text-[14px] font-semibold text-text-primary mt-1 truncate">{readOnly?.mail_host || "smtp"}</p>
                <p className="text-[12px] text-text-muted truncate">{readOnly?.mail_from || ""}</p>
                <p className="mt-1.5">{serviceBadge(readOnly?.mail_configured)}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Account" pad="5">
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input required value={profile.name ?? ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" className={inputClass} />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-primary hover:bg-orange-deep transition-colors cursor-pointer font-outfit"
              >
                Update profile
              </button>
            </div>
          </form>
        </Card>

        <Card title="Change password" pad="5">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                required
                value={pwd.current_password}
                onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={pwd.new_password}
                  onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm new</label>
                <input
                  type="password"
                  required
                  value={pwd.new_password_confirmation}
                  onChange={(e) => setPwd({ ...pwd, new_password_confirmation: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwdBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-orange-primary hover:bg-orange-deep disabled:opacity-50 transition-colors cursor-pointer font-outfit"
              >
                {pwdBusy ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <KeyRound size={13} strokeWidth={2.5} />}
                Change password
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}