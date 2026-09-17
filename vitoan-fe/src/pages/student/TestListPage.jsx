import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ClipboardCheck, PlayCircle, CheckCircle2, RotateCcw, Clock, Inbox, Divide, BookOpenText, BookMarked } from "lucide-react";
import { subjectService, testService, chapterService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const SUBJECT_ICON = { toan: Divide, "tieng-viet": BookOpenText };
const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const LEVEL_COLOR = {
  easy: "bg-primary/10 text-primary",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-600",
};
const TEST_TYPE_LABEL = { midterm: "Giữa kỳ", final: "Cuối kỳ" };

function TestCard({ test }) {
  const completed = !!test.lastAttempt;
  return (
    <Link
      to={`/kiem-tra/${test._id}`}
      className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
          completed ? "bg-primary/10 text-primary" : "bg-vietnamese/10 text-vietnamese"
        )}
      >
        {completed ? <CheckCircle2 className="h-6 w-6" /> : <ClipboardCheck className="h-6 w-6" />}
      </span>
      <div className="flex-1">
        <p className="font-display font-bold text-slate-800">
          {test.title}
          {test.testType !== "topic" && (
            <span className="ml-2 rounded-full bg-vietnamese/10 px-2 py-0.5 text-caption font-semibold text-vietnamese">
              {TEST_TYPE_LABEL[test.testType]}
            </span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-slate-500">
          {test.chapter?.title && <span>{test.chapter.title}</span>}
          <span className={cn("rounded-full px-2 py-0.5 font-semibold", LEVEL_COLOR[test.level])}>
            {LEVEL_LABEL[test.level]}
          </span>
          <span>{test.questionCount} câu</span>
          {test.timeLimitSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {Math.round(test.timeLimitSeconds / 60)} phút
            </span>
          )}
          {completed && (
            <span className="font-semibold text-primary">
              Điểm gần nhất: {test.lastAttempt.score}/{test.lastAttempt.totalQuestions}
            </span>
          )}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition",
          completed
            ? "border border-slate-200 text-slate-600 group-hover:border-primary/40 group-hover:text-primary"
            : "bg-primary text-white group-hover:bg-primary-dark"
        )}
      >
        {completed ? (
          <span className="flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Làm lại
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" /> Bắt đầu
          </span>
        )}
      </span>
    </Link>
  );
}

export default function TestListPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chapterParam = searchParams.get("chapter");
  const [subjects, setSubjects] = useState([]);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [topicTests, setTopicTests] = useState([]);
  const [termTests, setTermTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.grade) return;
    subjectService.list().then(async (res) => {
      setSubjects(res.data);
      let initialSubjectId = res.data[0]?._id || null;
      if (chapterParam) {
        try {
          const chapterRes = await chapterService.list({});
          const chapter = chapterRes.data.find((c) => c._id === chapterParam);
          if (chapter?.subject) initialSubjectId = chapter.subject._id || chapter.subject;
        } catch {
          // ignore, fall back to first subject
        }
      }
      setActiveSubjectId(initialSubjectId);
    });
  }, [user?.grade, chapterParam]);

  useEffect(() => {
    if (!user?.grade || !activeSubjectId) return;
    setLoading(true);
    Promise.all([
      testService.list({ testType: "topic", grade: user.grade._id, subject: activeSubjectId }),
      testService.list({ subject: activeSubjectId, grade: user.grade._id }),
    ]).then(([topicRes, allRes]) => {
      setTopicTests(topicRes.data);
      setTermTests(allRes.data.filter((t) => t.testType !== "topic"));
      setLoading(false);
    });
  }, [user?.grade, activeSubjectId]);

  if (!user?.grade) {
    return <Navigate to="/chon-lop" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center justify-center gap-2 text-vietnamese">
        <ClipboardCheck className="h-5 w-5" />
        <span className="text-caption font-semibold uppercase tracking-wide">Kiểm tra</span>
      </div>
      <h1 className="mt-2 text-center font-display text-h2 text-slate-800">
        Đánh giá năng lực — {user.grade.name}
      </h1>
      <p className="mt-2 text-center text-body text-slate-500">
        Làm bài kiểm tra để biết mức độ nắm kiến thức sau khi ôn tập và luyện tập
      </p>

      <div className="mt-8 flex justify-center gap-2">
        {subjects.map((subject) => {
          const Icon = SUBJECT_ICON[subject.slug] || BookMarked;
          const active = subject._id === activeSubjectId;
          return (
            <button
              key={subject._id}
              type="button"
              onClick={() => setActiveSubjectId(subject._id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                active ? "bg-primary text-white shadow-elevation-1" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" /> {subject.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="font-display text-h3 text-slate-800">Kiểm tra theo chủ đề</h2>
            {topicTests.length === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-elevation-1 ring-1 ring-slate-100">
                <Inbox className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-caption text-slate-500">Chưa có bài kiểm tra chủ đề nào.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {topicTests.map((test) => (
                  <TestCard key={test._id} test={test} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="font-display text-h3 text-slate-800">Kiểm tra giữa kỳ &amp; cuối kỳ</h2>
            {termTests.length === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-2xl bg-white p-8 text-center shadow-elevation-1 ring-1 ring-slate-100">
                <Inbox className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-caption text-slate-500">Chưa có bài kiểm tra giữa kỳ/cuối kỳ nào.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {termTests.map((test) => (
                  <TestCard key={test._id} test={test} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
