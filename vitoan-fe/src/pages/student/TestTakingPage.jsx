import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Send, AlertCircle, Volume2, Clock, Minus, Plus, Check } from "lucide-react";
import { testService, testAttemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import FillBlankPrompt from "../../components/quiz/FillBlankPrompt.jsx";
import { speakQuestionText, stopSpeaking, FILL_TYPES } from "../../lib/speech.js";
import { cn, shuffleArray } from "../../lib/utils";

function formatDuration(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${seconds < 0 ? "-" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TestTakingPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    testService
      .getOne(testId)
      .then((res) => {
        setTest({ ...res.data, questions: shuffleArray(res.data.questions) });
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(err.apiMessage || "Không thể tải bài kiểm tra");
        setLoading(false);
      });
  }, [testId]);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setZoom(100), [current]);
  useEffect(() => {
    const q = test?.questions?.[current];
    if (q?.type === "listen_choice" || q?.type === "listen_fill") speakQuestionText(q.audioText || q.text);
  }, [current, test]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError || !test) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <p className="text-body-lg font-semibold text-slate-800">{loadError || "Không tìm thấy bài kiểm tra"}</p>
        <Link to="/kiem-tra" className="mt-4 text-sm font-semibold text-primary hover:underline">
          Quay lại danh sách kiểm tra
        </Link>
      </div>
    );
  }

  if (test.questions.length === 0) {
    return (
      <p className="mx-auto max-w-xl px-4 py-16 text-center text-body text-slate-500">
        Bài kiểm tra này chưa có câu hỏi.
      </p>
    );
  }

  const question = test.questions[current];
  const isFillQuestion = FILL_TYPES.includes(question.type);
  const selected = answers[question._id];
  const timeDisplay =
    test.timeLimitSeconds > 0 ? formatDuration(test.timeLimitSeconds - elapsed) : formatDuration(elapsed);
  const overTime = test.timeLimitSeconds > 0 && elapsed > test.timeLimitSeconds;
  const letters = ["A", "B", "C", "D", "E", "F"];

  function isAnswered(q) {
    const v = answers[q._id];
    if (FILL_TYPES.includes(q.type)) return typeof v === "string" && v.trim().length > 0;
    return v !== undefined;
  }
  const answeredCount = test.questions.filter(isAnswered).length;
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
        test: testId,
        durationSeconds: elapsed,
        answers: test.questions.map((q) =>
          FILL_TYPES.includes(q.type)
            ? { question: q._id, textAnswer: (answers[q._id] || "").trim() }
            : { question: q._id, selectedIndex: answers[q._id] ?? -1 }
        ),
      };
      const res = await testAttemptService.submit(payload);
      navigate(`/kiem-tra/ket-qua/${res.data._id}`, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-vietnamese/15 via-slate-50 to-slate-50">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-vietnamese to-orange-600 px-4 py-3 shadow-elevation-2">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to="/kiem-tra"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{test.title}</p>
            <div className="mt-1.5 flex gap-1">
              {test.questions.map((q, idx) => (
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
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              overTime ? "bg-red-600 text-white" : "bg-white/15 text-white"
            )}
          >
            <Clock className="h-3.5 w-3.5" /> {timeDisplay}
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
                onClick={() => speakQuestionText(question.audioText || question.text)}
                aria-label="Đọc câu hỏi"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-vietnamese/10 hover:text-vietnamese"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </span>
            <span className="text-caption font-semibold text-slate-400">
              {answeredCount}/{test.questions.length} đã trả lời
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
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-vietnamese/40 hover:text-vietnamese"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-12 text-center text-caption font-semibold text-slate-500">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-vietnamese/40 hover:text-vietnamese"
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
              className="mt-3 flex items-center gap-2 rounded-full bg-vietnamese/10 px-4 py-2 text-sm font-bold text-vietnamese hover:bg-vietnamese/20"
            >
              <Volume2 className="h-4 w-4" /> Nghe lại câu hỏi
            </button>
          )}

          {isFillQuestion ? (
            <FillBlankPrompt text={question.text} value={selected || ""} onChange={setTextAnswer} />
          ) : (
            <div className="mt-5 space-y-2.5">
              {question.choices.map((choice, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectChoice(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-medium transition",
                    selected === idx
                      ? "border-vietnamese bg-vietnamese/10 text-vietnamese"
                      : "border-slate-200 hover:border-vietnamese/50 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                      selected === idx ? "border-vietnamese bg-vietnamese text-white" : "border-slate-300 text-slate-400"
                    )}
                  >
                    {selected === idx ? <Check className="h-4 w-4" /> : letters[idx]}
                  </span>
                  {choice}
                </button>
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
          {current < test.questions.length - 1 ? (
            <Button
              onClick={() => setCurrent((c) => c + 1)}
              disabled={!currentAnswered}
              className="rounded-full bg-vietnamese px-8 hover:bg-orange-600"
            >
              Trả lời
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < test.questions.length}
              className="rounded-full bg-vietnamese px-8 hover:bg-orange-600"
            >
              <Send className="h-4 w-4" /> {submitting ? "Đang nộp bài..." : "Nộp bài"}
            </Button>
          )}
        </div>
        {current === test.questions.length - 1 && answeredCount < test.questions.length && (
          <p className="mt-2 flex items-center justify-end gap-1.5 text-caption text-amber-600">
            <AlertCircle className="h-4 w-4" /> Hãy trả lời hết các câu trước khi nộp bài.
          </p>
        )}
      </div>
    </div>
  );
}
