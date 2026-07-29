import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0]?.[0];
        setError(first || "Registration failed.");
      } else {
        setError(err.response?.data?.message || "Registration failed.");
      }
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
          <p style={{ color: "#6b6b6f", marginTop: 8, fontSize: 14 }}>Create your account and start ordering.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 13, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="John Doe" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="you@example.com" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="At least 8 characters" />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirm Password</label>
            <input type="password" required value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              placeholder="Repeat your password" />
          </div>

          <button type="submit" disabled={submitting}
            style={{ width: "100%", padding: "12px 0", background: submitting ? "#ccc" : "#ff6b35", color: "#fff", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "#6b6b6f" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#ff6b35", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
