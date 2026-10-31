import { useState } from "react";
import { OwlAvatarArt, OWL_COUNT, isOwlAvatar, owlIndexFor } from "../../lib/owls.jsx";
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
  ocean: { label: "Đại dương", ring: "bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700", deco: "🐬" },
  candy: { label: "Kẹo ngọt", ring: "bg-gradient-to-br from-pink-300 via-fuchsia-300 to-sky-300", deco: "🍭" },
  sunset: { label: "Hoàng hôn", ring: "bg-gradient-to-br from-yellow-300 via-orange-500 to-pink-600", deco: "🌅" },
  dino: { label: "Khủng long", ring: "bg-gradient-to-br from-lime-300 via-emerald-500 to-teal-700", deco: "🦖" },
  unicorn: { label: "Kỳ lân", ring: "bg-gradient-to-br from-pink-200 via-violet-300 to-sky-300", deco: "🦄" },
  rocket: { label: "Tên lửa", ring: "bg-gradient-to-br from-slate-700 via-indigo-600 to-orange-400", deco: "🚀" },
  // Khung động (huyền thoại): viền xoay liên tục
  neon: {
    label: "Neon xoay",
    spin: true,
    style: { background: "conic-gradient(from 0deg,#22d3ee,#a855f7,#ec4899,#facc15,#22c55e,#22d3ee)" },
    deco: "💫",
  },
  aurora: {
    label: "Cực quang",
    spin: true,
    style: { background: "conic-gradient(from 0deg,#34d399,#38bdf8,#818cf8,#f0abfc,#34d399)" },
    deco: "🌌",
  },
  sunfire: {
    label: "Mặt trời rực lửa",
    spin: true,
    style: { background: "conic-gradient(from 0deg,#fde047,#f97316,#dc2626,#f97316,#fde047)" },
    deco: "☀️",
  },
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
  // Ảnh lỗi (vd ảnh Google hết hạn) → quay về cú mặc định thay vì hiện icon ảnh vỡ.
  const [failedSrc, setFailedSrc] = useState(null);
  const isPhoto = imgSrc && !isOwlAvatar(imgSrc) && failedSrc !== imgSrc;
  const owlIdx = isOwlAvatar(imgSrc) ? Number(imgSrc.slice(4)) % OWL_COUNT : owlIndexFor(user);

  const face = isPhoto ? (
    <img
      src={imgSrc}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(imgSrc)}
      className="h-full w-full rounded-full bg-white object-cover"
    />
  ) : (
    <OwlAvatarArt idx={owlIdx} className="h-full w-full rounded-full" />
  );

  return (
    <span className={cn("relative inline-flex shrink-0", size, className)}>
      {f?.spin ? (
        // Viền xoay: lớp màu nằm dưới và quay, ảnh nằm trên đứng yên
        <span className="relative flex h-full w-full rounded-full p-[max(3px,6%)] shadow-[0_0_14px_-2px_rgba(168,85,247,0.55)]">
          <span aria-hidden className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full" style={f.style} />
          <span className="relative flex h-full w-full rounded-full bg-white p-[1.5px]">{face}</span>
        </span>
      ) : f ? (
        <span className={cn("flex h-full w-full rounded-full p-[max(3px,6%)] shadow-elevation-1", f.ring)} style={f.style}>
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
