import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Users, BookOpen, HelpCircle, Dumbbell, ClipboardCheck, Newspaper, Gift, ShieldCheck, Flame, Target, Inbox } from "lucide-react";
import { adminStatsService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import UserAvatar from "../../components/common/UserAvatar.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { IconTile, adminPageClass } from "../../components/admin/adminUi.jsx";
import { cn } from "../../lib/utils";

// Trang tổng quan quản trị: lời chào, số liệu chính, biểu đồ hoạt động 7 ngày, lối tắt và học sinh mới.
function StatCard({ label, value, Icon, color, to }) {
  const body = (
    <>
      <IconTile Icon={Icon} color={color} size="lg" />
      <div className="min-w-0">
        <p className="font-display text-2xl font-black leading-none text-slate-800">{(value ?? 0).toLocaleString("vi-VN")}</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </>
  );
  const cls = "flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-elevation-1 transition";
  return to ? (
    <Link to={to} className={cn(cls, "hover:-translate-y-0.5 hover:shadow-elevation-2 active:scale-[0.98]")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// Biểu đồ cột chồng: luyện tập (xanh lá) + kiểm tra (hồng) theo ngày
function ActivityChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.practice + d.tests));
  const total = data.reduce((s, d) => s + d.practice + d.tests, 0);
  const signups = data.reduce((s, d) => s + d.signups, 0);
  return (
    <section className="rounded-2xl bg-white p-5 shadow-elevation-1 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-slate-800">Hoạt động 7 ngày qua</h2>
          <p className="text-sm text-slate-500">
            {total.toLocaleString("vi-VN")} lượt làm bài · {signups} học sinh mới
          </p>
        </div>
        <div className="flex gap-4 text-sm font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Luyện tập
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Kiểm tra
          </span>
        </div>
      </div>
      <div className="mt-6 grid h-48 grid-cols-7 items-end gap-2 sm:gap-4">
        {data.map((d) => {
          const sum = d.practice + d.tests;
          const date = new Date(`${d.day}T00:00:00`);
          return (
            <div key={d.day} className="group flex h-full flex-col items-center justify-end gap-2">
              <span className="text-xs font-black text-slate-400 opacity-0 transition group-hover:opacity-100">{sum}</span>
              <div
                className="flex w-full max-w-[3.2rem] flex-col-reverse overflow-hidden rounded-xl bg-slate-100"
                style={{ height: `${Math.max(4, (sum / max) * 100)}%` }}
                title={`${d.practice} luyện tập · ${d.tests} kiểm tra`}
              >
                <div className="bg-gradient-to-t from-green-500 to-emerald-400" style={{ height: `${sum ? (d.practice / sum) * 100 : 0}%` }} />
                <div className="bg-gradient-to-t from-rose-400 to-pink-300" style={{ height: `${sum ? (d.tests / sum) * 100 : 0}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-500">{date.toLocaleDateString("vi-VN", { weekday: "short" })}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const QUICK = [
  { to: "/admin/bai-hoc", label: "Thêm bài học", Icon: BookOpen, color: "from-emerald-400 to-green-500" },
  { to: "/admin/kiem-tra", label: "Tạo bài kiểm tra", Icon: ClipboardCheck, color: "from-rose-400 to-pink-500" },
  { to: "/admin/tin-tuc", label: "Đăng tin tức", Icon: Newspaper, color: "from-amber-400 to-orange-500" },
  { to: "/admin/doi-diem", label: "Thêm phần quà", Icon: Gift, color: "from-fuchsia-400 to-pink-500" },
];

const avatarOf = (s) => s.avatarUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(s.username)}`;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminStatsService
      .overview()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.apiMessage || "Không tải được số liệu"));
  }, []);

  if (error) {
    return (
      <div className={adminPageClass}>
        <p className="rounded-2xl bg-red-50 p-4 font-semibold text-red-600">{error}</p>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greet = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <div className={adminPageClass}>
      {/* Lời chào */}
      <section className="relative overflow-clip rounded-3xl bg-gradient-to-br from-[#0b2340] via-[#16407a] to-[#1f6fd1] p-6 text-white shadow-elevation-2 sm:p-8">
        <span aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <span aria-hidden className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
          <OwlMascot className="hidden h-24 w-24 shrink-0 drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] sm:block" />
          <div>
            <p className="font-bold text-white/70">{greet},</p>
            <h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">{user?.fullName || "Quản trị viên"}</h1>
            <p className="mt-2 max-w-xl text-white/80">
              Hôm nay có <b className="text-white">{stats.attemptsToday}</b> lượt làm bài và <b className="text-white">{stats.checkinsToday ?? 0}</b> bé đã điểm danh.
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* Việc cần xử lý: nội dung thiếu / dễ gây khó chịu cho học sinh */}
      <section className="mt-6 rounded-3xl bg-white p-5 shadow-elevation-1">
        <h2 className="flex items-center gap-2 font-display text-lg font-black text-slate-800">
          <ShieldCheck className="h-5 w-5 text-amber-500" /> Cần chú ý
        </h2>
        {(stats.attention || []).length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-emerald-600">Mọi thứ ổn: không có bài trống, đề quá ngắn hay quà hết hàng.</p>
        ) : (
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">
            {stats.attention.map((a) => (
              <li key={a.key} className={cn("rounded-2xl p-4 ring-1", a.level === "warn" ? "bg-amber-50 ring-amber-200" : "bg-sky-50 ring-sky-200")}>
                <p className="font-bold text-slate-800">{a.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{a.hint}</p>
                {a.samples.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {a.samples.map((x, i) => (
                      <li key={i}>
                        <Link to={x.to} className="font-semibold text-primary hover:underline">
                          {x.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link to={a.to} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-primary">
                  Xử lý <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Số liệu chính */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Học sinh" value={stats.totalStudents} Icon={Users} color="from-cyan-400 to-sky-500" to="/admin/tai-khoan" />
        <StatCard label="Bài học" value={stats.totalLessons} Icon={BookOpen} color="from-emerald-400 to-green-500" to="/admin/bai-hoc" />
        <StatCard label="Câu hỏi" value={stats.totalQuestions} Icon={HelpCircle} color="from-violet-400 to-purple-500" to="/admin/ngan-hang-cau-hoi" />
        <StatCard label="Bài luyện tập" value={stats.totalPracticeSets} Icon={Dumbbell} color="from-amber-400 to-orange-500" to="/admin/bai-hoc" />
        <StatCard label="Bài kiểm tra" value={stats.totalTests} Icon={ClipboardCheck} color="from-rose-400 to-pink-500" to="/admin/kiem-tra" />
        <StatCard label="Bài tin tức" value={stats.totalArticles} Icon={Newspaper} color="from-orange-400 to-red-400" to="/admin/tin-tuc" />
        <StatCard label="Lượt đổi quà" value={stats.totalRedemptions} Icon={Gift} color="from-fuchsia-400 to-pink-500" to="/admin/doi-diem" />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <ActivityChart data={stats.activity || []} />

          <section className="rounded-2xl bg-white p-5 shadow-elevation-1 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-slate-800">Thao tác nhanh</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {QUICK.map((q) => (
                <Link
                  key={q.label}
                  to={q.to}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 p-4 text-center font-bold text-slate-600 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-95"
                >
                  <span className="relative">
                    <IconTile Icon={q.Icon} color={q.color} size="lg" className="transition group-hover:-translate-y-0.5" />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white">
                      <Plus className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                  <span className="text-sm">{q.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-elevation-1 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-slate-800">Học sinh mới</h2>
            <Link to="/admin/tai-khoan" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {stats.recentStudents.length === 0 ? (
            <div className="py-10 text-center">
              <Inbox className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">Chưa có học sinh nào đăng ký.</p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {stats.recentStudents.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <UserAvatar user={s} size="h-10 w-10" showVip={false} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-700">{s.fullName}</p>
                    <p className="truncate text-sm text-slate-400">@{s.username}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">{s.grade?.name || "Chưa chọn lớp"}</span>
                    <p className="mt-1 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <BackupCard />
    </div>
  );
}

// Sao lưu / khôi phục nội dung học tập (chương trình, câu hỏi, bài kiểm tra, quà, nhiệm vụ, tin tức) ra file JSON.
function BackupCard() {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function exportData() {
    setBusy("export");
    setMsg("");
    try {
      const payload = await adminStatsService.backup();
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `vitoan-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg("Đã tải file sao lưu.");
    } catch (err) {
      setMsg(err.apiMessage || "Không thể sao lưu lúc này");
    } finally {
      setBusy("");
    }
  }

  async function importData(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Khôi phục từ file này? Dữ liệu trùng ID sẽ bị ghi đè, dữ liệu khác được giữ nguyên.")) return;
    setBusy("import");
    setMsg("");
    try {
      const res = await adminStatsService.restore(JSON.parse(await file.text()));
      const total = Object.values(res.data || {}).reduce((a, b) => a + b, 0);
      setMsg(`Đã khôi phục ${total} mục.`);
    } catch (err) {
      setMsg(err.apiMessage || "File không hợp lệ hoặc không khôi phục được");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-elevation-1">
      <h2 className="font-display text-lg font-black text-slate-800">Sao lưu dữ liệu</h2>
      <p className="mt-1 text-sm text-slate-500">
        Xuất nội dung học tập ra file JSON để lưu giữ, hoặc nhập lại khi cần. Không gồm tài khoản và bài làm của học sinh.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={exportData} disabled={!!busy} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {busy === "export" ? "Đang xuất..." : "Xuất sao lưu"}
        </button>
        <label className={cn("cursor-pointer rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700 hover:border-primary/40", busy && "pointer-events-none opacity-60")}>
          {busy === "import" ? "Đang nhập..." : "Nhập từ file"}
          <input type="file" accept="application/json,.json" className="hidden" onChange={importData} />
        </label>
        {msg && <span className="text-sm font-semibold text-slate-500">{msg}</span>}
      </div>
    </section>
  );
}
