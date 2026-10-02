import { useEffect, useState } from "react";
import { Target, Gem, Sun, CalendarDays, ArrowRight } from "../../components/ui/icons.jsx";
import { missionService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import { cn } from "../../lib/utils";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import { Img3D } from "../../lib/icons3d.jsx";
import CheckInCard from "../../components/missions/CheckInCard.jsx";

// Hình 3D theo loại nhiệm vụ
const GOAL_ICON = {
  attempts_count: "pencil",
  lessons_completed: "books",
  perfect_score: "hundred",
  checkin_days: "calendar",
  tests_completed: "clipboard",
  correct_answers: "brain",
};

function MissionCard({ mission, onClaim, claiming, learnTo }) {
  const done = mission.progress >= mission.goalValue;
  const percent = Math.min(100, Math.round((mission.progress / mission.goalValue) * 100));

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-clip rounded-[1.75rem] p-5 shadow-elevation-1 transition hover:-translate-y-0.5",
        mission.claimed ? "bg-slate-50" : done ? "bg-gradient-to-br from-amber-50 to-yellow-100 ring-2 ring-amber-300" : "bg-white"
      )}
    >
      {done && !mission.claimed && <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/60 blur-xl" />}
      <div className="relative flex items-start gap-4">
        <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl", mission.claimed ? "bg-green-50" : "bg-gradient-to-br from-violet-50 to-sky-50")}>
          <Img3D name={mission.claimed ? "check" : GOAL_ICON[mission.goalType] || "target"} className="h-11 w-11" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-black text-[#0b2340]">{mission.title}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">{mission.description}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-black text-sky-600 shadow-sm">
          <Img3D name="gem" className="h-5 w-5" /> +{mission.rewardPoints}
        </span>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="h-3 flex-1 overflow-clip rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full transition-all duration-700", done ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-primary to-lime-400")}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-black text-slate-500">
          {Math.min(mission.progress, mission.goalValue)}/{mission.goalValue}
        </span>
      </div>

      {mission.claimed ? (
        <span className="relative flex items-center justify-center gap-2 rounded-full bg-green-100 py-2.5 text-sm font-black text-green-700">
          <Img3D name="check" className="h-5 w-5" /> Đã nhận thưởng
        </span>
      ) : done ? (
        <button
          type="button"
          disabled={claiming}
          onClick={() => onClaim(mission)}
          className="btn-shine relative flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 py-3 font-black text-white shadow-[0_4px_0_0_#d97706] transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Img3D name="gift" className="h-6 w-6" /> {claiming ? "Đang nhận..." : "Nhận thưởng"}
        </button>
      ) : (
        <Button to={learnTo} variant="outline" className="relative justify-center rounded-full py-2.5">
          Còn {mission.goalValue - mission.progress} nữa — đi làm ngay <ArrowRight className="h-4 w-4" />
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
  const learnTo = user?.grade?.slug ? `/lop/${user.grade.slug}/toan` : "/chon-lop";
  const weekly = missions.filter((m) => m.type === "weekly");

  return (
    <div className="min-h-screen">
      <div className="page">
        <PageHeader
          icon={Target}
          tone="violet"
          title="Nhiệm vụ"
          subtitle="Làm nhiệm vụ mỗi ngày, mỗi tuần để nhận điểm thưởng"
          right={<HeaderStat icon={Gem} value={user?.points ?? 0} label="điểm thưởng" />}
        />

        <div className="mt-6">
          <CheckInCard onCheckedIn={load} />
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-600">{error}</p>
        )}

        <section className="mt-8">
          <h2 className="section-title">
            <Sun /> Nhiệm vụ hằng ngày
          </h2>
          {daily.length === 0 ? (
            <p className="mt-3 text-caption text-slate-500">Chưa có nhiệm vụ hằng ngày nào.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {daily.map((m) => (
                <MissionCard key={m._id} mission={m} onClaim={handleClaim} claiming={claimingId === m._id} learnTo={learnTo} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="section-title">
            <CalendarDays /> Nhiệm vụ hằng tuần
          </h2>
          {weekly.length === 0 ? (
            <p className="mt-3 text-caption text-slate-500">Chưa có nhiệm vụ hằng tuần nào.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {weekly.map((m) => (
                <MissionCard key={m._id} mission={m} onClaim={handleClaim} claiming={claimingId === m._id} learnTo={learnTo} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
