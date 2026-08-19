import { AlertTriangle } from "lucide-react";
import { Skeleton } from "../../../components/dashboard/Card";

export function ErrorBanner({ message = "Failed to load data.", onRetry }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-[13px] px-5 py-4 flex items-center gap-3">
      <AlertTriangle size={18} className="text-rose-500 shrink-0" />
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-rose-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[13px] font-semibold text-rose-600 underline mt-0.5 cursor-pointer border-none bg-none font-outfit"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function LoadingRows({ count = 4 }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}