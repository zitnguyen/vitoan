import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export default function Button({ className, variant = "primary", disabled, to, ...props }) {
  const classes = cn(BASE_CLASS, VARIANTS[variant], className);

  if (to) {
    return <Link to={to} className={classes} {...props} />;
  }

  return <button className={classes} disabled={disabled} {...props} />;
}
