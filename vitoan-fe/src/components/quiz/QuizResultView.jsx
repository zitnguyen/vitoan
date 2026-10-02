import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  History,
  Star,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  ArrowLeft,
  Bot,
  RotateCcw,
  MessageSquareQuote,
  TrendingUp,
  Gem,
  Clock,
} from "../ui/icons.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { testAttemptService } from "../../api/services";
import { cn } from "../../lib/utils";
import { Img3D } from "../../lib/icons3d.jsx";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function getTier(percent) {
  if (percent >= 90) return { stars: 3, message: "Xuất sắc lắm! Em thật giỏi! 🎉", covering: false };
  if (percent >= 70) return { stars: 2, message: "Giỏi lắm! Cố thêm chút nữa nhé! 👏", covering: false };
  if (percent >= 40) return { stars: 1, message: "Em làm tốt rồi, luyện thêm sẽ giỏi hơn! 💪", covering: false };
  return { stars: 0, message: "Đừng buồn nhé, mình cùng luyện lại nào! 🌟", covering: true };
}

function ActionButtons({ guest, backTo, backLabel, retryTo }) {
  return (
    <div className="flex flex-col gap-2.5">
      {retryTo && (
        <Link
          to={retryTo}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-vietnamese px-5 py-3 text-sm font-bold text-white shadow-elevation-2 transition hover:bg-orange-600"
        >
          <RotateCcw className="h-4 w-4" /> Làm lại
        </Link>
      )}
      {backTo && (
        <Link
          to={backTo}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-elevation-2 transition hover:bg-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
      )}
      {!guest && (
        <Link
          to="/lich-su"
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-bold transition",
            backTo
              ? "border-2 border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary"
              : "bg-primary text-white shadow-elevation-2 hover:bg-primary-dark"
          )}
        >
          <History className="h-4 w-4" /> Xem lịch sử làm bài
        </Link>
      )}
      <Link
        to="/"
        className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/40 hover:text-primary"
      >
        <Home className="h-4 w-4" /> Về trang chủ
      </Link>
    </div>
  );
}

function AiReviewCard({ attemptId }) {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequest() {
    setLoading(true);
    setError("");
    try {
      const res = await testAttemptService.aiReview(attemptId);
      setReview(res.data.review);
    } catch (err) {
      setError(err.apiMessage || "Chưa thể lấy nhận xét lúc này");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-100">
      <p className="flex items-center gap-1.5 font-display font-bold text-violet-700">
        <Bot className="h-5 w-5" /> Nhận xét từ AI
      </p>
      {review ? (
        <p className="mt-2 text-body text-violet-800">{review}</p>
      ) : (
        <>
          {error && <p className="mt-2 text-caption text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleRequest}
            disabled={loading}
            className="mt-3 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Đang phân tích..." : "Xem nhận xét từ AI"}
          </button>
        </>
      )}
    </div>
  );
}

// Nhận xét + kết quả theo từng phần kiến thức (bài học) của 1 lượt làm bài.
function FeedbackPanel({ feedback }) {
  if (!feedback) return null;
  const remarks = feedback.remarks || (feedback.message ? [feedback.message] : []);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-elevation-1">
      <p className="flex flex-wrap items-center gap-2 font-display font-bold text-slate-800">
        <MessageSquareQuote className="h-5 w-5 text-secondary" /> Nhận xét của ViToan
        {feedback.level && (
          <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">{feedback.level}</span>
        )}
      </p>
      {feedback.passPercent && (
        <p
          className={cn(
            "mt-2 rounded-xl px-3 py-2 text-sm font-semibold",
            feedback.passed ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          )}
        >
          {feedback.passed
            ? `Đạt từ ${feedback.passPercent}% — bài học được đánh dấu "Đã học".`
            : `Cần đạt từ ${feedback.passPercent}% để bài học được đánh dấu "Đã học".`}
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        {remarks.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" /> {r}
          </li>
        ))}
      </ul>
      {feedback.byLesson?.length > 1 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Theo phần kiến thức</p>
          {feedback.byLesson.map((g) => (
            <div key={g.lesson} className="flex items-center gap-2">
              <Link to={`/bai/${g.lesson}`} className="w-1/2 truncate text-xs font-semibold text-slate-600 hover:text-primary">
                {g.title}
              </Link>
              <div className="h-2 flex-1 overflow-clip rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    g.correctPercent >= 80 ? "bg-green-500" : g.correctPercent >= 50 ? "bg-amber-400" : "bg-red-400"
                  )}
                  style={{ width: `${g.correctPercent}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-slate-500">
                {g.total - g.wrong}/{g.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Các lần làm cùng 1 bài kiểm tra — thấy được tiến bộ qua từng lần.
function AttemptHistory({ history, currentId, linkPrefix }) {
  if (!history || history.length < 2) return null;
  const chronological = [...history].reverse();
  return (
    <div className="rounded-2xl bg-white p-5 shadow-elevation-1">
      <p className="flex items-center gap-2 font-display font-bold text-slate-800">
        <TrendingUp className="h-5 w-5 text-primary" /> Các lần làm bài ({history.length} lần)
      </p>
      <div className="mt-3 flex h-24 items-end gap-2">
        {chronological.map((a, idx) => {
          const pct = a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : 0;
          const isCurrent = a._id === currentId;
          return (
            <Link
              key={a._id}
              to={`${linkPrefix}${a._id}`}
              title={`Lần ${idx + 1}: ${a.score}/${a.totalQuestions}`}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs font-bold text-slate-500">{pct}%</span>
              <span
                className={cn("w-full max-w-[32px] rounded-t-md", isCurrent ? "bg-primary" : "bg-primary/30 hover:bg-primary/50")}
                style={{ height: `${Math.max(pct, 4) * 0.6}px` }}
              />
              <span className={cn("text-xs", isCurrent ? "font-bold text-primary" : "text-slate-400")}>L{idx + 1}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function QuizResultView({
  attempt,
  guest = false,
  newBadges = [],
  pointsEarned = 0,
  previousBest,
  heading,
  backTo,
  backLabel = "Quay lại chủ đề đang học",
  retryTo,
  historyLinkPrefix = "/kiem-tra/ket-qua/",
}) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const percent = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const tier = getTier(percent);
  const wrongCount = attempt.totalQuestions - attempt.score;
  const lessonId = attempt.lesson?._id || attempt.lesson;
  const isTestAttempt = !!attempt.test;
  // Điểm bài kiểm tra quy về thang 10, làm tròn 0.25 như cách chấm ở trường tiểu học.
  const score10 = attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 40) / 4 : 0;
  const resolvedBackTo = backTo || (lessonId ? `/bai/${lessonId}` : null);
  const shownAnswers = attempt.answers.map((a, idx) => ({ ...a, idx })).filter((a) => !onlyWrong || !a.correct);

  return (
    <div className="lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-6">
      <div className="space-y-4 lg:sticky lg:top-6">
        <div
          className="relative overflow-clip rounded-[2rem] p-8 text-center text-white shadow-[0_24px_50px_-24px_rgba(11,35,64,0.55)]"
          style={{
            background:
              tier.stars >= 2
                ? "linear-gradient(150deg,#34d399 0%,#10b981 50%,#0ea5e9 100%)"
                : tier.stars === 1
                ? "linear-gradient(150deg,#60a5fa 0%,#6366f1 55%,#a855f7 100%)"
                : "linear-gradient(150deg,#fb923c 0%,#f472b6 60%,#a855f7 100%)",
          }}
        >
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
          <Img3D name={tier.stars >= 2 ? "party" : "sparkles"} className="absolute left-5 top-5 h-10 w-10 animate-[float-soft_4s_ease-in-out_infinite]" />

          <div className="relative flex flex-col items-center">
            <OwlMascot className="h-28 w-28 drop-shadow-lg" covering={tier.covering} />

            <div className="mt-2 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Star
                  key={i}
                  className={cn("h-7 w-7", i < tier.stars ? "fill-amber-300 text-amber-300" : "fill-white/15 text-white/30")}
                />
              ))}
            </div>

            {heading && <p className="mt-2 text-sm font-semibold text-white/85">{heading}</p>}
            {isTestAttempt ? (
              <>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-white/80">Điểm số</p>
                <p className="font-display text-6xl font-black leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]">
                  {score10.toLocaleString("vi-VN")}
                  <span className="text-2xl text-white/70">/10</span>
                </p>
                <p className="mt-1 text-body text-white/85">
                  Đúng {attempt.score}/{attempt.totalQuestions} câu · {percent}%
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 font-display text-6xl font-black leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]">
                  {attempt.score}/{attempt.totalQuestions}
                </p>
                <p className="mt-1 text-body text-white/85">{percent}% chính xác</p>
              </>
            )}
            <p className="mt-3 rounded-full bg-white/85 px-4 py-1 font-display text-body-lg font-black text-ink">{tier.message}</p>
            {!guest && pointsEarned > 0 && (
              <span className="mt-3 flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
                <Gem className="h-4 w-4 text-amber-300" /> +{pointsEarned.toLocaleString("vi-VN")} điểm tích luỹ
              </span>
            )}
            {!guest && !pointsEarned && typeof previousBest === "number" && (
              <span className="mt-3 max-w-md rounded-2xl bg-white/15 px-4 py-2 text-center text-sm font-bold">
                <Gem className="mb-0.5 mr-1 inline h-4 w-4 text-amber-300" />
                Lần này chưa được cộng 💎 vì em chưa vượt kỷ lục cũ ({previousBest} câu đúng). Đúng nhiều hơn {previousBest} câu là được cộng
                điểm nhé!
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white p-4 shadow-elevation-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-800">{attempt.score}</p>
              <p className="text-caption text-slate-500">câu đúng</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white p-4 shadow-elevation-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
              <XCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-800">{wrongCount}</p>
              <p className="text-caption text-slate-500">câu sai</p>
            </div>
          </div>
          {attempt.durationSeconds > 0 && (
            <div className="col-span-2 flex items-center gap-2.5 rounded-2xl bg-white p-4 shadow-elevation-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold text-slate-800">
                  {Math.floor(attempt.durationSeconds / 60)} phút {attempt.durationSeconds % 60} giây
                </p>
                <p className="text-caption text-slate-500">thời gian làm bài</p>
              </div>
            </div>
          )}
        </div>

        <FeedbackPanel feedback={attempt.feedback} />
        <AttemptHistory history={attempt.history} currentId={attempt._id} linkPrefix={historyLinkPrefix} />
        {isTestAttempt && <AiReviewCard attemptId={attempt._id} />}

        {newBadges?.length > 0 && (
          <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
            <p className="flex items-center gap-1.5 font-display font-bold text-amber-700">
              <Award className="h-5 w-5" /> Huy hiệu mới!
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {newBadges.map((badge) => (
                <div
                  key={badge._id}
                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-elevation-1 ring-1 ring-amber-100"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-white">
                    <Award className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{badge.name}</p>
                    {badge.description && <p className="text-caption text-slate-500">{badge.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {guest && (
          <div className="rounded-2xl bg-vietnamese/10 p-5 ring-1 ring-vietnamese/30">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-vietnamese text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display font-bold text-slate-800">Đây là bài học thử miễn phí!</p>
            <p className="mt-1 text-caption text-slate-600">Đăng ký tài khoản để lưu kết quả và mở khoá toàn bộ bài học.</p>
            <Link
              to="/dang-ky"
              className="mt-3 flex items-center justify-center rounded-xl bg-vietnamese px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              Đăng ký ngay
            </Link>
          </div>
        )}

        <div className="hidden lg:block">
          <ActionButtons guest={guest} backTo={resolvedBackTo} backLabel={backLabel} retryTo={retryTo} />
        </div>
      </div>

      <div className="mt-8 lg:mt-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-display text-h3 text-slate-800">Xem lại bài làm</p>
          {wrongCount > 0 && (
            <div className="flex rounded-full bg-white p-1 text-sm font-bold shadow-elevation-1">
              <button
                type="button"
                onClick={() => setOnlyWrong(false)}
                className={cn("rounded-full px-3 py-1", !onlyWrong ? "bg-primary text-white" : "text-slate-500")}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setOnlyWrong(true)}
                className={cn("rounded-full px-3 py-1", onlyWrong ? "bg-red-500 text-white" : "text-slate-500")}
              >
                Câu sai ({wrongCount})
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {shownAnswers.map((answer) => {
            const idx = answer.idx;
            const q = answer.question;
            if (!q) return null;
            const isFillType = q.type === "fill_blank" || q.type === "listen_fill";
            return (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl bg-white p-5 shadow-elevation-1 ring-1",
                  answer.correct ? "ring-primary/20" : "ring-red-200"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-start gap-2.5 font-display font-bold text-slate-800">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500">
                      {idx + 1}
                    </span>
                    <span>{q.text.replace(/___/g, "…").replace(/\n/g, " ")}</span>
                  </p>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                      answer.correct ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"
                    )}
                  >
                    {answer.correct ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {answer.correct ? "Đúng" : "Sai"}
                  </span>
                </div>
                {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 h-auto max-w-full rounded-xl" />}
                {isFillType ? (
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border-2 px-3 py-2.5 font-medium",
                        answer.correct ? "border-primary bg-primary/5 text-primary" : "border-red-300 bg-red-50 text-red-600"
                      )}
                    >
                      {answer.correct ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                      Đáp án của em: {answer.textAnswer || "(bỏ trống)"}
                    </div>
                    {!answer.correct && (
                      <div className="flex items-center gap-1.5 rounded-xl border-2 border-primary bg-primary/5 px-3 py-2.5 font-medium text-primary">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Đáp án đúng: {q.correctText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {q.choices.map((choice, choiceIdx) => {
                      const isCorrect = choiceIdx === q.correctIndex;
                      const isWrongPick = choiceIdx === answer.selectedIndex && !isCorrect;
                      return (
                        <div
                          key={choiceIdx}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm font-medium",
                            isCorrect && "border-primary bg-primary/5 text-primary",
                            isWrongPick && "border-red-300 bg-red-50 text-red-600",
                            !isCorrect && !isWrongPick && "border-slate-100 bg-slate-50 text-slate-500"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              isCorrect && "bg-primary text-white",
                              isWrongPick && "bg-red-500 text-white",
                              !isCorrect && !isWrongPick && "bg-slate-200 text-slate-500"
                            )}
                          >
                            {LETTERS[choiceIdx] ?? choiceIdx + 1}
                          </span>
                          <span className="flex-1">{choice}</span>
                          {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                          {isWrongPick && <XCircle className="h-4 w-4 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.explanation && (
                  <p className="mt-3 rounded-xl bg-secondary/5 px-3 py-2 text-caption text-slate-600">
                    💡 Giải thích: {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 lg:hidden">
          <ActionButtons guest={guest} backTo={resolvedBackTo} backLabel={backLabel} retryTo={retryTo} />
        </div>
      </div>
    </div>
  );
}
