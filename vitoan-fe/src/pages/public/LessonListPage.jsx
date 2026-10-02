import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Lock,
  PlayCircle,
  PenLine,
  Search,
  CheckCircle2,
  CircleDashed,
  Trophy,
} from "../../components/ui/icons.jsx";
import { gradeService, subjectService, lessonService, chapterService, attemptService, testService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import IdBadge from "../../components/common/IdBadge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import LessonAvatar from "../../components/common/LessonAvatar.jsx";
import { cn } from "../../lib/utils";
import { Img3D } from "../../lib/icons3d.jsx";

const SUBJECT_STYLES = {
  toan: {
    label: "Toán",
    icon: "numbers",
    art: "abacus",
    hero: "linear-gradient(120deg,#d4ecff 0%,#dfe3ff 55%,#ece0ff 100%)",
    active: "from-sky-400 to-blue-500",
    text: "text-blue-600",
    soft: "bg-sky-50",
    ring: "ring-sky-300",
  },
  "tieng-viet": {
    label: "Tiếng Việt",
    icon: "letters",
    art: "openBook",
    hero: "linear-gradient(120deg,#ffeccc 0%,#ffe2d6 55%,#ffdcea 100%)",
    active: "from-amber-400 to-orange-500",
    text: "text-orange-600",
    soft: "bg-orange-50",
    ring: "ring-orange-300",
  },
};
const PASS_PERCENT = 80;

// Trạng thái + % đã học của 1 bài (xem video, đọc lý thuyết, luyện tập).
function LessonStatusPill({ status, learnPercent = 0 }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Đã học
      </span>
    );
  }
  if (status === "learning") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
        <CircleDashed className="h-3.5 w-3.5" /> Đang học · {learnPercent}%
        <span className="h-1.5 w-12 overflow-clip rounded-full bg-amber-200">
          <span className="block h-full rounded-full bg-amber-500" style={{ width: `${learnPercent}%` }} />
        </span>
      </span>
    );
  }
  return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">Chưa học</span>;
}

// Bộ nhớ đệm theo lớp/môn — chuyển qua lại giữa Tiếng Việt và Toán không phải chờ tải lại.
const PAGE_CACHE = new Map();
let GRADES_SUBJECTS = null;

async function fetchPageData({ gradeSlug, subjectSlug, isStudent }) {
  if (!GRADES_SUBJECTS) {
    const [gradesRes, subjectsRes] = await Promise.all([gradeService.list(), subjectService.list()]);
    GRADES_SUBJECTS = { grades: gradesRes.data, subjects: subjectsRes.data };
  }
  const { grades, subjects } = GRADES_SUBJECTS;
  const grade = grades.find((g) => g.slug === gradeSlug) || null;
  const subject = subjects.find((s) => s.slug === subjectSlug);
  const data = { grade, grades, subjects, chapters: [], lessons: [], tests: [], continueItem: null, completedLessonIds: new Set() };
  if (!grade || !subject) return data;

  const [chaptersRes, lessonsRes, testsRes] = await Promise.all([
    chapterService.list({ grade: grade._id, subject: subject._id }),
    lessonService.list({ grade: grade._id, subject: subject._id }),
    testService.list({ grade: grade._id, subject: subject._id }).catch(() => ({ data: [] })),
  ]);
  data.chapters = chaptersRes.data;
  data.lessons = lessonsRes.data;
  data.tests = testsRes.data;

  if (isStudent) {
    try {
      const lessonIds = new Set(lessonsRes.data.map((l) => l._id));
      const [progressRes, historyRes, completedRes] = await Promise.all([
        attemptService.myProgressList(),
        attemptService.myHistory(),
        attemptService.completedLessons(),
      ]);
      // Ưu tiên bài luyện tập đang làm dở (có lộ trình lưu), sau đó mới tới bài vừa làm gần nhất.
      const inProgress = progressRes.data.find((p) => lessonIds.has(p.lesson?._id));
      const recent = historyRes.data.find((a) => a.lesson && lessonIds.has(a.lesson._id));
      if (inProgress) {
        data.continueItem = {
          title: inProgress.lesson.title,
          sub: `Đang làm dở ${inProgress.answered}/${inProgress.total} câu`,
          to: inProgress.practiceSet ? `/luyen-tap/${inProgress.practiceSet._id}` : `/bai/${inProgress.lesson._id}/luyen-tap`,
        };
      } else if (recent) {
        data.continueItem = { title: recent.lesson.title, sub: "Bài học gần nhất", to: `/bai/${recent.lesson._id}` };
      }
      data.completedLessonIds = new Set(completedRes.data);
    } catch {
      // phần gợi ý & tiến độ là phụ — lỗi thì bỏ qua
    }
  }
  return data;
}

export default function LessonListPage() {
  const { gradeSlug, subjectSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const chapterParam = searchParams.get("chu-de");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === "Student";
  const [grade, setGrade] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [activeSemester, setActiveSemester] = useState(1);
  const [search, setSearch] = useState("");
  const [continueItem, setContinueItem] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [statusByLesson, setStatusByLesson] = useState(new Map());
  const [loading, setLoading] = useState(true);
  // stale = đang hiện dữ liệu của môn/lớp trước trong lúc chờ môn mới (làm mờ nhẹ, không nháy trang).
  const [stale, setStale] = useState(false);

  // Đổi môn / lớp: KHÔNG thay cả trang bằng vòng xoay — giữ nội dung đang xem, hiện ngay dữ liệu
  // đã có trong bộ nhớ (nếu từng mở) rồi làm mới lặng lẽ phía sau.
  function apply(data) {
    setGrade(data.grade);
    setGrades(data.grades);
    setSubjects(data.subjects);
    setChapters(data.chapters);
    setLessons(data.lessons);
    setTests(data.tests);
    setContinueItem(data.continueItem);
    setCompletedLessonIds(data.completedLessonIds);
  }

  useEffect(() => {
    let cancelled = false;
    const key = `${gradeSlug}/${subjectSlug}/${isStudent ? user?.id || user?._id : "guest"}`;
    const cached = PAGE_CACHE.get(key);
    if (cached) {
      apply(cached);
      setLoading(false);
    } else if (!grades.length) {
      setLoading(true);
    }
    setStale(!cached);
    fetchPageData({ gradeSlug, subjectSlug, isStudent })
      .then((data) => {
        if (cancelled) return;
        PAGE_CACHE.set(key, data);
        apply(data);
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setStale(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeSlug, subjectSlug, isStudent]);

  // Chủ đề đang chọn lấy từ URL (?chu-de=) để nút "quay lại" từ bài học/kiểm tra về đúng chủ đề.
  const activeChapter = useMemo(() => {
    const fromParam = chapters.find((c) => c._id === chapterParam);
    if (fromParam) return fromParam;
    return chapters.find((c) => (c.semester || 1) === activeSemester) || chapters[0] || null;
  }, [chapters, chapterParam, activeSemester]);

  useEffect(() => {
    if (activeChapter) setActiveSemester(activeChapter.semester || 1);
  }, [activeChapter]);

  useEffect(() => {
    if (!isStudent || !activeChapter) return;
    let cancelled = false;
    attemptService
      .lessonStatus(activeChapter._id)
      .then((res) => {
        if (cancelled) return;
        setStatusByLesson((prev) => new Map([...prev, ...res.data.map((s) => [s.lesson, s])]));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeChapter, isStudent]);

  function selectChapter(id) {
    setSearchParams({ "chu-de": id }, { replace: true });
  }

  function selectSemester(sem) {
    setActiveSemester(sem);
    const first = chapters.find((c) => (c.semester || 1) === sem);
    if (first) selectChapter(first._id);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const filteredChapters = chapters
    .filter((c) => (c.semester || 1) === activeSemester)
    .filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()));
  const chapterLessons = activeChapter ? lessons.filter((l) => l.chapter === activeChapter._id) : [];
  const chapterTests = activeChapter
    ? tests.filter((t) => t.chapter?._id === activeChapter._id || t.chapter === activeChapter._id)
    : [];
  const completedCount = chapterLessons.filter((l) => completedLessonIds.has(l._id)).length;
  const subjectUi = SUBJECT_STYLES[subjectSlug] || SUBJECT_STYLES.toan;
  const testsDone = chapterTests.filter((t) => t.attemptCount > 0).length;
  const semesterTests = [
    { type: "midterm", label: "Kiểm tra giữa kỳ" },
    { type: "final", label: "Kiểm tra cuối kỳ" },
  ]
    .map((x) => ({ ...x, test: tests.find((t) => t.testType === x.type && (t.semester || 1) === activeSemester) }))
    .filter((x) => x.test);

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 px-4 pb-10 pt-5">
        {/* ===== Đầu trang theo môn: lớp + đổi lớp, chuyển môn, tiến độ cả môn, hình 3D lớn ===== */}
        <section className="relative overflow-clip rounded-[2rem] px-6 py-6 sm:px-8" style={{ background: subjectUi.hero }}>
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/45 blur-2xl" />
          <div className="relative flex flex-wrap items-center gap-x-8 gap-y-5">
            <div className="min-w-[15rem] flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-black text-[#0b2340] sm:text-5xl">{grade?.name || "Chọn lớp"}</h1>
                <select
                  value={gradeSlug}
                  onChange={(e) => navigate(`/lop/${e.target.value}/${subjectSlug}`)}
                  className="cursor-pointer rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Đổi lớp"
                >
                  {grades.map((g) => (
                    <option key={g._id} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 inline-flex rounded-full bg-white/70 p-1.5 shadow-sm backdrop-blur">
                {subjects.map((s) => {
                  const st = SUBJECT_STYLES[s.slug] || { label: s.name, icon: "books", active: "from-primary to-emerald-500" };
                  const active = s.slug === subjectSlug;
                  return (
                    <Link
                      key={s._id}
                      to={`/lop/${gradeSlug}/${s.slug}`}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-5 py-2 font-display text-base font-black transition",
                        active ? cn("bg-gradient-to-r text-white shadow-md", st.active) : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <Img3D name={st.icon} className="h-6 w-6" /> {st.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            {isStudent && lessons.length > 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/85 px-5 py-3 shadow-sm backdrop-blur">
                <Img3D name="trophy" className="h-10 w-10" />
                <div>
                  <p className="font-display text-2xl font-black text-[#0b2340]">
                    {lessons.filter((l) => completedLessonIds.has(l._id)).length}/{lessons.length}
                  </p>
                  <p className="text-sm font-bold text-slate-500">bài đã học cả môn</p>
                </div>
              </div>
            )}
            <div className="relative hidden h-28 w-28 shrink-0 sm:block">
              <span aria-hidden className="absolute inset-2 rounded-full bg-white/60 blur-md" />
              <Img3D name={subjectUi.art || "books"} className="relative h-full w-full animate-[float-soft_4s_ease-in-out_infinite] drop-shadow-[0_10px_14px_rgba(11,35,64,0.18)]" />
            </div>
          </div>
        </section>

        <div className={cn("transition-opacity duration-200", stale && "pointer-events-none opacity-50")} aria-busy={stale}>
        {/* ===== Gợi ý: tiếp tục học + báo cáo ===== */}
        {isStudent && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to={continueItem?.to || (activeChapter ? `/lop/${gradeSlug}/${subjectSlug}?chu-de=${activeChapter._id}` : "#")}
              className="group flex items-center gap-4 rounded-[1.5rem] bg-gradient-to-r from-primary to-emerald-500 p-4 text-white shadow-[0_14px_30px_-16px_rgba(0,177,79,0.8)] transition hover:-translate-y-0.5"
            >
              <Img3D name="rocket" className="h-14 w-14 shrink-0 transition group-hover:-translate-y-1 group-hover:rotate-6" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide text-white/80">{continueItem ? continueItem.sub : "Bắt đầu học"}</p>
                <p className="truncate font-display text-lg font-black">
                  {continueItem ? continueItem.title : "Chọn một bài học bên dưới"}
                </p>
              </div>
              {continueItem && (
                <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-primary shadow">
                  Tiếp tục
                </span>
              )}
            </Link>
            <Link
              to="/thong-ke"
              className="group flex items-center gap-4 rounded-[1.5rem] bg-white p-4 shadow-elevation-2 transition hover:-translate-y-0.5"
            >
              <Img3D name="chart" className="h-14 w-14 shrink-0 transition group-hover:scale-110" />
              <div className="flex-1">
                <p className="font-display text-lg font-black text-[#0b2340]">Báo cáo học tập</p>
                <p className="text-caption text-slate-400">Xem phần kiến thức em hay sai</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-secondary" />
            </Link>
          </div>
        )}

        {chapters.length === 0 ? (
          <div className="mt-5 flex flex-col items-center rounded-[1.75rem] bg-white p-10 text-center shadow-elevation-1">
            <Img3D name="hourglassRun" className="h-20 w-20" />
            <p className="mt-3 font-display text-xl font-black text-[#0b2340]">Bài học đang được chuẩn bị</p>
            <p className="mt-1 font-semibold text-slate-500">Lớp/môn này chưa có bài học — em quay lại sau nhé!</p>
          </div>
        ) : (
          <div id="chu-de" className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* ── Cột trái: danh sách chủ đề ── */}
            <div className="overflow-clip rounded-[1.75rem] bg-white shadow-elevation-2 lg:sticky lg:top-24">
              <div className="m-3 mb-0 grid grid-cols-2 rounded-full bg-slate-100 p-1">
                {[1, 2].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => selectSemester(sem)}
                    className={cn(
                      "rounded-full py-2 font-display text-base font-black transition",
                      activeSemester === sem ? "bg-white text-[#0b2340] shadow" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    Học kỳ {sem}
                  </button>
                ))}
              </div>
              <div className="px-3 pt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm chủ đề..."
                    className="w-full rounded-full bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              {filteredChapters.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-400">Không tìm thấy chủ đề phù hợp.</p>
              ) : (
                <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-3">
                  {filteredChapters.map((chapter, ci) => {
                    const selected = activeChapter?._id === chapter._id;
                    const cLessons = lessons.filter((l) => l.chapter === chapter._id);
                    const cDone = cLessons.filter((l) => completedLessonIds.has(l._id)).length;
                    const cFinished = cLessons.length > 0 && cDone >= cLessons.length;
                    return (
                      <button
                        key={chapter._id}
                        type="button"
                        onClick={() => selectChapter(chapter._id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                          selected ? cn(subjectUi.soft, "ring-2", subjectUi.ring) : "hover:bg-slate-50"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-base font-black",
                            cFinished ? "bg-green-100" : selected ? cn("bg-gradient-to-br text-white shadow", subjectUi.active) : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {cFinished ? <Img3D name="check" className="h-6 w-6" /> : ci + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block font-display text-[16px] font-black leading-snug", selected ? subjectUi.text : "text-slate-700")}>
                            {chapter.title}
                          </span>
                          <span className="mt-1 flex items-center gap-2">
                            <span className="h-1.5 flex-1 overflow-clip rounded-full bg-slate-100">
                              <span
                                className="block h-full rounded-full bg-gradient-to-r from-primary to-lime-400"
                                style={{ width: `${cLessons.length ? (cDone / cLessons.length) * 100 : 0}%` }}
                              />
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {cDone}/{cLessons.length}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Kiểm tra giữa kỳ / cuối kỳ của học kỳ đang chọn — chỉ hiện đề đã có */}
              {semesterTests.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-100 p-3">
                  {semesterTests.map(({ type, label, test }) => (
                    <Link
                      key={type}
                      to={`/kiem-tra/${test._id}`}
                      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-50 to-pink-50 px-3.5 py-2.5 transition hover:-translate-y-0.5"
                    >
                      <Img3D name="clipboard" className="h-8 w-8 shrink-0" />
                      <span className="flex-1 font-display text-base font-black text-slate-700">{label}</span>
                      {test.attemptCount > 0 && (
                        <span className="text-xs font-semibold text-slate-400">
                          {test.bestScore}/{test.questionCount}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Cột phải: bài học của chủ đề ── */}
            <div className="rounded-[1.75rem] bg-white p-4 shadow-elevation-2 sm:p-6">
              {!activeChapter ? (
                <p className="py-10 text-center text-sm text-slate-400">Chọn một chủ đề bên trái để xem chi tiết.</p>
              ) : (
                <>
                  <div className={cn("flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] px-5 py-4", subjectUi.soft)}>
                    <div className="flex min-w-0 items-center gap-4">
                      <Img3D name={subjectUi.icon || "books"} className="h-14 w-14 shrink-0" />
                      <div className="min-w-0">
                        <h2 className="font-display text-2xl font-black leading-tight text-[#0b2340] sm:text-3xl">{activeChapter.title}</h2>
                        <IdBadge id={activeChapter._id} label="Chủ đề" className="mt-1" />
                      </div>
                    </div>
                    <div className="flex gap-3 text-center">
                      <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
                        <p className="text-xs font-black uppercase text-slate-400">Đã học</p>
                        <p className="font-display text-xl font-black text-primary">
                          {completedCount}/{chapterLessons.length}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
                        <p className="text-xs font-black uppercase text-slate-400">Kiểm tra</p>
                        <p className="font-display text-xl font-black text-violet-500">
                          {testsDone}/{chapterTests.length}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isStudent && (
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      Bài học được đánh dấu <b className="text-green-600">Đã học</b> khi em đạt từ {PASS_PERCENT}% bài luyện tập trở lên.
                    </p>
                  )}

                  <div className="mt-4 space-y-2.5">
                    {chapterLessons.map((lesson, idx) => {
                      const locked = !user && !lesson.isTrial;
                      const st = statusByLesson.get(lesson._id);
                      const completed = completedLessonIds.has(lesson._id);
                      return (
                        <div
                          key={lesson._id}
                          className={cn(
                            "group flex items-center gap-4 rounded-[1.25rem] p-3 transition hover:-translate-y-0.5",
                            completed ? "bg-gradient-to-r from-green-50 to-lime-50 ring-1 ring-green-200" : "bg-white ring-1 ring-slate-100 hover:shadow-elevation-1 hover:ring-slate-200"
                          )}
                        >
                          <Link to={locked ? "/dang-nhap" : `/bai/${lesson._id}`} className="relative shrink-0">
                            <LessonAvatar seed={lesson._id} idx={idx} number={idx + 1} className="h-14 w-14" />
                            {(locked || completed) && (
                              <span
                                className={cn(
                                  "absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-white ring-2 ring-white",
                                  locked ? "bg-slate-400" : "bg-green-500"
                                )}
                              >
                                {locked ? <Lock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              </span>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={locked ? "/dang-nhap" : `/bai/${lesson._id}`}
                              className={cn(
                                "block truncate font-display text-lg font-black hover:text-primary",
                                locked ? "text-slate-500" : "text-[#0b2340]"
                              )}
                            >
                              {lesson.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {isStudent && <LessonStatusPill status={st?.status} learnPercent={st?.learnPercent} />}
                              {!user && lesson.isTrial && (
                                <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">Học thử miễn phí</span>
                              )}
                              {locked && <span className="text-xs font-semibold text-slate-400">Đăng nhập để mở bài học</span>}
                              <IdBadge id={lesson._id} label="Bài" />
                            </div>
                          </div>
                          {!locked && (
                            <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                              <Link
                                to={`/bai/${lesson._id}`}
                                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-black text-white shadow-[0_3px_0_0_#049245] transition hover:-translate-y-0.5"
                              >
                                <PlayCircle className="h-5 w-5" /> Học
                              </Link>
                              <Link
                                to={`/bai/${lesson._id}/luyen-tap`}
                                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-200"
                              >
                                <PenLine className="h-5 w-5" /> Luyện tập
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {chapterTests.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {chapterTests.map((test) => (
                        <Link
                          key={test._id}
                          to={`/kiem-tra/${test._id}`}
                          className="group flex items-center gap-4 rounded-[1.25rem] bg-gradient-to-r from-violet-100 via-fuchsia-50 to-pink-100 p-4 transition hover:-translate-y-0.5"
                        >
                          <Img3D name="clipboard" className="h-14 w-14 shrink-0 transition group-hover:rotate-6" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bài kiểm tra chủ đề</p>
                            <p className="truncate font-display text-lg font-black text-[#0b2340]">{test.title}</p>
                            {test.attemptCount > 0 && (
                              <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <Trophy className="h-3.5 w-3.5 text-amber-500" /> Cao nhất {test.bestScore}/{test.questionCount} · đã làm{" "}
                                {test.attemptCount} lần
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-black text-white shadow-md">
                            {test.attemptCount > 0 ? "Làm lại" : "Làm bài"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
