import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "../lib/utils";

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    iconClass: "text-white bg-primary",
    barClass: "bg-primary",
    ring: "ring-primary/15",
  },
  error: {
    Icon: XCircle,
    iconClass: "text-white bg-red-500",
    barClass: "bg-red-500",
    ring: "ring-red-500/15",
  },
  info: {
    Icon: Info,
    iconClass: "text-white bg-secondary",
    barClass: "bg-secondary",
    ring: "ring-secondary/15",
  },
};

function ToastItem({ toast: t, onDismiss }) {
  const v = VARIANTS[t.variant] || VARIANTS.info;
  return (
    <div
      className={cn(
        "animate-toast-in pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-elevation-4 ring-1",
        v.ring
      )}
    >
      <div className="flex items-start gap-3.5 p-4 pr-3 sm:p-5 sm:pr-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm", v.iconClass)}>
          <v.Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          {t.title && (
            <p className="font-display text-base font-bold leading-snug text-slate-800">{t.title}</p>
          )}
          <p className={cn("leading-snug text-slate-600", t.title ? "mt-0.5 text-sm" : "text-base font-semibold text-slate-800")}>
            {t.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
          aria-label="Đóng thông báo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {t.duration > 0 && (
        <div className="h-1 w-full bg-slate-100">
          <div className={cn("h-full animate-toast-progress", v.barClass)} style={{ animationDuration: `${t.duration}ms` }} />
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
