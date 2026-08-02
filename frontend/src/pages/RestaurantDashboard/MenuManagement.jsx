import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, Image as ImageIcon } from "lucide-react";
import api, { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const emptyItem = { name: "", description: "", price: "", category: "", is_available: true };

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      const res = await restaurantApi.getMenuItems();
      setItems(res.data.menu_items);
    } catch {
      // keep current list
    }
  };

  useEffect(() => {
    restaurantApi.getMenuItems()
      .then((res) => { setItems(res.data.menu_items); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openCreate = () => {
    setForm(emptyItem); setEditingId(null); setImageFile(null); setImagePreview(null); setShowForm(true); setError("");
  };

  const openEdit = (item) => {
    setForm({ ...item, price: item.price.toString() }); setEditingId(item.id);
    setImageFile(null); setImagePreview(item.image_url || null); setShowForm(true); setError("");
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name); fd.append("price", form.price);
    if (form.description) fd.append("description", form.description);
    if (form.category) fd.append("category", form.category);
    fd.append("is_available", form.is_available ? "1" : "0");
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        if (imageFile) {
          const fd = buildFormData();
          fd.append("_method", "PUT");
          await api.post(`/restaurant/menu-items/${editingId}`, fd);
        } else {
          await restaurantApi.updateMenuItem(editingId, form);
        }
      } else {
        const fd = buildFormData();
        await restaurantApi.createMenuItem(fd);
      }
      setShowForm(false); setEditingId(null); setImageFile(null); setImagePreview(null);
      fetchItems();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] || "Failed to save." : err.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try { await restaurantApi.deleteMenuItem(id); fetchItems(); } catch { alert("Failed to delete."); }
  };

  const inputCls = "w-full bg-transparent border-b border-zinc-200 focus:border-red-500 outline-none py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-0.5";

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-2">Food Menu</h1>
          <p className="text-zinc-400">Manage the dishes customers see on your store.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-6 py-3 rounded-full shadow-[0_12px_30px_-10px_rgba(239,68,68,0.7)] transition-all hover:-translate-y-0.5">
          <Plus size={16} /> Add Menu Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] mb-8">
          <h2 className="font-extrabold tracking-tight text-zinc-900 mb-6">{editingId ? "Edit Menu Item" : "New Menu Item"}</h2>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className={labelCls}>Name *</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputCls} placeholder="Chicken Burger" />
              </div>
              <div>
                <label className={labelCls}>Price (৳) *</label>
                <input type="number" name="price" required min="0" step="0.01" value={form.price} onChange={handleChange} className={inputCls} placeholder="240" />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <input type="text" name="category" value={form.category} onChange={handleChange} className={inputCls} placeholder="Burgers, Drinks, etc." />
              </div>
              <div>
                <label className={labelCls}>Availability</label>
                <label className="flex items-center gap-3 mt-2.5 cursor-pointer select-none">
                  <span onClick={() => setForm({ ...form, is_available: !form.is_available })} className={`w-11 h-6 rounded-full relative transition-colors ${form.is_available ? "bg-red-500" : "bg-zinc-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_available ? "left-[22px]" : "left-0.5"}`} />
                  </span>
                  <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className="sr-only" readOnly />
                  <span className="text-sm text-zinc-600">{form.is_available ? "Available to order" : "Hidden from menu"}</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={`${inputCls} resize-y`} placeholder="Describe the item..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Image</label>
                <div className="flex items-center gap-4 mt-2.5">
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-2xl object-cover" />}
                  <label className="inline-flex items-center gap-2 border-2 border-dashed border-zinc-300 hover:border-red-400 text-zinc-500 hover:text-red-500 text-sm font-semibold px-5 py-3 rounded-2xl cursor-pointer transition-colors">
                    <ImageIcon size={15} /> {imagePreview ? "Replace image" : "Upload image"}
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-bold px-7 py-3 rounded-full transition-all disabled:cursor-not-allowed">
                {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-900 text-sm font-medium px-5 py-3">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-400 text-sm">Loading menu items...</p>
      ) : items.length === 0 && !showForm ? (
        <div className="bg-white rounded-3xl py-20 px-6 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4">
            <UtensilsCrossed size={26} />
          </div>
          <p className="font-semibold text-zinc-700 mb-1">No menu items yet</p>
          <p className="text-sm text-zinc-400">Click "Add Menu Item" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 flex justify-between items-center gap-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
              <div className="flex gap-5 items-center min-w-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 bg-zinc-50 rounded-2xl shrink-0 flex items-center justify-center text-zinc-300">
                    <UtensilsCrossed size={22} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-zinc-900">{item.name}</span>
                    <span className="font-extrabold text-red-500">{formatPrice(item.price)}</span>
                    {!item.is_available && (
                      <span className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Unavailable</span>
                    )}
                  </div>
                  {item.description && <p className="text-sm text-zinc-400 truncate">{item.description}</p>}
                  {item.category && <span className="text-xs text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full inline-block mt-1.5">{item.category}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-4 py-2 rounded-full transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-400 px-4 py-2 rounded-full transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}