import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const roleRedirect = (role) => {
  switch (role) {
    case "customer": return "/customer/account";
    case "restaurant": return "/restaurant/dashboard";
    case "admin": return "/admin/dashboard";
    default: return "/";
  }
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await login(form.email, form.password);
      navigate(roleRedirect(data.user.role));
    } catch (err) {
      setError(
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        "Login failed. Please try again."
      );
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
          <p className="text-gray-500 mt-2 text-sm">Welcome back! Sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-[10px] mb-4">{error}</div>
          )}

          <div className="mb-[18px]">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border"
              placeholder="you@example.com" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[10px] text-sm outline-none focus:ring-2 focus:ring-orange-400 box-border"
              placeholder="Enter your password" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-full text-base font-bold text-white transition cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 bg-[#ff6b35] hover:bg-[#e6551a]">
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center mt-[18px] text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#ff6b35] font-semibold no-underline">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
