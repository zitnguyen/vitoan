import { useEffect, useState } from "react";
import { Target, Gem, CheckCircle2, Sun, CalendarDays } from "lucide-react";
import { missionService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import { cn } from "../../lib/utils";

function MissionCard({ mission, onClaim, claiming }) {
  const done = mission.progress >= mission.goalValue;
  const percent = Math.min(100, Math.round((mission.progress / mission.goalValue) * 100));

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1",
        mission.claimed ? "ring-primary/20" : done ? "ring-amber-300" : "ring-slate-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold text-slate-800">{mission.title}</p>
          <p className="mt-0.5 text-caption text-slate-500">{mission.description}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-vietnamese/10 px-2.5 py-1 text-xs font-bold text-vietnamese">
          <Gem className="h-3.5 w-3.5" /> +{mission.rewardPoints}
        </span>
      </div>

      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full transition-all", done ? "bg-amber-400" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-caption font-semibold text-slate-400">
          {Math.min(mission.progress, mission.goalValue)}/{mission.goalValue}
        </p>
      </div>

      {mission.claimed ? (
        <span className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary">
          <CheckCircle2 className="h-4 w-4" /> Đã nhận thưởng
        </span>
      ) : (
        <Button disabled={!done || claiming} onClick={() => onClaim(mission)} className="justify-center rounded-xl">
          {claiming ? "Đang nhận..." : done ? "Nhận thưởng" : "Chưa hoàn thành"}
        </Button>
      )}
    </div>
  );
}

export default function MissionsPage() {
  const { user, refreshUser } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");

  function load() {
    return missionService.list().then((res) => {
      setMissions(res.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleClaim(mission) {
    setError("");
    setClaimingId(mission._id);
    try {
      await missionService.claim(mission._id);
      await Promise.all([load(), refreshUser()]);
    } catch (err) {
      setError(err.apiMessage || "Không thể nhận thưởng lúc này");
    } finally {
      setClaimingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const daily = missions.filter((m) => m.type === "daily");
  const weekly = missions.filter((m) => m.type === "weekly");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 p-8 text-center text-white shadow-elevation-3">
          <div className="animate-blob-float absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div
            className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10"
            style={{ animation: "blob-float 7s ease-in-out infinite reverse" }}
          />
          <div className="relative flex flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Target className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-white/80">Nhiệm vụ</p>
            <p className="mt-1 flex items-center gap-2 font-display text-h1 leading-none">
              <Gem className="h-8 w-8" /> {user?.points ?? 0}
            </p>
            <p className="mt-2 text-body text-white/85">điểm thưởng hiện có</p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-600">{error}</p>
        )}

        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 font-display text-h3 text-slate-800">
            <Sun className="h-5 w-5 text-amber-500" /> Nhiệm vụ hằng ngày
          </h2>
          {daily.length === 0 ? (
            <p className="mt-3 text-caption text-slate-500">Chưa có nhiệm vụ hằng ngày nào.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {daily.map((m) => (
                <MissionCard key={m._id} mission={m} onClaim={handleClaim} claiming={claimingId === m._id} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 font-display text-h3 text-slate-800">
            <CalendarDays className="h-5 w-5 text-secondary" /> Nhiệm vụ hằng tuần
          </h2>
          {weekly.length === 0 ? (
            <p className="mt-3 text-caption text-slate-500">Chưa có nhiệm vụ hằng tuần nào.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {weekly.map((m) => (
                <MissionCard key={m._id} mission={m} onClaim={handleClaim} claiming={claimingId === m._id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
