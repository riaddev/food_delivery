import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[13px] border border-border shadow-[0_10px_40px_rgba(0,0,0,0.18)] w-full max-w-[380px] p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                danger ? "bg-rose-50 text-rose-600" : "bg-orange-soft text-orange-deep"
              }`}
            >
              <AlertTriangle size={18} />
            </div>
            <div className="text-[16px] font-bold text-text-primary">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-text-light hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-[14px] text-text-muted leading-relaxed mt-3">{message}</p>
        <div className="flex justify-end gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[9px] border border-border text-[13px] font-semibold text-text-primary hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-[9px] text-[13px] font-semibold text-white transition-colors cursor-pointer ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-orange-primary hover:bg-orange-deep"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}