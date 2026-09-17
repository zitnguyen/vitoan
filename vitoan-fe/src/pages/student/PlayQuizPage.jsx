import { useEffect, useState } from "react";
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
} from "lucide-react";
import { lessonService, questionService, attemptService, practiceSetService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";
import FillBlankPrompt from "../../components/quiz/FillBlankPrompt.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { speak, speakQuestionText, stopSpeaking, FILL_TYPES } from "../../lib/speech.js";
import { playCorrectSound, playWrongSound } from "../../lib/sound.js";
import { cn, shuffleArray } from "../../lib/utils";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PlayQuizPage() {
  const { lessonId, practiceSetId } = useParams();
  const isPracticeSet = !!practiceSetId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
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
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    if (isPracticeSet) {
      practiceSetService
        .getOne(practiceSetId)
        .then((res) => {
          setMeta({ title: res.data.title, lessonId: res.data.lesson });
          setQuestions(shuffleArray(res.data.questions));
          setLoading(false);
        })
        .catch((err) => {
          setLoadError(err.apiMessage || "Không thể tải bài luyện tập");
          setLoading(false);
        });
    } else {
      Promise.all([lessonService.getOne(lessonId), questionService.listByLesson(lessonId)])
        .then(([lessonRes, questionsRes]) => {
          setMeta({ title: lessonRes.data.title, lessonId });
          setQuestions(shuffleArray(questionsRes.data));
          setLoading(false);
        })
        .catch((err) => {
          setLoadError(err.apiMessage || "Không thể tải bài học");
          setLoading(false);
        });
    }
  }, [lessonId, practiceSetId, isPracticeSet]);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setZoom(100), [current]);
  useEffect(() => setHintError(""), [current]);
  useEffect(() => {
    const q = questions[current];
    if (q?.type === "listen_choice" || q?.type === "listen_fill") speakQuestionText(q.audioText || q.text);
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
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
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
      <div className="mx-auto max-w-2xl px-4 py-12">
        <QuizResultView attempt={guestResult} guest />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="mx-auto max-w-xl px-4 py-16 text-center text-body text-slate-500">
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
  const wrongCount = Object.values(checked).filter((r) => !r.correct).length;
  const liveScore = Math.max(0, correctCount - wrongCount);

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
      setChecked((c) => ({ ...c, [question._id]: res.data }));
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
        durationSeconds: elapsed,
        answers: questions.map((q) =>
          FILL_TYPES.includes(q.type)
            ? { question: q._id, textAnswer: (answers[q._id] || "").trim() }
            : { question: q._id, selectedIndex: answers[q._id] ?? -1 }
        ),
      };
      if (user) {
        const res = await attemptService.submit(payload);
        navigate(`/ket-qua/${res.data._id}`, { state: { newBadges: res.newBadges } });
      } else {
        const res = await attemptService.submitGuest(payload);
        setGuestResult(res.data);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/15 via-slate-50 to-slate-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-secondary to-blue-600 px-4 py-3 shadow-elevation-2">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to={meta?.lessonId ? `/bai/${meta.lessonId}` : "/"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{meta?.title}</p>
            <div className="mt-1.5 flex gap-1">
              {questions.map((q, idx) => (
                <span
                  key={q._id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    idx === current
                      ? "bg-white"
                      : checked[q._id]
                      ? checked[q._id].correct
                        ? "bg-emerald-300"
                        : "bg-rose-300"
                      : isAnswered(q)
                      ? "bg-white/70"
                      : "bg-white/25"
                  )}
                />
              ))}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-white">
            <Star className="h-3.5 w-3.5 fill-white" /> {liveScore}/{questions.length}
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="relative rounded-3xl bg-white p-6 shadow-elevation-2 ring-1 ring-slate-100 sm:p-8">
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
              <span className="font-display font-bold text-slate-800">Câu hỏi số {current + 1}</span>
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
                <img
                  src={question.imageUrl}
                  alt=""
                  style={{ width: `${zoom}%` }}
                  className="h-auto max-w-none transition-[width]"
                />
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

          {!isFillQuestion && <p className="mt-4 text-body-lg font-semibold text-slate-800">{question.text}</p>}

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
                      "flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-6 font-bold transition",
                      isCorrectChoice && "border-primary bg-primary/10 text-primary",
                      isWrongPick && "border-red-400 bg-red-50 text-red-600",
                      !isLocked &&
                        (selected === idx
                          ? isTrueOption
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-200 hover:border-primary/50 hover:bg-slate-50")
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
                        "flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-center font-semibold transition",
                        isCorrectChoice && "border-primary bg-primary/10 text-primary",
                        isWrongPick && "border-red-400 bg-red-50 text-red-600",
                        !isLocked &&
                          (selected === idx
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 hover:border-primary/50 hover:bg-slate-50")
                      )}
                    >
                      <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
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

        {isLocked && (
          <div className="mt-4 flex items-start gap-3">
            <OwlMascot className="h-16 w-16 shrink-0" animated={false} covering={!currentResult.correct} />
            <div className="flex-1 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100">
              <p className={cn("font-display font-bold", currentResult.correct ? "text-primary" : "text-red-600")}>
                {currentResult.correct ? "Chính xác! Em giỏi quá! 🎉" : "Tiếc quá, câu trả lời của em sai rồi..."}
              </p>
              <p className="mt-0.5 text-caption text-slate-500">
                {currentResult.correct
                  ? "Tiếp tục phát huy nhé!"
                  : "Hãy cùng xem giải thích, sau đó làm câu tiếp theo nhé."}
              </p>
            </div>
          </div>
        )}

        {isLocked && (
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-elevation-1 ring-1 ring-slate-100">
            <div className="flex items-center gap-1.5 bg-amber-50 px-5 py-3">
              <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">Giải thích</span>
            </div>
            <div className="p-5">
              {!currentResult.correct && (
                <p className="text-body text-slate-700">
                  Đáp án đúng là:{" "}
                  <span className="font-bold text-primary">
                    {isFillQuestion ? currentResult.correctText : question.choices[currentResult.correctIndex]}
                  </span>
                  .
                </p>
              )}
              {currentResult.explanation && (
                <p className={cn("text-body text-slate-600", !currentResult.correct && "mt-1")}>
                  {currentResult.explanation}
                </p>
              )}
              <div className="mt-4">
                {current < questions.length - 1 ? (
                  <Button onClick={() => setCurrent((c) => c + 1)} className="rounded-full px-8">
                    Câu tiếp theo <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="rounded-full px-8">
                    <Send className="h-4 w-4" /> {submitting ? "Đang nộp bài..." : "Nộp bài"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {!isLocked && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
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
              onClick={() => setCurrent((c) => c - 1)}
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
