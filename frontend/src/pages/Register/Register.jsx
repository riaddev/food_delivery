import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const RegisterPage = () => {
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirmation) { setError("Passwords do not match."); return; }
    setSubmitting(true);
    try {
      await registerCustomer(form.name, form.email, form.password, form.phone);
      navigate("/customer/account");
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f2ec]">
      <div className="w-full max-w-[420px] mx-5">
        <div className="text-center mb-8">
          <Link to="/" className="text-[28px] font-extrabold text-[#ff6b35] no-underline">
            Swift<span className="text-gray-900">Bite</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Create your account and start ordering.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-[10px] mb-4">{error}</div>}

          {["name", "email", "phone"].map((field) => (
            <div key={field} className="mb-[18px]">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 capitalize">{field === "phone" ? "Phone Number" : field === "name" ? "Full Name" : field}</label>
              <input type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} required={field !== "phone"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border"
                placeholder={field === "name" ? "John Doe" : field === "email" ? "you@example.com" : "+1 234 567 8900"} />
            </div>
          ))}

          {["password", "password_confirmation"].map((field) => (
            <div key={field} className={field === "password" ? "mb-[18px]" : "mb-6"}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field === "password" ? "Password" : "Confirm Password"}</label>
              <input type="password" required={field === "password"} minLength={field === "password" ? 8 : undefined} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border"
                placeholder={field === "password" ? "At least 8 characters" : "Repeat your password"} />
            </div>
          ))}

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-full text-base font-bold text-white transition cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 bg-[#ff6b35] hover:bg-[#e6551a]">
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center mt-[18px] text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#ff6b35] font-semibold no-underline">Sign in</Link>
          </p>

          <div className="border-t border-gray-200 mt-5 pt-5 text-center">
            <p className="text-sm text-gray-500 mb-2">Own a restaurant?</p>
            <Link to="/register/restaurant" className="text-[#ff6b35] font-semibold text-sm no-underline">Register your restaurant</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
