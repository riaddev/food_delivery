import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

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
      await login(form.email, form.password);
      navigate("/");
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
    <div className="sb-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f2ec" }}>
      <div style={{ width: "100%", maxWidth: 420, margin: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ fontSize: 28, fontWeight: 800, color: "#ff6b35", textDecoration: "none" }}>
            Swift<span style={{ color: "#111827" }}>Bite</span>
          </Link>
          <p style={{ color: "#6b6b6f", marginTop: 8, fontSize: 14 }}>Welcome back! Sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", padding: "12px 0", background: submitting ? "#ccc" : "#ff6b35", color: "#fff", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", transition: "background 0.2s" }}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "#6b6b6f" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#ff6b35", fontWeight: 600, textDecoration: "none" }}>Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
