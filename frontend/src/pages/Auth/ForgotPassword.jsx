import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { authApi } from "../../features/api/apiSlice";
import BackToHome from "../../components/BackToHome";
import Logo from "../../components/Logo";

const fieldLabel = "block text-sm font-semibold text-zinc-700 mb-1.5";
const inputCls =
  "w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-colors bg-white placeholder:text-zinc-400";
const primaryBtn =
  "w-full py-3 rounded-full font-bold text-white transition disabled:bg-gray-300 disabled:bg-none disabled:cursor-not-allowed bg-gradient-to-br from-[#FF6B00] to-[#E05500] shadow-[0_4px_18px_rgba(255,107,0,0.38)] hover:opacity-90 cursor-pointer";

const RESEND_COOLDOWN = 60;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const firstError = (err, fallback) => {
    const errors = err.response?.data?.errors;
    if (errors) {
      const first = Object.values(errors)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
    return err.response?.data?.message || fallback;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setInfo(res.data?.message || "If an account exists for this email, a reset code has been sent.");
      setStep(2);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(firstError(err, "Could not send the code. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || submitting) return;
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setInfo(res.data?.message || "If an account exists for this email, a reset code has been sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(firstError(err, "Could not resend the code."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const res = await authApi.verifyResetOtp({ email, otp });
      setResetToken(res.data.token);
      setOtp("");
      setStep(3);
      setInfo("");
    } catch (err) {
      setError(firstError(err, "Verification failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (!resetToken) {
      setError("Reset session is missing. Please verify the code again.");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(
        { password, password_confirmation: passwordConfirmation },
        resetToken
      );
      setPassword("");
      setPasswordConfirmation("");
      setResetToken("");
      setStep(4);
    } catch (err) {
      setError(firstError(err, "Could not reset the password. Please request a new code."));
      if (err.response?.status === 401) {
        setResetToken("");
        setStep(2);
      }
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
            {step === 1 && "Forgot your password? Enter your email to get a reset code."}
            {step === 2 && "Enter the 6-digit code sent to your email."}
            {step === 3 && "Choose your new password."}
            {step === 4 && "You're all set."}
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {step === 1 && (
            <>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-9 h-9 rounded-full bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                  <Mail size={17} strokeWidth={2.2} />
                </span>
                <h1 className="text-lg font-bold text-zinc-900">Reset Password</h1>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}
              {info && <div className="bg-emerald-50 text-emerald-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{info}</div>}

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className={fieldLabel}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
                <button type="submit" disabled={submitting} className={primaryBtn}>
                  {submitting ? "Sending..." : "Send Reset Code"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-zinc-500">
                Remembered it?{" "}
                <Link to="/login" className="text-[#FF6B00] font-semibold no-underline">
                  Back to login
                </Link>
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-9 h-9 rounded-full bg-[#fff0e8] text-[#FF6B00] flex items-center justify-center">
                  <KeyRound size={17} strokeWidth={2.2} />
                </span>
                <h1 className="text-lg font-bold text-zinc-900">Enter Code</h1>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}
              {info && <div className="bg-emerald-50 text-emerald-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{info}</div>}

              <form onSubmit={handleVerify} className="space-y-4">
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
                <button type="submit" disabled={submitting} className={primaryBtn}>
                  {submitting ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={submitting || cooldown > 0}
                className="mt-4 w-full text-center text-sm font-semibold text-[#FF6B00] hover:text-[#E05500] cursor-pointer disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>

              <div className="mt-6 flex items-start gap-2.5 bg-[#fafafa] border border-orange-100 rounded-xl p-3.5 text-xs text-zinc-500">
                <ShieldCheck size={15} className="text-[#FF6B00] shrink-0 mt-0.5" />
                <span>The code is valid for 10 minutes. After 5 wrong tries it stops working and you'll need a new one.</span>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Lock size={17} strokeWidth={2.2} />
                </span>
                <h1 className="text-lg font-bold text-zinc-900">New Password</h1>
              </div>

              {error && <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className={fieldLabel}>Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputCls}
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
                    className={inputCls}
                  />
                </div>
                <button type="submit" disabled={submitting} className={primaryBtn}>
                  {submitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <span className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </span>
              <h1 className="text-lg font-bold text-zinc-900 mt-4">Password reset!</h1>
              <p className="text-sm text-zinc-500 mt-1.5">
                Please login with your new password.
              </p>
              <button onClick={() => navigate("/login", { replace: true })} className={`${primaryBtn} mt-6`}>
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
