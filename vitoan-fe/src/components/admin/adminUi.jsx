import { cn } from "../../lib/utils";

// Các thành phần giao diện dùng chung cho trang quản trị — để mọi form/trang cùng một kiểu.
export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, hint, required, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </label>
  );
}

export function AdminPage({ title, subtitle, actions, children, className }) {
  return (
    <div className={cn("mx-auto max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 px-6 py-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && <h1 className="font-display text-h2 text-slate-800">{title}</h1>}
            {subtitle && <p className="mt-0.5 text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Card({ children, className }) {
  return <div className={cn("rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100", className)}>{children}</div>;
}

export function IconButton({ title, onClick, children, tone = "default", disabled, className, ...rest }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white transition disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger" ? "text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:border-primary/40 hover:text-primary",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function StatusChip({ ok, children, warn }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold",
        ok ? "bg-green-50 text-green-700" : warn ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
      )}
    >
      {children}
    </span>
  );
}

// Nhận link YouTube bất kỳ (watch?v=, youtu.be/, shorts/, embed/) → link nhúng /embed/ID.
export function toEmbedUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  const m =
    s.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    s.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    s.match(/[?&]v=([\w-]{6,})/) ||
    s.match(/youtu\.be\/([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : s;
}
