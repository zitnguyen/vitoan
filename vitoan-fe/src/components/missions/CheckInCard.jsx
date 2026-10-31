import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { checkinService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { cn } from "../../lib/utils";
import { Img3D } from "../../lib/icons3d.jsx";
import { Confetti } from "../landing/LandingFx.jsx";
import Spinner from "../ui/Spinner.jsx";

// Điểm danh hằng ngày kiểu "nhận quà mỗi ngày": 7 ô quà trên một thanh tiến độ, thưởng tăng dần,
// ngày 7 là hộp quà lớn. compact = bản gọn cho trang chủ. onCheckedIn: gọi lại sau khi điểm danh.

// Màn nhận thưởng: món quà phóng to giữa vầng sáng xoay nhẹ
function Celebration({ reward, onClose }) {
  if (!reward) return null;
  const big = reward.streak % 7 === 0;
  // Gắn thẳng vào <body> để không bị khung thẻ cắt / cuộn lệch
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b2340]/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm animate-pop-in overflow-clip rounded-[2rem] bg-white px-6 pb-7 pt-10 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Confetti burst={reward.key} count={18} />
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 animate-[spin_12s_linear_infinite] rounded-full opacity-70"
            style={{ background: "repeating-conic-gradient(#fde68a 0deg 12deg, transparent 12deg 30deg)", WebkitMaskImage: "radial-gradient(circle, #000 35%, transparent 70%)", maskImage: "radial-gradient(circle, #000 35%, transparent 70%)" }}
          />
          <Img3D name={big ? "gift" : "gem"} className="relative h-24 w-24 drop-shadow-[0_12px_16px_rgba(11,35,64,0.25)]" />
        </div>
        <p className="mt-1 text-sm font-black uppercase tracking-wider text-amber-500">{big ? "Hộp quà ngày 7" : `Ngày ${((reward.streak - 1) % 7) + 1}`}</p>
        <p className="mt-1 font-display text-5xl font-black text-[#0b2340]">+{reward.points}</p>
        <p className="mt-1 font-bold text-slate-500">điểm thưởng đã vào túi của em</p>
        {reward.streak > 1 && (
          <p className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-black text-orange-500">
            <Img3D name="fire" className="h-5 w-5" /> {reward.streak} ngày liên tiếp
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-primary py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5"
        >
          Nhận quà
        </button>
      </div>
    </div>,
    document.body
  );
}

// Một ô quà trong vòng 7 ngày
function DayTile({ day, points, state, compact }) {
  const big = day === 7;
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={cn(
          "relative flex w-full flex-col items-center justify-center rounded-2xl transition",
          compact ? "h-[4.6rem]" : "h-24",
          state === "done" && "bg-gradient-to-b from-emerald-400 to-green-500 text-white shadow-[0_6px_14px_-6px_rgba(22,163,74,0.7)]",
          state === "today" && "bg-white ring-[3px] ring-amber-400 shadow-[0_0_0_6px_rgba(251,191,36,0.18),0_10px_22px_-8px_rgba(245,158,11,0.55)]",
          state === "future" && (big ? "bg-gradient-to-b from-fuchsia-50 to-pink-100" : "bg-slate-50")
        )}
      >
        {state === "done" ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25">
            <Check className="h-5 w-5" strokeWidth={3.5} />
          </span>
        ) : (
          <Img3D name={big ? "gift" : "gem"} className={cn(big ? (compact ? "h-9 w-9" : "h-11 w-11") : compact ? "h-7 w-7" : "h-8 w-8", state === "future" && !big && "opacity-60")} />
        )}
        <span className={cn("mt-1 font-display font-black", compact ? "text-xs" : "text-sm", state === "done" ? "text-white" : big ? "text-fuchsia-600" : state === "today" ? "text-amber-600" : "text-slate-500")}>
          +{points}
        </span>
      </div>
      <span className={cn("mt-1.5 text-xs font-black sm:text-xs", state === "today" ? "text-amber-600" : state === "done" ? "text-green-600" : "text-slate-400")}>
        {state === "today" ? "Hôm nay" : `Ngày ${day}`}
      </span>
    </div>
  );
}

export default function CheckInCard({ compact = false, onCheckedIn }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState(null);

  useEffect(() => {
    checkinService
      .status()
      .then((res) => setSt(res.data))
      .catch(() => setSt(false));
  }, []);

  async function handleCheckIn() {
    setBusy(true);
    try {
      const res = await checkinService.checkIn();
      setSt(res.data.status);
      setReward({ key: Date.now(), points: res.data.rewardPoints, streak: res.data.streak });
      await refreshUser?.();
      onCheckedIn?.();
    } catch (err) {
      toast?.error?.(err.apiMessage || "Chưa điểm danh được, em thử lại nhé!");
    } finally {
      setBusy(false);
    }
  }

  if (st === false) return null;
  if (!st) {
    return (
      <div className="flex justify-center rounded-[1.75rem] bg-white p-8 shadow-elevation-1">
        <Spinner />
      </div>
    );
  }

  const today = st.cycleDay; // vị trí hôm nay trong vòng 7 ngày
  const doneCount = st.checkedToday ? today : today - 1;
  const stateOf = (day) => (day <= doneCount ? "done" : day === today && !st.checkedToday ? "today" : "future");

  return (
    <section className={cn("rounded-[1.75rem] bg-white shadow-elevation-2", compact ? "p-5" : "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={cn("font-display font-black text-[#0b2340]", compact ? "text-xl" : "text-2xl")}>Điểm danh nhận quà</h2>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">Vào học mỗi ngày — ngày thứ 7 liên tiếp nhận hộp quà lớn!</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3.5 py-1.5 text-sm font-black text-orange-500">
          <Img3D name="fire" className="h-5 w-5" /> {st.activeStreak ?? st.streak} ngày liên tiếp
        </span>
      </div>

      {/* 7 ô quà trên một thanh tiến độ */}
      <div className="relative mt-5">
        <div aria-hidden className={cn("absolute inset-x-[7%] h-1.5 rounded-full bg-slate-100", compact ? "top-[2.3rem]" : "top-12")}>
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700" style={{ width: `${(Math.max(0, doneCount - 1) / 6) * 100}%` }} />
        </div>
        <div className={cn("relative grid grid-cols-7", compact ? "gap-1.5" : "gap-2 sm:gap-3")}>
          {st.rewards.map((pts, i) => (
            <DayTile key={i} day={i + 1} points={pts} state={stateOf(i + 1)} compact={compact} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-400">
          {st.checkedToday ? "Mai quay lại để giữ chuỗi nhé!" : "Bỏ lỡ 1 ngày là chuỗi quay về ngày 1."}
          {!compact && ` · Kỷ lục ${st.bestStreak} ngày · Tổng ${st.totalDays} ngày`}
        </p>
        {st.checkedToday ? (
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-500">
            <Check className="h-4 w-4 text-green-600" strokeWidth={3} /> Đã nhận quà hôm nay
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={handleCheckIn}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 font-display text-base font-black text-white shadow-[0_4px_0_0_#c2410c] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
          >
            {busy ? "Đang nhận..." : `Điểm danh nhận +${st.todayReward}`}
          </button>
        )}
      </div>

      <Celebration reward={reward} onClose={() => setReward(null)} />
    </section>
  );
}
