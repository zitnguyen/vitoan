import { useEffect, useState } from "react";
import { Trophy, Medal } from "../../components/ui/icons.jsx";
import { userService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import UserAvatar from "../../components/common/UserAvatar.jsx";
import UserName from "../../components/common/UserName.jsx";
import FloatingIsland from "../../components/common/FloatingIsland.jsx";
import { Img3D } from "../../lib/icons3d.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";

// Bảng xếp hạng lớp: bục top 3 trên "đảo nổi" giữa bầu trời, các bạn còn lại xếp bên dưới.
const MEDAL_BG = ["bg-amber-300 text-amber-900", "bg-slate-200 text-slate-700", "bg-orange-300 text-orange-900"];

function PodiumPerson({ r, first }) {
  return (
    <div className="flex flex-col items-center text-center">
      {first && <Img3D name="crown" className="-mb-1 h-11 w-11 animate-[float-soft_4s_ease-in-out_infinite]" />}
      <div className={cn("relative rounded-full bg-white p-1.5 shadow-lg", r.isMe && "ring-4 ring-primary")}>
        <UserAvatar user={r} size={first ? "h-24 w-24" : "h-20 w-20"} decoSize="text-sm" />
        <span className={cn("absolute -bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-sm font-black ring-4 ring-white", MEDAL_BG[r.rank - 1] || MEDAL_BG[2])}>
          {r.rank}
        </span>
      </div>
      <p className="mt-4 line-clamp-2 max-w-[10rem] font-display text-lg font-black leading-tight text-white [text-shadow:0_2px_6px_rgba(11,35,64,0.35)]">
        {r.fullName}
        {r.isMe && " (em)"}
      </p>
      <p className="mt-1 rounded-full bg-white/25 px-3 py-0.5 text-sm font-black text-white">{r.score} điểm</p>
    </div>
  );
}

export default function LeaderboardPage() {
  const [semester, setSemester] = useState(1);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    userService.leaderboard(semester).then((res) => {
      setRankings(res.data);
      setLoading(false);
    });
  }, [semester]);

  const me = rankings.find((r) => r.isMe);
  // Bục chỉ dành cho các bạn đã có điểm
  const top = rankings.filter((r) => r.score > 0).slice(0, 3);
  const podium = [top[1], top[0], top[2]]; // hạng 2 — hạng 1 — hạng 3
  const rest = rankings.filter((r) => !top.includes(r));

  return (
    <div className="min-h-screen">
      <div className="page">
        <PageHeader
          icon={Trophy}
          tone="amber"
          title="Bảng xếp hạng lớp"
          subtitle="Thi đua cùng các bạn trong lớp — ai chăm chỉ nhất sẽ đứng trên bục vàng!"
          right={me && <HeaderStat icon={Medal} value={`#${me.rank}`} label={`${me.score} điểm học tập`} />}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <button key={s} type="button" onClick={() => setSemester(s)} className={cn("pill", semester === s && "pill-active")}>
                Học kỳ {s}
              </button>
            ))}
          </div>
          <p className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
            <Img3D name="info" className="h-5 w-5" />
            Điểm = số câu đúng ở lần làm tốt nhất của mỗi bộ luyện tập
          </p>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Spinner />
          </div>
        ) : rankings.length === 0 ? (
          <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-elevation-1">
            <OwlMascot className="mx-auto h-28 w-28" />
            <p className="mt-3 font-display text-xl font-black text-[#0b2340]">Chưa có dữ liệu xếp hạng</p>
          </div>
        ) : (
          <>
            {/* Bục vinh danh */}
            <section className="relative mt-6 overflow-hidden rounded-[2rem] px-4 pb-6 pt-10 sm:px-8" style={{ background: "linear-gradient(180deg,#3b9cf2 0%,#5fb2f6 50%,#8fcbfa 100%)" }}>
              <Img3D name="cloud" className="absolute left-[4%] top-6 hidden w-28 opacity-90 sm:block" />
              <Img3D name="cloud" className="absolute right-[5%] top-16 hidden w-36 opacity-80 sm:block" />
              {top.length === 0 ? (
                <div className="relative py-8 text-center">
                  <Img3D name="trophy" className="mx-auto h-20 w-20" />
                  <p className="mt-3 font-display text-2xl font-black text-white">Bục vàng đang chờ em!</p>
                  <p className="mt-1 font-semibold text-white/90">Chưa bạn nào ghi điểm học kỳ này — luyện tập để là người đầu tiên nhé.</p>
                </div>
              ) : (
                <div className="relative mx-auto grid max-w-3xl grid-cols-3 items-end gap-2 sm:gap-8">
                  {podium.map((r, i) => (
                    <div key={i} className={cn("flex flex-col items-center", i === 0 && "sm:pt-10", i === 2 && "sm:pt-16")}>
                      {r ? <PodiumPerson r={r} first={i === 1} /> : <div className="h-24" />}
                      <div className="-mt-1 w-full">
                        <FloatingIsland place={[2, 1, 3][i]} scale={[0.9, 1.05, 0.82][i]} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Các bạn còn lại */}
            {rest.length > 0 && (
              <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
                {rest.map((r) => (
                  <div
                    key={r._id}
                    className={cn("flex items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-elevation-1 transition hover:-translate-y-0.5", r.isMe && "ring-2 ring-primary")}
                  >
                    <span className="w-8 shrink-0 text-center font-display text-xl font-black text-slate-300">{String(r.rank).padStart(2, "0")}</span>
                    <UserAvatar user={r} size="h-12 w-12" decoSize="text-sm" />
                    <div className="min-w-0 flex-1">
                      <UserName user={r} name={`${r.fullName}${r.isMe ? " (em)" : ""}`} className="text-lg" />
                      <p className="text-sm font-semibold text-slate-400">{r.sets > 0 ? `Đã luyện ${r.sets} bộ bài` : "Chưa luyện tập học kỳ này"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 font-display font-black text-primary">{r.score} điểm</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
