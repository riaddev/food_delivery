import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import BackToHome from "../../components/BackToHome";
import Logo from "../../components/Logo";

const roleRedirect = (role) => {
  switch (role) {
    case "customer": return "/customer/dashboard";
    case "restaurant": return "/restaurant/dashboard";
    case "rider": return "/rider/dashboard";
    case "admin": return "/admin/dashboard";
    default: return "/";
  }
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await login(form.email, form.password);
      // Return staff to role-appropriate deep links (e.g. rider visiting
      // /rider/dashboard while logged out); customers keep any `from`.
      const from = location.state?.from;
      const roleBase = { rider: "/rider", restaurant: "/restaurant", admin: "/admin" }[data.user.role];
      const safeFrom = data.user.role === "customer"
        ? from
        : from && roleBase && from.startsWith(roleBase) ? from : null;
      navigate(safeFrom || roleRedirect(data.user.role), { replace: true });
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
      <div className="fixed top-5 left-5 z-10">
        <BackToHome />
      </div>
      <div className="w-full max-w-[420px] mx-5">
        <div className="text-center mb-8">
          <Link to="/" className="no-underline inline-block">
            <Logo
              size={40}
              variant="color"
              swiftClassName="text-[#ff6b35]"
              biteClassName="text-gray-900"
              textClassName="text-[28px] font-extrabold tracking-tight"
            />
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Welcome back! Sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-5 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {location.state?.from === "/checkout" && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm px-3.5 py-2.5 rounded-[10px] mb-4">
              Sign in to complete your order — your cart is saved.
            </div>
          )}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[#ff6b35] no-underline hover:underline">
                Forgot password?
              </Link>
            </div>
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
            <Link to="/register" state={location.state?.from ? { from: location.state.from } : undefined} className="text-[#ff6b35] font-semibold no-underline">Create one</Link>
          </p>

          <div className="border-t border-gray-200 mt-5 pt-5 text-center">
            <p className="text-sm text-gray-500 mb-2">Own a restaurant?</p>
            <Link to="/signup/restaurant" className="text-[#ff6b35] font-semibold text-sm no-underline">Apply as a Restaurant Partner</Link>
            <p className="text-sm text-gray-500 mt-3">
              Approved already?{" "}
              <Link to="/restaurant/setup" className="text-[#ff6b35] font-semibold text-sm no-underline">Set up your account</Link>
            </p>
          </div>

          <div className="border-t border-gray-200 mt-5 pt-5 text-center">
            <p className="text-sm text-gray-500 mb-2">Want to deliver?</p>
            <Link to="/signup/rider" className="text-[#ff6b35] font-semibold text-sm no-underline">Apply as a Rider</Link>
            <p className="text-sm text-gray-500 mt-3">
              Approved already?{" "}
              <Link to="/rider/setup" className="text-[#ff6b35] font-semibold text-sm no-underline">Set up your rider account</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
