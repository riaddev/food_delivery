import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, Phone } from "lucide-react";
import { customerApi } from "../../features/api/apiSlice";

export default function SavedAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", address: "", city: "", phone: "", is_default: false });

  useEffect(() => {
    customerApi.getAddresses()
      .then((res) => setAddresses(res.data.addresses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => customerApi.getAddresses().then((res) => setAddresses(res.data.addresses));

  const resetForm = () => {
    setForm({ label: "", address: "", city: "", phone: "", is_default: false });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (addr) => {
    setForm({ label: addr.label || "", address: addr.address, city: addr.city || "", phone: addr.phone || "", is_default: addr.is_default });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await customerApi.updateAddress(editingId, form);
      } else {
        await customerApi.createAddress(form);
      }
      resetForm();
      loadMore();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save address");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this address?")) return;
    await customerApi.deleteAddress(id);
    loadMore();
  };

  const handleSetDefault = async (id) => {
    await customerApi.setDefaultAddress(id);
    loadMore();
  };

  const inputCls = "w-full bg-transparent border-b border-zinc-200 focus:border-red-500 outline-none py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors";

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Saved Addresses</h1>
        <p className="text-zinc-400 mt-1">Your delivery spots, one tap away.</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-7 mb-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <h2 className="font-extrabold tracking-tight text-zinc-900 mb-6">{editingId ? "Edit Address" : "Add New Address"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mb-6">
            <input type="text" placeholder="Label (e.g. Home, Office)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls} />
            <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
            <div className="sm:col-span-2">
              <textarea placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} required className={`${inputCls} resize-y`} />
            </div>
            <input type="text" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-zinc-600 mb-7 cursor-pointer select-none">
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${form.is_default ? "border-red-500 bg-red-500" : "border-zinc-300 bg-white"}`} onClick={() => setForm({ ...form, is_default: !form.is_default })}>
              {form.is_default && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="hidden" readOnly />
            Set as default address
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all">
              {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
            </button>
            <button type="button" onClick={resetForm} className="text-zinc-500 hover:text-zinc-900 text-sm font-medium px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 animate-pulse">
              <div className="h-12 w-12 bg-zinc-100 rounded-2xl mb-4" />
              <div className="h-4 bg-zinc-100 rounded w-40 mb-2" />
              <div className="h-4 bg-zinc-100 rounded w-64" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-3xl border-dashed border-2 border-zinc-300 hover:border-red-400 group p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 min-h-[200px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 group-hover:bg-red-500 text-white flex items-center justify-center mb-4 transition-colors">
              <Plus size={26} strokeWidth={2.5} />
            </div>
            <p className="font-bold text-zinc-900">Add New Address</p>
            <p className="text-sm text-zinc-400 mt-1">Save a home, office or friend's place</p>
          </button>

          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                  <MapPin size={22} strokeWidth={2.2} />
                </div>
                {addr.is_default && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star size={11} fill="currentColor" /> Default
                  </span>
                )}
              </div>
              {addr.label && <p className="font-extrabold tracking-tight text-zinc-900 mb-1">{addr.label}</p>}
              <p className="text-sm text-zinc-700 leading-relaxed">{addr.address}</p>
              <p className="text-sm text-zinc-400 mt-1">{addr.city}</p>
              {addr.phone && (
                <p className="text-sm text-zinc-500 mt-3 flex items-center gap-1.5">
                  <Phone size={14} /> {addr.phone}
                </p>
              )}
              <div className="flex gap-2 mt-5 pt-5 border-t border-zinc-50">
                <button onClick={() => handleEdit(addr)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3.5 py-2 rounded-full border border-zinc-200 hover:border-zinc-400 transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                {!addr.is_default && (
                  <>
                    <button onClick={() => handleSetDefault(addr.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3.5 py-2 rounded-full border border-emerald-200 hover:border-emerald-400 transition-colors">
                      <Star size={13} /> Set Default
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-3.5 py-2 rounded-full border border-red-200 hover:border-red-400 transition-colors ml-auto">
                      <Trash2 size={13} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}