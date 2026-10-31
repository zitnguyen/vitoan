import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Check, X, Info, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

const ToastContext = createContext(null);

// Thông báo nổi: thẻ trắng gọn, chấm tròn màu có icon nét trắng, thanh thời gian mảnh ở đáy.
const VARIANTS = {
  success: { Icon: Check, dot: "bg-gradient-to-br from-emerald-400 to-green-500 shadow-[0_6px_14px_-4px_rgba(22,163,74,0.6)]", bar: "bg-green-500" },
  error: { Icon: AlertTriangle, dot: "bg-gradient-to-br from-rose-400 to-red-500 shadow-[0_6px_14px_-4px_rgba(239,68,68,0.6)]", bar: "bg-red-500" },
  info: { Icon: Info, dot: "bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_6px_14px_-4px_rgba(59,130,246,0.6)]", bar: "bg-sky-500" },
};

function ToastItem({ toast: t, onDismiss }) {
  const v = VARIANTS[t.variant] || VARIANTS.info;
  return (
    <div className="animate-toast-in pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 shadow-[0_18px_40px_-14px_rgba(11,35,64,0.35)] ring-1 ring-slate-900/5 backdrop-blur">
      <div className="flex items-center gap-3 py-3 pl-3.5 pr-2.5">
        <span className={cn("toast-dot flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white", v.dot)}>
          <v.Icon className="h-5 w-5" strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          {t.title && <p className="font-display text-[15px] font-black leading-snug text-[#0b2340]">{t.title}</p>}
          <p className={cn("leading-snug", t.title ? "text-sm font-semibold text-slate-500" : "font-bold text-[#0b2340]")}>{t.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 active:scale-90"
          aria-label="Đóng thông báo"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {t.duration > 0 && (
        <div className="absolute inset-x-3 bottom-0 h-[3px] overflow-hidden rounded-full">
          <div className={cn("h-full rounded-full opacity-70 animate-toast-progress", v.bar)} style={{ animationDuration: `${t.duration}ms` }} />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = "success", options = {}) => {
      const duration = typeof options === "number" ? options : (options.duration ?? 4500);
      const title = typeof options === "object" ? options.title : undefined;
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, title, variant, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg, options) => push(msg, "success", options),
    error: (msg, options) => push(msg, "error", options),
    info: (msg, options) => push(msg, "info", options),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast phải dùng bên trong ToastProvider");
  return ctx;
}
