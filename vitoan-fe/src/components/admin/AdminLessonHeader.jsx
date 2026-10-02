import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, BookOpen, ListChecks, Dumbbell } from "lucide-react";
import { chapterService, lessonService } from "../../api/services";
import IdBadge from "../common/IdBadge.jsx";
import { contentUrl } from "./AdminIdLookup.jsx";
import { cn } from "../../lib/utils";

const TABS = [
  { key: "on-tap", label: "Lý thuyết & video", Icon: BookOpen },
  { key: "cau-hoi", label: "Câu hỏi", Icon: ListChecks },
  { key: "luyen-tap", label: "Bài luyện tập", Icon: Dumbbell },
];

// Đầu trang chung cho mọi trang con của 1 bài học: đường dẫn, chuyển bài học trước/sau,
// và tab chuyển qua lại giữa Lý thuyết – Câu hỏi – Bài luyện tập (không phải quay về cây).
// `version` đổi → tải lại số liệu (sau khi thêm/xoá câu hỏi...).
export default function AdminLessonHeader({ lesson, active, version = 0 }) {
  const [chapter, setChapter] = useState(null);
  const [siblings, setSiblings] = useState([]);

  useEffect(() => {
    if (!lesson?.chapter) return;
    chapterService
      .list({ subject: lesson.subject?._id, grade: lesson.grade?._id })
      .then((res) => setChapter(res.data.find((c) => c._id === lesson.chapter) || null))
      .catch(() => {});
  }, [lesson?.chapter, lesson?.subject?._id, lesson?.grade?._id]);

  useEffect(() => {
    if (!lesson?.chapter) return;
    lessonService
      .list({ chapter: lesson.chapter, withCounts: 1 })
      .then((res) => setSiblings(res.data))
      .catch(() => {});
  }, [lesson?.chapter, version]);

  if (!lesson) return null;
  const idx = siblings.findIndex((l) => l._id === lesson._id);
  const me = siblings[idx];
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const counts = {
    "on-tap": me ? (me.hasContent || me.hasVideo ? "✓" : "chưa có") : "",
    "cau-hoi": me ? String(me.questionCount) : "",
    "luyen-tap": me ? String(me.practiceSetCount) : "",
  };
  const backTo = contentUrl({
    subject: lesson.subject,
    grade: lesson.grade,
    chapter: lesson.chapter ? { _id: lesson.chapter } : null,
    lesson: { _id: lesson._id },
  });

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
        <Link to={backTo} className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {lesson.subject?.name} · {lesson.grade?.name}
          {chapter && ` · ${chapter.title}`}
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-400">
            Bài học {idx >= 0 ? `${idx + 1}/${siblings.length}` : ""}
          </p>
          <h1 className="font-display text-h2 leading-tight text-slate-800">{lesson.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IdBadge id={lesson._id} label="ID" always />
          <a
            href={`/bai/${lesson._id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" /> Xem như học sinh
          </a>
          <Link
            to={prev ? `/admin/bai-hoc/${prev._id}/${active}` : "#"}
            onClick={(e) => !prev && e.preventDefault()}
            title={prev ? `Bài học trước: ${prev.title}` : ""}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold",
              prev ? "text-slate-600 hover:text-primary" : "pointer-events-none opacity-40"
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Trước
          </Link>
          <Link
            to={next ? `/admin/bai-hoc/${next._id}/${active}` : "#"}
            onClick={(e) => !next && e.preventDefault()}
            title={next ? `Bài học sau: ${next.title}` : ""}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold",
              next ? "text-slate-600 hover:text-primary" : "pointer-events-none opacity-40"
            )}
          >
            Sau <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <NavLink
            key={t.key}
            to={`/admin/bai-hoc/${lesson._id}/${t.key}`}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition",
              active === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <t.Icon className="h-4 w-4" /> {t.label}
            {counts[t.key] !== "" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  counts[t.key] === "0" || counts[t.key] === "chưa có"
                    ? "bg-amber-100 text-amber-700"
                    : active === t.key
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
