import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, Inbox, ChevronRight, Award, ClipboardCheck, BookOpen } from "../../components/ui/icons.jsx";
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

export default function HistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([attemptService.myHistory(), badgeService.myBadges(), testAttemptService.myHistory()]).then(
      ([historyRes, badgesRes, testHistoryRes]) => {
        setAttempts(historyRes.data);
        setBadges(badgesRes.data);
        setTestAttempts(testHistoryRes.data);
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

  return (
    <div className="min-h-screen">
      <div className="page">
        <PageHeader
          icon={History}
          tone="green"
          title="Lịch sử làm bài"
          subtitle="Xem lại kết quả các lượt luyện tập và kiểm tra"
          right={
            <>
              <HeaderStat icon={BookOpen} value={attempts.length} label="luyện tập" />
              <HeaderStat icon={ClipboardCheck} value={testAttempts.length} label="kiểm tra" />
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

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="section-title">
              <BookOpen className="h-5 w-5 text-primary" /> Các lượt luyện tập
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
