import { useState } from "react";
import { avatarUrl, avatarBackground } from "../../lib/avatar.js";
import { cn } from "../../lib/utils";

// Ảnh minh hoạ bài học (DiceBear). Ảnh tải từ mạng ngoài nên có lúc chậm/lỗi — luôn có sẵn
// vòng tròn màu + số thứ tự bài bên dưới, ảnh tải xong mới hiện đè lên, không bao giờ để trống.
export default function LessonAvatar({ seed, idx = 0, number, className }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span
      className={cn("relative flex items-center justify-center overflow-hidden rounded-full font-display text-xl font-black text-ink shadow-elevation-1 ring-2 ring-white", className)}
      style={{ backgroundColor: `#${avatarBackground(idx)}` }}
    >
      {number}
      <img
        src={avatarUrl(seed, idx)}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={cn("absolute inset-0 h-full w-full object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
      />
    </span>
  );
}
