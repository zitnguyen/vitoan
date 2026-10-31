import { cn } from "../../lib/utils";
import { isVip } from "./UserAvatar.jsx";

// Màu tên đổi được ở trang Đổi quà.
export const NAME_COLORS = {
  blue: { label: "Xanh biển", className: "text-sky-600" },
  orange: { label: "Cam", className: "text-orange-500" },
  purple: { label: "Tím", className: "text-purple-600" },
  green: { label: "Xanh lá", className: "text-emerald-600" },
  pink: { label: "Hồng", className: "text-pink-500" },
  red: { label: "Đỏ", className: "text-red-500" },
  rainbow: {
    label: "Cầu vồng",
    className: "bg-gradient-to-r from-red-500 via-amber-500 via-40% to-purple-600 bg-clip-text text-transparent",
  },
  // Màu chuyển sắc có ánh chạy (name-shine trong index.css)
  gold: { label: "Vàng kim", className: "name-shine bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 bg-clip-text text-transparent" },
  ocean: { label: "Đại dương", className: "name-shine bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 bg-clip-text text-transparent" },
  candy: { label: "Kẹo ngọt", className: "name-shine bg-gradient-to-r from-pink-500 via-fuchsia-400 to-sky-500 bg-clip-text text-transparent" },
  galaxy: { label: "Thiên hà", className: "name-shine bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-purple-700 bg-clip-text text-transparent" },
};

export function TitleChip({ title, className }) {
  if (!title) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700",
        className
      )}
    >
      🏅 {title}
    </span>
  );
}

/** Tên hiển thị kèm màu tên, danh hiệu và nhãn VIP đang dùng. */
export default function UserName({ user, name, color, title, className, showTitle = true, showVip = true }) {
  const colorKey = color !== undefined ? color : user?.nameColor;
  const titleText = title !== undefined ? title : user?.equippedTitle;
  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className={cn("min-w-0 max-w-full truncate font-display font-bold text-slate-800", NAME_COLORS[colorKey]?.className, className)}>
        {name ?? user?.fullName}
      </span>
      {showVip && isVip(user) && (
        <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-extrabold leading-none text-white">
          VIP
        </span>
      )}
      {showTitle && <TitleChip title={titleText} />}
    </span>
  );
}
