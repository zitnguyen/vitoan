import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Plus, Search, Eye, EyeOff } from "lucide-react";
import { gradeService, subjectService, chapterService, lessonService, questionService, testService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

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
    lessonService.list(filter).then(async (lessonsRes) => {
      const withQuestions = await Promise.all(
        lessonsRes.data.map(async (lesson) => ({
          lesson,
          questions: (await questionService.listByLesson(lesson._id)).data,
        }))
      );
      setQuestionPool(withQuestions.filter((g) => g.questions.length > 0));
      setLoadingPool(false);
    });
  }, [form.subject, form.grade, form.testType, form.chapter]);

  function startEdit(test) {
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

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  function toggleQuestion(id) {
    setForm((f) => ({
      ...f,
      questions: f.questions.includes(id) ? f.questions.filter((q) => q !== id) : [...f.questions, id],
    }));
  }

  function toggleAllInLesson(lessonQuestions, checked) {
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
      const payload = { ...form, chapter: form.testType === "topic" ? form.chapter : undefined };
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
    if (!confirm("Xóa bài kiểm tra này?")) return;
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
    <div className="mx-auto max-w-4xl px-4 py-8">
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
          <input
            className={inputClass}
            placeholder="Tên bài kiểm tra"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              className={inputClass}
              value={form.testType}
              onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value, chapter: "" }))}
            >
              <option value="topic">Theo chủ đề</option>
              <option value="midterm">Giữa kỳ</option>
              <option value="final">Cuối kỳ</option>
            </select>
            <select
              className={inputClass}
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
            <select
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value, questions: [] }))}
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
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value, questions: [] }))}
              required
            >
              <option value="">-- Lớp --</option>
              {grades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
            {form.testType === "topic" ? (
              <select
                className={`${inputClass} sm:col-span-2`}
                value={form.chapter}
                onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value, questions: [] }))}
                required
              >
                <option value="">-- Chủ đề --</option>
                {chapters.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className={`${inputClass} sm:col-span-2`}
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
              >
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
              </select>
            )}
            <input
              type="number"
              className={`${inputClass} sm:col-span-2`}
              placeholder="Thời gian làm bài (giây, 0 = không giới hạn)"
              value={form.timeLimitSeconds}
              onChange={(e) => setForm((f) => ({ ...f, timeLimitSeconds: Number(e.target.value) }))}
            />
          </div>

          <div>
            <p className="text-caption font-semibold text-slate-500">Chọn câu hỏi cho bài kiểm tra ({form.questions.length} đã chọn)</p>
            {loadingPool ? (
              <div className="mt-2 flex justify-center py-4">
                <Spinner />
              </div>
            ) : questionPool.length === 0 ? (
              <p className="mt-2 text-caption text-slate-400">Chọn môn/lớp/chủ đề để xem câu hỏi khả dụng.</p>
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
        <select className={filterSelectClass} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="topic">Theo chủ đề</option>
          <option value="midterm">Giữa kỳ</option>
          <option value="final">Cuối kỳ</option>
        </select>
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
