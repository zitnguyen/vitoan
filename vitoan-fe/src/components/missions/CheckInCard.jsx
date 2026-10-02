import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { checkinService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { cn } from "../../lib/utils";
import { Img3D } from "../../lib/icons3d.jsx";
import { Confetti } from "../landing/LandingFx.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import Spinner from "../ui/Spinner.jsx";

// Điểm danh hằng ngày: vòng 7 ngày, thưởng tăng dần, ngày 7 là hộp quà lớn.
// compact = bản gọn cho trang chủ. onCheckedIn: gọi lại sau khi điểm danh (để tải lại nhiệm vụ…).

function Celebration({ reward, onClose }) {
  if (!reward) return null;
  // Gắn thẳng vào <body>: nếu nằm trong thẻ (overflow-clip) thì pháo giấy làm thẻ bị cuộn lệch
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b2340]/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm animate-pop-in rounded-[2rem] bg-white px-6 pb-7 pt-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Confetti burst={reward.key} count={42} />
        <OwlMascot className="mx-auto h-28 w-28" />
        <p className="mt-2 font-display text-2xl font-black text-[#0b2340]">{reward.streak > 1 ? `${reward.streak} ngày liên tiếp!` : "Điểm danh thành công!"}</p>
        <p className="mt-3 flex items-center justify-center gap-2 font-display text-5xl font-black text-sky-500">
          +{reward.points} <Img3D name="gem" className="h-12 w-12" />
        </p>
        <p className="mt-3 font-semibold text-slate-500">{reward.streak % 7 === 0 ? "Em đã mở hộp quà lớn ngày 7! Siêu quá!" : "Mai nhớ quay lại để giữ chuỗi và nhận nhiều quà hơn nhé!"}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-primary py-3 font-display text-lg font-black text-white shadow-[0_5px_0_0_#049245] transition hover:-translate-y-0.5"
        >
          Tuyệt vời!
        </button>
      </div>
    </div>,
    document.body
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

  // Vị trí hôm nay trong vòng 7 ngày; chưa điểm danh thì hôm nay là ngày sắp mở
  const today = st.cycleDay;
  const button = st.checkedToday ? (
    <span className="flex items-center justify-center gap-2 rounded-full bg-green-100 px-6 py-3 font-black text-green-700">
      <Img3D name="check" className="h-6 w-6" /> Đã điểm danh — mai quay lại nhé!
    </span>
  ) : (
    <button
      type="button"
      disabled={busy}
      onClick={handleCheckIn}
      className="btn-shine flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3 font-display text-lg font-black text-white shadow-[0_5px_0_0_#c2410c] transition hover:-translate-y-0.5 disabled:opacity-60"
    >
      {busy ? "Đang điểm danh..." : <>Điểm danh nhận +{st.todayReward} <Img3D name="gem" className="h-6 w-6" /></>}
    </button>
  );

  return (
    <section className={cn("relative overflow-clip rounded-[2rem] shadow-elevation-2", compact ? "p-5" : "p-6 sm:p-7")} style={{ background: "linear-gradient(120deg,#fff4d1 0%,#ffe6cf 50%,#ffe0ec 100%)" }}>
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Img3D name="calendar" className={compact ? "h-12 w-12" : "h-14 w-14"} />
          <div>
            <h2 className={cn("font-display font-black text-[#0b2340]", compact ? "text-xl" : "text-2xl")}>Điểm danh hằng ngày</h2>
            <p className="text-sm font-bold text-slate-500">Điểm danh liên tiếp để nhận quà to hơn mỗi ngày!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1.5 font-black text-orange-500 shadow-sm">
            <Img3D name="fire" className="h-6 w-6" /> {st.streak} ngày liên tiếp
          </span>
          {!compact && (
            <span className="hidden items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1.5 font-black text-amber-600 shadow-sm sm:flex">
              <Img3D name="trophy" className="h-5 w-5" /> Kỷ lục {st.bestStreak}
            </span>
          )}
        </div>
      </div>

      {/* Dải 7 ngày */}
      <div className="relative mt-5 grid grid-cols-7 gap-1.5 sm:gap-3">
        {st.rewards.map((pts, i) => {
          const day = i + 1;
          const done = day < today || (day === today && st.checkedToday);
          const isToday = day === today && !st.checkedToday;
          const big = day === 7;
          return (
            <div
              key={day}
              className={cn(
                "relative flex flex-col items-center rounded-2xl px-1 py-2.5 text-center transition sm:py-3",
                done ? "bg-green-50 ring-2 ring-green-300" : isToday ? "bg-white shadow-lg ring-4 ring-amber-300" : "bg-white/70",
                isToday && "animate-[float-soft_2.5s_ease-in-out_infinite]",
                big && !done && "bg-gradient-to-b from-fuchsia-50 to-pink-100"
              )}
            >
              <span className={cn("text-[11px] font-black uppercase sm:text-xs", isToday ? "text-amber-600" : "text-slate-400")}>{isToday ? "Hôm nay" : `Ngày ${day}`}</span>
              <span className="relative my-1.5">
                <Img3D name={big ? "gift" : "gem"} className={cn(big ? "h-10 w-10 sm:h-12 sm:w-12" : "h-7 w-7 sm:h-9 sm:w-9", !done && !isToday && "opacity-70")} />
                {done && <Img3D name="check" className="absolute -bottom-1 -right-2 h-5 w-5" />}
              </span>
              <span className={cn("font-display text-sm font-black sm:text-base", done ? "text-green-600" : big ? "text-fuchsia-600" : "text-sky-600")}>+{pts}</span>
            </div>
          );
        })}
      </div>

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">
          {st.checkedToday ? `Hôm nay em nhận ${st.todayReward} 💎.` : "Bỏ lỡ 1 ngày là chuỗi bắt đầu lại từ ngày 1 đó!"} Đã điểm danh tổng cộng {st.totalDays} ngày.
        </p>
        {button}
      </div>

      <Celebration reward={reward} onClose={() => setReward(null)} />
    </section>
  );
}
