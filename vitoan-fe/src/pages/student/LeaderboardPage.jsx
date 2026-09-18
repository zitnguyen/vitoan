import { useEffect, useState } from "react";
import { Trophy, Medal, User } from "lucide-react";
import { userService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const MEDAL_COLOR = ["text-amber-400", "text-slate-400", "text-orange-400"];

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-center text-white shadow-elevation-3">
          <div className="animate-blob-float absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div
            className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10"
            style={{ animation: "blob-float 7s ease-in-out infinite reverse" }}
          />
          <div className="relative flex flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Trophy className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <p className="mt-3 font-display text-h2">Bảng xếp hạng lớp</p>
            <p className="mt-1 text-body text-white/85">Thi đua cùng các bạn trong lớp nhé!</p>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {[1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSemester(s)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold transition",
                semester === s ? "bg-primary text-white shadow-elevation-1" : "bg-white text-slate-600 ring-1 ring-slate-200"
              )}
            >
              Học kỳ {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <Spinner />
          </div>
        ) : rankings.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
            Chưa có dữ liệu xếp hạng cho lớp của em.
          </p>
        ) : (
          <div className="mt-6 space-y-2.5">
            {rankings.map((r, idx) => (
              <div
                key={r._id}
                className={cn(
                  "flex items-center gap-4 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1",
                  r.isMe ? "ring-primary/40" : "ring-slate-100"
                )}
              >
                <span className="flex w-8 shrink-0 items-center justify-center font-display text-lg font-extrabold text-slate-400">
                  {idx < 3 ? <Medal className={cn("h-6 w-6", MEDAL_COLOR[idx])} /> : idx + 1}
                </span>
                {r.avatarUrl ? (
                  <img src={r.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-display font-bold", r.isMe ? "text-primary" : "text-slate-800")}>
                    {r.fullName} {r.isMe && "(Bạn)"}
                  </p>
                </div>
                <span className="shrink-0 font-display text-lg font-extrabold text-primary">{r.score} điểm</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
