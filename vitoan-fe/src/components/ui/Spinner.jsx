import { cn } from "../../lib/utils";

export default function Spinner({ className }) {
  return (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary",
        className
      )}
      role="status"
      aria-label="Đang tải"
    />
  );
}
