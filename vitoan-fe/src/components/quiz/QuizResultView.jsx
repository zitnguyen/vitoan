import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, History, Star, CheckCircle2, XCircle, Sparkles, Award, ArrowLeft, Bot } from "lucide-react";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { testAttemptService } from "../../api/services";
import { cn } from "../../lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function getTier(percent) {
  if (percent >= 90) return { stars: 3, message: "Xuất sắc lắm! Em thật giỏi! 🎉", covering: false };
  if (percent >= 70) return { stars: 2, message: "Giỏi lắm! Cố thêm chút nữa nhé! 👏", covering: false };
  if (percent >= 40) return { stars: 1, message: "Em làm tốt rồi, luyện thêm sẽ giỏi hơn! 💪", covering: false };
  return { stars: 0, message: "Đừng buồn nhé, mình cùng luyện lại nào! 🌟", covering: true };
}

function ActionButtons({ guest, lessonId }) {
  return (
    <div className="flex flex-col gap-2.5">
      {lessonId && (
        <Link
          to={`/bai/${lessonId}`}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-elevation-2 transition hover:bg-primary-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại chủ đề đang học
        </Link>
      )}
      {!guest && (
        <Link
          to="/lich-su"
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-2xl px-5 py-3 text-sm font-bold transition",
            lessonId
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

export default function QuizResultView({ attempt, guest = false, newBadges = [] }) {
  const percent = Math.round((attempt.score / attempt.totalQuestions) * 100);
  const tier = getTier(percent);
  const wrongCount = attempt.totalQuestions - attempt.score;
  const lessonId = attempt.lesson?._id || attempt.lesson;
  const isTestAttempt = !!attempt.test;

  return (
    <div className="lg:grid lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-8">
      <div className="space-y-6 lg:sticky lg:top-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-8 text-center text-white shadow-elevation-3">
          <div className="animate-blob-float absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div
            className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10"
            style={{ animation: "blob-float 7s ease-in-out infinite reverse" }}
          />

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

            <p className="mt-3 font-display text-h1 leading-none">
              {attempt.score}/{attempt.totalQuestions}
            </p>
            <p className="mt-1 text-body text-white/85">{percent}% chính xác</p>
            <p className="mt-3 font-display text-body-lg font-bold">{tier.message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-800">{attempt.score}</p>
              <p className="text-caption text-slate-500">câu đúng</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
              <XCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-slate-800">{wrongCount}</p>
              <p className="text-caption text-slate-500">câu sai</p>
            </div>
          </div>
        </div>

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
          <ActionButtons guest={guest} lessonId={lessonId} />
        </div>
      </div>

      <div className="mt-8 lg:mt-0">
        <p className="mb-4 font-display text-h3 text-slate-800">Xem lại bài làm</p>

        <div className="space-y-4">
          {attempt.answers.map((answer, idx) => {
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

        <div className="mt-8 lg:hidden">
          <ActionButtons guest={guest} lessonId={lessonId} />
        </div>
      </div>
    </div>
  );
}
