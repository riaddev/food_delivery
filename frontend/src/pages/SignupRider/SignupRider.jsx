import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, CheckCircle, TrendingUp, Clock, Wallet, ArrowLeft,
  IdCard, FileUp, CarFront, CalendarDays, ClipboardCheck, BadgeCheck, LockKeyhole, ImagePlus, X,
} from "lucide-react";
import { authApi } from "../../features/api/apiSlice";
import Logo from "../../components/Logo";

const BG = "https://images.unsplash.com/photo-1577308856961-8e9ec50d0c67?q=80&w=1920&auto=format&fit=crop";

const FOOD_ICONS = ["🍔", "🍕", "🍜", "🌮", "🥗", "🍰"];

const VEHICLE_OPTIONS = ["Bicycle", "Motorcycle", "Scooter", "Other"];

const DELIVERY_AREA_OPTIONS = [
  "Dhanmondi", "Gulshan", "Banani", "Mirpur", "Uttara",
  "Mohammadpur", "Badda", "Khilgaon", "Motijheel", "Other",
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
const NID_RE = /^(\d{10}|\d{17})$/;

export default function SignupRider() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    nid_number: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    license_number: "",
    vehicle_registration: "",
    vehicle_description: "",
    address: "",
    city: "Dhaka",
  });
  const [vehicleType, setVehicleType] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [customArea, setCustomArea] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const photoRef = useRef(null);
  const nidRef = useRef(null);
  const licenseRef = useRef(null);
  const [profilePhoto, setProfilePhoto] = useState({ file: null, preview: null });
  const [nidDoc, setNidDoc] = useState({ file: null });
  const [licenseDoc, setLicenseDoc] = useState({ file: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const pickFile = (kind, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (kind === "profile_photo") {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setErrors((prev) => ({ ...prev, profile_photo: "Profile photo must be a JPG or PNG image." }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profile_photo: "Profile photo must be under 2MB." }));
        return;
      }
      setErrors((prev) => ({ ...prev, profile_photo: "" }));
      setProfilePhoto({ file, preview: URL.createObjectURL(file) });
    } else {
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        setErrors((prev) => ({ ...prev, [kind]: "Document must be a JPG, PNG or PDF file." }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [kind]: "Document must be under 5MB." }));
        return;
      }
      setErrors((prev) => ({ ...prev, [kind]: "" }));
      if (kind === "nid_document") setNidDoc({ file });
      else setLicenseDoc({ file });
    }
  };

  const clearPhoto = () => {
    if (profilePhoto.preview) URL.revokeObjectURL(profilePhoto.preview);
    setProfilePhoto({ file: null, preview: null });
    if (photoRef.current) photoRef.current.value = "";
  };

  const clearDoc = (kind) => {
    if (kind === "nid_document") {
      setNidDoc({ file: null });
      if (nidRef.current) nidRef.current.value = "";
    } else {
      setLicenseDoc({ file: null });
      if (licenseRef.current) licenseRef.current.value = "";
    }
  };

  const motorized = vehicleType === "Motorcycle" || vehicleType === "Scooter";

  const toggleArea = (a) => {
    setDeliveryAreas((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
    setErrors((prev) => ({ ...prev, delivery_area: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email address is required.";
    else if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!BD_PHONE_RE.test(form.phone)) errs.phone = "Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX).";
    if (!form.date_of_birth) errs.date_of_birth = "Date of birth is required.";
    if (!form.nid_number.trim()) errs.nid_number = "NID number is required.";
    else if (!NID_RE.test(form.nid_number)) errs.nid_number = "Enter a valid NID number (10 or 17 digits).";
    if (!nidDoc.file) errs.nid_document = "NID document is required.";
    if (!form.emergency_contact_name.trim()) errs.emergency_contact_name = "Emergency contact name is required.";
    if (!form.emergency_contact_number.trim()) errs.emergency_contact_number = "Emergency contact number is required.";
    else if (!BD_PHONE_RE.test(form.emergency_contact_number)) errs.emergency_contact_number = "Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX).";
    if (!vehicleType) errs.vehicle_type = "Select a vehicle type.";
    if (motorized) {
      if (!form.license_number.trim()) errs.license_number = "Driving license number is required.";
      if (!licenseDoc.file) errs.license_document = "Driving license document is required.";
      if (!form.vehicle_registration.trim()) errs.vehicle_registration = "Vehicle registration number is required.";
    }
    if (vehicleType === "Other" && !form.vehicle_description.trim()) errs.vehicle_description = "Describe your vehicle.";
    if (!form.address.trim()) errs.address = "Current address is required.";
    if (deliveryAreas.length === 0) errs.delivery_area = "Select at least one delivery area.";
    if (deliveryAreas.includes("Other") && !customArea.trim()) errs.custom_area = "Specify your delivery area.";
    if (!form.city.trim()) errs.city = "City is required.";
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
      const selectedAreas = [...deliveryAreas];
      if (deliveryAreas.includes("Other") && customArea.trim()) {
        selectedAreas.push(customArea.trim());
      }
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("date_of_birth", form.date_of_birth);
      fd.append("nid_number", form.nid_number);
      fd.append("emergency_contact_name", form.emergency_contact_name);
      fd.append("emergency_contact_number", form.emergency_contact_number);
      fd.append("vehicle_type", vehicleType.toLowerCase());
      fd.append("address", form.address);
      fd.append("delivery_area", selectedAreas.join(", "));
      fd.append("city", form.city);
      if (profilePhoto.file) fd.append("profile_photo", profilePhoto.file);
      if (nidDoc.file) fd.append("nid_document", nidDoc.file);
      if (motorized) {
        fd.append("license_number", form.license_number);
        fd.append("vehicle_registration", form.vehicle_registration);
        if (licenseDoc.file) fd.append("license_document", licenseDoc.file);
      }
      if (vehicleType === "Other") fd.append("vehicle_description", form.vehicle_description);
      await authApi.applyRider(fd);
      setSubmitted(true);
    } catch (err) {
      const errData = err.response?.data?.errors;
      setError(errData ? Object.values(errData)[0]?.[0] : err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayErrors = { ...validate(), ...errors };

  const fieldError = (key) =>
    displayErrors[key] ? <p className="text-xs text-red-600 mt-1.5">{displayErrors[key]}</p> : null;

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
              Rider partner program
            </span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
            Deliver with{" "}
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
                <span className="block font-semibold text-white">Earn on your schedule</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Transparent payouts — you see the fee before you accept.</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                <Clock size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Flexible hours</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Dash when you want — lunch rush, dinner, or weekends.</span>
              </span>
            </li>
            <li className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-full bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                <Wallet size={18} strokeWidth={2.2} />
              </span>
              <span>
                <span className="block font-semibold text-white">Weekly payouts</span>
                <span className="block text-sm text-zinc-400 mt-0.5">Withdraw every Sunday to bKash, Nagad, or any bank.</span>
              </span>
            </li>
          </ul>

          <div className="mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF9A3C]">How it works</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <ClipboardCheck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Submit your application</p>
                  <p className="text-xs text-zinc-400">Share your details and documents below.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <BadgeCheck size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Admin verifies your identity</p>
                  <p className="text-xs text-zinc-400">Our team reviews every application.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <LockKeyhole size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Get approved</p>
                  <p className="text-xs text-zinc-400">Your account goes live after approval.</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="w-9 h-9 rounded-lg bg-[#FF6B00]/15 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <Mail size={16} strokeWidth={2.2} />
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
              <span className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900">RS</span>
              <span className="w-9 h-9 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900 -ml-2.5">TN</span>
              <span className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900 -ml-2.5">AK</span>
              <span className="w-9 h-9 rounded-full bg-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300 ring-2 ring-zinc-900 -ml-2.5">+</span>
            </div>
            <p className="text-sm font-semibold text-white mt-3">Join 300+ riders across Dhaka</p>
            <p className="text-xs text-zinc-400 mt-0.5">Delivering smiles, one order at a time.</p>
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
            <h2 className="text-xl font-bold text-zinc-900 mt-4">Deliver with Swift Bite</h2>
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
                    to="/rider/setup"
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
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Rider Partner Application</h1>
                <p className="text-zinc-500 text-sm mt-1.5">
                  Tell us about yourself. Your account goes live after admin approval.
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
                      Personal Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Full Name *</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className={displayErrors.name ? inputErrorClasses : inputClasses}
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
                            placeholder="rider@example.com"
                            className={displayErrors.email ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5">
                          We'll use this email for account access and OTP verification.
                        </p>
                        {fieldError("email")}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className={displayErrors.phone ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("phone")}
                      </div>
                      <div>
                        <label className={fieldLabel}>Date of Birth *</label>
                        <div className="relative">
                          <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="date"
                            name="date_of_birth"
                            value={form.date_of_birth}
                            onChange={handleChange}
                            max={new Date().toISOString().split("T")[0]}
                            className={displayErrors.date_of_birth ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("date_of_birth")}
                      </div>
                    </div>

                    <div>
                      <label className={fieldLabel}>Profile Photo</label>
                      <div className="flex items-center gap-4">
                        {profilePhoto.preview ? (
                          <div className="relative shrink-0">
                            <img src={profilePhoto.preview} alt="Profile preview" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-zinc-200" />
                            <button
                              type="button"
                              onClick={clearPhoto}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                              aria-label="Remove profile photo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : null}
                        <div>
                          <button
                            type="button"
                            onClick={() => photoRef.current?.click()}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] transition-colors cursor-pointer"
                          >
                            <ImagePlus size={16} /> {profilePhoto.preview ? "Replace photo" : "Upload profile photo"}
                          </button>
                          <p className="text-xs text-zinc-400 mt-1">JPG or PNG, up to 2MB.</p>
                        </div>
                        <input
                          ref={photoRef}
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => pickFile("profile_photo", e)}
                          className="hidden"
                        />
                      </div>
                      {fieldError("profile_photo")}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <IdCard size={15} strokeWidth={2.2} />
                      </span>
                      Identity Verification
                    </h2>

                    <div>
                      <label className={fieldLabel}>NID Number *</label>
                      <div className="relative">
                        <IdCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          name="nid_number"
                          value={form.nid_number}
                          onChange={handleChange}
                          placeholder="10 or 17 digit NID number"
                          className={displayErrors.nid_number ? inputErrorClasses : inputClasses}
                        />
                      </div>
                      {fieldError("nid_number")}
                    </div>

                    <div>
                      <label className={fieldLabel}>NID Document *</label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => nidRef.current?.click()}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] transition-colors cursor-pointer"
                        >
                          <FileUp size={16} /> {nidDoc.file ? nidDoc.file.name : "Upload NID document"}
                        </button>
                        {nidDoc.file && (
                          <button
                            type="button"
                            onClick={() => clearDoc("nid_document")}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                          >
                            <X size={12} /> Remove
                          </button>
                        )}
                        <p className="text-xs text-zinc-400">JPG, PNG or PDF, up to 5MB.</p>
                        <input
                          ref={nidRef}
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={(e) => pickFile("nid_document", e)}
                          className="hidden"
                        />
                      </div>
                      {fieldError("nid_document")}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Emergency Contact Name *</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            name="emergency_contact_name"
                            value={form.emergency_contact_name}
                            onChange={handleChange}
                            placeholder="Emergency contact name"
                            className={displayErrors.emergency_contact_name ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("emergency_contact_name")}
                      </div>
                      <div>
                        <label className={fieldLabel}>Emergency Contact Number *</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="tel"
                            name="emergency_contact_number"
                            value={form.emergency_contact_number}
                            onChange={handleChange}
                            placeholder="01XXXXXXXXX"
                            className={displayErrors.emergency_contact_number ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("emergency_contact_number")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <CarFront size={15} strokeWidth={2.2} />
                      </span>
                      Vehicle Information
                    </h2>

                    <div>
                      <label className={fieldLabel}>Vehicle Type *</label>
                      <div className="flex flex-wrap gap-2">
                        {VEHICLE_OPTIONS.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setVehicleType(v);
                              setErrors((prev) => ({ ...prev, vehicle_type: "" }));
                            }}
                            aria-pressed={vehicleType === v}
                            className={chipClasses(vehicleType === v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      {fieldError("vehicle_type")}
                    </div>

                    {motorized && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={fieldLabel}>Driving License Number *</label>
                            <div className="relative">
                              <IdCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input
                                type="text"
                                name="license_number"
                                value={form.license_number}
                                onChange={handleChange}
                                placeholder="Driving license number"
                                className={displayErrors.license_number ? inputErrorClasses : inputClasses}
                              />
                            </div>
                            {fieldError("license_number")}
                          </div>
                          <div>
                            <label className={fieldLabel}>Vehicle Registration Number *</label>
                            <div className="relative">
                              <CarFront size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input
                                type="text"
                                name="vehicle_registration"
                                value={form.vehicle_registration}
                                onChange={handleChange}
                                placeholder="e.g. Dhaka Metro-11-1234"
                                className={displayErrors.vehicle_registration ? inputErrorClasses : inputClasses}
                              />
                            </div>
                            {fieldError("vehicle_registration")}
                          </div>
                        </div>
                        <div>
                          <label className={fieldLabel}>Driving License Document *</label>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => licenseRef.current?.click()}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] transition-colors cursor-pointer"
                            >
                              <FileUp size={16} /> {licenseDoc.file ? licenseDoc.file.name : "Upload license document"}
                            </button>
                            {licenseDoc.file && (
                              <button
                                type="button"
                                onClick={() => clearDoc("license_document")}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
                              >
                                <X size={12} /> Remove
                              </button>
                            )}
                            <p className="text-xs text-zinc-400">JPG, PNG or PDF, up to 5MB.</p>
                            <input
                              ref={licenseRef}
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              onChange={(e) => pickFile("license_document", e)}
                              className="hidden"
                            />
                          </div>
                          {fieldError("license_document")}
                        </div>
                      </div>
                    )}

                    {vehicleType === "Other" && (
                      <div>
                        <label className={fieldLabel}>Vehicle Description *</label>
                        <textarea
                          name="vehicle_description"
                          rows={3}
                          value={form.vehicle_description}
                          onChange={handleChange}
                          placeholder="Describe your vehicle (type, condition, etc.)"
                          className={`${displayErrors.vehicle_description ? inputErrorClasses : inputClasses} resize-none`}
                        />
                        {fieldError("vehicle_description")}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h2 className={sectionTitle}>
                      <span className="w-8 h-8 rounded-lg bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                        <MapPin size={15} strokeWidth={2.2} />
                      </span>
                      Delivery Information
                    </h2>

                    <div>
                      <label className={fieldLabel}>Current Address *</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
                        <textarea
                          name="address"
                          rows={3}
                          value={form.address}
                          onChange={handleChange}
                          placeholder="Enter your current address"
                          className={`${displayErrors.address ? inputErrorClasses : inputClasses} resize-none`}
                        />
                      </div>
                      {fieldError("address")}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={fieldLabel}>Preferred Delivery Area *</label>
                        <div className="flex flex-wrap gap-2">
                          {DELIVERY_AREA_OPTIONS.map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => toggleArea(a)}
                              aria-pressed={deliveryAreas.includes(a)}
                              className={chipClasses(deliveryAreas.includes(a))}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-zinc-400 mt-2">Select all areas you can deliver to.</p>
                        {fieldError("delivery_area")}
                        {deliveryAreas.includes("Other") && (
                          <div className="mt-3">
                            <input
                              type="text"
                              value={customArea}
                              onChange={(e) => {
                                setCustomArea(e.target.value);
                                setErrors((prev) => ({ ...prev, custom_area: "" }));
                              }}
                              placeholder="Specify your delivery area"
                              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400"
                            />
                            {fieldError("custom_area")}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={fieldLabel}>City *</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            placeholder="Dhaka"
                            className={displayErrors.city ? inputErrorClasses : inputClasses}
                          />
                        </div>
                        {fieldError("city")}
                      </div>
                    </div>
                  </div>

                  <div className="border border-orange-100 bg-[#fafafa] rounded-lg p-4 text-xs text-zinc-600">
                    <p className="font-semibold text-zinc-800 mb-2">Terms &amp; Conditions</p>
                    <ul className="space-y-1.5 list-disc pl-4">
                      <li>I agree to follow Swift Bite's delivery guidelines and maintain professional conduct.</li>
                      <li>I understand my rider account must be approved by the Admin before I can start delivering.</li>
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
                      I agree to Swift Bite's <span className="font-semibold text-zinc-900">Rider Terms &amp; Conditions</span>.
                    </span>
                  </label>
                  {errors.terms && <p className="text-xs text-red-600 mt-1">{errors.terms}</p>}
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your rider application will be reviewed by Swift Bite. You will be able to access your rider account after admin approval.
                  </p>

                  <button
                    type="submit"
                    disabled={!formValid || submitting}
                    className="w-full py-3 rounded-full font-bold text-white transition disabled:bg-gray-300 disabled:bg-none disabled:cursor-not-allowed bg-gradient-to-br from-[#FF6B00] to-[#E05500] shadow-[0_4px_18px_rgba(255,107,0,0.38)] hover:opacity-90 cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Apply as Rider"}
                  </button>

                  <p className="text-center text-xs text-zinc-400">
                    Want to order food instead?{" "}
                    <Link to="/signup/customer" className="text-[#FF6B00] font-semibold">Create a customer account</Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}