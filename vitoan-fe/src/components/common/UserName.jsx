import { cn } from "../../lib/utils";
import { isVip } from "./UserAvatar.jsx";

// Màu tên đổi được ở trang Đổi quà.
export const NAME_COLORS = {
  blue: { label: "Xanh biển", className: "text-sky-600" },
  orange: { label: "Cam", className: "text-orange-500" },
  purple: { label: "Tím", className: "text-purple-600" },
  rainbow: {
    label: "Cầu vồng",
    className: "bg-gradient-to-r from-red-500 via-amber-500 via-40% to-purple-600 bg-clip-text text-transparent",
  },
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
