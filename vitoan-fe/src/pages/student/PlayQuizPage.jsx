import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Volume2,
  Lock,
  Clock,
  Star,
  Sparkles,
  Minus,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Ear,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Check,
  X,
  Gem,
  RotateCcw,
} from "../../components/ui/icons.jsx";
import { lessonService, questionService, attemptService, practiceSetService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";
import FillBlankPrompt from "../../components/quiz/FillBlankPrompt.jsx";
import QuestionImage from "../../components/quiz/QuestionImage.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import AnswerFeedbackPopup from "../../components/quiz/AnswerFeedbackPopup.jsx";
import { speak, speakQuestionText, stopSpeaking, FILL_TYPES } from "../../lib/speech.js";
import { playCorrectSound, playWrongSound } from "../../lib/sound.js";
import { cn, shuffleArray } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const POINTS_PER_CORRECT = 10;
const PERFECT_BONUS = 20;

function toPayloadAnswer(question, value) {
  return FILL_TYPES.includes(question.type)
    ? { question: question._id, textAnswer: (value || "").trim() }
    : { question: question._id, selectedIndex: value ?? -1 };
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PlayQuizPage() {
  const dialog = useDialog();
  const { lessonId, practiceSetId } = useParams();
  const isPracticeSet = !!practiceSetId;
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === "Student";
  const [meta, setMeta] = useState(null);
  // Kỷ lục trước đó ở bài này: chỉ phần đúng VƯỢT kỷ lục mới được cộng điểm (khớp với server).
  const [record, setRecord] = useState(null);
  // Popup kết quả hiện ngay sau khi bấm "Kiểm tra".
  const [showFeedback, setShowFeedback] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [resumed, setResumed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [checking, setChecking] = useState(false);
  const [hints, setHints] = useState({});
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestResult, setGuestResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [zoom, setZoom] = useState(100);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        let info;
        let qs;
        if (isPracticeSet) {
          const res = await practiceSetService.getOne(practiceSetId);
          const li = res.data.lessonInfo;
          info = { title: res.data.title, lessonId: res.data.lesson, subject: li?.subject, grade: li?.grade };
          qs = res.data.questions;
        } else {
          const [lessonRes, questionsRes] = await Promise.all([
            lessonService.getOne(lessonId),
            questionService.listByLesson(lessonId),
          ]);
          info = { title: lessonRes.data.title, lessonId, subject: lessonRes.data.subject, grade: lessonRes.data.grade };
          qs = questionsRes.data;
        }
        if (cancelled) return;
        setMeta(info);
        setAllQuestions(qs);
        if (user?.role === "Student") {
          attemptService
            .record({ lesson: info.lessonId, practiceSet: practiceSetId || undefined })
            .then((r) => !cancelled && setRecord(r.data))
            .catch(() => {});
        }

        // Có lộ trình đang làm dở → làm tiếp đúng thứ tự câu, đúng câu đang làm, giữ kết quả đã chấm.
        let progress = null;
        if (user?.role === "Student") {
          progress = (
            await attemptService
              .getProgress({ lesson: info.lessonId, practiceSet: practiceSetId || undefined })
              .catch(() => ({ data: null }))
          ).data;
        }
        const byId = new Map(qs.map((q) => [q._id, q]));
        const ordered = progress?.questionOrder?.map((id) => byId.get(id)).filter(Boolean) || [];
        if (progress && ordered.length === qs.length && progress.answers.length > 0) {
          const restoredAnswers = {};
          const restoredChecked = {};
          for (const a of progress.answers) {
            const q = byId.get(a.question);
            if (!q) continue;
            restoredAnswers[a.question] = FILL_TYPES.includes(q.type) ? a.textAnswer : a.selectedIndex;
            restoredChecked[a.question] = { correct: a.correct };
          }
          setQuestions(ordered);
          setAnswers(restoredAnswers);
          setChecked(restoredChecked);
          setCurrent(Math.min(progress.current || 0, ordered.length - 1));
          elapsedRef.current = progress.elapsedSeconds || 0;
          setResumed(true);
        } else {
          setQuestions(shuffleArray(qs));
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.apiMessage || "Không thể tải bài luyện tập");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, practiceSetId, isPracticeSet]);

  // Câu khôi phục từ lộ trình chỉ có cờ đúng/sai — lấy lại đáp án đúng + giải thích khi xem lại câu đó.
  useEffect(() => {
    const q = questions[current];
    const r = q && checked[q._id];
    if (!q || !r || r.explanation !== undefined) return;
    const payload = toPayloadAnswer(q, answers[q._id]);
    questionService
      .checkAnswer(q._id, payload)
      .then((res) => setChecked((c) => ({ ...c, [q._id]: res.data })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, questions]);

  const persist = useCallback(
    (nextAnswers, nextChecked, nextCurrent) => {
      if (!isStudent || !meta || questions.length === 0) return;
      attemptService
        .saveProgress({
          lesson: meta.lessonId,
          practiceSet: practiceSetId || undefined,
          questionOrder: questions.map((q) => q._id),
          answers: questions.filter((q) => nextChecked[q._id]).map((q) => toPayloadAnswer(q, nextAnswers[q._id])),
          current: nextCurrent,
          elapsedSeconds: elapsedRef.current,
        })
        .catch(() => {});
    },
    [isStudent, meta, practiceSetId, questions]
  );

  async function goTo(index) {
    setShowFeedback(false);
    setCurrent(index);
    persist(answers, checked, index);
  }

  async function restart() {
    if (!(await dialog.confirm({ message: "Làm lại từ đầu? Tiến trình đang làm dở sẽ bị xoá.", danger: true, confirmText: "Làm lại" }))) return;
    if (isStudent) {
      await attemptService.clearProgress({ lesson: meta.lessonId, practiceSet: practiceSetId || undefined }).catch(() => {});
    }
    setQuestions(shuffleArray(allQuestions));
    setAnswers({});
    setChecked({});
    setHints({});
    setCurrent(0);
    elapsedRef.current = 0;
    setElapsed(0);
    setResumed(false);
  }

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setZoom(100), [current]);
  useEffect(() => setHintError(""), [current]);
  useEffect(() => {
    const q = questions[current];
    if (q && !checked[q._id] && (q.type === "listen_choice" || q.type === "listen_fill")) {
      speakQuestionText(q.audioText || q.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, questions]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Lock className="h-7 w-7" />
        </span>
        <p className="mt-4 text-body-lg font-semibold text-slate-800">{loadError}</p>
        <p className="mt-1 text-caption text-slate-500">Đăng nhập hoặc đăng ký để tiếp tục luyện tập bài học này.</p>
        <div className="mt-5 flex gap-3">
          <Link to="/dang-nhap" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary">
            Đăng nhập
          </Link>
          <Link to="/dang-ky" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    );
  }

  if (guestResult) {
    return (
      <div className="page">
        <QuizResultView attempt={guestResult} guest backTo={meta?.lessonId ? `/bai/${meta.lessonId}` : "/"} backLabel="Về bài học" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="mx-auto max-w-xl px-4 py-10 text-center text-body text-slate-500">
        Bài này chưa có câu hỏi.
      </p>
    );
  }

  const question = questions[current];
  const isFillQuestion = FILL_TYPES.includes(question.type);
  const selected = answers[question._id];
  const letters = ["A", "B", "C", "D", "E", "F"];
  const currentResult = checked[question._id];
  const isLocked = !!currentResult;

  function isAnswered(q) {
    const v = answers[q._id];
    if (FILL_TYPES.includes(q.type)) return typeof v === "string" && v.trim().length > 0;
    return v !== undefined;
  }
  const answeredCount = questions.filter(isAnswered).length;
  const currentAnswered = isAnswered(question);
  const correctCount = Object.values(checked).filter((r) => r.correct).length;
  const checkedCount = Object.keys(checked).length;
  const runningPoints = record
    ? Math.max(0, correctCount - record.best) * POINTS_PER_CORRECT +
      (questions.length > 0 && correctCount === questions.length && !record.hadPerfect ? PERFECT_BONUS : 0)
    : correctCount * POINTS_PER_CORRECT;
  const allChecked = checkedCount === questions.length;
  const nextUnchecked = questions.findIndex((q, idx) => idx > current && !checked[q._id]);
  const firstUnchecked = questions.findIndex((q) => !checked[q._id]);

  function selectChoice(index) {
    if (isLocked) return;
    setAnswers((a) => ({ ...a, [question._id]: index }));
  }

  function setTextAnswer(value) {
    if (isLocked) return;
    setAnswers((a) => ({ ...a, [question._id]: value }));
  }

  async function handleGetHint() {
    if (hints[question._id]) return;
    setHintError("");
    setHintLoading(true);
    try {
      const res = await questionService.getHint(question._id);
      setHints((h) => ({ ...h, [question._id]: res.data.hint }));
    } catch (err) {
      setHintError(err.apiMessage || "Chưa thể lấy gợi ý lúc này, thử lại sau nhé.");
    } finally {
      setHintLoading(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      const payload = isFillQuestion ? { textAnswer: (selected || "").trim() } : { selectedIndex: selected };
      const res = await questionService.checkAnswer(question._id, payload);
      const nextChecked = { ...checked, [question._id]: res.data };
      setChecked(nextChecked);
      setShowFeedback(true);
      persist(answers, nextChecked, current);
      (res.data.correct ? playCorrectSound : playWrongSound)();
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        lesson: meta.lessonId,
        ...(isPracticeSet ? { practiceSet: practiceSetId } : {}),
        durationSeconds: elapsedRef.current,
        answers: questions.map((q) => toPayloadAnswer(q, answers[q._id])),
      };
      if (isStudent) {
        const res = await attemptService.submit(payload);
        if (res.pointsEarned > 0) refreshUser?.().catch?.(() => {});
        navigate(`/ket-qua/${res.data._id}`, {
          replace: true,
          state: { newBadges: res.newBadges, pointsEarned: res.pointsEarned, previousBest: res.previousBest },
        });
      } else {
        const res = await attemptService.submitGuest(payload);
        setGuestResult(res.data);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Top bar: lùi 1 cấp về bài học, tên môn · lớp, điểm tích luỹ, thời gian */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 px-4 py-2.5 shadow-[0_8px_24px_-12px_rgba(59,130,246,0.7)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:px-2 xl:max-w-none xl:px-6 2xl:px-12">
          <Link
            to={meta?.lessonId ? `/bai/${meta.lessonId}` : "/"}
            title="Quay lại bài học"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 text-white">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-white/80">
              {[meta?.subject?.name, meta?.grade?.name].filter(Boolean).join(" · ") || "Luyện tập"}
            </p>
            <p className="truncate font-display text-base font-bold">{meta?.title}</p>
          </div>
          <span
            title="Điểm tích luỹ lượt này"
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-sm font-extrabold text-white"
          >
            <Gem className="h-4 w-4" /> {runningPoints}
          </span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white sm:flex">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16">
        {/* Lộ trình làm bài: bấm để xem lại / nhảy tới câu */}
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white p-2.5 shadow-elevation-1">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const r = checked[q._id];
              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                    r
                      ? r.correct
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-400 text-white"
                      : isAnswered(q)
                      ? "bg-secondary/20 text-secondary"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    idx === current && "ring-2 ring-secondary ring-offset-2"
                  )}
                >
                  {r ? r.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" /> : idx + 1}
                </button>
              );
            })}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold uppercase text-slate-400">Đúng</p>
            <p className="font-display text-lg font-extrabold text-emerald-600">
              <Star className="mb-0.5 inline h-4 w-4 fill-amber-400 text-amber-400" /> {correctCount}/{checkedCount}
            </p>
          </div>
        </div>

        {isStudent && record && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-body text-amber-900 ring-1 ring-amber-200">
            <Gem className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <p>
              {record.attempts > 0 ? (
                <>
                  Kỷ lục của em ở bài này: <b>{record.best} câu đúng</b>. Mỗi câu đúng <b>vượt kỷ lục</b> được +{POINTS_PER_CORRECT} 💎
                  {!record.hadPerfect && <>, đúng hết thêm +{PERFECT_BONUS} 💎</>}. Điểm được cộng khi em bấm “Hoàn thành”.
                </>
              ) : (
                <>
                  Lần đầu làm bài này: mỗi câu đúng +{POINTS_PER_CORRECT} 💎, đúng hết thêm +{PERFECT_BONUS} 💎. Điểm được cộng khi em bấm “Hoàn thành”.
                </>
              )}
            </p>
          </div>
        )}

        {resumed && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
            <span className="flex-1">
              Em đang làm tiếp lộ trình dở: đã xong {checkedCount}/{questions.length} câu, tích luỹ {runningPoints} điểm.
            </span>
            <button type="button" onClick={restart} className="flex items-center gap-1 font-bold hover:underline">
              <RotateCcw className="h-4 w-4" /> Làm lại từ đầu
            </button>
          </div>
        )}

        <div className="relative rounded-3xl bg-white p-6 shadow-elevation-2 sm:p-8">
          <button
            type="button"
            onClick={handleGetHint}
            disabled={hintLoading}
            aria-label={hintLoading ? "AI đang nghĩ gợi ý..." : "Xin gợi ý từ AI"}
            title="Gợi ý AI"
            className="absolute -right-3 -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 shadow-elevation-2 ring-4 ring-white transition hover:bg-violet-200 disabled:opacity-70 sm:-right-5"
          >
            <OwlMascot className="h-12 w-12" animated shake={hintLoading} />
          </button>

          <div className="flex items-center justify-between pr-12">
            <span className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-slate-800">Câu hỏi số {current + 1}</span>
              <button
                type="button"
                onClick={() => speak(question.audioText || question.text)}
                aria-label="Đọc câu hỏi"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-primary/10 hover:text-primary"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </span>
            <span className="text-caption font-semibold text-slate-400">
              {answeredCount}/{questions.length} đã trả lời
            </span>
          </div>

          {(hints[question._id] || hintError) && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50 px-3.5 py-2.5 text-body text-violet-700 ring-1 ring-violet-100">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{hints[question._id] || hintError}</p>
            </div>
          )}

          {question.imageUrl && (
            <div className="mt-4">
              <div className="flex justify-center overflow-auto rounded-xl bg-slate-50 p-4">
                <QuestionImage src={question.imageUrl} zoom={zoom} />
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-12 text-center text-caption font-semibold text-slate-500">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {!isFillQuestion && <p className="mt-4 whitespace-pre-line text-2xl font-semibold leading-relaxed text-slate-800">{question.text}</p>}

          {(question.type === "listen_choice" || question.type === "listen_fill") && (
            <button
              type="button"
              onClick={() => speakQuestionText(question.audioText || question.text)}
              className="mt-3 flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-bold text-secondary hover:bg-secondary/20"
            >
              <Ear className="h-4 w-4" /> Nghe lại câu hỏi
            </button>
          )}

          {isFillQuestion ? (
            <FillBlankPrompt text={question.text} value={selected || ""} onChange={setTextAnswer} disabled={isLocked} />
          ) : question.type === "true_false" ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {question.choices.map((choice, idx) => {
                const isTrueOption = /^đúng$/i.test(choice.trim());
                const isCorrectChoice = isLocked && idx === currentResult.correctIndex;
                const isWrongPick = isLocked && idx === selected && !currentResult.correct;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLocked}
                    onClick={() => selectChoice(idx)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl px-4 py-6 font-bold ring-2 transition",
                      isCorrectChoice && "border-primary bg-primary/10 text-primary",
                      isWrongPick && "border-red-400 bg-red-50 text-red-600",
                      !isLocked &&
                        (selected === idx
                          ? isTrueOption
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : "bg-white text-slate-700 ring-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:-translate-y-0.5 hover:ring-sky-300")
                    )}
                  >
                    {isTrueOption ? <ThumbsUp className="h-8 w-8" /> : <ThumbsDown className="h-8 w-8" />}
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {question.choices.map((choice, idx) => {
                const isCorrectChoice = isLocked && idx === currentResult.correctIndex;
                const isWrongPick = isLocked && idx === selected && !currentResult.correct;
                return (
                  <div key={idx} className="relative">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => selectChoice(idx)}
                      className={cn(
                        "flex min-h-[5.5rem] w-full flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-center text-xl font-bold ring-2 transition",
                        isCorrectChoice && "border-primary bg-primary/10 text-primary",
                        isWrongPick && "border-red-400 bg-red-50 text-red-600",
                        !isLocked &&
                          (selected === idx
                            ? "-translate-y-0.5 bg-sky-50 text-sky-700 ring-sky-400 shadow-[0_4px_0_0_#7dd3fc]"
                            : "bg-white text-slate-700 ring-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:-translate-y-0.5 hover:ring-sky-300")
                      )}
                    >
                      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                        {letters[idx]}
                      </span>
                      {(isCorrectChoice || isWrongPick) && (
                        <span className="absolute right-2 top-2">
                          {isCorrectChoice ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      )}
                      {choice}
                    </button>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => speak(choice)}
                        aria-label={`Đọc đáp án ${letters[idx]}`}
                        className="absolute bottom-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-primary/10 hover:text-primary"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kết quả câu vừa kiểm tra hiện dạng popup; đóng popup thì còn 1 dòng tóm tắt để mở lại. */}
        {isLocked && (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 ring-1",
              currentResult.correct ? "bg-emerald-50 ring-emerald-100" : "bg-rose-50 ring-rose-100"
            )}
          >
            <OwlMascot className="h-10 w-10 shrink-0" animated={false} covering={!currentResult.correct} />
            <p className={cn("flex-1 font-display font-bold", currentResult.correct ? "text-emerald-700" : "text-rose-600")}>
              {currentResult.correct ? "Em đã trả lời đúng câu này! 🎉" : "Câu này em trả lời chưa đúng."}
            </p>
            {!currentResult.correct && (
              <button
                type="button"
                onClick={() => setShowFeedback(true)}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50"
              >
                <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" /> Xem giải thích
              </button>
            )}
          </div>
        )}

        {isLocked && showFeedback && (
          <AnswerFeedbackPopup
            result={currentResult}
            correctAnswer={isFillQuestion ? currentResult.correctText : question.choices[currentResult.correctIndex]}
            primaryLabel={
              allChecked
                ? submitting
                  ? "Đang nộp bài..."
                  : `Hoàn thành & nhận ${runningPoints} 💎`
                : nextUnchecked !== -1
                ? "Câu tiếp theo"
                : "Làm câu còn lại"
            }
            primaryIcon={allChecked ? "submit" : "next"}
            busy={submitting}
            onPrimary={() => (allChecked ? handleSubmit() : goTo(nextUnchecked !== -1 ? nextUnchecked : firstUnchecked))}
            onClose={() => setShowFeedback(false)}
          />
        )}

        {isLocked && (
          <div className="mt-4">
            {allChecked ? (
              <Button onClick={handleSubmit} disabled={submitting} className="rounded-full px-8">
                <Send className="h-4 w-4" /> {submitting ? "Đang nộp bài..." : `Hoàn thành & nhận ${runningPoints} 💎`}
              </Button>
            ) : (
              <Button onClick={() => goTo(nextUnchecked !== -1 ? nextUnchecked : firstUnchecked)} className="rounded-full px-8">
                {nextUnchecked !== -1 ? "Câu tiếp theo" : "Làm câu còn lại"} <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {!isLocked && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={current === 0}
              onClick={() => goTo(current - 1)}
              className="rounded-full px-5"
            >
              <ChevronLeft className="h-4 w-4" /> Câu trước
            </Button>
            <Button onClick={handleCheck} disabled={!currentAnswered || checking} className="rounded-full px-8">
              {checking ? "Đang kiểm tra..." : "Kiểm tra"}
            </Button>
          </div>
        )}
        {isLocked && current > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => goTo(current - 1)}
              className="rounded-full px-5"
            >
              <ChevronLeft className="h-4 w-4" /> Câu trước
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
