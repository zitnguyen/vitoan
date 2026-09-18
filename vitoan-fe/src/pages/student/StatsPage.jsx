import { useEffect, useState } from "react";
import { BarChart3, ListChecks, Percent, Flame } from "lucide-react";
import { attemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-xl font-extrabold text-slate-800">{value}</p>
        <p className="text-caption text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function TrendChart({ byDate }) {
  const max = Math.max(10, ...byDate.map((d) => d.attempts));
  return (
    <div className="flex h-40 items-end gap-1.5">
      {byDate.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-[18px] rounded-t-md bg-secondary/70 transition-all"
              style={{ height: `${(d.attempts / max) * 100}%`, minHeight: d.attempts > 0 ? "4px" : "0" }}
              title={`${d.date}: ${d.attempts} lượt, ${d.avgPercent}% đúng`}
            />
          </div>
          <span className="text-[9px] text-slate-400">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
        </div>
      ))}
    </div>
  );
}

function SubjectBar({ item }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{item.subject}</span>
        <span className="text-caption text-slate-400">{item.count} lượt · {item.avgPercent}% đúng</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.avgPercent}%` }} />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptService.stats().then((res) => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="flex items-center gap-2 font-display text-h2 text-slate-800">
          <BarChart3 className="h-7 w-7 text-secondary" /> Thống kê học tập
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={ListChecks} label="tổng số bài đã làm" value={stats.totalAttempts} color="bg-secondary/10 text-secondary" />
          <StatCard icon={Percent} label="điểm trung bình" value={`${stats.avgPercent}%`} color="bg-primary/10 text-primary" />
          <StatCard icon={Flame} label="ngày học liên tiếp" value={stats.streak} color="bg-amber-100 text-amber-500" />
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100">
          <p className="font-display font-bold text-slate-800">Số lượt luyện tập 14 ngày gần đây</p>
          <div className="mt-4">
            <TrendChart byDate={stats.byDate} />
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100">
          <p className="font-display font-bold text-slate-800">Kết quả theo môn học</p>
          {stats.bySubject.length === 0 ? (
            <p className="mt-3 text-caption text-slate-500">Chưa có dữ liệu, hãy luyện tập vài bài nhé!</p>
          ) : (
            <div className="mt-4 space-y-4">
              {stats.bySubject.map((item) => (
                <SubjectBar key={item.subject} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
