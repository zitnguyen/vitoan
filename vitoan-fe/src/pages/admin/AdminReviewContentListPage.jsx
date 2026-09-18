import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { gradeService, subjectService, chapterService, reviewContentService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const filterSelectClass =
  "w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminReviewContentListPage() {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterChapter, setFilterChapter] = useState("");

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
      reviewContentService
        .list({
          search: search || undefined,
          subject: filterSubject || undefined,
          grade: filterGrade || undefined,
          chapter: filterChapter || undefined,
        })
        .then((res) => {
          setRows(res.data);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filterSubject, filterGrade, filterChapter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-h2 text-slate-800">Quản lý nội dung ôn tập</h1>
      <p className="mt-1 text-caption text-slate-500">
        Danh sách bài học và trạng thái nội dung lý thuyết. Bấm vào một dòng để soạn/sửa nội dung.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo tiêu đề bài học"
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
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {rows.map(({ lesson, review }) => (
            <Link
              key={lesson._id}
              to={`/admin/bai-hoc/${lesson._id}/on-tap`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100 transition hover:ring-primary/30"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-display font-bold text-slate-800">
                  {lesson.title}
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold",
                      review ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {review ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {review ? "Đã có nội dung" : "Chưa có nội dung"}
                  </span>
                </p>
                <p className="text-caption text-slate-500">
                  {lesson.grade?.name} · {lesson.subject?.name}
                  {lesson.chapter?.title ? ` · ${lesson.chapter.title}` : ""}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          ))}
          {rows.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
              Không tìm thấy bài học phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
