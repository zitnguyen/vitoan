import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, Inbox, ChevronRight, Award, ClipboardCheck, BookOpen, CheckCircle2, XCircle, TrendingUp, MessageSquareQuote } from "../../components/ui/icons.jsx";
import { attemptService, badgeService, testAttemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import PageHeader, { HeaderStat } from "../../components/ui/PageHeader.jsx";
import { Img3D } from "../../lib/icons3d.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center rounded-[1.75rem] bg-white p-10 text-center shadow-elevation-1">
      <OwlMascot className="h-24 w-24" />
      <p className="mt-3 font-display text-lg font-black text-[#0b2340]">{text}</p>
      <Link to="/" className="mt-4 rounded-full bg-primary px-6 py-2.5 font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5">
        Học ngay thôi!
      </Link>
    </div>
  );
}

const ACCENT_HOVER_CHEVRON = {
  primary: "group-hover:text-primary",
  vietnamese: "group-hover:text-vietnamese",
};

function AttemptCard({ attempt, subtitle, to, accent }) {
  const percent = Math.round((attempt.score / attempt.totalQuestions) * 100);
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-elevation-1 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
    >
      <div className="min-w-0">
        <p className="truncate font-display font-bold text-slate-800">{subtitle}</p>
        <p className="text-caption text-slate-500">{new Date(attempt.createdAt).toLocaleString("vi-VN")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "rounded-full px-3 py-1 font-display text-body-lg font-extrabold",
            percent >= 70 ? "bg-primary/10 text-primary" : percent >= 40 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"
          )}
        >
          {attempt.score}/{attempt.totalQuestions}
        </span>
        <ChevronRight
          className={cn("h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5", ACCENT_HOVER_CHEVRON[accent])}
        />
      </div>
    </Link>
  );
}

function fmtMinutes(seconds) {
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : `${m} phút`;
}

// Thống kê phần luyện tập: số lần làm, đúng/sai, bài hay làm & bài yếu, 14 ngày gần đây, nhận xét.
function PracticeSummary({ summary }) {
  if (!summary || summary.totalAttempts === 0) return null;
  const maxDay = Math.max(1, ...summary.recentDays.map((d) => d.attempts));
  const tiles = [
    { label: "Số lần luyện tập", value: summary.totalAttempts, icon: BookOpen, tone: "bg-primary/10 text-primary" },
    { label: "Câu đúng", value: summary.correct, icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-600" },
    { label: "Câu sai", value: summary.wrong, icon: XCircle, tone: "bg-rose-100 text-rose-500" },
    { label: "Tỉ lệ đúng", value: `${summary.accuracy}%`, icon: TrendingUp, tone: "bg-violet-100 text-violet-600" },
  ];
  return (
    <section className="mt-5">
      <h2 className="section-title">
        <TrendingUp className="h-5 w-5 text-primary" /> Thống kê luyện tập
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-elevation-1">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", t.tone)}>
              <t.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-2xl font-black text-slate-800">{t.value}</p>
              <p className="text-caption text-slate-500">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-elevation-1 lg:col-span-2">
          <p className="font-display font-bold text-slate-800">14 ngày gần đây</p>
          <div className="mt-3 flex h-28 items-end gap-1.5">
            {summary.recentDays.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.attempts} lượt`}>
                <span className="text-[10px] font-bold text-slate-400">{d.attempts || ""}</span>
                <span
                  className={cn("w-full rounded-t-md", d.attempts ? "bg-primary/70" : "bg-slate-100")}
                  style={{ height: `${d.attempts ? Math.max(12, (d.attempts / maxDay) * 80) : 6}px` }}
                />
                <span className="text-[10px] text-slate-400">{d.day.slice(8)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-caption text-slate-500">
            Luyện tập {summary.activeDays}/14 ngày · tổng thời gian {fmtMinutes(summary.seconds)}
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-100">
          <p className="flex items-center gap-1.5 font-display font-bold text-violet-700">
            <MessageSquareQuote className="h-5 w-5" /> Nhận xét
          </p>
          <ul className="mt-2 space-y-1.5">
            {summary.remarks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-violet-900">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" /> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
        {[
          { title: "Bài em luyện tập nhiều nhất", list: summary.mostPracticed, show: (g) => `${g.attempts} lần` },
          { title: "Bài cần luyện thêm (đúng ít nhất)", list: summary.weakest, show: (g) => `đúng ${g.accuracy}% · sai ${g.wrong} câu` },
        ].map((box) => (
          <div key={box.title} className="rounded-2xl bg-white p-5 shadow-elevation-1">
            <p className="font-display font-bold text-slate-800">{box.title}</p>
            {box.list.length === 0 ? (
              <p className="mt-2 text-caption text-slate-400">Chưa đủ dữ liệu — làm thêm vài bài nhé.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {box.list.map((g) => (
                  <li key={g.lesson} className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/bai/${g.lesson}`} className="min-w-0 truncate font-semibold text-slate-700 hover:text-primary">
                      {g.title}
                    </Link>
                    <span className="shrink-0 text-xs font-bold text-slate-500">{box.show(g)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HistoryPage() {
  const [summary, setSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [totals, setTotals] = useState({ practice: 0, tests: 0 });
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attemptService.practiceSummary().then((r) => setSummary(r.data)).catch(() => {});
    Promise.all([attemptService.myHistory(), badgeService.myBadges(), testAttemptService.myHistory()]).then(
      ([historyRes, badgesRes, testHistoryRes]) => {
        setAttempts(historyRes.data);
        setTotals({ practice: historyRes.total ?? historyRes.data.length, tests: testHistoryRes.total ?? testHistoryRes.data.length });
        setBadges(badgesRes.data);
        setTestAttempts(testHistoryRes.data);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="page">
        <PageHeader
          icon={History}
          tone="green"
          title="Lịch sử làm bài"
          subtitle="Xem lại kết quả các lượt luyện tập và kiểm tra"
          right={
            <>
              <HeaderStat icon={BookOpen} value={totals.practice} label="luyện tập" />
              <HeaderStat icon={ClipboardCheck} value={totals.tests} label="kiểm tra" />
              <HeaderStat icon={Award} value={badges.length} label="huy hiệu" />
            </>
          }
        />

        <section className="mt-5">
          <h2 className="section-title">
            <Award className="h-5 w-5 text-amber-500" /> Huy hiệu của em
          </h2>
          {badges.length === 0 ? (
            <Link to="/thanh-tich" className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-500 shadow-elevation-1 transition hover:-translate-y-0.5">
              <Img3D name="lock" className="h-9 w-9" /> Chưa có huy hiệu nào — hoàn thành bài học để mở khoá nhé! <span className="ml-auto font-black text-primary">Xem huy hiệu →</span>
            </Link>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {badges.map((sb) => (
                <div
                  key={sb._id}
                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-elevation-1 ring-1 ring-amber-100"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-white">
                    <Award className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{sb.badge?.name}</p>
                    {sb.badge?.description && <p className="text-caption text-slate-500">{sb.badge.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <PracticeSummary summary={summary} />

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
          <section>
            <h2 className="section-title">
              <BookOpen className="h-5 w-5 text-primary" /> Các lượt luyện tập{totals.practice > attempts.length && <span className="ml-2 text-sm font-semibold text-slate-400">({attempts.length} lần gần nhất)</span>}
            </h2>
            {attempts.length === 0 ? (
              <div className="mt-4">
                <EmptyState text="Chưa có lượt làm bài nào." />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {attempts.map((attempt) => (
                  <AttemptCard
                    key={attempt._id}
                    attempt={attempt}
                    subtitle={attempt.lesson?.title}
                    to={`/ket-qua/${attempt._id}`}
                    accent="primary"
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="section-title">
              <ClipboardCheck className="h-5 w-5 text-vietnamese" /> Các lượt kiểm tra
            </h2>
            {testAttempts.length === 0 ? (
              <div className="mt-4">
                <EmptyState text="Chưa có lượt kiểm tra nào." />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {testAttempts.map((attempt) => (
                  <AttemptCard
                    key={attempt._id}
                    attempt={attempt}
                    subtitle={attempt.test?.title}
                    to={`/kiem-tra/ket-qua/${attempt._id}`}
                    accent="vietnamese"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
