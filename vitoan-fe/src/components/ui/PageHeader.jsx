import { cn } from "../../lib/utils";
import { Img3D } from "../../lib/icons3d.jsx";

// Tiêu đề trang dùng chung cho mọi trang học sinh — phong cách hiện đại giống trang chủ:
// dải gradient pastel theo khu vực (tone), tiêu đề đậm, hình 3D cỡ lớn bay nhẹ ở góc phải.
const TONES = {
  green: "linear-gradient(120deg,#d7f5e3 0%,#e6f7d4 55%,#fff6d6 100%)",
  blue: "linear-gradient(120deg,#d4ecff 0%,#e1e3ff 60%,#efe3ff 100%)",
  orange: "linear-gradient(120deg,#ffe6c7 0%,#ffe0d6 55%,#ffe0ee 100%)",
  amber: "linear-gradient(120deg,#fff0bf 0%,#ffe3c4 55%,#ffe0e0 100%)",
  violet: "linear-gradient(120deg,#e7dcff 0%,#f1dcff 55%,#ffdcee 100%)",
  pink: "linear-gradient(120deg,#ffdbea 0%,#f1dcff 55%,#dfe7ff 100%)",
};

export function HeaderStat({ value, label, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-2.5 shadow-sm backdrop-blur">
      {Icon && <Icon className="h-9 w-9 shrink-0" />}
      <div className="leading-tight">
        <p className="font-display text-2xl font-black text-[#0b2340]">{value}</p>
        <p className="text-sm font-bold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function PageHeader({ icon: Icon, title, subtitle, tone = "green", right, className }) {
  return (
    <div
      className={cn("relative flex flex-wrap items-center gap-x-6 gap-y-4 overflow-clip rounded-[2rem] px-6 py-6 sm:px-8 sm:py-7", className)}
      style={{ background: TONES[tone] || TONES.green }}
    >
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/45 blur-2xl" />
      <Img3D name="sparkles" className="pointer-events-none absolute left-[46%] top-3 hidden h-7 w-7 opacity-70 md:block" />

      <div className="relative min-w-[14rem] flex-1">
        <h1 className="font-display text-3xl font-black leading-tight text-[#0b2340] sm:text-[2.4rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl font-semibold text-slate-600">{subtitle}</p>}
      </div>

      {right && <div className="relative flex w-full flex-wrap gap-3 sm:w-auto">{right}</div>}

      {Icon && (
        <div className="relative hidden h-24 w-24 shrink-0 items-center justify-center sm:flex">
          <span aria-hidden className="absolute inset-1 rounded-full bg-white/60 blur-md" />
          <Icon className="relative h-20 w-20 animate-[float-soft_4s_ease-in-out_infinite] drop-shadow-[0_10px_14px_rgba(11,35,64,0.18)]" />
        </div>
      )}
    </div>
  );
}
