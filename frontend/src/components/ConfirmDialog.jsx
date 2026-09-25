import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                danger ? "bg-red-50 text-red-600" : "bg-orange-50 text-[#F97316]"
              }`}
            >
              <AlertTriangle size={18} />
            </div>
            <div className="text-base font-bold text-zinc-900">{title}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed mt-3">{message}</p>
        <div className="flex justify-end gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#F97316] hover:bg-[#EA580C]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
