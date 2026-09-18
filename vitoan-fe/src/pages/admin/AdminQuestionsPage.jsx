import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, X, CheckCircle2, Sparkles } from "lucide-react";
import { lessonService, questionService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

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
  order: 0,
};
const TYPE_LABELS = {
  multiple_choice: "Trắc nghiệm 4 đáp án",
  listen_choice: "Nghe và chọn đáp án",
  true_false: "Đúng / Sai",
  fill_blank: "Điền vào chỗ trống",
  listen_fill: "Nghe rồi điền vào chỗ trống",
};
const FILL_TYPES = ["fill_blank", "listen_fill"];
const LISTEN_TYPES = ["listen_choice", "listen_fill"];
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminQuestionsPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState("easy");
  const [aiDrafts, setAiDrafts] = useState([]);
  const [generating, setGenerating] = useState(false);

  async function loadQuestions() {
    const res = await questionService.listByLesson(lessonId);
    setQuestions(res.data);
  }

  useEffect(() => {
    Promise.all([lessonService.getOne(lessonId), questionService.listByLesson(lessonId)]).then(
      ([lessonRes, questionsRes]) => {
        setLesson(lessonRes.data);
        setQuestions(questionsRes.data);
        setLoading(false);
      }
    );
  }, [lessonId]);

  function startEdit(question) {
    setEditingId(question._id);
    setForm({
      type: question.type || "multiple_choice",
      text: question.text,
      audioText: question.audioText || "",
      imageUrl: question.imageUrl || "",
      choices: question.choices?.length ? [...question.choices] : ["", "", "", ""],
      correctIndex: question.correctIndex || 0,
      correctText: question.correctText || "",
      explanation: question.explanation || "",
      difficulty: question.difficulty,
      order: question.order,
    });
  }

  function changeType(type) {
    setForm((f) => ({
      ...f,
      type,
      choices: type === "true_false" ? ["Đúng", "Sai"] : f.choices.length === 2 ? ["", "", "", ""] : f.choices,
      correctIndex: 0,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function updateChoice(idx, value) {
    setForm((f) => {
      const choices = [...f.choices];
      choices[idx] = value;
      return { ...f, choices };
    });
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

  function useDraft(idx) {
    const draft = aiDrafts[idx];
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      type: "multiple_choice",
      text: draft.text,
      choices: draft.choices,
      correctIndex: draft.correctIndex,
      explanation: draft.explanation,
      difficulty: draft.difficulty,
    });
    setAiDrafts((d) => d.filter((_, i) => i !== idx));
  }

  function discardDraft(idx) {
    setAiDrafts((d) => d.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const isFill = FILL_TYPES.includes(form.type);
      const payload = {
        ...form,
        lesson: lessonId,
        choices: isFill ? [] : form.choices,
        correctText: isFill ? form.correctText : "",
      };
      if (editingId) {
        await questionService.update(editingId, payload);
      } else {
        await questionService.create(payload);
      }
      resetForm();
      await loadQuestions();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xóa câu hỏi này?")) return;
    await questionService.remove(id);
    await loadQuestions();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/admin/bai-hoc" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài học
      </Link>
      <h1 className="mt-2 font-display text-h2 text-slate-800">Câu hỏi: {lesson?.title}</h1>

      <div className="mt-6 rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-100">
        <p className="flex items-center gap-1.5 font-display font-bold text-violet-700">
          <Sparkles className="h-4.5 w-4.5" /> Tạo câu hỏi bằng AI
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            max={10}
            className={`${inputClass} w-24`}
            value={aiCount}
            onChange={(e) => setAiCount(Number(e.target.value))}
          />
          <select className={`${inputClass} w-40`} value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
          <Button type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? "Đang tạo..." : "Sinh câu hỏi"}
          </Button>
        </div>

        {aiDrafts.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {aiDrafts.map((draft, idx) => (
              <div key={idx} className="rounded-xl bg-white p-3.5 ring-1 ring-violet-100">
                <p className="text-sm font-semibold text-slate-800">{draft.text}</p>
                <ul className="mt-1.5 grid grid-cols-1 gap-1 text-caption text-slate-500 sm:grid-cols-2">
                  {draft.choices.map((c, i) => (
                    <li key={i} className={i === draft.correctIndex ? "font-bold text-primary" : ""}>
                      {i === draft.correctIndex && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => useDraft(idx)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-caption font-bold text-white hover:bg-primary-dark"
                  >
                    Dùng câu này (xem/sửa rồi lưu)
                  </button>
                  <button
                    type="button"
                    onClick={() => discardDraft(idx)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-caption font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100"
      >
        <select className={inputClass} value={form.type} onChange={(e) => changeType(e.target.value)}>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <textarea
          className={inputClass}
          placeholder={
            FILL_TYPES.includes(form.type)
              ? 'Nội dung câu hỏi — dùng "___" (3 dấu gạch dưới) đánh dấu vị trí ô trống, VD: 856 - 193 = ___'
              : "Nội dung câu hỏi"
          }
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          required
        />
        {FILL_TYPES.includes(form.type) && (
          <p className="text-caption text-slate-500">
            Dùng đúng 3 dấu gạch dưới <code className="rounded bg-slate-100 px-1">___</code> tại vị trí cần điền. Có thể xuống dòng để
            tách câu dẫn và phần cần điền.
          </p>
        )}
        {LISTEN_TYPES.includes(form.type) && (
          <>
            <textarea
              className={inputClass}
              placeholder='Nội dung đọc to (audio) — để trống thì đọc luôn "Nội dung câu hỏi" ở trên'
              value={form.audioText}
              onChange={(e) => setForm((f) => ({ ...f, audioText: e.target.value }))}
            />
            <p className="text-caption text-slate-500">
              {form.type === "listen_fill"
                ? 'Với "nghe rồi điền", ô trống ở trên sẽ giấu đáp án — điền đầy đủ câu (kèm đáp án) vào đây để hệ thống đọc to cho bé nghe.'
                : "Điền câu muốn đọc to khi bé bấm nút nghe (ví dụ đọc chậm/rõ hơn nội dung câu hỏi)."}
            </p>
          </>
        )}
        <input
          className={inputClass}
          placeholder="Ảnh minh họa (URL, tùy chọn)"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
        {form.imageUrl && (
          <img src={form.imageUrl} alt="" className="max-h-32 rounded-xl object-cover ring-1 ring-slate-100" />
        )}
        {FILL_TYPES.includes(form.type) ? (
          <input
            className={inputClass}
            placeholder="Đáp án đúng (chữ hoặc số)"
            value={form.correctText}
            onChange={(e) => setForm((f) => ({ ...f, correctText: e.target.value }))}
            required
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {form.choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctIndex"
                    checked={form.correctIndex === idx}
                    onChange={() => setForm((f) => ({ ...f, correctIndex: idx }))}
                    className="h-4 w-4 accent-primary"
                  />
                  <input
                    className={inputClass}
                    placeholder={`Đáp án ${idx + 1}`}
                    value={choice}
                    onChange={(e) => updateChoice(idx, e.target.value)}
                    readOnly={form.type === "true_false"}
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-caption text-slate-500">Chọn nút tròn ở đáp án đúng.</p>
          </>
        )}
        <input
          className={inputClass}
          placeholder="Giải thích (tùy chọn)"
          value={form.explanation}
          onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
        />
        <div className="flex gap-3">
          <select
            className={inputClass}
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
          >
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
          <input
            type="number"
            className={inputClass}
            placeholder="Thứ tự"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />
        </div>
        {error && <p className="text-caption text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit">{editingId ? "Cập nhật" : "Thêm câu hỏi"}</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4" /> Hủy
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {questions.map((question, idx) => (
          <div key={question._id} className="rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display font-bold text-slate-800">
                {idx + 1}. {question.text}
                {question.type && question.type !== "multiple_choice" && (
                  <span className="ml-2 rounded-full bg-secondary/10 px-2 py-0.5 align-middle text-xs font-semibold text-secondary">
                    {TYPE_LABELS[question.type]}
                  </span>
                )}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => startEdit(question)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(question._id)} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {question.imageUrl && (
              <img src={question.imageUrl} alt="" className="mt-2 max-h-24 rounded-lg object-cover" />
            )}
            {FILL_TYPES.includes(question.type) ? (
              <p className="mt-3 flex items-center gap-1.5 text-body font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Đáp án đúng: {question.correctText}
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-body text-slate-600 sm:grid-cols-2">
                {question.choices.map((choice, choiceIdx) => (
                  <li
                    key={choiceIdx}
                    className={`flex items-center gap-1.5 ${choiceIdx === question.correctIndex ? "font-semibold text-primary" : ""}`}
                  >
                    {choiceIdx === question.correctIndex && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    {choice}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
