import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, X, CheckCircle2, Plus, Sparkles, Search } from "lucide-react";
import { lessonService, questionService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import AdminLessonHeader from "../../components/admin/AdminLessonHeader.jsx";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import { AdminPage, Card, Field, IconButton, inputClass } from "../../components/admin/adminUi.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const TYPE_LABELS = {
  multiple_choice: "Trắc nghiệm (chọn 1 đáp án)",
  true_false: "Đúng / Sai",
  fill_blank: "Điền vào chỗ trống",
  listen_choice: "Nghe rồi chọn đáp án",
  listen_fill: "Nghe rồi điền",
};
const DIFFICULTY_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const FILL_TYPES = ["fill_blank", "listen_fill"];
const LISTEN_TYPES = ["listen_choice", "listen_fill"];
const EMPTY_FORM = {
  type: "multiple_choice",
  text: "",
  audioText: "",
  imageUrl: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
  correctText: "",
  explanation: "",
  difficulty: "easy",
};

export default function AdminQuestionsPage() {
  const dialog = useDialog();
  const { lessonId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("q");
  const formRef = useRef(null);
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [version, setVersion] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("easy");
  const [aiDrafts, setAiDrafts] = useState([]);
  const [generating, setGenerating] = useState(false);

  async function loadQuestions() {
    const res = await questionService.listByLesson(lessonId);
    setQuestions(res.data);
    setVersion((v) => v + 1);
  }

  useEffect(() => {
    setLoading(true);
    setForm(null);
    setEditingId(null);
    setAiDrafts([]);
    Promise.all([lessonService.getOne(lessonId), questionService.listByLesson(lessonId)]).then(([lessonRes, questionsRes]) => {
      setLesson(lessonRes.data);
      setQuestions(questionsRes.data);
      setLoading(false);
    });
  }, [lessonId]);

  // Đến từ ô tra cứu ID / ngân hàng câu hỏi (?q=<questionId>) → mở luôn form sửa câu đó.
  useEffect(() => {
    if (!focusId || questions.length === 0) return;
    const q = questions.find((x) => x._id === focusId);
    if (q) startEdit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, questions.length]);

  async function scrollToForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function startEdit(question) {
    setEditingId(question._id);
    setError("");
    setForm({
      type: question.type || "multiple_choice",
      text: question.text,
      audioText: question.audioText || "",
      imageUrl: question.imageUrl || "",
      choices: question.choices?.length ? [...question.choices] : ["", "", "", ""],
      correctIndex: question.correctIndex || 0,
      correctText: question.correctText || "",
      explanation: question.explanation || "",
      difficulty: question.difficulty || "easy",
    });
    scrollToForm();
  }

  async function startCreate() {
    setEditingId(null);
    setError("");
    setForm({ ...EMPTY_FORM });
    scrollToForm();
  }

  async function changeType(type) {
    setForm((f) => ({
      ...f,
      type,
      choices: type === "true_false" ? ["Đúng", "Sai"] : f.choices.length === 2 ? ["", "", "", ""] : f.choices,
      correctIndex: 0,
    }));
  }

  async function closeForm() {
    setEditingId(null);
    setForm(null);
    if (focusId) setSearchParams({}, { replace: true });
  }

  async function updateChoice(idx, value) {
    setForm((f) => {
      const choices = [...f.choices];
      choices[idx] = value;
      return { ...f, choices };
    });
  }

  async function removeChoice(idx) {
    setForm((f) => ({
      ...f,
      choices: f.choices.filter((_, i) => i !== idx),
      correctIndex: f.correctIndex === idx ? 0 : f.correctIndex > idx ? f.correctIndex - 1 : f.correctIndex,
    }));
  }

  async function handleSubmit(e, keepOpen = false) {
    e.preventDefault();
    setError("");
    const isFill = FILL_TYPES.includes(form.type);
    if (isFill && !form.text.includes("___")) {
      setError('Câu điền chỗ trống cần có "___" (3 dấu gạch dưới) ở vị trí ô trống.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        lesson: lessonId,
        choices: isFill ? [] : form.choices.map((c) => c.trim()),
        correctText: isFill ? form.correctText.trim() : "",
      };
      if (editingId) await questionService.update(editingId, payload);
      else await questionService.create({ ...payload, order: questions.length + 1 });
      await loadQuestions();
      if (keepOpen && !editingId) setForm({ ...EMPTY_FORM, type: form.type, difficulty: form.difficulty });
      else closeForm();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(q) {
    if (!(await dialog.confirm({ message: `Xoá câu hỏi "${q.text.slice(0, 60)}"?`, danger: true, confirmText: "Xoá" }))) return;
    await questionService.remove(q._id);
    if (editingId === q._id) closeForm();
    await loadQuestions();
  }

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const res = await questionService.aiGenerate({ lessonId, count: aiCount, difficulty: aiDifficulty });
      setAiDrafts(res.data);
    } catch (err) {
      setError(err.apiMessage || "Không thể tạo câu hỏi bằng AI lúc này");
    } finally {
      setGenerating(false);
    }
  }

  function takeDraft(idx) {
    const d = aiDrafts[idx];
    setEditingId(null);
    setForm({ ...EMPTY_FORM, text: d.text, choices: d.choices, correctIndex: d.correctIndex, explanation: d.explanation, difficulty: d.difficulty });
    setAiDrafts((list) => list.filter((_, i) => i !== idx));
    scrollToForm();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isFill = form && FILL_TYPES.includes(form.type);
  const shown = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => !filter || q.text.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <AdminPage>
      <AdminLessonHeader lesson={lesson} active="cau-hoi" version={version} />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" /> Thêm câu hỏi
        </Button>
        <Button variant="outline" onClick={() => setAiOpen((o) => !o)} className="border-violet-200 text-violet-700 hover:bg-violet-50">
          <Sparkles className="h-4 w-4" /> Gợi ý câu hỏi bằng AI
        </Button>
        {questions.length > 5 && (
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Lọc câu hỏi..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        )}
      </div>

      {aiOpen && (
        <Card className="mt-3 bg-violet-50/60 ring-violet-100">
          <p className="text-sm text-violet-700">AI soạn nháp câu trắc nghiệm theo tên bài học. Em xem, sửa rồi mới lưu.</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Số câu">
              <select className={cn(inputClass, "w-28")} value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))}>
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} câu
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mức độ">
              <select className={cn(inputClass, "w-40")} value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Button onClick={handleGenerate} disabled={generating} className="bg-violet-600 hover:bg-violet-700">
              {generating ? "Đang soạn..." : "Soạn câu hỏi"}
            </Button>
          </div>
          {aiDrafts.length > 0 && (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {aiDrafts.map((d, idx) => (
                <div key={idx} className="rounded-xl bg-white p-3 ring-1 ring-violet-100">
                  <p className="font-semibold text-slate-800">{d.text}</p>
                  <ul className="mt-1 text-sm text-slate-500">
                    {d.choices.map((c, i) => (
                      <li key={i} className={i === d.correctIndex ? "font-bold text-primary" : ""}>
                        {"ABCD"[i]}. {c}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <Button onClick={() => takeDraft(idx)} className="px-3 py-1.5 text-sm">
                      Dùng câu này
                    </Button>
                    <Button variant="outline" onClick={() => setAiDrafts((l) => l.filter((_, i) => i !== idx))} className="px-3 py-1.5 text-sm">
                      Bỏ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {error && !form && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}

      {form && (
        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl bg-white p-5 shadow-elevation-2 ring-2 ring-primary/30">
          <div className="flex items-center justify-between">
            <p className="font-display text-h3 text-slate-800">{editingId ? "Sửa câu hỏi" : "Câu hỏi mới"}</p>
            <IconButton title="Đóng" onClick={closeForm}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_200px]">
            <Field label="Dạng câu hỏi">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeType(value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition",
                      form.type === value ? "bg-primary text-white ring-primary" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Độ khó">
              <select className={inputClass} value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label="Nội dung câu hỏi"
            required
            hint={isFill ? 'Gõ "___" (3 dấu gạch dưới) ở chỗ học sinh cần điền. VD: 5 + 2 = ___' : undefined}
          >
            <textarea
              className={cn(inputClass, "min-h-[80px]")}
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              required
            />
          </Field>

          {LISTEN_TYPES.includes(form.type) && (
            <Field
              label="Câu đọc to cho học sinh nghe"
              hint={form.type === "listen_fill" ? "Gõ đầy đủ câu (kèm đáp án) để máy đọc cho bé nghe." : "Để trống thì máy đọc luôn nội dung câu hỏi."}
            >
              <textarea className={inputClass} value={form.audioText} onChange={(e) => setForm((f) => ({ ...f, audioText: e.target.value }))} />
            </Field>
          )}

          {isFill ? (
            <Field label="Đáp án đúng" required hint="Không phân biệt chữ hoa/thường khi chấm.">
              <input className={inputClass} value={form.correctText} onChange={(e) => setForm((f) => ({ ...f, correctText: e.target.value }))} required />
            </Field>
          ) : (
            <Field label="Các đáp án — bấm vào vòng tròn để chọn đáp án đúng">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {form.choices.map((choice, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 p-1.5 pl-2",
                      form.correctIndex === idx ? "border-green-400 bg-green-50" : "border-slate-100"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, correctIndex: idx }))}
                      title="Chọn làm đáp án đúng"
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold",
                        form.correctIndex === idx ? "border-green-500 bg-green-500 text-white" : "border-slate-300 text-slate-500"
                      )}
                    >
                      {form.correctIndex === idx ? <CheckCircle2 className="h-5 w-5" /> : "ABCD"[idx]}
                    </button>
                    <input
                      className={inputClass}
                      value={choice}
                      onChange={(e) => updateChoice(idx, e.target.value)}
                      readOnly={form.type === "true_false"}
                      placeholder={`Đáp án ${"ABCD"[idx]}`}
                      required
                    />
                    {form.type !== "true_false" && form.choices.length > 2 && (
                      <IconButton title="Bỏ đáp án này" tone="danger" onClick={() => removeChoice(idx)}>
                        <X className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
              {form.type !== "true_false" && form.choices.length < 4 && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, choices: [...f.choices, ""] }))}
                  className="mt-2 flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" /> Thêm đáp án
                </button>
              )}
            </Field>
          )}

          <Field label="Giải thích" hint="Hiện cho học sinh khi trả lời sai.">
            <input className={inputClass} value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} />
          </Field>

          <ImageUploadField
            label="Ảnh minh hoạ (không bắt buộc)"
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
            inputClass={inputClass}
          />

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Lưu câu hỏi"}
            </Button>
            {!editingId && (
              <Button type="button" variant="outline" disabled={saving} onClick={(e) => handleSubmit(e, true)}>
                Lưu & thêm câu tiếp
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={closeForm}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {shown.map(({ q, i }) => (
          <div
            key={q._id}
            className={cn("rounded-2xl bg-white p-4 shadow-elevation-1 ring-1", q._id === editingId ? "ring-2 ring-primary" : "ring-slate-100")}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line font-semibold text-slate-800">{q.text}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-sm font-semibold text-secondary">{TYPE_LABELS[q.type]}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-500">{DIFFICULTY_LABEL[q.difficulty]}</span>
                  {!q.explanation && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-700">Chưa có giải thích</span>}
                </div>
                {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-2 max-h-24 rounded-lg object-contain" />}
                {FILL_TYPES.includes(q.type) ? (
                  <p className="mt-2 flex items-center gap-1.5 font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Đáp án: {q.correctText}
                  </p>
                ) : (
                  <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-slate-600 sm:grid-cols-2">
                    {q.choices.map((choice, ci) => (
                      <li key={ci} className={cn("flex items-center gap-1.5", ci === q.correctIndex && "font-semibold text-green-700")}>
                        {ci === q.correctIndex ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="w-4 text-center text-slate-400">{"ABCD"[ci]}</span>}
                        {choice}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton title="Sửa câu hỏi" onClick={() => startEdit(q)}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton title="Xoá câu hỏi" tone="danger" onClick={() => handleDelete(q)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <Card className="text-center text-slate-500">Bài học này chưa có câu hỏi. Bấm "Thêm câu hỏi" hoặc dùng AI để soạn nhanh.</Card>
        )}
      </div>
    </AdminPage>
  );
}
