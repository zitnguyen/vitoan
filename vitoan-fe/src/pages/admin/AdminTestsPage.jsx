import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import IdBadge from "../../components/common/IdBadge.jsx";
import { Pencil, Trash2, X, Plus, Search, Eye, EyeOff, Copy, ChevronDown, CheckCircle2, Minus } from "lucide-react";
import { gradeService, subjectService, chapterService, lessonService, questionService, testService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import CustomQuestionPanel from "../../components/admin/CustomQuestionPanel.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, adminPageClass } from "../../components/admin/adminUi.jsx";
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

const FILL = ["fill_blank", "listen_fill"];
const TYPE_TAG = {
  multiple_choice: "Chọn 1 đáp án",
  multi_choice: "Chọn nhiều đáp án",
  true_false: "Đúng / Sai",
  fill_blank: "Điền chỗ trống",
  listen_choice: "Nghe & chọn",
  listen_fill: "Nghe & điền",
};

function QuestionDetail({ q }) {
  const right = (i) => (q.type === "multi_choice" ? (q.correctIndexes || []).includes(i) : i === q.correctIndex);
  return (
    <div className="ml-6 mt-1 rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-100">
      <p className="text-xs font-bold text-slate-400">
        {TYPE_TAG[q.type] || "Trắc nghiệm"} · độ khó: {LEVEL_LABEL[q.difficulty] || "—"}
      </p>
      {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-2 max-h-32 rounded-lg" />}
      {FILL.includes(q.type) ? (
        <p className="mt-1.5 font-bold text-primary">Đáp án đúng: {q.correctText}</p>
      ) : (
        <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
          {(q.choices || []).map((c, i) => (
            <li key={i} className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1", right(i) ? "bg-primary/10 font-bold text-primary" : "bg-white text-slate-600")}>
              {right(i) ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="w-4 shrink-0 text-center text-slate-400">{"ABCD"[i]}</span>}
              {c}
            </li>
          ))}
        </ul>
      )}
      {q.explanation && <p className="mt-1.5 text-slate-500">💡 {q.explanation}</p>}
    </div>
  );
}

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
  const [perLessonN, setPerLessonN] = useState(3);
  const [customs, setCustoms] = useState([]); // câu hỏi riêng của đề đang soạn
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [openDetail, setOpenDetail] = useState({}); // id câu hỏi đang mở xem chi tiết

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
    // Xếp theo lớp → môn → loại đề (chủ đề, giữa kỳ, cuối kỳ) → học kỳ/chủ đề cho dễ tìm.
    const TYPE_ORDER = { topic: 0, midterm: 1, final: 2 };
    setTests(
      [...res.data].sort(
        (x, y) =>
          (x.grade?.order ?? 0) - (y.grade?.order ?? 0) ||
          (x.subject?.name || "").localeCompare(y.subject?.name || "", "vi") ||
          (TYPE_ORDER[x.testType] ?? 0) - (TYPE_ORDER[y.testType] ?? 0) ||
          (x.semester || 1) - (y.semester || 1) ||
          (x.chapter?.order ?? 0) - (y.chapter?.order ?? 0) ||
          x.title.localeCompare(y.title, "vi")
      )
    );
    setLoadingList(false);
  }

  useEffect(() => {
    Promise.all([gradeService.list(), subjectService.list()]).then(([gradesRes, subjectsRes]) => {
      setGrades(gradesRes.data);
      // Khối đang triển khai là Lớp 1: mặc định lọc theo lớp đầu tiên.
      setFilterGrade([...gradesRes.data].sort((x, y) => (x.order || 0) - (y.order || 0))[0]?._id || "");
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

  // Thêm toàn bộ câu hỏi của một bài kiểm tra có sẵn vào bài đang soạn (không trùng).
  async function copyFromTest(testId) {
    if (!testId) return;
    const res = await testService.getOne(testId);
    const ids = res.data.questions.map((q) => q._id);
    setForm((f) => ({ ...f, questions: [...new Set([...f.questions, ...ids])] }));
  }

  // Chọn nhanh ngẫu nhiên n câu từ kho câu hỏi đang hiển thị (rải đều các bài học).
  async function pickRandom(n) {
    const all = questionPool.flatMap((g) => g.questions.map((q) => q._id));
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    setForm((f) => ({ ...f, questions: shuffled.slice(0, n) }));
  }

  // Chọn ngẫu nhiên mỗi bài học n câu (giữ nguyên phần đã chọn ở bài khác nếu chỉ định 1 bài).
  function pickPerLesson(n, onlyLessonId) {
    setForm((f) => {
      let keep = f.questions;
      const picked = [];
      for (const { lesson, questions } of questionPool) {
        if (onlyLessonId && lesson._id !== onlyLessonId) continue;
        const ids = questions.map((q) => q._id);
        keep = keep.filter((id) => !ids.includes(id));
        picked.push(...[...ids].sort(() => Math.random() - 0.5).slice(0, n));
      }
      return { ...f, questions: [...keep, ...picked] };
    });
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
      setCustoms(res.data.questions.filter((q) => q.testOnly));
    });
  }

  async function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setCustoms([]);
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
    if (form.questions.length < 8 && form.isActive !== false) {
      const ok = await dialog.confirm({
        message: `Đề này mới có ${form.questions.length} câu — quá ngắn nên điểm khó phản ánh đúng năng lực. Vẫn lưu và cho học sinh làm?`,
        confirmText: "Vẫn lưu",
        cancelText: "Chọn thêm câu",
      });
      if (!ok) return;
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

  async function handleDuplicate(test) {
    await testService.duplicate(test._id);
    await loadTests();
  }

  const [collapsed, setCollapsed] = useState({});

  // Gom đề theo Môn → Loại đề để quét nhanh thay vì một danh sách dài (giống cách Moodle/Udemy chia theo phần).
  const groups = (() => {
    const map = new Map();
    for (const t of tests) {
      const key = `${t.grade?.name || ""}|${t.subject?.name || ""}|${t.testType}`;
      if (!map.has(key)) map.set(key, { key, title: `${t.grade?.name || ""} · ${t.subject?.name || ""} — ${TEST_TYPE_LABEL[t.testType]}`, items: [] });
      map.get(key).items.push(t);
    }
    return [...map.values()];
  })();

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
    <div className={adminPageClass}>
      <AdminHeader
        className="mb-0"
        title="Bài kiểm tra"
        subtitle="Tạo đề theo chủ đề, giữa kỳ, cuối kỳ cho từng lớp và môn."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm bài kiểm tra
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100"
        >
          <p className="font-display text-lg font-bold text-slate-800">{editingId ? "Sửa bài kiểm tra" : "Thêm bài kiểm tra"}</p>
          {editingId && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              Môn, lớp, loại đề và chủ đề/học kỳ đã cố định, không đổi được khi sửa. Muốn đổi hãy tạo đề mới.
            </p>
          )}
          {/* Thứ tự theo quan hệ 1-nhiều: Môn → Lớp → Loại → Chủ đề/Học kỳ, rồi mới tới thông tin bài */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-caption font-semibold text-slate-500">1. Môn học</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value, chapter: "", questions: [] }))}
                required
                disabled={!!editingId}
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
                disabled={!!editingId}
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
                disabled={!!editingId}
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
                  disabled={!form.subject || !form.grade || !!editingId}
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
                  disabled={!!editingId}
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

          <CustomQuestionPanel
            customs={customs}
            onAdd={(q) => {
              setCustoms((c) => [...c, q]);
              setForm((f) => ({ ...f, questions: [...f.questions, q._id] }));
            }}
            onUpdate={(q) => setCustoms((c) => c.map((x) => (x._id === q._id ? q : x)))}
            onRemove={(id) => {
              setCustoms((c) => c.filter((x) => x._id !== id));
              setForm((f) => ({ ...f, questions: f.questions.filter((x) => x !== id) }));
            }}
          />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption font-semibold text-slate-500">
                6. Chọn câu hỏi cho bài kiểm tra ({form.questions.length} đã chọn)
              </p>
              <select
                value=""
                onChange={(e) => copyFromTest(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600"
              >
                <option value="">+ Thêm câu từ bài kiểm tra có sẵn…</option>
                {tests
                  .filter((t) => t._id !== editingId && (!form.subject || t.subject?._id === form.subject) && (!form.grade || t.grade?._id === form.grade))
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.questionCount} câu)
                    </option>
                  ))}
              </select>
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
                  <span className="ml-2 text-slate-400">Mỗi bài</span>
                  <input
                    type="number"
                    min="1"
                    value={perLessonN}
                    onChange={(e) => setPerLessonN(Math.max(1, Number(e.target.value) || 1))}
                    className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => pickPerLesson(perLessonN)}
                    className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600 hover:bg-primary/10 hover:text-primary"
                  >
                    câu ngẫu nhiên
                  </button>
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
                        <span className="font-normal text-slate-400">({questions.length} câu)</span>
                        <button
                          type="button"
                          onClick={() => pickPerLesson(perLessonN, lesson._id)}
                          className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 hover:bg-primary/10 hover:text-primary"
                        >
                          Lấy ngẫu nhiên {perLessonN} câu
                        </button>
                      </label>
                      <div className="mt-1 ml-6 space-y-1">
                        {questions.map((q, idx) => (
                          <div key={q._id} className="text-sm text-slate-600">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 shrink-0 accent-primary"
                                checked={form.questions.includes(q._id)}
                                onChange={() => toggleQuestion(q._id)}
                              />
                              <span className="flex-1">
                                {idx + 1}. {q.text}
                              </span>
                              <button
                                type="button"
                                title={openDetail[q._id] ? "Thu gọn chi tiết" : "Xem chi tiết câu hỏi"}
                                onClick={() => setOpenDetail((o) => ({ ...o, [q._id]: !o[q._id] }))}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary"
                              >
                                {openDetail[q._id] ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              </button>
                            </div>
                            {openDetail[q._id] && <QuestionDetail q={q} />}
                          </div>
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
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <section key={g.key} className="overflow-clip rounded-2xl bg-white shadow-elevation-1 ring-1 ring-slate-100">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                className="flex w-full items-center gap-2 bg-slate-50 px-4 py-3 text-left"
              >
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", collapsed[g.key] && "-rotate-90")} />
                <span className="flex-1 font-display font-black text-slate-800">{g.title}</span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500">{g.items.length} đề</span>
                <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 sm:inline">
                  {g.items.filter((t) => !t.isActive).length > 0 && `${g.items.filter((t) => !t.isActive).length} nháp`}
                </span>
              </button>
              {!collapsed[g.key] && (
                <div className="divide-y divide-slate-100">
                  <div className="hidden grid-cols-[minmax(0,1fr)_80px_80px_160px_190px] gap-3 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-400 xl:grid">
                    <span>Tên đề · phạm vi</span>
                    <span>Số câu</span>
                    <span>Thời gian</span>
                    <span>Học sinh làm</span>
                    <span className="text-right">Thao tác</span>
                  </div>
                  {g.items.map((test) => {
                    const st = test.adminStats;
                    return (
                      <div key={test._id} className="grid grid-cols-1 items-center gap-x-3 gap-y-1 px-4 py-3 xl:grid-cols-[minmax(0,1fr)_80px_80px_160px_190px]">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
                            <span className="truncate">{test.title}</span>
                            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", test.isActive ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700")}>
                              {test.isActive ? "Đang dùng" : "Nháp"}
                            </span>
                            {test.questionCount < 8 && <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Quá ngắn</span>}
                          </p>
                          <p className="text-xs text-slate-500">
                            {test.chapter?.title || `Học kỳ ${test.semester || 1}`} · {LEVEL_LABEL[test.level]} <IdBadge id={test._id} label="KT" always />
                          </p>
                        </div>
                        <span className={cn("text-sm font-semibold", test.questionCount < 8 ? "text-rose-600" : "text-slate-700")}>{test.questionCount} câu</span>
                        <span className="text-sm text-slate-600">{test.timeLimitSeconds > 0 ? `${Math.round(test.timeLimitSeconds / 60)} phút` : "Tự do"}</span>
                        <span className="text-sm text-slate-600">
                          {st && st.attempts > 0 ? (
                            <>
                              <b>{st.attempts}</b> lượt · TB <b className={st.avgPercent >= 80 ? "text-emerald-600" : st.avgPercent >= 50 ? "text-amber-600" : "text-rose-600"}>{st.avgPercent}%</b>
                            </>
                          ) : (
                            <span className="text-slate-300">Chưa có</span>
                          )}
                        </span>
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" onClick={() => toggleStatus(test)} title={test.isActive ? "Chuyển sang Nháp" : "Đưa vào sử dụng"}>
                            {test.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" onClick={() => handleDuplicate(test)} title="Nhân bản đề (bản sao ở trạng thái Nháp)">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => startEdit(test)} title="Sửa đề">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(test._id)} className="text-red-600 hover:bg-red-50" title="Xoá đề">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
          {tests.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">Không tìm thấy bài kiểm tra phù hợp.</p>
          )}
        </div>
      )}
    </div>
  );
}
