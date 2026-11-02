import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Volume2,
  Clock,
  Minus,
  Plus,
  ClipboardCheck,
  PlayCircle,
  HelpCircle,
  Trophy,
  History,
  ThumbsUp,
  ThumbsDown,
  Flag,
} from "../../components/ui/icons.jsx";
import { testService, testAttemptService } from "../../api/services";
import FocusShell from "../../components/layout/FocusShell.jsx";
import TestLockedView from "../../components/quiz/TestLockedView.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import FillBlankPrompt from "../../components/quiz/FillBlankPrompt.jsx";
import QuestionImage from "../../components/quiz/QuestionImage.jsx";
import { speakQuestionText, stopSpeaking, FILL_TYPES } from "../../lib/speech.js";
import { cn, shuffleArray } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const TEST_TYPE_LABEL = { topic: "Kiểm tra chủ đề", midterm: "Kiểm tra giữa kỳ", final: "Kiểm tra cuối kỳ" };
const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

function formatDuration(seconds) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function TestTakingPage() {
  const dialog = useDialog();
  const { refreshUser } = useAuth();
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [history, setHistory] = useState([]);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  // Câu gắn cờ "phân vân": nhớ trong phiên làm bài, lỡ tải lại trang vẫn còn.
  const flagKey = `vitoan_test_flags:${testId}`;
  const [flags, setFlags] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(flagKey)) || {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(flagKey, JSON.stringify(flags));
    } catch {
      // trình duyệt chặn lưu trữ: bỏ qua
    }
  }, [flags, flagKey]);
  // Phím tắt: F = gắn/bỏ cờ câu đang xem
  useEffect(() => {
    if (!started) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        document.getElementById("flag-toggle")?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lock, setLock] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [zoom, setZoom] = useState(100);
  const submittedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([testService.getOne(testId), testAttemptService.myHistory({ test: testId }).catch(() => ({ data: [] }))])
      .then(([testRes, historyRes]) => {
        setTest({ ...testRes.data, questions: shuffleArray(testRes.data.questions) });
        setHistory(historyRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.apiMessage || "Không thể tải bài kiểm tra");
        setLock(err.response?.data?.lock || null);
        setLoading(false);
      });
  }, [testId]);

  useEffect(() => {
    if (!started) return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [started]);

  // Đang làm bài mà lỡ đóng tab/tải lại trang → hỏi lại để tránh mất bài.
  useEffect(() => {
    if (!started) return undefined;
    const warn = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [started]);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setZoom(100), [current]);
  // Không tự đọc câu hỏi — em bấm nút loa khi muốn nghe. Chuyển câu khác thì tắt tiếng ngay.
  useEffect(() => stopSpeaking(), [current]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || !test) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        test: testId,
        durationSeconds: elapsed,
        answers: test.questions.map((q) =>
          q.type === "multi_choice"
            ? { question: q._id, selectedIndexes: Array.isArray(answers[q._id]) ? answers[q._id] : [] }
            : FILL_TYPES.includes(q.type)
            ? { question: q._id, textAnswer: (answers[q._id] || "").trim() }
            : { question: q._id, selectedIndex: answers[q._id] ?? -1 }
        ),
      };
      const res = await testAttemptService.submit(payload);
      try {
        sessionStorage.removeItem(`vitoan_test_flags:${testId}`);
      } catch {
        // bỏ qua
      }
      if (res.pointsEarned > 0) refreshUser?.().catch?.(() => {});
      navigate(`/kiem-tra/ket-qua/${res.data._id}`, { replace: true, state: { newBadges: res.newBadges, pointsEarned: res.pointsEarned, previousBest: res.previousBest } });
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [answers, elapsed, navigate, refreshUser, test, testId]);

  // Hết giờ → tự nộp bài.
  const timeUp = started && test?.timeLimitSeconds > 0 && elapsed >= test.timeLimitSeconds;
  useEffect(() => {
    if (timeUp) handleSubmit();
  }, [timeUp, handleSubmit]);

  if (loading) {
    return (
      <FocusShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Spinner />
        </div>
      </FocusShell>
    );
  }

  if (loadError || !test) {
    return <TestLockedView lock={lock} message={loadError} />;
  }

  const backTo =
    test.chapter && test.grade?.slug && test.subject?.slug
      ? `/lop/${test.grade.slug}/${test.subject.slug}?chu-de=${test.chapter._id}`
      : `/kiem-tra${test.subject?.slug ? `?mon=${test.subject.slug}` : ""}`;
  const subtitle = [
    test.subject?.name,
    test.grade?.name,
    test.chapter?.title || (test.testType !== "topic" ? `Học kỳ ${test.semester || 1}` : null),
  ]
    .filter(Boolean)
    .join(" · ");

  if (test.questions.length === 0) {
    return <TestLockedView message="Bài kiểm tra này chưa có câu hỏi" />;
  }

  // ===== Màn hình bắt đầu: thông tin bài + kết quả các lần làm trước =====
  if (!started) {
    const best = history.reduce((m, a) => Math.max(m, a.score), 0);
    return (
      <div className="page">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </Link>
        <div className="mt-3 overflow-clip rounded-3xl bg-white shadow-elevation-2">
          <div className="relative overflow-clip p-6 sm:p-8" style={{ background: "linear-gradient(120deg,#fff0bf 0%,#ffe3c4 55%,#ffe0e0 100%)" }}>
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
            <Img3D name="clipboard" className="absolute right-6 top-1/2 hidden h-24 w-24 -translate-y-1/2 animate-[float-soft_4s_ease-in-out_infinite] sm:block" />
            <p className="relative flex w-fit items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-sm font-black uppercase tracking-wide text-amber-700">
              <ClipboardCheck className="h-4 w-4" /> {TEST_TYPE_LABEL[test.testType] || "Kiểm tra"}
            </p>
            <h1 className="relative mt-3 max-w-2xl font-display text-3xl font-black text-[#0b2340] sm:text-4xl">{test.title}</h1>
            {subtitle && <p className="relative mt-2 w-fit rounded-full bg-white/85 px-3 py-0.5 font-bold text-ink">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 border-b border-slate-100 text-center sm:grid-cols-4 sm:divide-y-0">
            <div className="p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Số câu</p>
              <p className="font-display text-h3 text-slate-800">{test.questions.length}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Thời gian</p>
              <p className="font-display text-h3 text-slate-800">
                {test.timeLimitSeconds > 0 ? `${Math.round(test.timeLimitSeconds / 60)} phút` : "Tự do"}
              </p>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Mức độ</p>
              <p className="font-display text-h3 text-slate-800">{LEVEL_LABEL[test.level] || "—"}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Đã làm</p>
              <p className="font-display text-h3 text-slate-800">{history.length} lần</p>
            </div>
          </div>
          <div className="p-6">
            {history.length > 0 && (
              <div className="mb-5">
                <p className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                  <History className="h-4 w-4" /> Kết quả các lần kiểm tra trước
                  <span className="ml-auto flex items-center gap-1 text-primary">
                    <Trophy className="h-4 w-4" /> Cao nhất: {best}/{history[0].totalQuestions}
                  </span>
                </p>
                <div className="mt-2 space-y-1.5">
                  {history.slice(0, 5).map((a, idx) => (
                    <Link
                      key={a._id}
                      to={`/kiem-tra/ket-qua/${a._id}`}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      <span className="text-slate-600">
                        Lần {history.length - idx} · {new Date(a.createdAt).toLocaleString("vi-VN")}
                      </span>
                      <span className="font-bold text-slate-800">
                        {a.score}/{a.totalQuestions} <span className="font-semibold text-secondary">Xem lại ›</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {history.length > 0 && (
              <Link
                to={`/kiem-tra/ket-qua/${history[0]._id}`}
                className="mb-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-secondary/40 bg-secondary/5 px-4 py-3 font-display font-bold text-secondary transition hover:bg-secondary/10"
              >
                <History className="h-5 w-5" /> Quay lại bản lưu bài kiểm tra mới nhất ({history[0].score}/{history[0].totalQuestions} ·{" "}
                {new Date(history[0].createdAt).toLocaleString("vi-VN")})
              </Link>
            )}
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li>• Chọn số câu trong “Danh sách câu hỏi” để chuyển nhanh; có thể quay lại đổi đáp án bất cứ lúc nào.</li>
              <li>• {test.timeLimitSeconds > 0 ? "Hết thời gian, hệ thống sẽ tự nộp bài." : "Không giới hạn thời gian, làm cẩn thận nhé."}</li>
            </ul>
            <Button onClick={() => setStarted(true)} className="mt-5 w-full rounded-2xl py-3 text-base">
              <PlayCircle className="h-5 w-5" /> {history.length > 0 ? `Làm lại (lần ${history.length + 1})` : "Bắt đầu làm bài"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const total = test.questions.length;
  const question = test.questions[current];
  const isFillQuestion = FILL_TYPES.includes(question.type);
  const isMulti = question.type === "multi_choice";
  const selected = answers[question._id];
  const isPicked = (idx) => (isMulti ? Array.isArray(selected) && selected.includes(idx) : selected === idx);
  const remaining = test.timeLimitSeconds > 0 ? test.timeLimitSeconds - elapsed : null;
  const lowTime = remaining !== null && remaining <= 60;

  function isAnswered(q) {
    const v = answers[q._id];
    if (FILL_TYPES.includes(q.type)) return typeof v === "string" && v.trim().length > 0;
    if (q.type === "multi_choice") return Array.isArray(v) && v.length > 0;
    return v !== undefined;
  }
  const answeredCount = test.questions.filter(isAnswered).length;
  const unanswered = test.questions.map((q, idx) => (isAnswered(q) ? null : idx)).filter((v) => v !== null);

  const flaggedIdx = test.questions.map((q, idx) => (flags[q._id] ? idx : null)).filter((v) => v !== null);
  function toggleFlag() {
    setFlags((f) => ({ ...f, [question._id]: !f[question._id] }));
  }
  // Nhảy tới câu gắn cờ kế tiếp (vòng lại từ đầu nếu hết)
  function goNextFlag() {
    if (flaggedIdx.length === 0) return;
    setCurrent(flaggedIdx.find((i) => i > current) ?? flaggedIdx[0]);
  }

  function setAnswer(value) {
    setAnswers((a) => ({ ...a, [question._id]: value }));
  }
  function pickChoice(idx) {
    if (!isMulti) return setAnswer(idx);
    const cur = Array.isArray(selected) ? selected : [];
    setAnswer(cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx].sort());
  }


  return (
    <div className="min-h-screen">
      {/* Tiêu đề bài + thanh tiến độ */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 shadow-[0_6px_20px_-14px_rgba(11,35,64,0.35)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            title="Thoát bài kiểm tra"
            onClick={async () => (await dialog.confirm({ message: "Thoát bài kiểm tra? Bài làm hiện tại sẽ không được lưu.", danger: true, confirmText: "Thoát", cancelText: "Làm tiếp" })) && navigate(backTo)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-lg font-extrabold uppercase text-primary sm:text-xl">{test.title}</p>
            <p className="truncate text-xs font-semibold text-slate-400">{subtitle}</p>
          </div>
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-white lg:hidden",
              lowTime ? "bg-red-500" : "bg-primary"
            )}
          >
            <Clock className="h-4 w-4" /> {formatDuration(remaining !== null ? remaining : elapsed)}
          </span>
        </div>
        <div className="mx-auto flex max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 items-center gap-3 px-4 pb-2.5">
          <div className="h-2.5 flex-1 overflow-clip rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answeredCount / total) * 100}%` }} />
          </div>
          <span className="shrink-0 text-sm font-bold text-slate-500">
            Đã làm {answeredCount}/{total} câu
          </span>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-5 px-4 py-5 xl:max-w-none xl:px-10 lg:grid-cols-[1fr_270px] 2xl:px-16">
        {/* ===== Câu hỏi ===== */}
        <div>
          <div className="overflow-clip rounded-2xl bg-white shadow-elevation-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-primary px-4 py-3 text-white sm:px-5">
              <span className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold">
                <HelpCircle className="h-5 w-5" /> Câu hỏi số {current + 1}
                <span className="text-sm font-semibold text-white/75">/ {total}</span>
                <button
                  type="button"
                  onClick={() => speakQuestionText(question.audioText || question.text)}
                  aria-label="Đọc câu hỏi"
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </span>
            </div>

            <div className="p-5 sm:p-6">
              {/* Gắn cờ câu phân vân để quay lại xem sau */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-400">{isFillQuestion ? "Điền đáp án vào ô trống" : isMulti ? "Chọn TẤT CẢ đáp án đúng (có thể nhiều hơn 1)" : "Chọn một đáp án đúng"}</p>
                <button
                  id="flag-toggle"
                  type="button"
                  onClick={toggleFlag}
                  aria-pressed={!!flags[question._id]}
                  title="Gắn cờ câu phân vân để xem lại (phím F)"
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-bold ring-2 transition active:scale-95",
                    flags[question._id] ? "bg-amber-400 text-white ring-amber-400 shadow-[0_4px_0_0_#d97706]" : "bg-white text-amber-700 ring-amber-300 hover:bg-amber-50"
                  )}
                >
                  <Flag className={cn("h-5 w-5", flags[question._id] && "fill-white")} />
                  {flags[question._id] ? "Đã gắn cờ — bấm để bỏ" : "Phân vân? Gắn cờ"}
                  <kbd className={cn("hidden rounded px-1.5 text-xs font-black sm:inline", flags[question._id] ? "bg-white/25" : "bg-amber-100")}>F</kbd>
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-5">
                {question.imageUrl && (
                  <div className="mb-3">
                    <div className="flex justify-center overflow-auto rounded-xl bg-slate-50 p-3">
                      <QuestionImage src={question.imageUrl} zoom={zoom} />
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(50, z - 25))}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-primary"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-12 text-center text-caption font-semibold text-slate-500">{zoom}%</span>
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(200, z + 25))}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-primary"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {!isFillQuestion && <p className="whitespace-pre-line text-2xl font-semibold leading-relaxed text-slate-800">{question.text}</p>}
                {isFillQuestion && <FillBlankPrompt text={question.text} value={selected || ""} onChange={setAnswer} />}
                {(question.type === "listen_choice" || question.type === "listen_fill") && (
                  <button
                    type="button"
                    onClick={() => speakQuestionText(question.audioText || question.text)}
                    className="mt-3 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20"
                  >
                    <Volume2 className="h-4 w-4" /> Nghe lại câu hỏi
                  </button>
                )}
              </div>

              {!isFillQuestion && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {question.choices.map((choice, idx) => {
                    const active = isPicked(idx);
                    const tf = question.type === "true_false";
                    const TfIcon = /^đúng$/i.test(choice.trim()) ? ThumbsUp : ThumbsDown;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => pickChoice(idx)}
                        className={cn(
                          "flex items-stretch overflow-clip rounded-2xl text-left text-xl font-bold text-slate-700 ring-2 ring-slate-200 shadow-[0_4px_0_0_#e2e8f0] transition",
                          active ? "-translate-y-0.5 bg-sky-50 text-sky-700 ring-sky-400 shadow-[0_4px_0_0_#7dd3fc]" : "bg-white hover:-translate-y-0.5 hover:ring-sky-300"
                        )}
                      >
                        <span
                          className={cn(
                            "flex w-16 shrink-0 items-center justify-center",
                            active ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                          )}
                        >
                          {tf ? (
                            <TfIcon className="h-5 w-5" />
                          ) : (
                            <span
                              className={cn(
                                "flex h-10 w-10 items-center justify-center border-2 text-xl font-black",
                                isMulti ? "rounded-lg" : "rounded-full",
                                active ? "border-white bg-white/20" : "border-slate-300"
                              )}
                            >
                              {LETTERS[idx]}
                            </span>
                          )}
                        </span>
                        <span className="flex-1 px-4 py-3">{choice}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="h-20" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 xl:max-w-none xl:px-10 2xl:px-16 lg:pr-[calc(270px+2.5rem)] xl:pr-[calc(270px+4rem)] 2xl:pr-[calc(270px+6rem)]">
            <Button
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
              className="rounded-xl px-5 py-2.5 shadow-[0_3px_0_rgba(0,0,0,0.12)]"
            >
              <ArrowLeft className="h-4 w-4" /> Câu hỏi trước
            </Button>
            <Button
              disabled={current === total - 1}
              onClick={() => setCurrent((c) => c + 1)}
              className="rounded-xl px-5 py-2.5 shadow-[0_3px_0_rgba(0,0,0,0.12)]"
            >
              Câu hỏi sau <ArrowRight className="h-4 w-4" />
            </Button>
          </div></div>
        </div>

        {/* ===== Cột phải: thời gian, nộp bài, danh sách câu hỏi ===== */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="hidden lg:block">
            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl py-4 font-display text-3xl font-extrabold text-white shadow-elevation-1",
                lowTime ? "animate-pulse bg-red-500" : "bg-primary"
              )}
            >
              <Clock className="h-6 w-6" /> {formatDuration(remaining !== null ? remaining : elapsed)}
            </div>
            <p className="mt-1 text-center text-xs font-semibold text-slate-400">
              {remaining !== null ? "Thời gian còn lại" : "Thời gian đã làm"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
            className="w-full rounded-2xl border-2 border-primary bg-white py-4 font-display text-xl font-bold uppercase text-primary shadow-[4px_4px_0_rgba(0,0,0,0.08)] transition hover:bg-primary/5 disabled:opacity-60"
          >
            {submitting ? "Đang nộp..." : "Nộp bài kiểm tra"}
          </button>

          <div className="rounded-2xl bg-white p-4 shadow-elevation-1">
            <p className="border-b border-dashed border-slate-200 pb-2 text-center font-bold text-slate-700">Danh sách câu hỏi</p>
            <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-8 lg:grid-cols-4">
              {test.questions.map((q, idx) => (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-md text-sm font-bold transition",
                    isAnswered(q) ? "bg-primary text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    idx === current && "ring-2 ring-slate-700 ring-offset-1"
                  )}
                >
                  {idx + 1}
                  {flags[q._id] && <Flag className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-amber-400 text-amber-500" />}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-primary" /> Đã làm
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded border border-slate-300" /> Chưa làm
              </span>
              <span className="flex items-center gap-1">
                <Flag className="h-3 w-3 fill-amber-400 text-amber-500" /> Gắn cờ
              </span>
            </div>
          </div>
          {/* Danh sách câu đã gắn cờ */}
          <div className={cn("rounded-2xl p-4 shadow-elevation-1", flaggedIdx.length > 0 ? "bg-amber-50 ring-2 ring-amber-200" : "bg-white")}>
            <p className="flex items-center gap-1.5 font-bold text-slate-700">
              <Flag className={cn("h-5 w-5", flaggedIdx.length > 0 ? "fill-amber-400 text-amber-500" : "text-slate-400")} /> Câu phân vân ({flaggedIdx.length})
            </p>
            {flaggedIdx.length === 0 ? (
              <p className="mt-1.5 text-sm font-semibold text-slate-400">Gặp câu chưa chắc? Bấm “Gắn cờ” (hoặc phím F) để quay lại xem sau.</p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {flaggedIdx.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrent(i)}
                      className={cn("flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-white px-2 text-sm font-black text-amber-700 ring-1 ring-amber-300 hover:bg-amber-100", i === current && "ring-2 ring-amber-500")}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={goNextFlag} className="mt-3 w-full rounded-xl bg-amber-400 py-2 text-sm font-black text-white shadow-[0_3px_0_0_#d97706] transition hover:brightness-105 active:translate-y-0.5">
                  Đến câu gắn cờ kế tiếp
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-elevation-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-h3 text-slate-800">Nộp bài kiểm tra?</p>
            <p className="mt-1 text-sm text-slate-500">
              Đã làm {answeredCount}/{total} câu · thời gian {formatDuration(elapsed)}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Đồng hồ vẫn đang chạy
              {remaining !== null ? ` — còn ${formatDuration(remaining)}` : ""} cho tới khi em bấm “Nộp bài”.
            </p>
            {flaggedIdx.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-700">
                <Flag className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400" />
                Có {flaggedIdx.length} câu đang gắn cờ cần xem lại:{" "}
                {flaggedIdx.slice(0, 10).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setConfirmOpen(false);
                      setCurrent(i);
                    }}
                    className="mx-0.5 rounded bg-amber-100 px-1.5 font-black text-amber-800 hover:bg-amber-200"
                  >
                    {i + 1}
                  </button>
                ))}
                {flaggedIdx.length > 10 ? "…" : ""}
              </p>
            )}
            {unanswered.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Còn {unanswered.length} câu chưa làm: {unanswered.slice(0, 10).map((i) => i + 1).join(", ")}
                {unanswered.length > 10 ? "…" : ""}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">
                Làm tiếp
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1"
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
