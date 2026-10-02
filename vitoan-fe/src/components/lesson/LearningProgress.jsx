import { Link } from "react-router-dom";
import { CheckCircle2, PlayCircle, BookOpen, PenLine, ChevronRight } from "../ui/icons.jsx";
import { cn } from "../../lib/utils";
import { formatClock } from "../../lib/youtube.js";

function StepRow({ Icon, title, done, percent, detail, sub, action }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          done ? "bg-green-500 text-white" : percent > 0 ? "bg-amber-100 text-amber-600" : "bg-white text-slate-400 ring-1 ring-slate-200"
        )}
      >
        {done ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-800">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className={cn("h-full rounded-full transition-all", done ? "bg-green-500" : "bg-amber-400")} style={{ width: `${percent}%` }} />
          </div>
          <span className={cn("shrink-0 text-sm font-bold", done ? "text-green-600" : percent > 0 ? "text-amber-600" : "text-slate-400")}>
            {detail}
          </span>
        </div>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Khung "Em đã học được bao nhiêu" của 1 bài học: tổng % + từng bước (video, lý thuyết, luyện tập).
 * learning = kết quả API /attempts/learning.
 */
export default function LearningProgress({ learning, practiceTo, onGoTheory, onGoVideo }) {
  if (!learning) return null;
  const { percent, steps, completed, passPercent } = learning;
  const p = steps.practice;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-elevation-1">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${completed ? "#22c55e" : "#00b14f"} ${percent * 3.6}deg, #e2e8f0 0deg)` }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white font-display text-xl font-extrabold text-slate-800">
            {percent}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-h3 text-slate-800">
            {completed ? "Em đã học xong bài này! 🎉" : percent > 0 ? `Em đã học được ${percent}% bài này` : "Bắt đầu học bài này nhé!"}
          </p>
          <p className="text-slate-500">
            {completed
              ? "Có thể xem lại video hoặc luyện tập thêm để nhớ lâu hơn."
              : `Xem video, đọc kiến thức cần nhớ rồi luyện tập đạt từ ${passPercent}% để hoàn thành bài.`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {steps.video && (
          <StepRow
            Icon={PlayCircle}
            title="Xem video"
            done={steps.video.done}
            percent={steps.video.percent}
            detail={steps.video.done ? "Xong" : steps.video.percent > 0 ? `${steps.video.percent}%` : "Chưa xem"}
            sub={
              steps.video.duration > 0 && (steps.video.watchedSeconds > 0 || steps.video.position > 0)
                ? `Đã xem ${formatClock(steps.video.watchedSeconds)} / ${formatClock(steps.video.duration)}`
                : null
            }
            action={
              !steps.video.done && (
                <button type="button" onClick={onGoVideo} className="shrink-0 text-sm font-bold text-primary hover:underline">
                  Xem
                </button>
              )
            }
          />
        )}
        {steps.theory && (
          <StepRow
            Icon={BookOpen}
            title="Đọc kiến thức"
            done={steps.theory.done}
            percent={steps.theory.percent}
            detail={steps.theory.done ? "Xong" : "Chưa đọc"}
            action={
              !steps.theory.done && (
                <button type="button" onClick={onGoTheory} className="shrink-0 text-sm font-bold text-primary hover:underline">
                  Đọc
                </button>
              )
            }
          />
        )}
        {p && (
          <StepRow
            Icon={PenLine}
            title="Luyện tập"
            done={p.done}
            percent={p.percent}
            detail={
              p.done
                ? `Đạt ${p.bestPercent}%`
                : p.inProgress
                ? `Đã làm ${p.answered}/${p.total} câu`
                : p.bestPercent !== null
                ? `Cao nhất ${p.bestPercent}%`
                : "Chưa làm"
            }
            action={
              practiceTo && (
                <Link to={practiceTo} className="flex shrink-0 items-center text-sm font-bold text-primary hover:underline">
                  {p.inProgress ? "Làm tiếp" : p.done ? "Luyện lại" : "Làm"} <ChevronRight className="h-4 w-4" />
                </Link>
              )
            }
          />
        )}
      </div>
    </div>
  );
}
