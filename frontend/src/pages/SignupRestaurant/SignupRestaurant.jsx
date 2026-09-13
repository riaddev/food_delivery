import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, Store, MapPin, CheckCircle,
  TrendingUp, Bike, Users, ArrowLeft, Clock, ImagePlus, X,
  FileText, ClipboardCheck, BadgeCheck, LockKeyhole,
} from "lucide-react";
import { authApi } from "../../features/api/apiSlice";
import Logo from "../../components/Logo";

const BG = "https://images.unsplash.com/photo-1577308856961-8e9ec50d0c67?q=80&w=1920&auto=format&fit=crop";

const FOOD_ICONS = ["🍔", "🍕", "🍜", "🌮", "🥗", "🍰"];

const CUISINE_OPTIONS = [
  "Bangladeshi", "Biryani", "Chinese", "Indian", "Fast Food",
  "Burger", "Pizza", "Kebab", "Dessert", "Cafe", "Bakery", "Other",
];

const DAY_OPTIONS = [
  "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
];

const TERMS = [
  "I agree to maintain food quality and hygiene.",
  "I agree to pay a 10% commission to Swift Bite on each order.",
  "Your application will be reviewed by Swift Bite. Your restaurant account will become active only after admin approval.",
];

const inputClasses =
  "w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400";

const inputErrorClasses =
  "w-full pl-10 pr-3.5 py-2.5 border border-red-400 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400";

const fieldLabel = "block text-sm font-semibold text-zinc-700 mb-1.5";

const sectionTitle =
  "flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-zinc-900";

const chipClasses = (active) =>
  `px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
    active
      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-[0_4px_14px_rgba(255,106,43,0.35)]"
      : "bg-white text-zinc-600 border-zinc-200 hover:border-[#FF6B00] hover:text-[#FF6B00]"
  }`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_PHONE_RE = /^01[3-9]\d{8}$/;

export default function SignupRestaurant() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    restaurant_name: "",
    description: "",
    address: "",
    area: "",
    city: "Dhaka",
    opening_time: "",
    closing_time: "",
  });
  const [cuisineTypes, setCuisineTypes] = useState([]);
  const [customCuisine, setCustomCuisine] = useState("");
  const [operatingDays, setOperatingDays] = useState([]);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const logoRef = useRef(null);
  const [logo, setLogo] = useState({ file: null, preview: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const toggleCuisine = (c) => {
    setCuisineTypes((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
    setErrors((prev) => ({ ...prev, cuisine_type: "" }));
  };

  const toggleDay = (d) => {
    setOperatingDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    setErrors((prev) => ({ ...prev, operating_days: "" }));
  };

  const handleLogo = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, logo: "Logo must be a JPG or PNG image." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "Logo must be under 2MB." }));
      return;
    }
    setErrors((prev) => ({ ...prev, logo: "" }));
    setLogo({ file, preview: URL.createObjectURL(file) });
  };

  const clearLogo = () => {
    if (logo.preview) URL.revokeObjectURL(logo.preview);
    setLogo({ file: null, preview: null });
    if (logoRef.current) logoRef.current.value = "";
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Owner name is required.";
    if (!form.email.trim()) errs.email = "Email address is required.";
    else if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!BD_PHONE_RE.test(form.phone)) errs.phone = "Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX).";
    if (!form.restaurant_name.trim()) errs.restaurant_name = "Restaurant name is required.";
    if (cuisineTypes.length === 0) errs.cuisine_type = "Select at least one cuisine type.";
    if (cuisineTypes.includes("Other") && !customCuisine.trim()) errs.custom_cuisine = "Specify your cuisine.";
    if (!form.address.trim()) errs.address = "Restaurant address is required.";
    if (!form.area.trim()) errs.area = "Area / location is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.opening_time) errs.opening_time = "Opening time is required.";
    if (!form.closing_time) errs.closing_time = "Closing time is required.";
    if (operatingDays.length === 0) errs.operating_days = "Select at least one operating day.";
    if (!terms) errs.terms = "You must accept the Terms & Conditions.";
    return errs;
  };

  const formValid = Object.keys(validate()).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const selectedCuisines = [...cuisineTypes];
      if (cuisineTypes.includes("Other") && customCuisine.trim()) {
        selectedCuisines.push(customCuisine.trim());
      }
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("restaurant_name", form.restaurant_name);
      fd.append("cuisine_type", selectedCuisines.join(", "));
      fd.append("description", form.description);
      fd.append("address", form.address);
      fd.append("area", form.area);
      fd.append("city", form.city);
      fd.append("opening_time", form.opening_time);
      fd.append("closing_time", form.closing_time);
      fd.append("operating_days", operatingDays.join(", "));
      if (logo.file) fd.append("logo", logo.file);
      await authApi.applyRestaurant(fd);
      setSubmitted(true);
    } catch (err) {
      const errData = err.response?.data?.errors;
      setError(errData ? Object.values(errData)[0]?.[0] : err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key) =>
    errors[key] ? <p className="text-xs text-red-600 mt-1.5">{errors[key]}</p> : null;

  return (
    <div className="min-h-screen flex bg-[#f6f2ec]">
      <aside className="hidden lg:flex w-[42%] xl:w-[38%] bg-zinc-900 text-white px-12 py-8 flex-col justify-between min-h-screen sticky top-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${BG})` }} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.72) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.3),transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          {FOOD_ICONS.map((icon, i) => (
            <span
              key={i}
              className="absolute animate-float-cta opacity-25"
              style={{
                left: `${8 + (i * 17) % 84}%`,
                top: `${12 + (i * 19) % 76}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i % 3)}s`,
                fontSize: `${20 + (i % 3) * 6}px`,
              }}
            >
              {icon}
            </span>
          ))}
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 outline-none focus:outline-none">
            <Logo
              size={40}
              variant="color"
              swiftClassName="text-[#FF6B00]"
              biteClassName="text-white"
              textClassName="text-xl tracking-tight font-bold"
            />
          </Link>
        </div>

        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: "rgba(255,107,0,0.12)",
              border: "1px solid rgba(255,107,0,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#FF9A3C]">
              Restaurant partner program
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
            Partner with{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #FF6B00, #FFB347)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Swift Bite
            </span>
          </h2>
          <ul className="mt-10 space-y-6">
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                <TrendingUp size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Increase revenue</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Keep 90% of every order — just a simple 10% commission.</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                <Bike size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Fast delivery</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Get orders out quickly with our delivery network.</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                <Users size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Reach more customers</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Thousands of hungry customers across Dhaka, every day.</span>
              </span>
            </li>
          </ul>

          <div className="mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF9A3C]">How it works</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <FileText size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Submit your application</p>
                  <p className="text-xs text-zinc-400">Share your restaurant details below.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <ClipboardCheck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Admin verifies your details</p>
                  <p className="text-xs text-zinc-400">Our team reviews every application.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <BadgeCheck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Get approved</p>
                  <p className="text-xs text-zinc-400">Your account goes live after approval.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <LockKeyhole size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Log in with your email</p>
                  <p className="text-xs text-zinc-400">Verify with a one-time code sent to your inbox.</p>
                </div>
              </div>
            </div>
          </div>
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
        <div className="px-5 sm:px-12 py-8">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto mt-10 mb-16 px-5">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-block outline-none focus:outline-none">
              <Logo
                size={44}
                variant="color"
                swiftClassName="text-[#FF6B00]"
                biteClassName="text-zinc-900"
                textClassName="text-3xl font-extrabold tracking-tight"
              />
            </Link>
            <h2 className="text-xl font-bold text-zinc-900 mt-4">Partner with Swift Bite</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 sm:p-8">
            {submitted ? (
              <div className="text-center py-6">
                <span className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle size={40} strokeWidth={2} />
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-6">Application Submitted!</h1>
                <p className="text-zinc-500 text-sm mt-2.5 leading-relaxed">
                  Application submitted successfully. Your application is now pending admin approval. You can log in using your registered email after your application is approved.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    to="/restaurant/setup"
                    className="w-full py-3 rounded-full font-bold text-white bg-gradient-to-br from-[#FF6B00] to-[#E05500] shadow-[0_4px_18px_rgba(255,107,0,0.38)] hover:opacity-90 transition text-center"
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

                <form onSubmit={handleSubmit} className="mt-6 space-y-8" noValidate>
                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <User size={15} strokeWidth={2.2} />
                      </span>
                      Owner Information
                    </h2>

                    <div>
                      <label className={fieldLabel}>Owner Name *</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className={errors.name ? inputErrorClasses : inputClasses}
                        />
                      </div>
                      {fieldError("name")}
                    </div>

                    <div>
                      <label className={fieldLabel}>Email Address *</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="owner@example.com"
                          className={errors.email ? inputErrorClasses : inputClasses}
                        />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1.5">
                        We'll use this email for account access and OTP verification.
                      </p>
                      {fieldError("email")}
                    </div>

                    <div>
                      <label className={fieldLabel}>Phone Number *</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="01XXXXXXXXX"
                          className={errors.phone ? inputErrorClasses : inputClasses}
                        />
                      </div>
                      {fieldError("phone")}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <Store size={15} strokeWidth={2.2} />
                      </span>
                      Restaurant Information
                    </h2>

                    <div>
                      <label className={fieldLabel}>Restaurant Name *</label>
                      <div className="relative">
                        <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          name="restaurant_name"
                          value={form.restaurant_name}
                          onChange={handleChange}
                          placeholder="Bella Italia"
                          className={errors.restaurant_name ? inputErrorClasses : inputClasses}
                        />
                      </div>
                      {fieldError("restaurant_name")}
                    </div>

                    <div>
                      <label className={fieldLabel}>Cuisine Type *</label>
                      <div className="flex flex-wrap gap-2">
                        {CUISINE_OPTIONS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleCuisine(c)}
                            aria-pressed={cuisineTypes.includes(c)}
                            className={chipClasses(cuisineTypes.includes(c))}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">Select all that apply.</p>
                      {errors.cuisine_type && (
                        <p className="text-xs text-red-600 mt-1.5">{errors.cuisine_type}</p>
                      )}
                      {cuisineTypes.includes("Other") && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={customCuisine}
                            onChange={(e) => {
                              setCustomCuisine(e.target.value);
                              setErrors((prev) => ({ ...prev, custom_cuisine: "" }));
                            }}
                            placeholder="Specify your cuisine"
                            className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400"
                          />
                          {fieldError("custom_cuisine")}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={fieldLabel}>Restaurant Description</label>
                      <textarea
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Tell customers a little about your restaurant..."
                        className={`${inputClasses} resize-none`}
                      />
                    </div>

                    <div>
                      <label className={fieldLabel}>Restaurant Logo</label>
                      <div className="flex items-center gap-4">
                        {logo.preview ? (
                          <div className="relative shrink-0">
                            <img src={logo.preview} alt="Logo preview" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-zinc-200" />
                            <button
                              type="button"
                              onClick={clearLogo}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                              aria-label="Remove logo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null}
                        <div>
                          <button
                            type="button"
                            onClick={() => logoRef.current?.click()}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] transition-colors cursor-pointer"
                          >
                            <ImagePlus size={16} /> {logo.preview ? "Replace logo" : "Upload logo"}
                          </button>
                          <p className="text-xs text-zinc-400 mt-1">JPG or PNG, up to 2MB.</p>
                        </div>
                        <input
                          ref={logoRef}
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleLogo}
                          className="hidden"
                        />
                      </div>
                      {fieldError("logo")}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <MapPin size={15} strokeWidth={2.2} />
                      </span>
                      Location
                    </h2>

                    <div>
                      <label className={fieldLabel}>Restaurant Address *</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
                        <textarea
                          name="address"
                          rows={3}
                          value={form.address}
                          onChange={handleChange}
                          placeholder="House, road, area"
                          className={`${errors.address ? inputErrorClasses : inputClasses} resize-none`}
                        />
                      </div>
                      {fieldError("address")}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Area / Location *</label>
                        <input
                          type="text"
                          name="area"
                          value={form.area}
                          onChange={handleChange}
                          placeholder="e.g. Dhanmondi"
                          className={errors.area ? inputErrorClasses : inputClasses}
                        />
                        {fieldError("area")}
                      </div>
                      <div>
                        <label className={fieldLabel}>City *</label>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="Dhaka"
                          className={errors.city ? inputErrorClasses : inputClasses}
                        />
                        {fieldError("city")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <Clock size={15} strokeWidth={2.2} />
                      </span>
                      Operating Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Opening Time *</label>
                        <div className="relative">
                          <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="time"
                            name="opening_time"
                            value={form.opening_time}
                            onChange={handleChange}
                            className={errors.opening_time ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("opening_time")}
                      </div>
                      <div>
                        <label className={fieldLabel}>Closing Time *</label>
                        <div className="relative">
                          <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="time"
                            name="closing_time"
                            value={form.closing_time}
                            onChange={handleChange}
                            className={errors.closing_time ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("closing_time")}
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabel}>Operating Days *</label>
                      <div className="flex flex-wrap gap-2">
                        {DAY_OPTIONS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDay(d)}
                            aria-pressed={operatingDays.includes(d)}
                            className={chipClasses(operatingDays.includes(d))}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">Select all days your restaurant is open.</p>
                      {errors.operating_days && (
                        <p className="text-xs text-red-600 mt-1.5">{errors.operating_days}</p>
                      )}
                    </div>
                  </div>

                  <div className="border border-orange-100 bg-[#fafafa] rounded-lg p-4 text-xs text-zinc-600">
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
                      onChange={(e) => {
                        setTerms(e.target.checked);
                        setErrors((prev) => ({ ...prev, terms: "" }));
                      }}
                      className="mt-0.5 w-4 h-4 accent-[#FF6B00] cursor-pointer"
                    />
                    <span className="text-sm text-zinc-600">
                      I have read and agree to the <span className="font-semibold text-zinc-900">Terms &amp; Conditions</span>.
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-red-600 mt-1">{errors.terms}</p>}

                  <button
                    type="submit"
                    disabled={!formValid || submitting}
                    className="w-full py-3 rounded-full font-bold text-white transition disabled:bg-gray-300 disabled:bg-none disabled:cursor-not-allowed bg-gradient-to-br from-[#FF6B00] to-[#E05500] shadow-[0_4px_18px_rgba(255,107,0,0.38)] hover:opacity-90 cursor-pointer"
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