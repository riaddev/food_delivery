import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, Store, MapPin, UtensilsCrossed, Check, ClipboardCheck,
} from "lucide-react";
import { authApi } from "../../features/api/apiSlice";
import BackToHome from "../../components/BackToHome";

const CUISINE_OPTIONS = ["Biryani", "Burger", "Pizza", "Kabab", "Dessert", "Fast Food", "Other"];

const TERMS = [
  "I agree to maintain food quality and hygiene.",
  "I agree to pay a 10% commission to Swift Bite on each order.",
  "I understand my account must be approved by the Admin before I can access my dashboard.",
];

const inputClasses =
  "w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#E03546] focus:ring-2 focus:ring-[#E03546]/15 transition-colors bg-white placeholder:text-zinc-400";

const fieldLabel = "block text-sm font-semibold text-zinc-700 mb-1.5";

export default function SignupRestaurant() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    restaurant_name: "",
    address: "",
  });
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleCuisine = (c) => {
    setCuisineTypes((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.applyRestaurant({
        name: form.name,
        email: form.email,
        phone: form.phone,
        restaurant_name: form.restaurant_name,
        cuisine_type: cuisineTypes.join(", "),
        address: form.address,
      });
      setSubmitted(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      <aside className="hidden lg:flex w-[42%] xl:w-[38%] bg-zinc-900 text-white p-12 flex-col justify-between min-h-screen sticky top-0">
        <Link to="/" className="flex items-center gap-2.5 text-xl tracking-tight font-bold text-[#E03546]">
          <span className="w-10 h-10 rounded-lg bg-[#E03546] flex items-center justify-center text-white">
            <UtensilsCrossed size={19} strokeWidth={2.2} />
          </span>
          Swift<span className="text-white">Bite</span>
        </Link>

        <div>
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
            Partner with Swift Bite
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={2.5} />
              </span>
              Reach thousands of hungry customers across Dhaka.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={2.5} />
              </span>
              Keep 90% of every order — just a simple 10% commission.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={2.5} />
              </span>
              Get verified by our team before going live.
            </li>
          </ul>
        </div>

        <p className="text-xs text-zinc-500">Swift Bite &copy; 2026. All rights reserved.</p>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="fixed top-5 left-5 z-10">
          <BackToHome />
        </div>

        <div className="max-w-lg mx-auto mt-10 mb-16 px-5">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="text-3xl font-extrabold text-[#E03546]">
              Swift<span className="text-zinc-900">Bite</span>
            </Link>
            <h2 className="text-xl font-bold text-zinc-900 mt-4">Partner with Swift Bite</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            {submitted ? (
              <div className="text-center py-6">
                <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <ClipboardCheck size={30} strokeWidth={2} />
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-5">Application Submitted</h1>
                <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
                  Thanks for applying! Our team will review your business information and
                  email <span className="font-semibold text-zinc-900">{form.email}</span> to set up
                  your password once your account is approved.
                </p>
                <div className="mt-7 flex flex-col gap-3">
                  <Link
                    to="/"
                    className="w-full py-3 rounded-xl font-medium text-white bg-[#E03546] hover:bg-[#c72e3e] transition-colors text-center"
                  >
                    Back to Home
                  </Link>
                  <Link
                    to="/login"
                    className="w-full py-3 rounded-xl font-medium text-zinc-700 border border-zinc-200 hover:border-zinc-300 transition-colors text-center"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Restaurant Partner Application</h1>
                <p className="text-zinc-500 text-sm mt-1.5">
                  Fill in your business details below. Your account goes live after admin approval.
                </p>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mt-5">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className={fieldLabel}>Owner Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Business Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="01XXXXXXXXX"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Restaurant Name</label>
                    <div className="relative">
                      <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        name="restaurant_name"
                        required
                        value={form.restaurant_name}
                        onChange={handleChange}
                        placeholder="Bella Italia"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Cuisine Type</label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((c) => {
                        const selected = cuisineTypes.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCuisine(c)}
                            aria-pressed={selected}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                              selected
                                ? "bg-[#E03546] text-white border-[#E03546]"
                                : "bg-white text-zinc-600 border-zinc-200 hover:border-[#E03546] hover:text-[#E03546]"
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>Restaurant Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
                      <textarea
                        name="address"
                        rows={3}
                        value={form.address}
                        onChange={handleChange}
                        placeholder="House, road, area"
                        className={`${inputClasses} resize-none`}
                      />
                    </div>
                  </div>

                  <div className="border border-zinc-200 bg-zinc-50 rounded-lg p-4 text-xs text-zinc-600">
                    <p className="font-semibold text-zinc-800 mb-2">Terms &amp; Conditions</p>
                    <ul className="space-y-1.5 list-disc pl-4">
                      {TERMS.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#E03546] cursor-pointer"
                    />
                    <span className="text-sm text-zinc-600">
                      I have read and agree to the <span className="font-semibold text-zinc-900">Terms &amp; Conditions</span>.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!terms || cuisineTypes.length === 0 || submitting}
                    className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed bg-[#E03546] hover:bg-[#c72e3e] cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}