import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { gradeService, subjectService, chapterService, questionService } from "../../api/services";
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
const TYPE_LABEL = {
  multiple_choice: "Trắc nghiệm 4 đáp án",
  listen_choice: "Nghe và chọn đáp án",
  true_false: "Đúng / Sai",
  fill_blank: "Điền vào chỗ trống",
  listen_fill: "Nghe rồi điền vào chỗ trống",
};
const FILL_TYPES = ["fill_blank", "listen_fill"];

export default function AdminQuestionBankPage() {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterType, setFilterType] = useState("");

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
      questionService
        .list({
          search: search || undefined,
          subject: filterSubject || undefined,
          grade: filterGrade || undefined,
          chapter: filterChapter || undefined,
          difficulty: filterDifficulty || undefined,
          type: filterType || undefined,
        })
        .then((res) => {
          setQuestions(res.data);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, filterSubject, filterGrade, filterChapter, filterDifficulty, filterType]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-h2 text-slate-800">Ngân hàng câu hỏi</h1>
      <p className="mt-1 text-caption text-slate-500">
        Tìm kiếm câu hỏi trên toàn hệ thống. Bấm vào một câu để tới trang quản lý câu hỏi của bài học đó.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo nội dung câu hỏi"
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
        <select className={filterSelectClass} value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
          <option value="">Tất cả mức độ</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
        <select className={filterSelectClass} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tất cả loại câu hỏi</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
          {questions.map((q) => (
            <Link
              key={q._id}
              to={q.lesson?._id ? `/admin/bai-hoc/${q.lesson._id}/cau-hoi` : "#"}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100 transition hover:ring-primary/30"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-display font-bold text-slate-800">
                  <span className="truncate">{q.text.replace(/\n/g, " ")}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-caption font-semibold text-secondary">
                    {TYPE_LABEL[q.type] || TYPE_LABEL.multiple_choice}
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold", LEVEL_COLOR[q.difficulty])}>
                    {LEVEL_LABEL[q.difficulty]}
                  </span>
                </div>
                <p className="mt-1 text-caption text-slate-500">
                  {q.lesson?.grade?.name} · {q.lesson?.subject?.name}
                  {q.lesson?.chapter?.title ? ` · ${q.lesson.chapter.title}` : ""} · {q.lesson?.title}
                </p>
                <p className="mt-1 text-caption font-semibold text-primary">
                  Đáp án đúng:{" "}
                  {FILL_TYPES.includes(q.type) ? q.correctText : q.choices?.[q.correctIndex] ?? "—"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          ))}
          {questions.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-400 shadow-elevation-1 ring-1 ring-slate-100">
              Không tìm thấy câu hỏi phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
