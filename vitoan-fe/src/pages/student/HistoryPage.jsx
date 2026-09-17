import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History, Inbox, ChevronRight, Award, ClipboardCheck } from "lucide-react";
import { attemptService, badgeService, testAttemptService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";

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
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="flex items-center gap-2 font-display text-h2 text-slate-800">
        <History className="h-6 w-6 text-primary" /> Lịch sử làm bài
      </h1>

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

      <h2 className="mt-8 font-display text-h3 text-slate-800">Các lượt luyện tập</h2>
      {attempts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-elevation-1 ring-1 ring-slate-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-7 w-7" />
          </span>
          <p className="mt-4 text-body text-slate-500">Chưa có lượt làm bài nào.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {attempts.map((attempt) => (
            <Link
              key={attempt._id}
              to={`/ket-qua/${attempt._id}`}
              className="group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
            >
              <div>
                <p className="font-display font-bold text-slate-800">{attempt.lesson?.title}</p>
                <p className="text-caption text-slate-500">
                  {new Date(attempt.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-h3 text-primary">
                  {attempt.score}/{attempt.totalQuestions}
                </span>
                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-8 flex items-center gap-1.5 font-display text-h3 text-slate-800">
        <ClipboardCheck className="h-5 w-5 text-vietnamese" /> Các lượt kiểm tra
      </h2>
      {testAttempts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-elevation-1 ring-1 ring-slate-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-7 w-7" />
          </span>
          <p className="mt-4 text-body text-slate-500">Chưa có lượt kiểm tra nào.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {testAttempts.map((attempt) => (
            <Link
              key={attempt._id}
              to={`/kiem-tra/ket-qua/${attempt._id}`}
              className="group flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
            >
              <div>
                <p className="font-display font-bold text-slate-800">{attempt.test?.title}</p>
                <p className="text-caption text-slate-500">
                  {new Date(attempt.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-h3 text-vietnamese">
                  {attempt.score}/{attempt.totalQuestions}
                </span>
                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
