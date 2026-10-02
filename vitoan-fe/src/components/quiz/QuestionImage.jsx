import { useState } from "react";

// Ảnh minh hoạ câu hỏi: hiển thị theo kích thước gốc (không phóng to vỡ hình),
// thu nhỏ vừa khung nếu ảnh lớn; nút phóng to/thu nhỏ đổi tỉ lệ theo `zoom` (%).
export default function QuestionImage({ src, zoom = 100 }) {
  const [natural, setNatural] = useState(0);
  return (
    <img
      src={src}
      alt=""
      onLoad={(e) => setNatural(e.currentTarget.naturalWidth)}
      style={{
        width: natural ? `${Math.round((natural * zoom) / 100)}px` : "auto",
        maxWidth: zoom <= 100 ? "100%" : "none",
      }}
      className="h-auto transition-[width]"
    />
  );
}
