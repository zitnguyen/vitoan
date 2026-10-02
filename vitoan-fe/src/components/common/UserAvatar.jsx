import { useState } from "react";
import { User } from "../ui/icons.jsx";
import { cn } from "../../lib/utils";

// Khung avatar đổi được ở trang Đổi quà. Mỗi khung = viền gradient + 1 hình trang trí nhỏ.
export const FRAMES = {
  leaf: { label: "Lá xanh", ring: "bg-gradient-to-br from-lime-300 via-green-500 to-emerald-600", deco: "🍃" },
  star: { label: "Ngôi sao", ring: "bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-500", deco: "⭐" },
  flower: { label: "Hoa xuân", ring: "bg-gradient-to-br from-pink-300 via-rose-400 to-fuchsia-500", deco: "🌸" },
  rainbow: {
    label: "Cầu vồng",
    style: { background: "conic-gradient(#ef4444,#f97316,#facc15,#22c55e,#3b82f6,#6366f1,#a855f7,#ef4444)" },
    deco: "🌈",
  },
  fire: { label: "Ngọn lửa", ring: "bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300", deco: "🔥" },
  ice: { label: "Băng giá", ring: "bg-gradient-to-br from-cyan-100 via-sky-400 to-blue-600", deco: "❄️" },
  galaxy: { label: "Vũ trụ", ring: "bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500", deco: "✨" },
  gold: { label: "Vàng hoàng gia", ring: "bg-gradient-to-br from-yellow-100 via-amber-500 to-yellow-700", deco: "👑" },
};

export function isVip(user) {
  return !!user?.vipUntil && new Date(user.vipUntil) > new Date();
}

/**
 * Ảnh đại diện kèm khung + vương miện VIP.
 * size: lớp Tailwind kích thước (vd "h-10 w-10"); decoSize: cỡ hình trang trí của khung.
 * frame/src: ghi đè khung/ảnh (dùng để xem trước ở trang Đổi quà).
 */
export default function UserAvatar({ user, size = "h-10 w-10", decoSize = "text-sm", frame, src, showVip = true, className }) {
  const frameKey = frame !== undefined ? frame : user?.equippedFrame;
  const f = FRAMES[frameKey];
  const imgSrc = src !== undefined ? src : user?.avatarUrl;
  const initial = user?.fullName?.trim()?.split(/\s+/).pop()?.[0]?.toUpperCase();
  // Ảnh lỗi (vd ảnh Google hết hạn) → quay về chữ cái đầu thay vì hiện icon ảnh vỡ.
  const [failedSrc, setFailedSrc] = useState(null);

  const face = imgSrc && failedSrc !== imgSrc ? (
    <img
      src={imgSrc}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(imgSrc)}
      className="h-full w-full rounded-full bg-white object-cover"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
      {initial || <User className="h-1/2 w-1/2" strokeWidth={2} />}
    </span>
  );

  return (
    <span className={cn("relative inline-flex shrink-0", size, className)}>
      {f ? (
        <span className={cn("flex h-full w-full rounded-full p-[3px] shadow-elevation-1", f.ring)} style={f.style}>
          <span className="flex h-full w-full rounded-full bg-white p-[1.5px]">{face}</span>
        </span>
      ) : (
        <span className="flex h-full w-full rounded-full ring-2 ring-slate-100">{face}</span>
      )}
      {f && (
        <span aria-hidden className={cn("absolute -bottom-1 -right-1 leading-none drop-shadow", decoSize)}>
          {f.deco}
        </span>
      )}
      {showVip && isVip(user) && (
        <span aria-hidden title="VIP" className={cn("absolute -left-1 -top-1.5 leading-none drop-shadow", decoSize)}>
          👑
        </span>
      )}
    </span>
  );
}
