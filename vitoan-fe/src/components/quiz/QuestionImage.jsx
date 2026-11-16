import { useState } from "react";

// Ảnh minh hoạ câu hỏi. Ở mức 100% ảnh tự co vừa khung chứa (không tràn → trang không phải cuộn),
// không phóng to quá kích thước gốc; nút phóng to/thu nhỏ đổi tỉ lệ theo `zoom` (%) khi em cần xem rõ hơn.
export default function QuestionImage({ src, zoom = 100 }) {
  const [natural, setNatural] = useState(0);
  const custom = zoom !== 100 && natural;
  return (
    <img
      src={src}
      alt=""
      onLoad={(e) => setNatural(e.currentTarget.naturalWidth)}
      style={custom ? { width: `${Math.round((natural * zoom) / 100)}px`, maxWidth: zoom < 100 ? "100%" : "none" } : undefined}
      className={custom ? "h-auto transition-[width]" : "h-auto max-h-full w-auto max-w-full object-contain"}
    />
  );
}
