import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { questionService } from "../../api/services";
import Button from "../ui/Button.jsx";
import ImageUploadField from "./ImageUploadField.jsx";
import { cn } from "../../lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const TYPES = {
  multiple_choice: "Trắc nghiệm (2–4 đáp án)",
  true_false: "Đúng / Sai",
  fill_blank: "Điền vào chỗ trống",
};
const LETTERS = ["A", "B", "C", "D"];
const EMPTY = { type: "multiple_choice", text: "", imageUrl: "", choices: ["", "", "", ""], correctIndex: 0, correctText: "", explanation: "", difficulty: "medium" };

// "Câu hỏi riêng của đề": admin tự soạn câu hỏi ngay trong bài kiểm tra, không thuộc chương/bài học nào
// (vd câu tổng hợp, câu nâng cao, câu lấy từ đề bên ngoài). Câu này chỉ dùng trong bài kiểm tra.
export default function CustomQuestionPanel({ customs, onAdd, onUpdate, onRemove }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isFill = draft?.type === "fill_blank";
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  function changeType(type) {
    if (type === "true_false") set({ type, choices: ["Đúng", "Sai"], correctIndex: 0 });
    else if (type === "multiple_choice") set({ type, choices: draft.choices.length === 4 && draft.type !== "true_false" ? draft.choices : ["", "", "", ""], correctIndex: 0 });
    else set({ type });
  }

  function validate() {
    if (!draft.text.trim()) return "Nhập nội dung câu hỏi";
    if (isFill) {
      if (!draft.correctText.trim()) return "Nhập đáp án đúng";
      if (!draft.text.includes("___")) return "Câu điền chỗ trống cần có “___” ở vị trí ô trống";
      return "";
    }
    const filled = draft.choices.filter((c) => c.trim());
    if (draft.type === "multiple_choice" && filled.length < 2) return "Cần ít nhất 2 đáp án";
    if (!draft.choices[draft.correctIndex]?.trim()) return "Chọn một đáp án đúng (đáp án đó không được để trống)";
    return "";
  }

  async function save() {
    const msg = validate();
    if (msg) return setError(msg);
    setError("");
    setSaving(true);
    try {
      let choices = draft.choices;
      let correctIndex = draft.correctIndex;
      if (!isFill && draft.type === "multiple_choice") {
        // bỏ đáp án trống nhưng giữ đúng vị trí đáp án đúng
        const keep = choices.map((c, i) => ({ c: c.trim(), i })).filter((x) => x.c);
        correctIndex = keep.findIndex((x) => x.i === draft.correctIndex);
        choices = keep.map((x) => x.c);
      }
      const payload = {
        testOnly: true,
        type: draft.type,
        text: draft.text.trim(),
        imageUrl: draft.imageUrl,
        explanation: draft.explanation.trim(),
        difficulty: draft.difficulty,
        ...(isFill ? { choices: [], correctText: draft.correctText.trim() } : { choices, correctIndex }),
      };
      if (draft._id) {
        const res = await questionService.update(draft._id, payload);
        onUpdate(res.data);
      } else {
        const res = await questionService.create(payload);
        onAdd(res.data);
      }
      setDraft(null);
    } catch (err) {
      setError(err.apiMessage || "Không lưu được câu hỏi");
    } finally {
      setSaving(false);
    }
  }

  function edit(q) {
    setError("");
    setDraft({
      _id: q._id,
      type: q.type === "listen_choice" ? "multiple_choice" : q.type === "listen_fill" ? "fill_blank" : q.type,
      text: q.text,
      imageUrl: q.imageUrl || "",
      choices: q.type === "fill_blank" || q.type === "listen_fill" ? ["", "", "", ""] : [...q.choices, "", "", ""].slice(0, q.type === "true_false" ? 2 : 4),
      correctIndex: q.correctIndex || 0,
      correctText: q.correctText || "",
      explanation: q.explanation || "",
      difficulty: q.difficulty || "medium",
    });
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display font-bold text-slate-800">Câu hỏi riêng của đề ({customs.length})</p>
          <p className="text-caption text-slate-500">Tự soạn câu hỏi mới cho đề này — không cần thuộc chương hay bài học nào.</p>
        </div>
        {!draft && (
          <Button type="button" onClick={() => { setError(""); setDraft({ ...EMPTY }); }} className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4" /> Soạn câu hỏi mới
          </Button>
        )}
      </div>

      {customs.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {customs.map((q, i) => (
            <li key={q._id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{q.text.replace(/\n/g, " ")}</span>
              <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 sm:block">{TYPES[q.type] || "Trắc nghiệm"}</span>
              <button type="button" title="Sửa câu này" onClick={() => edit(q)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" title="Gỡ khỏi đề" onClick={() => onRemove(q._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="mt-3 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-700">{draft._id ? "Sửa câu hỏi" : "Câu hỏi mới"}</p>
            <button type="button" onClick={() => setDraft(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-caption font-semibold text-slate-500">Dạng câu hỏi</label>
              <select className={cn(inputClass, "mt-1")} value={draft.type} onChange={(e) => changeType(e.target.value)}>
                {Object.entries(TYPES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-caption font-semibold text-slate-500">Mức độ</label>
              <select className={cn(inputClass, "mt-1")} value={draft.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-caption font-semibold text-slate-500">
              Nội dung câu hỏi {isFill && <span className="font-normal text-slate-400">— gõ “___” ở chỗ cần điền</span>}
            </label>
            <textarea className={cn(inputClass, "mt-1")} rows={3} value={draft.text} onChange={(e) => set({ text: e.target.value })} placeholder={isFill ? "VD: 5 + ___ = 9" : "VD: Số nào lớn nhất trong các số sau?"} />
          </div>
          <ImageUploadField value={draft.imageUrl} onChange={(url) => set({ imageUrl: url })} inputClass={inputClass} />

          {isFill ? (
            <div>
              <label className="text-caption font-semibold text-slate-500">Đáp án đúng</label>
              <input className={cn(inputClass, "mt-1")} value={draft.correctText} onChange={(e) => set({ correctText: e.target.value })} placeholder="VD: 4" />
            </div>
          ) : (
            <div>
              <label className="text-caption font-semibold text-slate-500">Các đáp án — bấm tròn để chọn đáp án đúng</label>
              <div className="mt-1 space-y-2">
                {draft.choices.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="custom-correct" className="h-5 w-5 accent-primary" checked={draft.correctIndex === i} onChange={() => set({ correctIndex: i })} aria-label={`Đáp án ${LETTERS[i]} đúng`} />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{LETTERS[i]}</span>
                    <input
                      className={inputClass}
                      value={c}
                      readOnly={draft.type === "true_false"}
                      onChange={(e) => set({ choices: draft.choices.map((x, j) => (j === i ? e.target.value : x)) })}
                      placeholder={draft.type === "multiple_choice" && i >= 2 ? `Đáp án ${LETTERS[i]} (có thể bỏ trống)` : `Đáp án ${LETTERS[i]}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-caption font-semibold text-slate-500">Giải thích (hiện cho em sau khi nộp bài)</label>
            <input className={cn(inputClass, "mt-1")} value={draft.explanation} onChange={(e) => set({ explanation: e.target.value })} />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={save} disabled={saving}>{saving ? "Đang lưu..." : draft._id ? "Cập nhật câu hỏi" : "Thêm vào đề"}</Button>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>Huỷ</Button>
          </div>
        </div>
      )}
    </div>
  );
}
