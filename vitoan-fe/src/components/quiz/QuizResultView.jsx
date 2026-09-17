import { Link } from "react-router-dom";
import { Home, History, Trophy, CheckCircle2, XCircle, Sparkles, Award } from "lucide-react";
import { cn } from "../../lib/utils";

export default function QuizResultView({ attempt, guest = false, newBadges = [] }) {
  const percent = Math.round((attempt.score / attempt.totalQuestions) * 100);

  return (
    <div>
      <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-primary to-secondary p-8 text-center text-white shadow-elevation-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Trophy className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-white/80">Kết quả</p>
        <p className="mt-1 font-display text-h1 leading-none">
          {attempt.score}/{attempt.totalQuestions}
        </p>
        <p className="mt-2 text-body text-white/85">{percent}% chính xác</p>
      </div>

      {newBadges?.length > 0 && (
        <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
          <p className="flex items-center gap-1.5 font-display font-bold text-amber-700">
            <Award className="h-5 w-5" /> Chúc mừng! Em vừa đạt huy hiệu mới
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
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-vietnamese/10 p-5 ring-1 ring-vietnamese/30">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vietnamese text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-display font-bold text-slate-800">Đây là bài học thử miễn phí!</p>
            <p className="text-caption text-slate-600">Đăng ký tài khoản để lưu kết quả và mở khoá toàn bộ bài học.</p>
          </div>
          <Link
            to="/dang-ky"
            className="shrink-0 whitespace-nowrap rounded-xl bg-vietnamese px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Đăng ký ngay
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {attempt.answers.map((answer, idx) => {
          const q = answer.question;
          if (!q) return null;
          const isFillType = q.type === "fill_blank" || q.type === "listen_fill";
          return (
            <div key={idx} className="rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100">
              <p className="font-display font-bold text-slate-800">
                Câu {idx + 1}: {q.text.replace(/___/g, "…").replace(/\n/g, " ")}
              </p>
              {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 h-auto max-w-full" />}
              {isFillType ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2",
                      answer.correct ? "border-primary bg-primary/5 text-primary" : "border-red-400 bg-red-50 text-red-600"
                    )}
                  >
                    {answer.correct ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                    Đáp án của em: {answer.textAnswer || "(bỏ trống)"}
                  </div>
                  {!answer.correct && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary/5 px-3 py-2 text-primary">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Đáp án đúng: {q.correctText}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.choices.map((choice, choiceIdx) => {
                    const isCorrect = choiceIdx === q.correctIndex;
                    const isWrongPick = choiceIdx === answer.selectedIndex && !isCorrect;
                    return (
                      <div
                        key={choiceIdx}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm",
                          isCorrect && "border-primary bg-primary/5 text-primary",
                          isWrongPick && "border-red-400 bg-red-50 text-red-600"
                        )}
                      >
                        {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        {isWrongPick && <XCircle className="h-4 w-4 shrink-0" />}
                        {choice}
                      </div>
                    );
                  })}
                </div>
              )}
              {q.explanation && (
                <p className="mt-3 text-caption text-slate-500">Giải thích: {q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
        >
          <Home className="h-4 w-4" /> Về trang chủ
        </Link>
        {!guest && (
          <Link
            to="/lich-su"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-elevation-1 hover:bg-primary-dark"
          >
            <History className="h-4 w-4" /> Xem lịch sử làm bài
          </Link>
        )}
      </div>
    </div>
  );
}
