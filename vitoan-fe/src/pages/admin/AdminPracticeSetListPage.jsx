import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Clock } from "lucide-react";
import { gradeService, subjectService, chapterService, practiceSetService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const filterSelectClass =
  "w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const LEVEL_COLOR = {
  easy: "bg-primary/10 text-primary",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-rose-100 text-rose-600",
};

export default function AdminPracticeSetListPage() {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    Promise.all([gradeService.list(), subjectService.list()]).then(([gradesRes, subjectsRes]) => {
      setGrades(gradesRes.data);
      setSubjects(subjectsRes.data);
    });
  }, []);

  useEffect(() => {
    if (!filterSubject || !filterGrade) {
      setChapters([]);
      setFilterChapter("");
      return;
    }
    chapterService.list({ subject: filterSubject, grade: filterGrade }).then((res) => setChapters(res.data));
  }, [filterSubject, filterGrade]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      practiceSetService
        .list({
          search: search || undefined,
          subject: filterSubject || undefined,
          grade: filterGrade || undefined,
          chapter: filterChapter || undefined,
          level: filterLevel || undefined,
          status: filterStatus || undefined,
        })
        .then((res) => {
          setSets(res.data);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filterSubject, filterGrade, filterChapter, filterLevel, filterStatus]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-h2 text-slate-800">Quản lý bài luyện tập</h1>
      <p className="mt-1 text-caption text-slate-500">
        Tìm kiếm bài luyện tập trên toàn hệ thống. Bấm vào một bài để tới trang quản lý của bài học đó.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo tên bài luyện tập"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={filterSelectClass} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">Tất cả môn</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={filterSelectClass} value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {grades.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          className={filterSelectClass}
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          disabled={chapters.length === 0}
        >
          <option value="">Tất cả chủ đề</option>
          {chapters.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        <select className={filterSelectClass} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          <option value="">Tất cả mức độ</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
        <select className={filterSelectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="published">Đang dùng</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {sets.map((set) => (
            <Link
              key={set._id}
              to={set.lesson?._id ? `/admin/bai-hoc/${set.lesson._id}/luyen-tap` : "#"}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100 transition hover:ring-primary/30"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-display font-bold text-slate-800">
                  {set.title}
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold", LEVEL_COLOR[set.level])}>
                    {LEVEL_LABEL[set.level]}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold",
                      set.isPublished ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {set.isPublished ? "Đang dùng" : "Nháp"}
                  </span>
                </p>
                <p className="flex flex-wrap items-center gap-1 text-caption text-slate-500">
                  {set.lesson?.grade?.name} · {set.lesson?.subject?.name}
                  {set.lesson?.chapter?.title ? ` · ${set.lesson.chapter.title}` : ""} · {set.lesson?.title} · {set.questionCount} câu
                  {set.timeLimitSeconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {Math.round(set.timeLimitSeconds / 60)} phút
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          ))}
          {sets.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
              Không tìm thấy bài luyện tập phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
