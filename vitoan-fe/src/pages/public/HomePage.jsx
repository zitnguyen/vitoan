import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Play } from "../../components/ui/icons.jsx";
import {
  gradeService,
  subjectService,
  chapterService,
  lessonService,
  attemptService,
  missionService,
  userService,
  badgeService,
} from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { Img3D } from "../../lib/icons3d.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import UserAvatar from "../../components/common/UserAvatar.jsx";
import GuestLanding from "./GuestLanding.jsx";
import CheckInCard from "../../components/missions/CheckInCard.jsx";

// Trang chủ sau khi đăng nhập — "bảng điều khiển" cho bé (tham khảo Duolingo / VioEdu):
// chào + chuỗi ngày học + mục tiêu hôm nay, học tiếp, lối tắt, BẢN ĐỒ PHIÊU LƯU theo chủ đề,
// và cột phải: nhiệm vụ hôm nay, hoạt động trong tuần, xếp hạng lớp, huy hiệu.

const NAVY = "#0b2340";
const CARD = "rounded-[1.75rem] bg-white shadow-[0_14px_40px_-18px_rgba(11,35,64,0.28)]";
const DAILY_GOAL = 3; // số lượt luyện tập mỗi ngày

const SUBJECT_UI = {
  toan: { icon: "numbers", grad: "from-sky-400 to-blue-500", soft: "bg-sky-50", ring: "ring-sky-200", text: "text-sky-600" },
  "tieng-viet": { icon: "letters", grad: "from-amber-400 to-orange-500", soft: "bg-orange-50", ring: "ring-orange-200", text: "text-orange-600" },
};

function SectionTitle({ icon, children, to, linkText = "Xem tất cả" }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-display text-xl font-black" style={{ color: NAVY }}>
        {icon && <Img3D name={icon} className="h-7 w-7" />} {children}
      </h2>
      {to && (
        <Link to={to} className="flex items-center gap-0.5 text-sm font-black text-primary hover:underline">
          {linkText} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ---------- Vòng tròn mục tiêu hôm nay ----------
function GoalRing({ value, goal }) {
  const pct = Math.min(1, value / goal);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="#e2e8f0" strokeWidth="9" fill="none" />
        <circle cx="40" cy="40" r={r} stroke="url(#goalGrad)" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-[stroke-dashoffset] duration-700" />
        <defs>
          <linearGradient id="goalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#00b14f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {pct >= 1 ? <Img3D name="check" className="h-9 w-9" /> : <span className="font-display text-2xl font-black" style={{ color: NAVY }}>{value}/{goal}</span>}
      </div>
    </div>
  );
}

// ---------- 1. Lời chào ----------
function Hero({ user, stats }) {
  const firstName = user.fullName?.split(" ").pop() || user.username;
  const h = new Date().getHours();
  const hi = h < 11 ? "Chào buổi sáng" : h < 14 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const today = stats?.byDate?.[stats.byDate.length - 1]?.attempts || 0;
  const streak = stats?.streak || 0;
  const say =
    today >= DAILY_GOAL
      ? "Em đã hoàn thành mục tiêu hôm nay rồi, giỏi quá! 🎉"
      : streak >= 2
      ? `Em đã học ${streak} ngày liên tiếp — giữ lửa nhé!`
      : "Mỗi ngày 3 bài luyện tập nhỏ, em sẽ tiến bộ rất nhanh!";

  return (
    <section className="relative overflow-clip rounded-[2.25rem] px-5 py-6 sm:px-8" style={{ background: "linear-gradient(120deg,#c9ecff 0%,#e7dcff 55%,#ffe1f0 100%)" }}>
      <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/40 blur-2xl" />
      <Img3D name="sparkles" className="absolute right-[38%] top-4 hidden h-8 w-8 opacity-80 md:block" />
      <div className="relative flex flex-col items-center gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <OwlMascot className="h-32 w-32 shrink-0 sm:h-36 sm:w-36" />
          <div className="min-w-0">
            <p className="font-bold text-slate-500">{hi},</p>
            <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
              {firstName} ơi! 👋
            </h1>
            <p className="mt-2 max-w-md font-semibold text-slate-600">{say}</p>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 lg:w-auto">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 px-4 py-3 backdrop-blur">
            <Img3D name="fire" className="h-10 w-10" />
            <p className="mt-1 font-display text-2xl font-black text-orange-500">{streak}</p>
            <p className="text-xs font-bold text-slate-500">ngày liên tiếp</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 px-4 py-3 backdrop-blur">
            <Img3D name="gem" className="h-10 w-10" />
            <p className="mt-1 font-display text-2xl font-black text-sky-500">{(user.points ?? 0).toLocaleString("vi-VN")}</p>
            <p className="text-xs font-bold text-slate-500">điểm thưởng</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 px-3 py-2 backdrop-blur">
            <GoalRing value={Math.min(today, DAILY_GOAL)} goal={DAILY_GOAL} />
            <p className="text-xs font-bold text-slate-500">mục tiêu hôm nay</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- 2. Học tiếp ----------
function ContinueCard({ item, fallbackTo }) {
  const pct = item?.total ? Math.round((item.answered / item.total) * 100) : 0;
  return (
    <Link
      to={item?.to || fallbackTo}
      className="group relative flex items-center gap-4 overflow-clip rounded-[1.75rem] bg-gradient-to-r from-primary to-emerald-500 p-5 text-white shadow-[0_16px_36px_-16px_rgba(0,177,79,0.7)] transition hover:-translate-y-0.5"
    >
      <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15" />
      <Img3D name="rocket" className="relative h-16 w-16 shrink-0 transition group-hover:-translate-y-1 group-hover:rotate-6 sm:h-20 sm:w-20" />
      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-black uppercase tracking-wide text-white/80">{item ? item.sub : "Bắt đầu hành trình"}</p>
        <p className="truncate font-display text-xl font-black sm:text-2xl">{item ? item.title : "Chọn chủ đề đầu tiên và học ngay!"}</p>
        {item?.total > 0 && (
          <div className="mt-2 h-2.5 w-full max-w-sm overflow-clip rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <span className="relative hidden shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 font-black text-primary shadow sm:flex">
        <Play className="h-4 w-4 fill-current" /> {item ? "Học tiếp" : "Bắt đầu"}
      </span>
    </Link>
  );
}

// ---------- 3. Lối tắt ----------
function QuickTiles({ gradeSlug }) {
  const base = gradeSlug ? `/lop/${gradeSlug}` : "/chon-lop";
  const tiles = [
    { to: gradeSlug ? `${base}/toan` : base, icon: "numbers", label: "Toán", tint: "from-sky-100 to-sky-200" },
    { to: gradeSlug ? `${base}/tieng-viet` : base, icon: "letters", label: "Tiếng Việt", tint: "from-orange-100 to-amber-200" },
    { to: "/kiem-tra", icon: "clipboard", label: "Kiểm tra", tint: "from-violet-100 to-violet-200" },
    { to: "/on-tap", icon: "brain", label: "Ôn tập", tint: "from-pink-100 to-pink-200" },
    { to: "/ban-dong-hanh", icon: "chat", label: "Hỏi cú AI", tint: "from-emerald-100 to-emerald-200" },
    { to: "/doi-qua", icon: "gift", label: "Đổi quà", tint: "from-yellow-100 to-amber-200" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {tiles.map((t) => (
        <Link
          key={t.label}
          to={t.to}
          className={cn("group flex flex-col items-center gap-1.5 rounded-3xl bg-gradient-to-br px-2 py-4 text-center transition hover:-translate-y-1 hover:shadow-lg", t.tint)}
        >
          <Img3D name={t.icon} className="h-12 w-12 transition duration-300 group-hover:scale-110 sm:h-14 sm:w-14" />
          <span className="font-display text-sm font-black sm:text-base" style={{ color: NAVY }}>
            {t.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ---------- 4. Bản đồ phiêu lưu ----------
const MAP_X = [50, 76, 50, 24]; // vị trí ngang (%) của các trạm, lặp lại thành đường zíc-zắc
const MAP_X_NARROW = [18, 30]; // điện thoại: trạm lệch trái, nhãn luôn bên phải
const ROW_H = 132;

// true khi màn hẹp (< 640px) — bản đồ đổi cách xếp để nhãn không tràn
function useIsNarrow() {
  const query = "(max-width: 639px)";
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

const DECOR = ["sunflower", "star", "books", "blossom", "pencil", "glowStar", "ruler", "puzzle"];
const MAP_TOP = 96; // chừa chỗ cho cú đứng trên trạm đầu

function AdventureMap({ user, subjects: rawSubjects }) {
  const subjects = useMemo(() => [...rawSubjects].sort((a, b) => (a.slug === "toan" ? -1 : b.slug === "toan" ? 1 : 0)), [rawSubjects]);
  const [subjectSlug, setSubjectSlug] = useState(subjects[0]?.slug || "toan");
  const [data, setData] = useState(null);
  const [semester, setSemester] = useState(null);
  const narrow = useIsNarrow();
  const subject = subjects.find((s) => s.slug === subjectSlug);

  useEffect(() => {
    if (!subject) return undefined;
    let cancelled = false;
    setData(null);
    Promise.all([
      chapterService.list({ grade: user.grade._id, subject: subject._id }),
      lessonService.list({ grade: user.grade._id, subject: subject._id }),
      attemptService.completedLessons().catch(() => ({ data: [] })),
    ])
      .then(([chRes, lsRes, doneRes]) => {
        if (cancelled) return;
        const done = new Set(doneRes.data);
        const nodes = chRes.data.map((c) => {
          const lessons = lsRes.data.filter((l) => (l.chapter?._id || l.chapter) === c._id);
          const completed = lessons.filter((l) => done.has(l._id)).length;
          return { ...c, total: lessons.length || c.lessonCount || 0, completed };
        });
        setData(nodes);
        // mặc định mở học kỳ có chủ đề đang học dở
        const cur = nodes.find((n) => n.completed < n.total);
        setSemester((cur || nodes[0])?.semester || 1);
      })
      .catch(() => !cancelled && setData([]));
    return () => {
      cancelled = true;
    };
  }, [subject, user.grade._id]);

  const ui = SUBJECT_UI[subjectSlug] || SUBJECT_UI.toan;
  const semesters = [...new Set((data || []).map((n) => n.semester || 1))].sort();
  const all = data || [];
  const globalCurrent = all.findIndex((n) => n.completed < n.total);
  const nodes = all.map((n, idx) => ({ ...n, idx })).filter((n) => (n.semester || 1) === semester);
  const xs = narrow ? MAP_X_NARROW : MAP_X;
  const pts = nodes.map((_, i) => [xs[i % xs.length], i * ROW_H + MAP_TOP]);
  const mapH = nodes.length * ROW_H + MAP_TOP - 40;
  const pathD = pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const my = (py + y) / 2;
    return `${d} C ${px} ${my}, ${x} ${my}, ${x} ${y}`;
  }, "");

  return (
    <section className={cn(CARD, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-black" style={{ color: NAVY }}>
          <Img3D name="flag" className="h-8 w-8" /> Bản đồ phiêu lưu {user.grade.name}
        </h2>
        <div className="flex rounded-full bg-slate-100 p-1">
          {subjects.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => setSubjectSlug(s.slug)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-black transition", s.slug === subjectSlug ? cn("bg-gradient-to-r text-white shadow", (SUBJECT_UI[s.slug] || SUBJECT_UI.toan).grad) : "text-slate-500 hover:text-slate-800")}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : data.length === 0 ? (
        <p className="py-10 text-center font-semibold text-slate-400">Chưa có chủ đề cho môn này.</p>
      ) : (
        <>
        {semesters.length > 1 && (
          <div className="mt-4 flex gap-2">
            {semesters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSemester(s)}
                className={cn("rounded-full px-4 py-1.5 text-sm font-black transition", s === semester ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800")}
              >
                Học kỳ {s}
              </button>
            ))}
          </div>
        )}
        <div className={cn("relative mt-4 overflow-clip rounded-[1.5rem] px-2", ui.soft)} style={{ height: mapH }}>
          {/* đường đi chấm nối các trạm */}
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${mapH}`} preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke="#cbd5e1" strokeDasharray="2.5 2.5" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 5 }} />
          </svg>
          {nodes.map((n, i) => {
            const [x, y] = pts[i];
            const isDone = n.total > 0 && n.completed >= n.total;
            const isCurrent = n.idx === globalCurrent;
            const labelLeft = !narrow && x > 50; // nhãn nằm phía đối diện để không tràn
            // hình trang trí ở phía còn trống của hàng
            const decorX = x === 76 ? 10 : x === 24 ? 90 : 12;
            return (
              <div key={n._id}>
                <Img3D
                  name={DECOR[n.idx % DECOR.length]}
                  className="absolute hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 opacity-90 sm:block"
                  style={{ left: `${decorX}%`, top: y + (i % 2 ? 18 : -14), animation: `float-soft ${4 + (i % 3)}s ease-in-out infinite` }}
                />
                <Link
                  to={`/lop/${user.grade.slug}/${subjectSlug}?chu-de=${n._id}`}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: y }}
                  title={n.title}
                >
                  {isCurrent && (
                    <span className="absolute -top-16 left-1/2 flex -translate-x-1/2 flex-col items-center">
                      <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-black text-primary shadow">Học tiếp nè!</span>
                      <OwlMascot className="-mt-1 h-12 w-12" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "relative flex items-center justify-center rounded-full font-display font-black transition group-hover:scale-110",
                      isCurrent ? "h-20 w-20 text-3xl text-white" : "h-16 w-16 text-2xl",
                      isDone && "bg-gradient-to-b from-lime-400 to-green-500 text-white shadow-[0_6px_0_0_#15803d]",
                      isCurrent && cn("bg-gradient-to-b shadow-[0_6px_0_0_rgba(11,35,64,0.35)] ring-8", ui.grad, ui.ring),
                      !isDone && !isCurrent && "bg-white text-slate-400 shadow-[0_6px_0_0_#cbd5e1]"
                    )}
                  >
                    {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />}
                    {isDone ? <Img3D name="check" className="h-9 w-9" /> : n.idx + 1}
                  </span>
                  <span
                    className={cn(
                      "absolute top-1/2 w-36 -translate-y-1/2 rounded-2xl bg-white px-3 py-2 text-left shadow-md sm:w-52",
                      labelLeft ? "right-full mr-4" : "left-full ml-4"
                    )}
                  >
                    <span className="line-clamp-2 text-sm font-black leading-snug" style={{ color: NAVY }}>
                      {n.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-clip rounded-full bg-slate-100">
                        <span className={cn("block h-full rounded-full", isDone ? "bg-green-500" : "bg-amber-400")} style={{ width: `${n.total ? (n.completed / n.total) * 100 : 0}%` }} />
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {n.completed}/{n.total}
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
        </>
      )}
    </section>
  );
}

// ---------- 5. Cột phải ----------
function DailyMissions({ missions }) {
  const daily = (missions || []).filter((m) => m.type === "daily").slice(0, 4);
  return (
    <section className={cn(CARD, "p-5")}>
      <SectionTitle icon="target" to="/nhiem-vu">
        Nhiệm vụ hôm nay
      </SectionTitle>
      {!missions ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : daily.length === 0 ? (
        <p className="text-sm font-semibold text-slate-400">Chưa có nhiệm vụ.</p>
      ) : (
        <div className="space-y-3">
          {daily.map((m) => {
            const done = m.progress >= m.goalValue;
            const pct = Math.min(100, Math.round((m.progress / m.goalValue) * 100));
            return (
              <div key={m._id} className={cn("rounded-2xl p-3", done ? "bg-green-50" : "bg-slate-50")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-black" style={{ color: NAVY }}>
                    {m.title}
                  </p>
                  {m.claimed ? (
                    <Img3D name="check" className="h-6 w-6 shrink-0" />
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-black text-sky-600">
                      <Img3D name="gem" className="h-4 w-4" />+{m.rewardPoints}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-clip rounded-full bg-white">
                    <div className={cn("h-full rounded-full", done ? "bg-green-500" : "bg-gradient-to-r from-amber-400 to-orange-400")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {Math.min(m.progress, m.goalValue)}/{m.goalValue}
                  </span>
                </div>
                {done && !m.claimed && (
                  <Link to="/nhiem-vu" className="mt-2 block rounded-xl bg-amber-400 py-1.5 text-center text-sm font-black text-white">
                    Nhận thưởng!
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function WeekActivity({ stats }) {
  const days = (stats?.byDate || []).slice(-7);
  const max = Math.max(1, ...days.map((d) => d.attempts));
  return (
    <section className={cn(CARD, "p-5")}>
      <SectionTitle icon="calendar" to="/thong-ke" linkText="Thống kê">
        Tuần này của em
      </SectionTitle>
      <div className="flex h-32 items-end justify-between gap-2">
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-black text-slate-400">{d.attempts || ""}</span>
              <div className="flex h-20 w-full items-end">
                <div
                  className={cn("w-full rounded-t-xl transition-all", d.attempts ? (isToday ? "bg-gradient-to-t from-primary to-lime-400" : "bg-gradient-to-t from-sky-400 to-sky-300") : "bg-slate-100")}
                  style={{ height: `${d.attempts ? Math.max(14, (d.attempts / max) * 100) : 10}%` }}
                />
              </div>
              <span className={cn("text-xs font-black", isToday ? "text-primary" : "text-slate-400")}>{WEEKDAYS[new Date(d.date).getDay()]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const PODIUM_BG = ["bg-amber-100", "bg-slate-100", "bg-orange-100"];

function ClassRank({ rows }) {
  const top = (rows || []).slice(0, 3);
  const me = (rows || []).find((r) => r.isMe);
  return (
    <section className={cn(CARD, "p-5")}>
      <SectionTitle icon="trophy" to="/xep-hang">
        Bảng xếp hạng lớp
      </SectionTitle>
      {!rows ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((r, i) => (
            <div key={r._id} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2", PODIUM_BG[i], r.isMe && "ring-2 ring-primary")}>
              <span className="w-5 text-center font-display text-lg font-black text-slate-500">{r.rank}</span>
              <UserAvatar user={r} size="h-9 w-9" />
              <span className="min-w-0 flex-1 truncate text-sm font-black" style={{ color: NAVY }}>
                {r.fullName}
                {r.isMe && " (em)"}
              </span>
              <span className="text-sm font-black text-primary">{r.score}</span>
            </div>
          ))}
          {me && me.rank > 3 && (
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-3 py-2 ring-2 ring-primary">
              <span className="w-5 text-center font-display text-lg font-black text-primary">{me.rank}</span>
              <UserAvatar user={me} size="h-9 w-9" />
              <span className="min-w-0 flex-1 truncate text-sm font-black" style={{ color: NAVY }}>
                Em
              </span>
              <span className="text-sm font-black text-primary">{me.score}</span>
            </div>
          )}
          {top.length === 0 && <p className="text-sm font-semibold text-slate-400">Học bài đầu tiên để lên bảng nhé!</p>}
        </div>
      )}
    </section>
  );
}

function BadgeCard({ earned, total }) {
  const pct = total ? Math.round((earned / total) * 100) : 0;
  return (
    <Link to="/thanh-tich" className={cn(CARD, "group flex items-center gap-4 p-5 transition hover:-translate-y-0.5")}>
      <Img3D name="medal" className="h-16 w-16 shrink-0 transition group-hover:rotate-6 group-hover:scale-110" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-black" style={{ color: NAVY }}>
          Huy hiệu của em
        </p>
        <p className="text-sm font-bold text-slate-500">
          Đã có <span className="text-amber-500">{earned}</span>/{total} huy hiệu
        </p>
        <div className="mt-2 h-2.5 overflow-clip rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

// ---------- Trang ----------
function StudentHome({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [missions, setMissions] = useState(null);
  const [rank, setRank] = useState(null);
  const [badges, setBadges] = useState({ earned: 0, total: 0 });
  const [continueItem, setContinueItem] = useState(null);

  useEffect(() => {
    subjectService.list().then((r) => setSubjects(r.data)).catch(() => {});
    attemptService.stats().then((r) => setStats(r.data)).catch(() => setStats({}));
    missionService.list().then((r) => setMissions(r.data)).catch(() => setMissions([]));
    userService.leaderboard(1).then((r) => setRank(r.data)).catch(() => setRank([]));
    Promise.all([badgeService.list(), badgeService.myBadges()])
      .then(([all, mine]) => setBadges({ total: all.data.length, earned: mine.data.length }))
      .catch(() => {});
    attemptService
      .myProgressList()
      .then((r) => {
        const p = r.data[0];
        if (p)
          setContinueItem({
            title: p.lesson.title,
            sub: `Đang làm dở ${p.answered}/${p.total} câu`,
            answered: p.answered,
            total: p.total,
            to: p.practiceSet ? `/luyen-tap/${p.practiceSet._id}` : `/bai/${p.lesson._id}/luyen-tap`,
          });
      })
      .catch(() => {});
  }, []);

  const fallbackTo = user.grade?.slug ? `/lop/${user.grade.slug}/toan` : "/chon-lop";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-6 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16">
      <Hero user={user} stats={stats} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <ContinueCard item={continueItem} fallbackTo={fallbackTo} />
          <QuickTiles gradeSlug={user.grade?.slug} />
          {user.grade && subjects.length > 0 && <AdventureMap user={user} subjects={subjects} />}
          {!user.grade && (
            <Link to="/chon-lop" className={cn(CARD, "block p-6 text-center font-black text-primary")}>
              Chọn lớp của em để bắt đầu học →
            </Link>
          )}
        </div>
        <aside className="space-y-6">
          <CheckInCard compact onCheckedIn={() => missionService.list().then((r) => setMissions(r.data)).catch(() => {})} />
          <DailyMissions missions={missions} />
          <WeekActivity stats={stats} />
          <ClassRank rows={rank} />
          <BadgeCard {...badges} />
        </aside>
      </div>
    </div>
  );
}

// Tài khoản không phải học sinh (admin xem thử): chỉ lời chào + danh sách lớp.
function OtherHome({ user }) {
  const [grades, setGrades] = useState([]);
  useEffect(() => {
    gradeService.list().then((r) => setGrades(r.data)).catch(() => {});
  }, []);
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <section className="flex items-center gap-5 rounded-[2.25rem] px-6 py-6" style={{ background: "linear-gradient(120deg,#c9ecff 0%,#e7dcff 55%,#ffe1f0 100%)" }}>
        <OwlMascot className="h-28 w-28" />
        <div>
          <h1 className="font-display text-3xl font-black" style={{ color: NAVY }}>
            Xin chào {user.fullName || user.username}!
          </h1>
          <p className="font-semibold text-slate-600">Chọn lớp để xem nội dung như học sinh.</p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {grades.map((g) => (
          <Link key={g._id} to={`/lop/${g.slug}/toan`} className={cn(CARD, "p-5 text-center font-display text-xl font-black transition hover:-translate-y-1")} style={{ color: NAVY }}>
            {g.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { hash } = useLocation();

  // Bấm menu "/#chon-lop"... thì cuộn tới đúng mục
  useEffect(() => {
    if (!hash) return undefined;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    return () => clearTimeout(t);
  }, [hash]);

  const isStudent = useMemo(() => user?.role === "Student", [user]);
  if (!user) return <GuestLanding />;
  return isStudent ? <StudentHome user={user} /> : <OtherHome user={user} />;
}
