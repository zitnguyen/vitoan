import { useState } from "react";
import { Newspaper } from "../ui/icons.jsx";
import { cn } from "../../lib/utils";

export const CATEGORY_LABELS = {
  "giao-duc": "Tin giáo dục",
  "tieu-hoc": "Tiểu học",
  "phu-huynh": "Góc phụ huynh",
  vitoan: "Tin ViToan",
};

export function formatNewsDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const diffH = (Date.now() - d.getTime()) / 36e5;
  if (diffH < 1) return "Vừa xong";
  if (diffH < 24) return `${Math.floor(diffH)} giờ trước`;
  if (diffH < 24 * 7) return `${Math.floor(diffH / 24)} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Ảnh nhúng từ link của báo gốc; không gửi referrer (một số báo chặn ảnh khi có referrer lạ),
// lỗi ảnh thì hiện khung thay thế.
export function NewsImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-primary/40", className)}>
        <Newspaper className="h-10 w-10" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
