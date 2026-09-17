import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, X } from "lucide-react";
import { lessonService, questionService, practiceSetService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const EMPTY_FORM = { title: "", level: "medium", order: 0, timeLimitSeconds: 0, questions: [] };
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminPracticeSetsPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadSets() {
    const res = await practiceSetService.listByLesson(lessonId);
    const detailed = await Promise.all(res.data.map((s) => practiceSetService.getOne(s._id)));
    setSets(detailed.map((r) => r.data));
  }

  useEffect(() => {
    Promise.all([lessonService.getOne(lessonId), questionService.listByLesson(lessonId)]).then(
      async ([lessonRes, questionsRes]) => {
        setLesson(lessonRes.data);
        setQuestions(questionsRes.data);
        await loadSets();
        setLoading(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  function startEdit(set) {
    setEditingId(set._id);
    setForm({
      title: set.title,
      level: set.level,
      order: set.order || 0,
      timeLimitSeconds: set.timeLimitSeconds || 0,
      questions: set.questions.map((q) => q._id),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function toggleQuestion(id) {
    setForm((f) => ({
      ...f,
      questions: f.questions.includes(id) ? f.questions.filter((q) => q !== id) : [...f.questions, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.questions.length === 0) {
      setError("Chọn ít nhất 1 câu hỏi cho bài luyện tập");
      return;
    }
    try {
      const payload = { ...form, lesson: lessonId };
      if (editingId) {
        await practiceSetService.update(editingId, payload);
      } else {
        await practiceSetService.create(payload);
      }
      resetForm();
      await loadSets();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xóa bài luyện tập này?")) return;
    await practiceSetService.remove(id);
    await loadSets();
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
      <h1 className="mt-2 font-display text-h2 text-slate-800">Bài luyện tập: {lesson?.title}</h1>

      {questions.length === 0 ? (
        <p className="mt-6 text-body text-slate-500">
          Bài học này chưa có câu hỏi. Hãy{" "}
          <Link to={`/admin/bai-hoc/${lessonId}/cau-hoi`} className="font-semibold text-primary hover:underline">
            thêm câu hỏi
          </Link>{" "}
          trước khi tạo bài luyện tập.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100"
        >
          <input
            className={inputClass}
            placeholder="Tên bài luyện tập"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className={inputClass}
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
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
            <input
              type="number"
              className={inputClass}
              placeholder="Thời gian (giây, 0 = không giới hạn)"
              value={form.timeLimitSeconds}
              onChange={(e) => setForm((f) => ({ ...f, timeLimitSeconds: Number(e.target.value) }))}
            />
          </div>
          <div>
            <p className="text-caption font-semibold text-slate-500">Chọn câu hỏi cho bài luyện tập này</p>
            <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 p-3">
              {questions.map((q, idx) => (
                <label key={q._id} className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={form.questions.includes(q._id)}
                    onChange={() => toggleQuestion(q._id)}
                  />
                  <span>
                    {idx + 1}. {q.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-caption text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Cập nhật" : "Thêm bài luyện tập"}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="h-4 w-4" /> Hủy
              </Button>
            )}
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {sets.map((set) => (
          <div
            key={set._id}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100"
          >
            <div>
              <p className="font-display font-bold text-slate-800">{set.title}</p>
              <p className="text-caption text-slate-500">
                {set.questions.length} câu · Mức {set.level}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => startEdit(set)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => handleDelete(set._id)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
