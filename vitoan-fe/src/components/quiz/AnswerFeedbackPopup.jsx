import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, Send, Eye } from "../ui/icons.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { cn } from "../../lib/utils";

const PRAISE = ["Chính xác! Em giỏi quá! 🎉", "Tuyệt vời! Đúng rồi! ⭐", "Giỏi lắm! Em làm đúng rồi! 🌟", "Hoan hô! Chính xác! 👏"];

/**
 * Popup thông báo kết quả sau khi bấm "Kiểm tra": đúng → khen + đi tiếp;
 * sai → đáp án đúng + giải thích. Enter = nút chính, Esc/bấm nền = xem lại câu.
 */
export default function AnswerFeedbackPopup({ result, correctAnswer, primaryLabel, primaryIcon = "next", onPrimary, onClose, busy }) {
  const primaryRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const correct = !!result?.correct;

  // Chỉ chạy 1 lần khi mở (trang làm bài re-render mỗi giây vì đồng hồ).
  useEffect(() => {
    primaryRef.current?.focus();
    function onKey(e) {
      if (e.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!result) return null;
  const praise = PRAISE[(correctAnswer || "").length % PRAISE.length];

  return (
    <div className="feedback-fade fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="feedback-pop w-full max-w-lg overflow-clip rounded-[2rem] bg-white shadow-[0_30px_70px_-20px_rgba(11,35,64,0.55)]"
      >
        {/* Đầu popup: màu theo đúng / sai */}
        <div className={cn("relative flex items-center gap-4 px-6 pb-5 pt-6", correct ? "bg-gradient-to-br from-emerald-400 to-primary" : "bg-gradient-to-br from-rose-400 to-red-500")}>
          <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15" />
          <div className="relative shrink-0 rounded-full bg-white/90 p-1.5 shadow-elevation-1">
            <OwlMascot className="h-16 w-16" animated={correct} covering={!correct} />
          </div>
          <div className="relative min-w-0 text-white">
            <p className="flex items-center gap-1.5 font-display text-h3 leading-tight">
              {correct ? <CheckCircle2 className="h-7 w-7 shrink-0" /> : <XCircle className="h-7 w-7 shrink-0" />}
              {correct ? praise : "Chưa đúng rồi!"}
            </p>
            <p className="mt-1 text-body text-white/90">{correct ? "Tiếp tục phát huy nhé!" : "Không sao cả, cùng xem đáp án đúng nhé."}</p>
          </div>
        </div>

        {/* Thân popup: chỉ câu sai mới cần đáp án + giải thích */}
        {!correct && (
          <div className="space-y-3 px-6 pt-5">
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
              <p className="text-body text-slate-700">
                Đáp án đúng: <span className="font-display text-xl font-extrabold text-emerald-600">{correctAnswer}</span>
              </p>
            </div>
            {result.explanation && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
                <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-amber-700">
                  <Lightbulb className="h-4 w-4 fill-amber-300 text-amber-500" /> Giải thích
                </p>
                <p className="mt-1 text-body leading-relaxed text-slate-700">{result.explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-full px-5 py-3 font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" /> Xem lại câu này
          </button>
          <button
            ref={primaryRef}
            type="button"
            disabled={busy}
            onClick={onPrimary}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full px-7 py-3 text-lg font-extrabold text-white shadow-elevation-1 transition disabled:opacity-60",
              correct ? "bg-primary hover:bg-primary-dark" : "bg-secondary hover:bg-blue-600"
            )}
          >
            {primaryIcon === "submit" && <Send className="h-5 w-5" />}
            {primaryLabel}
            {primaryIcon === "next" && <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
