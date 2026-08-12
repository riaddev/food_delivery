import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackToHome({ variant = "icon", className = "" }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  if (variant === "pill") {
    return (
      <button
        onClick={goBack}
        className={`inline-flex items-center gap-2 bg-white/90 hover:bg-white text-zinc-900 text-sm font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 ${className}`}
      >
        <ArrowLeft size={16} />
        Back
      </button>
    );
  }

  return (
    <button
      onClick={goBack}
      aria-label="Back"
      className={`w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors shrink-0 ${className}`}
    >
      <ArrowLeft size={18} />
    </button>
  );
}