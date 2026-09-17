import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Inbox,
  Lock,
  PlayCircle,
  PenLine,
  Search,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import { gradeService, subjectService, lessonService, chapterService, attemptService, testService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { avatarUrl } from "../../lib/avatar.js";
import { cn } from "../../lib/utils";

const SUBJECT_STYLES = {
  toan: { color: "from-secondary to-blue-600", label: "Toán", emoji: "🔢" },
  "tieng-viet": { color: "from-vietnamese to-orange-600", label: "Tiếng Việt", emoji: "📖" },
};

function Kicker({ children, className }) {
  return <p className={cn("text-[11px] font-bold uppercase tracking-wide text-slate-400", className)}>{children}</p>;
}

function StatBlock({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-display text-lg font-extrabold text-primary">{value}</p>
    </div>
  );
}

export default function LessonListPage() {
  const { gradeSlug, subjectSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grade, setGrade] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subject, setSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [activeSemester, setActiveSemester] = useState(1);
  const [expandedChapterId, setExpandedChapterId] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState(null);
  const [search, setSearch] = useState("");
  const [continueLesson, setContinueLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [statusByLesson, setStatusByLesson] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [gradesRes, subjectsRes] = await Promise.all([gradeService.list(), subjectService.list()]);
      const foundGrade = gradesRes.data.find((g) => g.slug === gradeSlug);
      const foundSubject = subjectsRes.data.find((s) => s.slug === subjectSlug);
      if (cancelled) return;
      setGrade(foundGrade || null);
      setGrades(gradesRes.data);
      setSubject(foundSubject || null);
      setSubjects(subjectsRes.data);
      if (foundGrade && foundSubject) {
        const [chaptersRes, lessonsRes, testsRes] = await Promise.all([
          chapterService.list({ grade: foundGrade._id, subject: foundSubject._id }),
          lessonService.list({ grade: foundGrade._id, subject: foundSubject._id }),
          testService.list({ grade: foundGrade._id, subject: foundSubject._id }).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setChapters(chaptersRes.data);
        setLessons(lessonsRes.data);
        setTests(testsRes.data);
        const firstSemester = chaptersRes.data[0]?.semester || 1;
        setActiveSemester(firstSemester);
        setExpandedChapterId(chaptersRes.data.find((c) => (c.semester || 1) === firstSemester)?._id || null);

        if (user) {
          try {
            const [historyRes, completedRes] = await Promise.all([
              attemptService.myHistory(),
              attemptService.completedLessons(),
            ]);
            const lessonIds = new Set(lessonsRes.data.map((l) => l._id));
            const recent = historyRes.data.find((a) => a.lesson && lessonIds.has(a.lesson._id));
            if (!cancelled && recent) setContinueLesson(recent.lesson);
            if (!cancelled) setCompletedLessonIds(new Set(completedRes.data));
          } catch {
            // ignore — continue-learning card and progress tracking are nice-to-haves
          }
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [gradeSlug, subjectSlug, user]);

  useEffect(() => {
    if (!user || !expandedChapterId) return;
    let cancelled = false;
    attemptService
      .lessonStatus(expandedChapterId)
      .then((res) => {
        if (cancelled) return;
        setStatusByLesson((prev) => new Map([...prev, ...res.data.map((s) => [s.lesson, s.status])]));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [expandedChapterId, user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ background: "linear-gradient(180deg,#2f97e8 0%,#4aa9ee 22%,#5bb4f0 45%,#6fbdf2 100%)" }}>
      {/* Decorative clouds scattered across the whole blue canvas */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-6 top-10 h-20 w-40 rounded-full bg-white/80 blur-[1px]" />
        <span className="absolute left-24 top-4 h-12 w-24 rounded-full bg-white/70 blur-[1px]" />
        <span className="absolute right-10 top-16 h-16 w-32 rounded-full bg-white/60 blur-[1px]" />
        <span className="absolute -right-8 top-[420px] h-24 w-44 rounded-full bg-white/25 blur-[1px]" />
        <span className="absolute left-6 top-[520px] h-16 w-28 rounded-full bg-white/20 blur-[1px]" />
        <span className="absolute right-1/4 top-[900px] h-20 w-36 rounded-full bg-white/15 blur-[1px]" />
      </div>

      {/* ===== Hero: "Hôm nay bạn muốn học gì?" ===== */}
      <div className="relative pb-10 pt-16 md:pt-20">
        <div className="relative mx-auto max-w-6xl px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-1.5 text-caption font-semibold text-primary shadow-elevation-2">
            Vào học
          </span>
          <h1 className="mt-4 font-display text-h1 leading-[1.1] text-white [text-shadow:0_2px_0_rgba(11,35,64,0.15)]">
            Hôm nay bạn muốn học gì?
          </h1>
          <p className="mt-2 text-body-lg font-semibold text-white/85">
            {grade?.name || "Chọn lớp"} · Chọn môn học em muốn luyện tập
          </p>

          {/* Subject cards */}
          <div className="mt-6 flex flex-wrap gap-3">
            {subjects.map((s) => {
              const style = SUBJECT_STYLES[s.slug] || { color: "from-primary to-primary-dark", label: s.name, emoji: "📘" };
              const active = s.slug === subjectSlug;
              return (
                <Link
                  key={s._id}
                  to={`/lop/${gradeSlug}/${s.slug}`}
                  className={cn(
                    "flex min-w-[112px] flex-col items-center gap-2.5 rounded-3xl bg-white px-5 py-4 shadow-elevation-3 transition hover:-translate-y-1",
                    active ? "ring-[3px] ring-primary" : "ring-1 ring-slate-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-elevation-2",
                      style.color
                    )}
                  >
                    {style.emoji}
                  </span>
                  <span className={cn("whitespace-nowrap text-sm font-display font-extrabold", active ? "text-primary" : "text-slate-700")}>
                    {style.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Suggestion cards */}
          <p className="mt-9 text-caption font-bold uppercase tracking-wider text-white/80">ViToan gợi ý cho bạn</p>
          <div className="mt-2.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {continueLesson ? (
              <Link
                to={`/bai/${continueLesson._id}`}
                className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-elevation-3 ring-1 ring-slate-100 transition hover:-translate-y-1"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-3xl shadow-elevation-2">
                  🚀
                </span>
                <div className="flex-1 min-w-0">
                  <Kicker>Đang học dở</Kicker>
                  <p className="truncate font-display font-bold text-slate-800">{continueLesson.title}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-elevation-1 transition group-hover:bg-primary-dark">
                  Tiếp tục học
                </span>
              </Link>
            ) : (
              <Link
                to={`/lop/${gradeSlug}/${subjectSlug}#chu-de`}
                className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-elevation-3 ring-1 ring-slate-100 transition hover:-translate-y-1"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-3xl shadow-elevation-2">
                  🚀
                </span>
                <div className="flex-1">
                  <p className="font-display font-bold text-slate-800">Bắt đầu chủ đề đầu tiên</p>
                  <p className="text-caption text-slate-400">Khởi động hành trình luyện tập của em</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            )}

            <Link
              to="/lich-su"
              className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-elevation-3 ring-1 ring-slate-100 transition hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary-dark text-3xl shadow-elevation-2">
                📊
              </span>
              <div className="flex-1">
                <p className="font-display font-bold text-slate-800">Báo cáo học tập</p>
                <p className="text-caption text-slate-400">Xem tổng quan năng lực của em</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-secondary" />
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Topics: sidebar + detail panel ===== */}
      <div id="chu-de" className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-2 pb-16">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-h3 text-white [text-shadow:0_2px_0_rgba(11,35,64,0.15)]">Toàn bộ chủ đề</h2>
            <select
              value={gradeSlug}
              onChange={(e) => navigate(`/lop/${e.target.value}/${subjectSlug}`)}
              className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-elevation-2 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {grades.map((g) => (
                <option key={g._id} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          {(() => {
            const filteredChapters = chapters
              .filter((c) => (c.semester || 1) === activeSemester)
              .filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()));
            const activeChapter =
              filteredChapters.find((c) => c._id === expandedChapterId) || filteredChapters[0] || null;
            const chapterLessons = activeChapter ? lessons.filter((l) => l.chapter === activeChapter._id) : [];
            const chapterTests = activeChapter
              ? tests.filter((t) => t.chapter?._id === activeChapter._id || t.chapter === activeChapter._id)
              : [];
            const semesterMidterm = tests.find((t) => t.testType === "midterm" && (t.semester || 1) === activeSemester);
            const semesterFinal = tests.find((t) => t.testType === "final" && (t.semester || 1) === activeSemester);
            const completedCount = chapterLessons.filter((l) => completedLessonIds.has(l._id)).length;
            const needsPracticeCount = user
              ? chapterLessons.filter((l) => !completedLessonIds.has(l._id) && statusByLesson.get(l._id) !== "locked").length
              : 0;

            if (chapters.length === 0) {
              return (
                <div className="flex flex-col items-center rounded-3xl bg-white p-10 text-center shadow-elevation-1 ring-1 ring-slate-100/80">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Inbox className="h-7 w-7" />
                  </span>
                  <p className="mt-4 text-body text-slate-500">Chưa có bài học nào cho lớp/môn này.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[360px_1fr]">
                {/* ── LEFT: sidebar ── */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-elevation-2 ring-1 ring-slate-100">
                  <div className="grid grid-cols-2">
                    {[1, 2].map((sem) => (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setActiveSemester(sem)}
                        className={cn(
                          "py-3.5 text-sm font-display font-bold transition",
                          activeSemester === sem ? "bg-white text-slate-800" : "bg-secondary/10 text-secondary/70 hover:text-secondary"
                        )}
                      >
                        Học kỳ {sem}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 pb-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm nhanh kỹ năng..."
                        className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                    </div>
                  </div>

                  {filteredChapters.length === 0 ? (
                    <p className="px-4 pb-5 pt-2 text-sm text-slate-400">Không tìm thấy chủ đề phù hợp.</p>
                  ) : (
                    <div className="max-h-[560px] overflow-y-auto px-4 pb-3">
                      {filteredChapters.map((chapter, i) => {
                        const selected = !selectedTestType && activeChapter?._id === chapter._id;
                        const cLessons = lessons.filter((l) => l.chapter === chapter._id);
                        const cTests = tests.filter((t) => t.chapter?._id === chapter._id || t.chapter === chapter._id);
                        return (
                          <button
                            key={chapter._id}
                            type="button"
                            onClick={() => {
                              setExpandedChapterId(chapter._id);
                              setSelectedTestType(null);
                            }}
                            className="flex w-full gap-3 text-left"
                          >
                            <div className="flex flex-col items-center pt-2.5">
                              <span
                                className={cn(
                                  "h-3 w-3 shrink-0 rounded-full border-2 transition",
                                  selected ? "border-secondary bg-secondary" : "border-slate-300 bg-white"
                                )}
                              />
                              <span className="mt-1 w-0.5 flex-1 bg-slate-200" />
                            </div>
                            <div
                              className={cn(
                                "mb-3 flex-1 rounded-xl px-3 py-2.5 transition",
                                selected ? "bg-secondary/10" : "hover:bg-slate-50"
                              )}
                            >
                              <p className={cn("font-display text-sm font-bold", selected ? "text-secondary" : "text-slate-700")}>
                                {chapter.title}
                              </p>
                              <p className="mt-0.5 text-[12px] text-slate-400">
                                {cLessons.length} chủ điểm
                                {cTests.length > 0 && ` • ${cTests.length} bài kiểm tra`}
                              </p>
                            </div>
                          </button>
                        );
                      })}

                      {[
                        { type: "midterm", label: "Kiểm tra giữa kỳ", test: semesterMidterm },
                        { type: "final", label: "Kiểm tra cuối kỳ", test: semesterFinal },
                      ].map(({ type, label, test }, i, arr) => {
                        const selected = selectedTestType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedTestType(type)}
                            className="flex w-full gap-3 text-left"
                          >
                            <div className="flex flex-col items-center pt-2">
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white transition",
                                  selected ? "bg-vietnamese" : "bg-slate-300"
                                )}
                              >
                                <ClipboardCheck className="h-3 w-3" />
                              </span>
                              {i < arr.length - 1 && <span className="mt-1 w-0.5 flex-1 bg-slate-200" />}
                            </div>
                            <div
                              className={cn(
                                "mb-3 flex-1 rounded-xl px-3 py-2.5 transition",
                                selected ? "bg-vietnamese/10" : "hover:bg-slate-50"
                              )}
                            >
                              <p className={cn("font-display text-sm font-bold", selected ? "text-vietnamese" : "text-slate-700")}>
                                {label}
                              </p>
                              <p className="mt-0.5 text-[12px] text-slate-400">{test ? "Đã có đề kiểm tra" : "Đang cập nhật đề"}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: detail panel ── */}
                <div className="rounded-3xl bg-white p-6 shadow-elevation-2 ring-1 ring-slate-100">
                  {selectedTestType ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vietnamese/15 text-vietnamese">
                        <ClipboardCheck className="h-8 w-8" />
                      </span>
                      <h3 className="mt-4 font-display text-h3 text-slate-800">
                        {selectedTestType === "midterm" ? "Kiểm tra giữa kỳ" : "Kiểm tra cuối kỳ"}
                      </h3>
                      <p className="mt-1 text-body text-slate-500">
                        {(selectedTestType === "midterm" ? semesterMidterm : semesterFinal)
                          ? `Đề tổng hợp kiến thức Học kỳ ${activeSemester}`
                          : "Đề kiểm tra đang được chuẩn bị, quay lại sau nhé!"}
                      </p>
                      {(selectedTestType === "midterm" ? semesterMidterm : semesterFinal) && (
                        <Link
                          to={`/kiem-tra/${(selectedTestType === "midterm" ? semesterMidterm : semesterFinal)._id}`}
                          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-vietnamese px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                          <ClipboardCheck className="h-4 w-4" /> Bắt đầu làm bài
                        </Link>
                      )}
                    </div>
                  ) : !activeChapter ? (
                    <p className="py-10 text-center text-sm text-slate-400">Chọn một chủ đề bên trái để xem chi tiết.</p>
                  ) : (
                    <>
                      <div className="mb-5 flex items-center gap-3 border-b border-dashed border-slate-200 pb-4">
                        <span className="text-2xl">🎯</span>
                        <h3 className="font-display text-h3 text-slate-800">{activeChapter.title}</h3>
                      </div>

                      <div className="mb-6 flex flex-wrap gap-8">
                        <StatBlock label="Chủ điểm" value={`${completedCount}/${chapterLessons.length}`} />
                        <StatBlock label="Kiểm tra" value={`0/${chapterTests.length}`} />
                        {user && <StatBlock label="Cần luyện tập" value={needsPracticeCount} />}
                      </div>

                      <div className="space-y-3">
                        {chapterLessons.map((lesson, idx) => {
                          const guestLocked = !user && !lesson.isTrial;
                          const locked = guestLocked;
                          const completed = completedLessonIds.has(lesson._id);
                          return (
                            <div
                              key={lesson._id}
                              className="flex items-center gap-4 rounded-2xl border border-slate-100 p-3.5 transition hover:border-slate-200"
                            >
                              <span className="relative shrink-0">
                                <img
                                  src={avatarUrl(lesson._id, idx)}
                                  alt=""
                                  className="h-16 w-16 rounded-full object-cover shadow-elevation-1 ring-4 ring-white"
                                  loading="lazy"
                                />
                                {(locked || completed) && (
                                  <span
                                    className={cn(
                                      "absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-elevation-1 ring-2 ring-white",
                                      locked ? "bg-slate-400" : "bg-primary"
                                    )}
                                  >
                                    {locked ? <Lock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-elevation-1",
                                    lesson.isTrial ? "bg-secondary" : "bg-vietnamese"
                                  )}
                                >
                                  {lesson.isTrial ? "Miễn phí" : "Trả phí"}
                                </span>
                              </span>
                              <div className="min-w-0 flex-1">
                                <Kicker>CHỦ ĐIỂM</Kicker>
                                <p className={cn("truncate font-display font-bold", locked ? "text-slate-500" : "text-slate-800")}>
                                  {lesson.title}
                                </p>
                                {!locked ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Link
                                      to={`/bai/${lesson._id}`}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-primary-dark"
                                    >
                                      <PlayCircle className="h-3.5 w-3.5" /> Xem lý thuyết
                                    </Link>
                                    <Link
                                      to={`/bai/${lesson._id}/luyen-tap`}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                                    >
                                      <PenLine className="h-3.5 w-3.5" /> Thực hành
                                    </Link>
                                  </div>
                                ) : (
                                  <Link
                                    to={guestLocked ? "/dang-nhap" : "#"}
                                    onClick={(e) => !guestLocked && e.preventDefault()}
                                    className="mt-1.5 flex items-center gap-1.5 text-caption font-semibold text-slate-400"
                                  >
                                    <Lock className="h-3.5 w-3.5" />
                                    {guestLocked ? "Đăng nhập miễn phí để mở bài học này" : "Hoàn thành chủ điểm trước để mở khoá"}
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {chapterTests.length > 0 ? (
                        <div className="mt-4 space-y-2.5">
                          {chapterTests.map((test) => (
                            <Link
                              key={test._id}
                              to={`/kiem-tra/${test._id}`}
                              className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-vietnamese/40 bg-vietnamese/5 p-4 transition hover:bg-vietnamese/10"
                            >
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vietnamese/15 text-vietnamese">
                                <ClipboardCheck className="h-5 w-5" />
                              </span>
                              <div className="flex-1">
                                <Kicker>BÀI KIỂM TRA</Kicker>
                                <p className="font-display font-bold text-slate-800">{test.title}</p>
                              </div>
                              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        user &&
                        chapterLessons.length > 0 && (
                          <Link
                            to={completedCount === chapterLessons.length ? `/kiem-tra?chapter=${activeChapter._id}` : "#"}
                            onClick={(e) => completedCount < chapterLessons.length && e.preventDefault()}
                            className={cn(
                              "mt-4 flex items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition",
                              completedCount === chapterLessons.length
                                ? "border-vietnamese/40 bg-vietnamese/5 hover:bg-vietnamese/10"
                                : "cursor-not-allowed border-slate-200 opacity-60"
                            )}
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vietnamese/15 text-vietnamese">
                              <ClipboardCheck className="h-5 w-5" />
                            </span>
                            <div className="flex-1">
                              <p className="font-display font-bold text-slate-800">Kiểm tra chủ đề</p>
                              <p className="text-caption text-slate-500">
                                {completedCount === chapterLessons.length
                                  ? "Đánh giá mức độ nắm kiến thức của chủ đề này"
                                  : "Hoàn thành hết chủ điểm trong chương để mở bài kiểm tra"}
                              </p>
                            </div>
                          </Link>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Floating mascot helper */}
      <div className="fixed bottom-5 right-5 z-40 hidden sm:block">
        <div className="group relative">
          <div className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-2xl rounded-br-sm bg-slate-800 px-3.5 py-2 text-caption font-semibold text-white opacity-0 shadow-elevation-2 transition group-hover:opacity-100">
            Cố lên nhé, em làm được! 🎉
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-elevation-3 ring-2 ring-primary-light/60 transition hover:-translate-y-1">
            <OwlMascot className="h-14 w-14" />
          </span>
        </div>
      </div>
    </div>
  );
}
