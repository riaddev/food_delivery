import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

const isPdf = (src) => /\.pdf($|\?)/i.test(String(src || ""));

export default function Lightbox({ images = [], startIndex = 0, title = "", onClose }) {
  const [index, setIndex] = useState(startIndex);
  const total = images.length;
  const current = images[Math.min(Math.max(index, 0), Math.max(total - 1, 0))] || "";
  const pdf = isPdf(current);

  const step = useCallback(
    (dir) => setIndex((i) => (i + dir + total) % Math.max(total, 1)),
    [total]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  if (total === 0) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={title || "File preview"}>
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
      >
        <X size={20} />
      </button>

      {total > 1 && (
        <>
          <button
            onClick={() => step(-1)}
            aria-label="Previous file"
            className="absolute left-3 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Next file"
            className="absolute right-3 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div className="relative z-[1] flex flex-col items-center gap-3 max-w-full">
        {pdf ? (
          <iframe
            key={current}
            src={current}
            title={title || "Document preview"}
            className="w-[88vw] sm:w-[720px] max-w-full h-[70vh] rounded-xl bg-white shadow-2xl"
          />
        ) : (
          <img
            key={current}
            src={current}
            alt={title || "Preview"}
            className="max-w-[88vw] max-h-[76vh] rounded-xl shadow-2xl object-contain bg-white"
          />
        )}
        <div className="flex items-center gap-3 text-white/80 text-xs font-semibold">
          {total > 1 && <span>{Math.min(index + 1, total)} of {total}</span>}
          <a
            href={current}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            Open original <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
