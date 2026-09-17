import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, Inbox, ChevronRight, Award, ClipboardCheck, BookOpen } from "lucide-react";
import { attemptService, badgeService, testAttemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-elevation-1 ring-1 ring-slate-100">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox className="h-7 w-7" />
      </span>
      <p className="mt-4 text-body text-slate-500">{text}</p>
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
      className="group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 font-display text-h2 text-slate-800">
            <History className="h-7 w-7 text-primary" /> Lịch sử làm bài
          </h1>
          <div className="flex gap-3">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-elevation-1 ring-1 ring-slate-100">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-slate-800">{attempts.length}</p>
                <p className="text-caption text-slate-500">lượt luyện tập</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-elevation-1 ring-1 ring-slate-100">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-vietnamese/10 text-vietnamese">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-slate-800">{testAttempts.length}</p>
                <p className="text-caption text-slate-500">lượt kiểm tra</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-elevation-1 ring-1 ring-slate-100">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-slate-800">{badges.length}</p>
                <p className="text-caption text-slate-500">huy hiệu</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 font-display text-h3 text-slate-800">
            <Award className="h-5 w-5 text-amber-500" /> Huy hiệu của em
          </h2>
          {badges.length === 0 ? (
            <p className="mt-3 text-caption text-slate-500">Chưa có huy hiệu nào. Hoàn thành bài học để nhận huy hiệu!</p>
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

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="flex items-center gap-1.5 font-display text-h3 text-slate-800">
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
            <h2 className="flex items-center gap-1.5 font-display text-h3 text-slate-800">
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
