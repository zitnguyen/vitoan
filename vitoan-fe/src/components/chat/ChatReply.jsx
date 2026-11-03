import { cn } from "../../lib/utils";

// Hiển thị câu trả lời của AI theo bố cục dễ nhìn cho bé. Định dạng AI được yêu cầu dùng:
//   💡 câu trả lời ngắn      → thẻ nổi bật
//   ## 🏠 Tiêu đề mục        → tiêu đề mục
//   - ý nhỏ                  → gạch đầu dòng
//   VD: a | b | c            → các ví dụ dạng thẻ
//   👉 câu hỏi thử           → ô thử sức
//   **từ khoá**              → tô nổi bật

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="rounded-md bg-amber-100 px-1 font-extrabold text-slate-800">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const CHIP_COLORS = ["bg-sky-100 text-sky-700", "bg-pink-100 text-pink-700", "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700"];

export default function ChatReply({ text }) {
  const lines = String(text || "")
    .replace(/\$/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2.5">
      {lines.map((line, i) => {
        if (line.startsWith("##")) {
          return (
            <p key={i} className="pt-1 font-display text-base font-black text-primary">
              {inline(line.replace(/^#+\s*/, ""))}
            </p>
          );
        }
        if (line.startsWith("💡")) {
          return (
            <p key={i} className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 px-3.5 py-2.5 text-[15px] font-bold text-slate-800 ring-1 ring-amber-200">
              {inline(line)}
            </p>
          );
        }
        if (/^(VD|Ví dụ)\s*:/i.test(line)) {
          const items = line.replace(/^(VD|Ví dụ)\s*:/i, "").split(/[|;]/).map((s) => s.trim()).filter(Boolean);
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Ví dụ</span>
              {items.map((it, k) => (
                <span key={k} className={cn("rounded-full px-3 py-1 text-sm font-bold", CHIP_COLORS[k % CHIP_COLORS.length])}>
                  {it}
                </span>
              ))}
            </div>
          );
        }
        if (/^[-•*]\s+/.test(line)) {
          return (
            <p key={i} className="flex gap-2 pl-1">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
              <span>{inline(line.replace(/^[-•*]\s+/, ""))}</span>
            </p>
          );
        }
        if (line.startsWith("👉")) {
          return (
            <p key={i} className="rounded-2xl bg-violet-50 px-3.5 py-2.5 font-bold text-violet-700 ring-1 ring-violet-200">
              {inline(line)}
            </p>
          );
        }
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}
