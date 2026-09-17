import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, BookOpen, ListChecks, Dumbbell, ClipboardCheck, Activity, ArrowRight } from "lucide-react";
import { adminStatsService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";

function StatCard({ label, value, Icon, color }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-caption font-semibold text-slate-500">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStatsService.overview().then((res) => {
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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="font-display text-h2 text-slate-800">Tổng quan</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Học sinh" value={stats.totalStudents} Icon={Users} color="bg-primary/10 text-primary" />
        <StatCard label="Quản trị viên" value={stats.totalAdmins} Icon={ShieldCheck} color="bg-secondary/10 text-secondary" />
        <StatCard label="Bài học" value={stats.totalLessons} Icon={BookOpen} color="bg-vietnamese/10 text-vietnamese" />
        <StatCard label="Câu hỏi" value={stats.totalQuestions} Icon={ListChecks} color="bg-violet-100 text-violet-600" />
        <StatCard label="Bài luyện tập" value={stats.totalPracticeSets} Icon={Dumbbell} color="bg-amber-100 text-amber-600" />
        <StatCard label="Bài kiểm tra" value={stats.totalTests} Icon={ClipboardCheck} color="bg-rose-100 text-rose-600" />
        <StatCard label="Lượt làm bài hôm nay" value={stats.attemptsToday} Icon={Activity} color="bg-blue-100 text-blue-600" />
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-slate-800">Học sinh mới đăng ký</h2>
          <Link to="/admin/tai-khoan" className="flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {stats.recentStudents.length === 0 ? (
          <p className="mt-4 text-caption text-slate-400">Chưa có học sinh nào đăng ký.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {stats.recentStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">{s.fullName}</p>
                  <p className="text-caption text-slate-400">@{s.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-caption font-semibold text-slate-500">{s.grade?.name || "Chưa chọn lớp"}</p>
                  <p className="text-caption text-slate-400">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
