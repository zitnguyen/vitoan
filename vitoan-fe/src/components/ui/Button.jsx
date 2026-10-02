import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

// Nút hiện đại: nền xanh có "chân" đổ mềm, ấn thì lún; nút viền là nền trắng + viền nhạt.
const VARIANTS = {
  primary: "bg-primary text-white shadow-[0_4px_0_0_#049245] hover:-translate-y-0.5 hover:bg-[#00bf55] active:translate-y-[3px] active:shadow-none",
  outline: "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-primary hover:ring-primary/50 active:translate-y-[2px]",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

export default function Button({ className, variant = "primary", disabled, to, ...props }) {
  const classes = cn(BASE_CLASS, VARIANTS[variant], className);

  if (to) {
    return <Link to={to} className={classes} {...props} />;
  }

  return <button className={classes} disabled={disabled} {...props} />;
}
