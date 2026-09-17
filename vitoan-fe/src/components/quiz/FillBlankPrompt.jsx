// Hiển thị câu hỏi "điền vào chỗ trống": tách text theo từng dòng, dòng nào có
// dấu "___" thì chèn ô nhập inline ngay vị trí đó (dùng cho cả Toán và Tiếng Việt,
// kể cả dạng "nghe rồi điền" — audio phát riêng ở nơi gọi component này).
export default function FillBlankPrompt({ text, value, onChange, disabled = false }) {
  const lines = text.split("\n");
  return (
    <div className="mt-4 space-y-2">
      {lines.map((line, i) => {
        const idx = line.indexOf("___");
        if (idx === -1) {
          return (
            <p key={i} className="text-body-lg font-semibold text-slate-800">
              {line}
            </p>
          );
        }
        const before = line.slice(0, idx);
        const after = line.slice(idx + 3);
        return (
          <div key={i} className="flex flex-wrap items-center gap-2 text-body-lg font-semibold text-slate-800">
            {before && <span>{before}</span>}
            <input
              type="text"
              inputMode="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="?"
              autoComplete="off"
              disabled={disabled}
              className="w-28 rounded-xl border-2 border-primary/40 bg-primary/5 px-3 py-2 text-center text-body-lg font-bold text-primary outline-none focus:border-primary disabled:opacity-70"
            />
            {after && <span>{after}</span>}
          </div>
        );
      })}
    </div>
  );
}
