import { useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { uploadService } from "../../api/services";

// Ảnh riêng cho MỘT đáp án: tải ảnh từ máy lên, hoặc nhờ AI vẽ theo chữ của đáp án (hoặc mô tả tự gõ).
export default function ChoiceImageControl({ value, onChange, choiceText, questionText }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("upload");
    setError("");
    try {
      onChange((await uploadService.image(file)).data.url);
    } catch (err) {
      setError(err.apiMessage || "Tải ảnh thất bại");
    } finally {
      setBusy("");
    }
  }

  async function generate() {
    const seed = (choiceText || "").trim();
    const prompt = window.prompt(
      "Mô tả ảnh AI cần vẽ cho đáp án này (VD: một con mèo màu cam):",
      seed ? `${seed}` : ""
    );
    if (!prompt || !prompt.trim()) return;
    setBusy("ai");
    setError("");
    try {
      onChange((await uploadService.aiImage(`${prompt.trim()}${questionText ? ` (ngữ cảnh câu hỏi: ${questionText.slice(0, 80)})` : ""}`)).data.url);
    } catch (err) {
      setError(err.apiMessage || "AI chưa tạo được ảnh");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-1">
      {value && (
        <span className="relative inline-block">
          <img src={value} alt="" className="h-14 w-14 rounded-lg object-contain ring-1 ring-slate-200" />
          <button type="button" onClick={() => onChange("")} title="Bỏ ảnh đáp án" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
      <button type="button" onClick={() => fileRef.current?.click()} disabled={!!busy} className="flex items-center gap-1 rounded-lg bg-secondary/10 px-2 py-1 text-xs font-bold text-secondary hover:bg-secondary/20 disabled:opacity-60">
        {busy === "upload" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} {value ? "Đổi ảnh" : "Tải ảnh"}
      </button>
      <button type="button" onClick={generate} disabled={!!busy} className="flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-60" title="AI vẽ ảnh minh hoạ cho đáp án">
        {busy === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI tạo ảnh
      </button>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={upload} />
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
