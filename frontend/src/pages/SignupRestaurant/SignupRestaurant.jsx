import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, Store, MapPin, UtensilsCrossed, CheckCircle,
  TrendingUp, Bike, Users, ArrowLeft,
} from "lucide-react";
import { authApi } from "../../features/api/apiSlice";

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
  const [customCuisine, setCustomCuisine] = useState("");
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

  const cuisineValid =
    cuisineTypes.length > 0 &&
    (!cuisineTypes.includes("Other") || customCuisine.trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const selectedCuisines = [...cuisineTypes];
      if (cuisineTypes.includes("Other") && customCuisine.trim()) {
        selectedCuisines.push(customCuisine.trim());
      }
      await authApi.applyRestaurant({
        name: form.name,
        email: form.email,
        phone: form.phone,
        restaurant_name: form.restaurant_name,
        cuisine_type: selectedCuisines.join(", "),
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
      <aside className="hidden lg:flex w-[42%] xl:w-[38%] bg-zinc-900 text-white px-12 py-8 flex-col justify-between min-h-screen sticky top-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(224,53,70,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 text-xl tracking-tight font-bold text-[#E03546]">
            <span className="w-10 h-10 rounded-lg bg-[#E03546] flex items-center justify-center text-white">
              <UtensilsCrossed size={19} strokeWidth={2.2} />
            </span>
            Swift<span className="text-white">Bite</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
            Partner with Swift Bite
          </h2>
          <ul className="mt-10 space-y-6">
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[#E03546]">
                <TrendingUp size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Increase revenue</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Keep 90% of every order — just a simple 10% commission.</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[#E03546]">
                <Bike size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Fast delivery</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Get orders out quickly with our delivery network.</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-[#E03546]">
                <Users size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Reach more customers</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Thousands of hungry customers across Dhaka, every day.</span>
              </span>
            </li>
          </ul>
        </div>

        <div className="relative z-10">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-center">
              <span className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900">JS</span>
              <span className="w-9 h-9 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900 -ml-2.5">MR</span>
              <span className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900 -ml-2.5">AK</span>
              <span className="w-9 h-9 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900 -ml-2.5">+</span>
            </div>
            <p className="text-sm font-semibold text-white mt-3">Join 500+ restaurants in Dhaka</p>
            <p className="text-xs text-zinc-400 mt-0.5">Trusted by food partners across the city.</p>
          </div>
          <p className="text-xs text-zinc-500 mt-6">Swift Bite &copy; 2026. All rights reserved.</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="px-12 py-8">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
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
                <span className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle size={40} strokeWidth={2} />
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-6">Application Submitted!</h1>
                <p className="text-zinc-500 text-sm mt-2.5 leading-relaxed">
                  Our admin team is reviewing your details. Once approved, a one-time setup code will be sent to your email — use it to create your password.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    to="/restaurant/setup"
                    className="w-full py-3 rounded-xl font-medium text-white bg-[#E03546] hover:bg-[#c72e3e] transition-colors text-center"
                  >
                    Check setup status
                  </Link>
                  <Link
                    to="/"
                    className="w-full py-3 rounded-xl font-medium text-zinc-700 border border-zinc-200 hover:border-zinc-300 transition-colors text-center"
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
                      {CUISINE_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCuisine(c)}
                          aria-pressed={cuisineTypes.includes(c)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                            cuisineTypes.includes(c)
                              ? "bg-[#E03546] text-white border-[#E03546]"
                              : "bg-white text-zinc-600 border-zinc-200 hover:border-[#E03546] hover:text-[#E03546]"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">Select all that apply.</p>
                    {cuisineTypes.includes("Other") && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={customCuisine}
                          onChange={(e) => setCustomCuisine(e.target.value)}
                          placeholder="Specify your cuisine"
                          className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#E03546] focus:ring-2 focus:ring-[#E03546]/15 transition-colors bg-white placeholder:text-zinc-400"
                        />
                      </div>
                    )}
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
                    disabled={!terms || !cuisineValid || submitting}
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