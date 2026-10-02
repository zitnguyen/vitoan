import { useState } from "react";
import { Copy, Check } from "../ui/icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { cn } from "../../lib/utils";

// Nút nhỏ "Copy ID" — chỉ hiện với Admin, để lấy ID dán vào ô "Tra cứu ID" của trang quản trị.
// Không in chuỗi ID ra giao diện (khó đọc, chiếm chỗ), di chuột để xem ID đầy đủ.
export default function IdBadge({ id, label = "ID", className, always = false }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  if (!id || (!always && user?.role !== "Admin")) return null;

  async function copy(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard có thể bị chặn — bỏ qua
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ID ${label.toLowerCase()}: ${id}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold transition",
        copied ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Đã copy" : "Copy ID"}
    </button>
  );
}
