import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import IdBadge from "../../components/common/IdBadge.jsx";
import { Pencil, Trash2, X, Plus, Search, Eye, EyeOff } from "lucide-react";
import { gradeService, subjectService, chapterService, lessonService, questionService, testService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const EMPTY_FORM = {
  title: "",
  testType: "topic",
  subject: "",
  grade: "",
  chapter: "",
  semester: 1,
  level: "medium",
  timeLimitSeconds: 0,
  questions: [],
};
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const filterSelectClass =
  "w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

const TEST_TYPE_LABEL = { topic: "Theo chủ đề", midterm: "Giữa kỳ", final: "Cuối kỳ" };
const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

export default function AdminTestsPage() {
  const dialog = useDialog();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [tests, setTests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [questionPool, setQuestionPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function loadTests() {
    setLoadingList(true);
    const res = await testService.list({
      search: search || undefined,
      testType: filterType || undefined,
      subject: filterSubject || undefined,
      grade: filterGrade || undefined,
      level: filterLevel || undefined,
      status: filterStatus || undefined,
    });
    setTests(res.data);
    setLoadingList(false);
  }

  useEffect(() => {
    Promise.all([gradeService.list(), subjectService.list()]).then(([gradesRes, subjectsRes]) => {
      setGrades(gradesRes.data);
      setSubjects(subjectsRes.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadTests, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterType, filterSubject, filterGrade, filterLevel, filterStatus]);

  useEffect(() => {
    if (!form.subject || !form.grade) {
      setChapters([]);
      return;
    }
    chapterService.list({ subject: form.subject, grade: form.grade }).then((res) => setChapters(res.data));
  }, [form.subject, form.grade]);

  useEffect(() => {
    if (!form.subject || !form.grade) {
      setQuestionPool([]);
      return;
    }
    if (form.testType === "topic" && !form.chapter) {
      setQuestionPool([]);
      return;
    }
    setLoadingPool(true);
    const filter = { subject: form.subject, grade: form.grade };
    if (form.testType === "topic") filter.chapter = form.chapter;
    // Đề giữa kỳ/cuối kỳ: chỉ lấy câu hỏi của các chủ đề thuộc học kỳ đã chọn.
    const semesterChapterIds = new Set(chapters.filter((c) => (c.semester || 1) === form.semester).map((c) => c._id));
    lessonService.list(filter).then(async (lessonsRes) => {
      const lessons =
        form.testType === "topic" ? lessonsRes.data : lessonsRes.data.filter((l) => semesterChapterIds.has(l.chapter));
      const withQuestions = await Promise.all(
        lessons.map(async (lesson) => ({
          lesson,
          questions: (await questionService.listByLesson(lesson._id)).data,
        }))
      );
      setQuestionPool(withQuestions.filter((g) => g.questions.length > 0));
      setLoadingPool(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subject, form.grade, form.testType, form.chapter, form.semester, chapters]);

  // Chọn nhanh ngẫu nhiên n câu từ kho câu hỏi đang hiển thị (rải đều các bài học).
  async function pickRandom(n) {
    const all = questionPool.flatMap((g) => g.questions.map((q) => q._id));
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    setForm((f) => ({ ...f, questions: shuffled.slice(0, n) }));
  }

  // Đến từ ô tra cứu ID (?edit=<testId>) → mở luôn form sửa bài kiểm tra đó.
  useEffect(() => {
    if (!editParam || loadingList) return;
    const t = tests.find((x) => x._id === editParam);
    if (t) {
      startEdit(t);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, loadingList]);

  async function startEdit(test) {
    setEditingId(test._id);
    setShowForm(true);
    setForm({
      title: test.title,
      testType: test.testType,
      subject: test.subject?._id || test.subject,
      grade: test.grade?._id || test.grade,
      chapter: test.chapter?._id || test.chapter || "",
      semester: test.semester || 1,
      level: test.level,
      timeLimitSeconds: test.timeLimitSeconds || 0,
      questions: [],
    });
    testService.getOne(test._id).then((res) => {
      setForm((f) => ({ ...f, questions: res.data.questions.map((q) => q._id) }));
    });
  }

  async function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function toggleQuestion(id) {
    setForm((f) => ({
      ...f,
      questions: f.questions.includes(id) ? f.questions.filter((q) => q !== id) : [...f.questions, id],
    }));
  }

  async function toggleAllInLesson(lessonQuestions, checked) {
    const ids = lessonQuestions.map((q) => q._id);
    setForm((f) => ({
      ...f,
      questions: checked ? Array.from(new Set([...f.questions, ...ids])) : f.questions.filter((q) => !ids.includes(q)),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.testType === "topic" && !form.chapter) {
      setError("Vui lòng chọn chủ đề cho bài kiểm tra theo chủ đề");
      return;
    }
    if (form.questions.length === 0) {
      setError("Chọn ít nhất 1 câu hỏi cho bài kiểm tra");
      return;
    }
    try {
      const payload = { ...form, chapter: form.testType === "topic" ? form.chapter : null };
      if (editingId) {
        await testService.update(editingId, payload);
      } else {
        await testService.create(payload);
      }
      resetForm();
      await loadTests();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleDelete(id) {
    if (!(await dialog.confirm({ message: "Xóa bài kiểm tra này?", danger: true, confirmText: "Xoá" }))) return;
    await testService.remove(id);
    await loadTests();
  }

  async function toggleStatus(test) {
    await testService.update(test._id, { isActive: !test.isActive });
    await loadTests();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-h2 text-slate-800">Quản lý bài kiểm tra</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> Thêm bài kiểm tra
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100"
        >
          <p className="font-display text-lg font-bold text-slate-800">{editingId ? "Sửa bài kiểm tra" : "Thêm bài kiểm tra"}</p>
          {/* Thứ tự theo quan hệ 1-nhiều: Môn → Lớp → Loại → Chủ đề/Học kỳ, rồi mới tới thông tin bài */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">1. Môn học</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value, chapter: "", questions: [] }))}
                required
              >
                <option value="">-- Chọn môn --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">2. Lớp</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value, chapter: "", questions: [] }))}
                required
              >
                <option value="">-- Chọn lớp --</option>
                {grades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">3. Loại bài kiểm tra</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.testType}
                onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value, chapter: "", questions: [] }))}
              >
                <option value="topic">Theo chủ đề</option>
                <option value="midterm">Giữa kỳ</option>
                <option value="final">Cuối kỳ</option>
              </select>
            </label>
            {form.testType === "topic" ? (
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">4. Chủ đề</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={form.chapter}
                  onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value, questions: [] }))}
                  disabled={!form.subject || !form.grade}
                  required
                >
                  <option value="">{form.subject && form.grade ? "-- Chọn chủ đề --" : "Chọn môn & lớp trước"}</option>
                  {chapters.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
            </label>
            ) : (
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">4. Học kỳ</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                >
                  <option value={1}>Học kỳ 1</option>
                  <option value={2}>Học kỳ 2</option>
                </select>
            </label>
            )}
            <label className="block sm:col-span-2">
              <span className="text-caption font-semibold text-slate-500">5. Tên bài kiểm tra</span>
              <input
                className={`${inputClass} mt-1`}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">Mức độ</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </label>
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">Thời gian làm bài (phút, 0 = không giới hạn)</span>
              <input
                type="number"
                min={0}
                className={`${inputClass} mt-1`}
                value={Math.round(form.timeLimitSeconds / 60)}
                onChange={(e) => setForm((f) => ({ ...f, timeLimitSeconds: Math.max(0, Number(e.target.value)) * 60 }))}
              />
            </label>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption font-semibold text-slate-500">
                6. Chọn câu hỏi cho bài kiểm tra ({form.questions.length} đã chọn)
              </p>
              {questionPool.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-slate-400">Chọn nhanh ngẫu nhiên:</span>
                  {[10, 15, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => pickRandom(n)}
                      className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                    >
                      {n} câu
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, questions: [] }))}
                    className="rounded-full px-2.5 py-1 font-bold text-slate-400 hover:text-red-500"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              )}
            </div>
            {loadingPool ? (
              <div className="mt-2 flex justify-center py-4">
                <Spinner />
              </div>
            ) : questionPool.length === 0 ? (
              <p className="mt-2 text-caption text-slate-400">Chọn môn, lớp và chủ đề (hoặc học kỳ) ở trên để hiện danh sách câu hỏi.</p>
            ) : (
              <div className="mt-2 max-h-80 space-y-4 overflow-y-auto rounded-xl border border-slate-100 p-3">
                {questionPool.map(({ lesson, questions }) => {
                  const allChecked = questions.every((q) => form.questions.includes(q._id));
                  return (
                    <div key={lesson._id}>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={allChecked}
                          onChange={(e) => toggleAllInLesson(questions, e.target.checked)}
                        />
                        {lesson.title}
                      </label>
                      <div className="mt-1 ml-6 space-y-1">
                        {questions.map((q, idx) => (
                          <label key={q._id} className="flex items-start gap-2 text-sm text-slate-600">
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
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-caption text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Cập nhật" : "Thêm bài kiểm tra"}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4" /> Hủy
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo tên bài kiểm tra"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={filterSelectClass} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">Tất cả môn</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={filterSelectClass} value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {grades.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <select className={filterSelectClass} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="topic">Theo chủ đề</option>
          <option value="midterm">Giữa kỳ</option>
          <option value="final">Cuối kỳ</option>
        </select>
        <select className={filterSelectClass} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          <option value="">Tất cả mức độ</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
        <select className={filterSelectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="published">Đang dùng</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {loadingList ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tests.map((test) => (
            <div
              key={test._id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display font-bold text-slate-800">
                  {test.title}
                  <IdBadge id={test._id} label="KT" always />
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold",
                      test.isActive ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {test.isActive ? "Đang dùng" : "Nháp"}
                  </span>
                </p>
                <p className="text-caption text-slate-500">
                  {TEST_TYPE_LABEL[test.testType]} · {test.grade?.name} · {test.subject?.name}
                  {test.chapter?.title ? ` · ${test.chapter.title}` : ` · Học kỳ ${test.semester || 1}`} ·{" "}
                  {LEVEL_LABEL[test.level]} · {test.questionCount} câu
                  {test.timeLimitSeconds > 0 ? ` · ${Math.round(test.timeLimitSeconds / 60)} phút` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => toggleStatus(test)} title={test.isActive ? "Chuyển sang Nháp" : "Đưa vào sử dụng"}>
                  {test.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={() => startEdit(test)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(test._id)} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {tests.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
              Không tìm thấy bài kiểm tra phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
