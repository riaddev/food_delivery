import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { authApi } from "../../features/api/apiSlice";
import { useAuth } from "../../features/auth/AuthContext";
import BackToHome from "../../components/BackToHome";
import Logo from "../../components/Logo";

const fieldLabel = "block text-sm font-semibold text-zinc-700 mb-1.5";

export default function RiderSetup() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => (sessionStorage.getItem("setup_token") ? 2 : 1));
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const res = await authApi.verifySetupOtp({ email, otp });
      localStorage.setItem("token", res.data.token);
      sessionStorage.setItem("setup_token", res.data.token);
      setOtp("");
      setStep(2);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      await authApi.resendSetupOtp({ email });
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Could not resend the code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.setSetupPassword({
        password,
        password_confirmation: passwordConfirmation,
      });
      sessionStorage.removeItem("setup_token");
      localStorage.setItem("token", res.data.token);
      await refreshUser();
      navigate("/rider/dashboard", { replace: true });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0]?.[0] : err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f2ec] px-5">
      <div className="fixed top-5 left-5 z-10">
        <BackToHome />
      </div>

      <div className="w-full max-w-[440px]">
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
          <p className="text-zinc-500 mt-2 text-sm">
            {step === 1 ? "Approved? Enter the code sent to your email." : "Last step — choose your password."}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-9 h-9 rounded-full bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                  <Mail size={17} strokeWidth={2.2} />
                </span>
                <h1 className="text-lg font-bold text-zinc-900">Rider Account Setup</h1>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}
              {info && <div className="bg-emerald-50 text-emerald-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{info}</div>}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className={fieldLabel}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className={fieldLabel}>One-Time Code</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full font-bold text-white transition disabled:bg-gray-300 disabled:bg-none disabled:cursor-not-allowed bg-gradient-to-br from-[#FF6B00] to-[#E05500] shadow-[0_4px_18px_rgba(255,107,0,0.38)] hover:opacity-90 cursor-pointer"
                >
                  {submitting ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={submitting}
                className="mt-4 w-full text-center text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] cursor-pointer disabled:opacity-50"
              >
                Resend code
              </button>

              <div className="mt-6 flex items-start gap-2.5 bg-[#fafafa] border border-orange-100 rounded-xl p-3.5 text-xs text-zinc-500">
                <ShieldCheck size={15} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <span>The code is valid for 15 minutes. Didn't get it? Make sure the admin approved your application, then resend.</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Lock size={17} strokeWidth={2.2} />
                </span>
                <h1 className="text-lg font-bold text-zinc-900">Create Your Password</h1>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}

              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className={fieldLabel}>Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full font-bold text-white transition disabled:bg-gray-300 disabled:bg-none disabled:cursor-not-allowed bg-gradient-to-br from-[#FF6B00] to-[#E05500] shadow-[0_4px_18px_rgba(255,107,0,0.38)] hover:opacity-90 cursor-pointer"
                >
                  {submitting ? "Setting up..." : "Set Password & Enter Dashboard"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-zinc-400">
                You'll be logged in automatically once your password is set.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}