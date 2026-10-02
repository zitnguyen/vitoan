import { useEffect, useState } from "react";
import { Trophy, Award, Medal } from "../../components/ui/icons.jsx";
import { badgeService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

// Hình 3D & màu huy chương theo loại điều kiện
const CONDITION_ICON = { lessons_completed: "books", perfect_score: "hundred", streak: "fire" };
const CONDITION_RING = {
  lessons_completed: "from-sky-300 via-blue-400 to-indigo-500",
  perfect_score: "from-amber-200 via-amber-400 to-orange-500",
  streak: "from-rose-300 via-pink-400 to-fuchsia-500",
};
const CONDITION_LABEL = {
  lessons_completed: (v) => `Hoàn thành ${v} bài học`,
  perfect_score: (v) => `Đạt điểm tuyệt đối ${v} lần`,
  streak: (v) => `Luyện tập liên tục ${v} ngày`,
};

function BadgeCard({ badge, earnedAt, progressValue }) {
  const earned = !!earnedAt;
  const value = Math.min(progressValue || 0, badge.conditionValue);
  const progress = Math.round((value / badge.conditionValue) * 100);
  const icon = CONDITION_ICON[badge.conditionType] || "medal";

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center overflow-hidden rounded-[1.75rem] p-5 text-center shadow-elevation-1 transition hover:-translate-y-1",
        earned ? "bg-gradient-to-b from-amber-50 via-white to-white" : "bg-white"
      )}
    >
      {earned && <span aria-hidden className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-amber-200/60 blur-2xl" />}
      {/* Huy chương: vòng gradient + hình 3D; chưa đạt thì xám + ổ khoá */}
      <div className="relative">
        <span className={cn("flex h-24 w-24 items-center justify-center rounded-full p-1.5", earned ? cn("bg-gradient-to-br shadow-lg", CONDITION_RING[badge.conditionType]) : "bg-slate-200")}>
          <span className={cn("flex h-full w-full items-center justify-center rounded-full", earned ? "bg-white" : "bg-slate-100")}>
            <Img3D name={icon} className={cn("h-14 w-14 transition duration-300 group-hover:scale-110", !earned && "opacity-60 saturate-[.35]")} />
          </span>
        </span>
        {earned ? (
          <Img3D name="check" className="absolute -bottom-1 -right-1 h-8 w-8" />
        ) : (
          <Img3D name="lock" className="absolute -bottom-1 -right-1 h-8 w-8" />
        )}
      </div>

      <p className={cn("relative mt-4 font-display text-lg font-black leading-tight", earned ? "text-[#0b2340]" : "text-slate-500")}>{badge.name}</p>
      <p className="relative mt-1 text-sm font-semibold text-slate-500">{badge.description || CONDITION_LABEL[badge.conditionType]?.(badge.conditionValue)}</p>

      {earned ? (
        <p className="relative mt-auto pt-3 text-sm font-black text-amber-600">🎉 Đạt ngày {new Date(earnedAt).toLocaleDateString("vi-VN")}</p>
      ) : (
        <div className="relative mt-auto w-full pt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-lime-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-sm font-black text-slate-400">
            {value}/{badge.conditionValue}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const [badges, setBadges] = useState([]);
  const [earned, setEarned] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([badgeService.list(), badgeService.myBadges(), badgeService.progress()]).then(
      ([badgesRes, earnedRes, statsRes]) => {
        setBadges(badgesRes.data);
        setEarned(earnedRes.data);
        setStats(statsRes.data);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const earnedByBadgeId = new Map(earned.map((sb) => [String(sb.badge?._id), sb.achievedAt]));
  const earnedCount = badges.filter((b) => earnedByBadgeId.has(String(b._id))).length;
  // Huy hiệu đã đạt lên trước, rồi tới huy hiệu sắp đạt (tiến độ cao) để bé có động lực
  const pct = (b) => (earnedByBadgeId.has(String(b._id)) ? 2 : Math.min(1, (stats[b.conditionType] || 0) / b.conditionValue));
  const sortedBadges = [...badges].sort((a, b) => pct(b) - pct(a));

  return (
    <div className="min-h-screen">
      <div className="page">
        <PageHeader
          icon={Trophy}
          tone="amber"
          title="Thành tích"
          subtitle="Hoàn thành bài học để mở khoá huy hiệu mới"
          right={<HeaderStat icon={Medal} value={`${earnedCount}/${badges.length}`} label="huy hiệu đã đạt" />}
        />

        {badges.length === 0 ? (
          <div className="mt-5 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-elevation-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Award className="h-7 w-7" />
            </span>
            <p className="mt-4 text-body text-slate-500">Chưa có huy hiệu nào được thiết lập.</p>
          </div>
        ) : (
          <>
          {/* Tiến độ tổng */}
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-[1.75rem] bg-white px-6 py-4 shadow-elevation-1">
            <Img3D name="trophy" className="h-12 w-12" />
            <div className="min-w-[12rem] flex-1">
              <p className="font-display text-lg font-black text-[#0b2340]">
                Em đã sưu tầm {earnedCount}/{badges.length} huy hiệu
              </p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400" style={{ width: `${badges.length ? (earnedCount / badges.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {sortedBadges.map((badge) => (
              <BadgeCard
                key={badge._id}
                badge={badge}
                earnedAt={earnedByBadgeId.get(String(badge._id))}
                progressValue={stats[badge.conditionType]}
              />
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
