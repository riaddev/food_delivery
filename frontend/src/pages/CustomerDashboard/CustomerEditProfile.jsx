import { useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import { customerApi } from "../../features/api/apiSlice";

const CustomerEditProfile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", address: user?.address || "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await customerApi.updateProfile(form);
      await refreshUser();
      setMessage({ type: "success", text: "Profile updated!" });
    } catch (err) {
      const msg = err.response?.data?.errors ? Object.values(err.response.data.errors)[0]?.[0] || "Failed to save." : err.response?.data?.message || "Failed to save.";
      setMessage({ type: "error", text: msg });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-bold text-gray-900 mt-0 mb-4">Edit Profile</h2>

      {message && (
        <div className={`text-sm px-3.5 py-2.5 rounded-[10px] mb-4 ${message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5">
        {[
          { name: "name", label: "Name", type: "text", required: true, placeholder: "" },
          { name: "phone", label: "Phone", type: "tel", required: false, placeholder: "+1 234 567 8900" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
            <input type={f.type} name={f.name} required={f.required} value={form[f.name]} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border" placeholder={f.placeholder} />
          </div>
        ))}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Address</label>
          <textarea name="address" value={form.address} onChange={handleChange}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border min-h-[60px] resize-y" placeholder="123 Main St, New York, NY" />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-full text-base font-bold text-white transition mt-2 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 bg-[#ff6b35] hover:bg-[#e6551a]">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default CustomerEditProfile;
