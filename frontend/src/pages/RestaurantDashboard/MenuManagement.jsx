import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, Image as ImageIcon, Tag, Power, PowerOff } from "lucide-react";
import api, { restaurantApi } from "../../features/api/apiSlice";
import { formatPrice } from "../../utils/foodImages";

const emptyItem = { name: "", description: "", price: "", discount_price: "", category: "", category_id: "", is_available: true };

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [showCategoryRequest, setShowCategoryRequest] = useState(false);
  const [categoryRequestName, setCategoryRequestName] = useState("");
  const [categoryRequestSaving, setCategoryRequestSaving] = useState(false);
  const [categoryRequestError, setCategoryRequestError] = useState("");
  const [categoryRequestSuccess, setCategoryRequestSuccess] = useState("");

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
    api.get("/categories")
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleCategoryChange = (e) => {
    const id = e.target.value ? Number(e.target.value) : null;
    const name = categories.find((c) => c.id === id)?.name || "";
    setForm({ ...form, category_id: id, category: name });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl("");
    setRemoveImage(false);
  };

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    setRemoveImage(true);
  };

  const openCreate = () => {
    setForm(emptyItem); setEditingId(null); setImageFile(null); setImagePreview(null); setImageUrl(""); setRemoveImage(false); setShowForm(true); setError("");
  };

  const openEdit = (item) => {
    setForm({ ...item, price: item.price.toString(), discount_price: item.discount_price != null ? item.discount_price.toString() : "", category_id: item.category_id ?? "" }); setEditingId(item.id);
    setImageFile(null); setImagePreview(item.image_url || null);
    setImageUrl(item.image && String(item.image).startsWith("http") ? item.image : "");
    setRemoveImage(false); setShowForm(true); setError("");
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name); fd.append("price", form.price);
    if (form.discount_price !== "" && form.discount_price != null) fd.append("discount_price", form.discount_price);
    if (form.description) fd.append("description", form.description);
    if (form.category) fd.append("category", form.category);
    if (form.category_id) fd.append("category_id", form.category_id);
    fd.append("is_available", form.is_available ? "1" : "0");
    if (imageFile) fd.append("image", imageFile);
    if (!imageFile && imageUrl.trim()) fd.append("image_url", imageUrl.trim());
    if (removeImage) fd.append("remove_image", "1");
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("price", form.price);
        if (form.discount_price !== "" && form.discount_price != null) fd.append("discount_price", form.discount_price);
        if (form.description) fd.append("description", form.description);
        if (form.category) fd.append("category", form.category);
        if (form.category_id) fd.append("category_id", form.category_id);
        fd.append("is_available", form.is_available ? "1" : "0");
        if (imageFile) fd.append("image", imageFile);
        if (!imageFile && imageUrl.trim()) fd.append("image_url", imageUrl.trim());
        if (removeImage) fd.append("remove_image", "1");
        fd.append("_method", "PUT");
        await api.post(`/restaurant/menu-items/${editingId}`, fd);
      } else {
        const fd = buildFormData();
        await restaurantApi.createMenuItem(fd);
      }
      setShowForm(false); setEditingId(null); setImageFile(null); setImagePreview(null); setImageUrl(""); setRemoveImage(false);
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

  const handleToggleAvailability = async (item) => {
    try {
      await restaurantApi.toggleAvailability(item.id, { is_available: !item.is_available });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      );
    } catch {
      alert("Failed to update availability.");
    }
  };

  const handleCategoryRequest = async () => {
    if (!categoryRequestName.trim()) return;
    setCategoryRequestSaving(true);
    setCategoryRequestError("");
    setCategoryRequestSuccess("");
    try {
      const res = await restaurantApi.storeCategoryRequest({ name: categoryRequestName.trim() });
      setCategoryRequestSuccess(res.data.message);
      setCategoryRequestName("");
      setTimeout(() => {
        setShowCategoryRequest(false);
        setCategoryRequestSuccess("");
      }, 2000);
    } catch (err) {
      setCategoryRequestError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setCategoryRequestSaving(false);
    }
  };

  const inputCls = "w-full bg-transparent border-b border-zinc-200 focus:border-orange-500 outline-none py-2.5 text-sm text-text-primary placeholder:text-text-light transition-colors";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.06em] text-text-light mb-0.5";

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-end gap-4 mb-8">
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-orange-primary hover:bg-orange-deep text-white text-sm font-bold px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5 cursor-pointer font-outfit">
          <Plus size={16} /> Add Menu Item
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-[13px] border border-border p-5 md:p-7 mb-8">
          <h2 className="text-[15px] font-bold text-text-primary mb-6">{editingId ? "Edit Menu Item" : "New Menu Item"}</h2>

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
                <label className={labelCls}>Discounted Price (৳)</label>
                <input
                  type="number"
                  name="discount_price"
                  min="0"
                  step="0.01"
                  value={form.discount_price}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Leave empty for no discount"
                />
                {form.discount_price !== "" && form.discount_price != null && parseFloat(form.discount_price) > 0 && form.price && parseFloat(form.discount_price) < parseFloat(form.price) && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Customer pays: ৳{parseFloat(form.discount_price).toFixed(2)} (save ৳{(parseFloat(form.price) - parseFloat(form.discount_price)).toFixed(2)})
                  </p>
                )}
                {form.discount_price !== "" && form.discount_price != null && parseFloat(form.discount_price) > 0 && form.price && parseFloat(form.discount_price) >= parseFloat(form.price) && (
                  <p className="text-xs text-red-500 mt-1">Must be less than regular price</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Category</label>
                {categories.length > 0 ? (
                  <div>
                    <select
                      name="category_id"
                      value={form.category_id ?? ""}
                      onChange={handleCategoryChange}
                      className={`${inputCls} bg-transparent cursor-pointer`}
                    >
                      <option value="">— None —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryRequest(true)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-primary hover:text-orange-deep transition-colors cursor-pointer"
                    >
                      <Tag size={12} /> Request new category
                    </button>
                  </div>
                ) : (
                  <div>
                    <input type="text" name="category" value={form.category} onChange={handleChange} className={inputCls} placeholder="Burgers, Drinks, etc." />
                    <button
                      type="button"
                      onClick={() => setShowCategoryRequest(true)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-primary hover:text-orange-deep transition-colors cursor-pointer"
                    >
                      <Tag size={12} /> Request new category
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Availability</label>
                <label className="flex items-center gap-3 mt-2.5 cursor-pointer select-none">
                  <span onClick={() => setForm({ ...form, is_available: !form.is_available })} className={`w-11 h-6 rounded-full relative transition-colors ${form.is_available ? "bg-orange-primary" : "bg-zinc-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_available ? "left-[22px]" : "left-0.5"}`} />
                  </span>
                  <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className="sr-only" readOnly />
                  <span className="text-sm text-text-muted">{form.is_available ? "Available to order" : "Hidden from menu"}</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={`${inputCls} resize-y`} placeholder="Describe the item..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Image</label>
                <div className="flex items-center gap-4 mt-2.5">
                  {(imagePreview || imageUrl) && <img src={imagePreview || imageUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover" />}
                  <label className="inline-flex items-center gap-2 border-2 border-dashed border-zinc-300 hover:border-orange-primary text-text-muted hover:text-orange-primary text-sm font-semibold px-5 py-3 rounded-2xl cursor-pointer transition-colors">
                    <ImageIcon size={15} /> {imagePreview || imageUrl ? "Replace image" : "Upload image"}
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className="h-px flex-1 bg-zinc-100" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-light">or use a URL</span>
                  <span className="h-px flex-1 bg-zinc-100" />
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="url"
                    name="image_url"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder="Paste image URL from Google..."
                    className="flex-1 min-w-0 bg-transparent border-b border-zinc-200 focus:border-orange-500 outline-none py-2 text-sm text-text-primary placeholder:text-text-light transition-colors"
                  />
                  {(imagePreview || imageUrl) && (
                    <button type="button" onClick={handleRemoveImage} className="text-xs font-semibold text-red-500 hover:text-red-600 shrink-0 cursor-pointer">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-light mt-1.5">Uploading a photo overrides the URL.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-7 py-3 rounded-lg transition-all disabled:cursor-not-allowed cursor-pointer font-outfit">
                {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary text-sm font-medium px-5 py-3 cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Loading menu items...</p>
      ) : items.length === 0 && !showForm ? (
        <div className="bg-card rounded-[13px] border border-border py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-soft flex items-center justify-center text-orange-deep mb-4">
            <UtensilsCrossed size={26} />
          </div>
          <p className="font-semibold text-text-primary mb-1">No menu items yet</p>
          <p className="text-sm text-text-muted">Click "Add Menu Item" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {(() => {
            const grouped = {};
            items.forEach((item) => {
              const cat = item.category || "Uncategorized";
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(item);
            });
            return Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">{cat}</h3>
                <div className="grid gap-4">
                  {catItems.map((item) => (
                    <div key={item.id} className="bg-card rounded-[13px] border border-border p-5 flex justify-between items-center gap-4 transition-all duration-300 hover:border-zinc-300">
                      <div className="flex gap-5 items-center min-w-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 bg-surface rounded-2xl shrink-0 flex items-center justify-center text-text-light">
                            <UtensilsCrossed size={22} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-bold text-text-primary">{item.name}</span>
                            {item.discount_price != null ? (
                              <>
                                <span className="font-bold text-text-light line-through font-mono tracking-tight text-xs">{formatPrice(item.price)}</span>
                                <span className="font-bold text-orange-primary font-mono tracking-tight">{formatPrice(item.discount_price)}</span>
                              </>
                            ) : (
                              <span className="font-bold text-orange-primary font-mono tracking-tight">{formatPrice(item.price)}</span>
                            )}
                            {!item.is_available && (
                              <span className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Unavailable</span>
                            )}
                          </div>
                          {item.description && <p className="text-sm text-text-muted truncate">{item.description}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          title={item.is_available ? "Mark unavailable" : "Mark available"}
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                            item.is_available
                              ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              : "text-red-500 border-red-200 hover:bg-red-50"
                          }`}
                        >
                          {item.is_available ? <Power size={14} /> : <PowerOff size={14} />}
                          {item.is_available ? "On" : "Off"}
                        </button>
                        <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-primary border border-border hover:border-zinc-300 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-400 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {showCategoryRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-[13px] border border-border p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-[15px] font-bold text-text-primary mb-4">Request New Category</h3>
            {categoryRequestSuccess ? (
              <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-2xl mb-4">{categoryRequestSuccess}</div>
            ) : (
              <>
                {categoryRequestError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl mb-4">{categoryRequestError}</div>}
                <input
                  type="text"
                  value={categoryRequestName}
                  onChange={(e) => setCategoryRequestName(e.target.value)}
                  placeholder="e.g. Sushi, Thai..."
                  className={`${inputCls} mb-4`}
                  autoFocus
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCategoryRequest}
                    disabled={categoryRequestSaving || !categoryRequestName.trim()}
                    className="bg-orange-primary hover:bg-orange-deep disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all disabled:cursor-not-allowed cursor-pointer font-outfit"
                  >
                    {categoryRequestSaving ? "Submitting..." : "Submit Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCategoryRequest(false); setCategoryRequestName(""); setCategoryRequestError(""); setCategoryRequestSuccess(""); }}
                    className="text-text-muted hover:text-text-primary text-sm font-medium px-4 py-2.5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}