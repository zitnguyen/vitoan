import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send, AlertCircle, Volume2, Lock, Clock, Minus, Plus, Check, ThumbsUp, ThumbsDown, Ear } from "lucide-react";
import { lessonService, questionService, attemptService, practiceSetService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import QuizResultView from "../../components/quiz/QuizResultView.jsx";
import FillBlankPrompt from "../../components/quiz/FillBlankPrompt.jsx";
import { speak, speakQuestionText, stopSpeaking, FILL_TYPES } from "../../lib/speech.js";
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

  function isAnswered(q) {
    const v = answers[q._id];
    if (FILL_TYPES.includes(q.type)) return typeof v === "string" && v.trim().length > 0;
    return v !== undefined;
  }
  const answeredCount = questions.filter(isAnswered).length;
  const currentAnswered = isAnswered(question);

  function selectChoice(index) {
    setAnswers((a) => ({ ...a, [question._id]: index }));
  }

  function setTextAnswer(value) {
    setAnswers((a) => ({ ...a, [question._id]: value }));
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
                    idx === current ? "bg-white" : isAnswered(q) ? "bg-white/70" : "bg-white/25"
                  )}
                />
              ))}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(elapsed)}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-3xl bg-white p-6 shadow-elevation-2 ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center justify-between">
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
            <FillBlankPrompt text={question.text} value={selected || ""} onChange={setTextAnswer} />
          ) : question.type === "true_false" ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {question.choices.map((choice, idx) => {
                const isTrueOption = /^đúng$/i.test(choice.trim());
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectChoice(idx)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-6 font-bold transition",
                      selected === idx
                        ? isTrueOption
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                    )}
                  >
                    {isTrueOption ? <ThumbsUp className="h-8 w-8" /> : <ThumbsDown className="h-8 w-8" />}
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {question.choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectChoice(idx)}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-medium transition",
                      selected === idx
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                        selected === idx ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-400"
                      )}
                    >
                      {selected === idx ? <Check className="h-4 w-4" /> : letters[idx]}
                    </span>
                    {choice}
                  </button>
                  <button
                    type="button"
                    onClick={() => speak(choice)}
                    aria-label={`Đọc đáp án ${letters[idx]}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-primary/10 hover:text-primary"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            className="rounded-full px-5"
          >
            <ChevronLeft className="h-4 w-4" /> Câu trước
          </Button>
          {current < questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => c + 1)} disabled={!currentAnswered} className="rounded-full px-8">
              Trả lời
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || answeredCount < questions.length} className="rounded-full px-8">
              <Send className="h-4 w-4" /> {submitting ? "Đang nộp bài..." : "Nộp bài"}
            </Button>
          )}
        </div>
        {current === questions.length - 1 && answeredCount < questions.length && (
          <p className="mt-2 flex items-center justify-end gap-1.5 text-caption text-amber-600">
            <AlertCircle className="h-4 w-4" /> Hãy trả lời hết các câu trước khi nộp bài.
          </p>
        )}
      </div>
    </div>
  );
}
