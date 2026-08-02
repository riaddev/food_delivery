import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const cuisineOptions = ["Bangladeshi", "Fast Food", "Chinese", "Pizza", "Burgers", "Cafe", "Dessert", "Others"];

const RegisterRestaurantPage = () => {
  const { registerRestaurant } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ restaurant_name: "", name: "", email: "", phone: "", password: "", password_confirmation: "", cuisine_type: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirmation) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      await registerRestaurant({
        restaurant_name: form.restaurant_name, name: form.name, email: form.email,
        phone: form.phone, password: form.password, cuisine_type: form.cuisine_type,
      });
      navigate("/restaurant/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Registration failed.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f2ec] py-10 px-5">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-8">
          <Link to="/" className="text-[28px] font-extrabold text-[#ff6b35] no-underline">
            Swift<span className="text-gray-900">Bite</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">List your restaurant and reach more customers.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-[10px] mb-4">{error}</div>}

          <h3 className="text-base font-bold text-gray-900 mb-4 mt-0">Account Information</h3>

          {[{ name: "restaurant_name", label: "Restaurant Name *", type: "text", placeholder: "Bella Italia" },
            { name: "name", label: "Owner/Manager Name *", type: "text", placeholder: "John Doe" },
            { name: "email", label: "Email Address *", type: "email", placeholder: "you@example.com" },
            { name: "phone", label: "Phone Number *", type: "tel", placeholder: "+1 234 567 8900" },
          ].map((f) => (
            <div key={f.name} className="mb-3.5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
              <input type={f.type} name={f.name} required value={form[f.name]} onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border" placeholder={f.placeholder} />
            </div>
          ))}

          <div className="mb-3.5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
            <input type="password" name="password" required minLength={8} value={form.password} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border" placeholder="At least 8 characters" />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
            <input type="password" name="password_confirmation" required value={form.password_confirmation} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border" placeholder="Repeat your password" />
          </div>

          <h3 className="text-base font-bold text-gray-900 mb-4">Business Information</h3>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cuisine Type *</label>
            <select name="cuisine_type" required value={form.cuisine_type} onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border bg-white">
              <option value="">Select cuisine type</option>
              {cuisineOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-full text-base font-bold text-white transition cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 bg-[#ff6b35] hover:bg-[#e6551a]">
            {submitting ? "Registering..." : "Register Restaurant"}
          </button>

          <p className="text-center mt-[18px] text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#ff6b35] font-semibold no-underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterRestaurantPage;
