import { useEffect, useState } from "react";
import { Trophy, Award, BookOpen, Star, Flame, Lock, CheckCircle2 } from "lucide-react";
import { badgeService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const CONDITION_ICON = {
  lessons_completed: BookOpen,
  perfect_score: Star,
  streak: Flame,
};

const CONDITION_COLOR = {
  lessons_completed: "from-secondary to-blue-600",
  perfect_score: "from-amber-400 to-orange-500",
  streak: "from-rose-500 to-pink-600",
};

const CONDITION_LABEL = {
  lessons_completed: (v) => `Hoàn thành ${v} bài học`,
  perfect_score: (v) => `Đạt điểm tuyệt đối ${v} lần`,
  streak: (v) => `Luyện tập liên tục ${v} ngày`,
};

function BadgeCard({ badge, earnedAt, progressValue }) {
  const Icon = CONDITION_ICON[badge.conditionType] || Award;
  const earned = !!earnedAt;
  const progress = Math.min(100, Math.round(((progressValue || 0) / badge.conditionValue) * 100));

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl p-5 text-center shadow-elevation-1 ring-1 transition",
        earned ? "bg-white ring-primary/20" : "bg-slate-50 ring-slate-100"
      )}
    >
      <span
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-elevation-1",
          earned ? cn("bg-gradient-to-br", CONDITION_COLOR[badge.conditionType]) : "bg-slate-300"
        )}
      >
        {earned ? <Icon className="h-8 w-8" /> : <Lock className="h-7 w-7" />}
        {earned && (
          <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
        )}
      </span>

      <p className={cn("mt-3 font-display font-bold", earned ? "text-slate-800" : "text-slate-500")}>{badge.name}</p>
      <p className="mt-1 text-caption text-slate-500">{badge.description || CONDITION_LABEL[badge.conditionType]?.(badge.conditionValue)}</p>

      {earned ? (
        <p className="mt-3 text-caption font-semibold text-primary">
          Đạt được ngày {new Date(earnedAt).toLocaleDateString("vi-VN")}
        </p>
      ) : (
        <div className="mt-3 w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-caption font-semibold text-slate-400">
            {Math.min(progressValue || 0, badge.conditionValue)}/{badge.conditionValue}
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
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
            <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-white/80">Thành tích</p>
            <p className="mt-1 font-display text-h1 leading-none">
              {earnedCount}/{badges.length}
            </p>
            <p className="mt-2 text-body text-white/85">huy hiệu đã đạt được</p>
          </div>
        </div>

        {badges.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-elevation-1 ring-1 ring-slate-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Award className="h-7 w-7" />
            </span>
            <p className="mt-4 text-body text-slate-500">Chưa có huy hiệu nào được thiết lập.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {badges.map((badge) => (
              <BadgeCard
                key={badge._id}
                badge={badge}
                earnedAt={earnedByBadgeId.get(String(badge._id))}
                progressValue={stats[badge.conditionType]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
