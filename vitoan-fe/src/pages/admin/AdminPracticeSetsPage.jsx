import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Pencil, Trash2, X, Plus, Info, Eye, EyeOff } from "lucide-react";
import AdminLessonHeader from "../../components/admin/AdminLessonHeader.jsx";
import { AdminPage, Card, Field, IconButton, inputClass } from "../../components/admin/adminUi.jsx";
import { lessonService, questionService, practiceSetService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const EMPTY_FORM = { title: "", level: "easy", isPublished: true, questions: [] };

export default function AdminPracticeSetsPage() {
  const dialog = useDialog();
  const { lessonId } = useParams();
  const [searchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  async function loadSets() {
    const res = await practiceSetService.listByLesson(lessonId);
    const detailed = await Promise.all(res.data.map((s) => practiceSetService.getOne(s._id)));
    setSets(detailed.map((r) => r.data));
    setVersion((v) => v + 1);
  }

  useEffect(() => {
    setLoading(true);
    setForm(null);
    setEditingId(null);
    Promise.all([lessonService.getOne(lessonId), questionService.listByLesson(lessonId)]).then(async ([lessonRes, questionsRes]) => {
      setLesson(lessonRes.data);
      setQuestions(questionsRes.data);
      await loadSets();
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Đến từ ô tra cứu ID (?edit=<practiceSetId>) → mở luôn form sửa.
  useEffect(() => {
    const set = sets.find((x) => x._id === editParam);
    if (set) startEdit(set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, sets.length]);

  async function startEdit(set) {
    setEditingId(set._id);
    setError("");
    setForm({
      title: set.title,
      level: set.level,
      isPublished: set.isPublished !== false,
      questions: set.questions.map((q) => q._id),
    });
  }

  async function startCreate() {
    setEditingId(null);
    setError("");
    setForm({ ...EMPTY_FORM, title: `Luyện tập ${sets.length + 1}` });
  }

  async function toggleQuestion(id) {
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
    setSaving(true);
    try {
      // Giữ đúng thứ tự câu hỏi như trong danh sách của bài học.
      const ordered = questions.map((q) => q._id).filter((id) => form.questions.includes(id));
      const payload = { title: form.title.trim(), level: form.level, isPublished: form.isPublished, questions: ordered, lesson: lessonId };
      if (editingId) await practiceSetService.update(editingId, payload);
      else await practiceSetService.create({ ...payload, order: sets.length + 1 });
      setForm(null);
      setEditingId(null);
      await loadSets();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(set) {
    if (!(await dialog.confirm({ message: `Xoá bài luyện tập "${set.title}"? (Câu hỏi vẫn giữ nguyên trong bài học)`, danger: true, confirmText: "Xoá" }))) return;
    await practiceSetService.remove(set._id);
    if (editingId === set._id) setForm(null);
    await loadSets();
  }

  async function togglePublished(set) {
    await practiceSetService.update(set._id, { isPublished: set.isPublished === false });
    await loadSets();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const allChecked = form && form.questions.length === questions.length;

  return (
    <AdminPage>
      <AdminLessonHeader lesson={lesson} active="luyen-tap" version={version} />

      <div className="mb-4 flex items-start gap-2 rounded-xl bg-secondary/5 px-4 py-3 text-slate-600 ring-1 ring-secondary/20">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <p>
          Bài luyện tập là <b>không bắt buộc</b>. Nếu bài học chưa có bài luyện tập nào, học sinh sẽ luyện với <b>toàn bộ {questions.length} câu hỏi</b>{" "}
          của bài học. Tạo bài luyện tập khi muốn chia câu hỏi thành nhiều bài nhỏ (VD: Dễ – Khó).
        </p>
      </div>

      {questions.length === 0 ? (
        <Card className="text-center text-slate-500">
          Bài học này chưa có câu hỏi.{" "}
          <Link to={`/admin/bai-hoc/${lessonId}/cau-hoi`} className="font-bold text-primary hover:underline">
            Thêm câu hỏi trước
          </Link>
          .
        </Card>
      ) : (
        !form && (
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" /> Tạo bài luyện tập
          </Button>
        )
      )}

      {form && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-elevation-2 ring-2 ring-primary/30">
          <div className="flex items-center justify-between">
            <p className="font-display text-h3 text-slate-800">{editingId ? "Sửa bài luyện tập" : "Bài luyện tập mới"}</p>
            <IconButton title="Đóng" onClick={() => setForm(null)}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_200px]">
            <Field label="Tên bài luyện tập" required>
              <input className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </Field>
            <Field label="Mức độ">
              <select className={inputClass} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
                {Object.entries(LEVEL_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={`Câu hỏi trong bài (${form.questions.length}/${questions.length} đã chọn)`}>
            <div className="rounded-xl ring-1 ring-slate-200">
              <label className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 font-bold text-slate-700">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                  checked={allChecked}
                  onChange={(e) => setForm((f) => ({ ...f, questions: e.target.checked ? questions.map((q) => q._id) : [] }))}
                />
                Chọn tất cả
              </label>
              <div className="max-h-80 overflow-y-auto">
                {questions.map((q, idx) => (
                  <label
                    key={q._id}
                    className={cn("flex items-start gap-2 border-b border-slate-50 px-3 py-2", form.questions.includes(q._id) && "bg-primary/5")}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                      checked={form.questions.includes(q._id)}
                      onChange={() => toggleQuestion(q._id)}
                    />
                    <span className="text-slate-700">
                      <b className="text-slate-400">{idx + 1}.</b> {q.text.replace(/\n/g, " ")}
                      <span className="ml-2 text-sm text-slate-400">({LEVEL_LABEL[q.difficulty] || "Dễ"})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </Field>
          <label className="flex items-center gap-2 font-semibold text-slate-600">
            <input
              type="checkbox"
              className="h-5 w-5 accent-primary"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            Hiện cho học sinh
          </label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo bài luyện tập"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {sets.map((set) => (
          <div
            key={set._id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1",
              set._id === editingId ? "ring-2 ring-primary" : "ring-slate-100"
            )}
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-slate-800">
                {set.title}
                {set.isPublished === false && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">Đang ẩn</span>}
              </p>
              <p className="text-slate-500">
                {set.questions.length} câu · {LEVEL_LABEL[set.level] || set.level}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <IconButton title={set.isPublished === false ? "Hiện cho học sinh" : "Ẩn khỏi học sinh"} onClick={() => togglePublished(set)}>
                {set.isPublished === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </IconButton>
              <IconButton title="Sửa" onClick={() => startEdit(set)}>
                <Pencil className="h-4 w-4" />
              </IconButton>
              <IconButton title="Xoá" tone="danger" onClick={() => handleDelete(set)}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
