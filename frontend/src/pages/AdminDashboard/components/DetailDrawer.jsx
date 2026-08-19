import { X } from "lucide-react";

export default function DetailDrawer({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="text-[17px] font-bold text-text-primary">{title}</div>
            {subtitle && <div className="text-[13px] text-text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-light hover:text-text-primary transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}