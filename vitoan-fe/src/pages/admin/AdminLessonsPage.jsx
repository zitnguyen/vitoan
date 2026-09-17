import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Dumbbell, BookOpen, Pencil, Trash2, X } from "lucide-react";
import { gradeService, subjectService, lessonService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const EMPTY_FORM = { title: "", description: "", subject: "", grade: "", order: 0, isPublished: true };
const inputClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminLessonsPage() {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadLessons() {
    const res = await lessonService.list();
    setLessons(res.data);
  }

  useEffect(() => {
    Promise.all([gradeService.list(), subjectService.list(), lessonService.list()]).then(
      ([gradesRes, subjectsRes, lessonsRes]) => {
        setGrades(gradesRes.data);
        setSubjects(subjectsRes.data);
        setLessons(lessonsRes.data);
        setLoading(false);
      }
    );
  }, []);

  function startEdit(lesson) {
    setEditingId(lesson._id);
    setForm({
      title: lesson.title,
      description: lesson.description || "",
      subject: lesson.subject?._id,
      grade: lesson.grade?._id,
      order: lesson.order,
      isPublished: lesson.isPublished,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await lessonService.update(editingId, form);
      } else {
        await lessonService.create(form);
      }
      resetForm();
      await loadLessons();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xóa bài học này? Câu hỏi liên quan cũng sẽ bị xóa.")) return;
    await lessonService.remove(id);
    await loadLessons();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-h2 text-slate-800">Quản lý bài học</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:grid-cols-2"
      >
        <input
          className={`${inputClass} sm:col-span-2`}
          placeholder="Tên bài học"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          className={`${inputClass} sm:col-span-2`}
          placeholder="Mô tả"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <select
          className={inputClass}
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          required
        >
          <option value="">-- Môn học --</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={form.grade}
          onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
          required
        >
          <option value="">-- Lớp --</option>
          {grades.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={inputClass}
          placeholder="Thứ tự"
          value={form.order}
          onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
        />
        <label className="flex items-center gap-2 text-body text-slate-600">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          />
          Công khai bài học
        </label>
        {error && <p className="text-caption text-red-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">{editingId ? "Cập nhật" : "Thêm bài học"}</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4" /> Hủy
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {lessons.map((lesson) => (
          <div
            key={lesson._id}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100"
          >
            <div>
              <p className="font-display font-bold text-slate-800">
                {lesson.title}{" "}
                {!lesson.isPublished && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-caption font-semibold text-amber-700">
                    Ẩn
                  </span>
                )}
              </p>
              <p className="text-caption text-slate-500">
                {lesson.grade?.name} · {lesson.subject?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/admin/bai-hoc/${lesson._id}/on-tap`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
              >
                <BookOpen className="h-4 w-4" /> Ôn tập
              </Link>
              <Link
                to={`/admin/bai-hoc/${lesson._id}/cau-hoi`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
              >
                <ListChecks className="h-4 w-4" /> Câu hỏi
              </Link>
              <Link
                to={`/admin/bai-hoc/${lesson._id}/luyen-tap`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
              >
                <Dumbbell className="h-4 w-4" /> Luyện tập
              </Link>
              <Button variant="outline" onClick={() => startEdit(lesson)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => handleDelete(lesson._id)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
