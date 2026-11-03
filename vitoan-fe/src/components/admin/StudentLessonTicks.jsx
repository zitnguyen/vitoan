import { useEffect, useMemo, useState } from "react";
import { userService } from "../../api/services";
import Spinner from "../ui/Spinner.jsx";

// Admin tick "đã học" thay học sinh để mở khoá làm kiểm tra. Mỗi lần tick lưu ngay.
export default function StudentLessonTicks({ studentId }) {
  const [lessons, setLessons] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await userService.lessonProgress(studentId);
      setLessons(res.data);
    } catch (err) {
      setError(err.apiMessage || "Không tải được danh sách bài học");
      setLessons([]);
    }
  }

  useEffect(() => {
    setLessons(null);
    setError("");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Gom: môn › học kỳ › chương.
  const groups = useMemo(() => {
    const map = new Map();
    for (const l of lessons || []) {
      const key = `${l.subject}|${l.semester}|${l.chapterId}`;
      if (!map.has(key)) map.set(key, { key, title: `${l.subject} · HK${l.semester} · ${l.chapterTitle}`, sort: [l.subject, l.semester, l.chapterOrder], items: [] });
      map.get(key).items.push(l);
    }
    return [...map.values()].sort((a, b) => String(a.sort[0]).localeCompare(String(b.sort[0]), "vi") || a.sort[1] - b.sort[1] || a.sort[2] - b.sort[2]);
  }, [lessons]);

  async function apply(items, completed) {
    // Bài học sinh đã làm thật thì không đổi được; bỏ tick chỉ gỡ phần admin tick.
    const ids = items.filter((l) => (completed ? !l.completed : l.adminCompleted)).map((l) => l._id);
    if (!ids.length) return;
    setSaving(true);
    setError("");
    try {
      await userService.setLessonProgress(studentId, ids, completed);
      await load();
    } catch (err) {
      setError(err.apiMessage || "Không lưu được");
    } finally {
      setSaving(false);
    }
  }

  if (!lessons) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    );
  }

  const doneCount = lessons.filter((l) => l.completed).length;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-800">Bài học đã học ({doneCount}/{lessons.length})</p>
          <p className="text-sm text-slate-500">Tick để tính là đã học, học sinh sẽ làm được bài kiểm tra ngay. Lưu tự động.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={saving} onClick={() => apply(lessons, true)} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary disabled:opacity-50">
            Tick tất cả
          </button>
          <button type="button" disabled={saving} onClick={() => apply(lessons, false)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 disabled:opacity-50">
            Bỏ tick do admin
          </button>
        </div>
      </div>
      {error && <p className="mb-2 rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-600">{error}</p>}
      {lessons.length === 0 && <p className="text-slate-400">Học sinh chưa chọn lớp hoặc lớp chưa có bài học.</p>}
      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {groups.map((g) => {
          const allDone = g.items.every((l) => l.completed);
          return (
            <div key={g.key} className="rounded-xl bg-slate-50 p-3">
              <label className="mb-2 flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" className="h-4 w-4" disabled={saving} checked={allDone} onChange={(e) => apply(g.items, e.target.checked)} />
                {g.title}
              </label>
              <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                {g.items.map((l) => (
                  <label key={l._id} className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      disabled={saving || (l.completed && !l.adminCompleted)}
                      checked={l.completed}
                      onChange={(e) => apply([l], e.target.checked)}
                    />
                    <span className={l.completed ? "text-slate-800" : ""}>{l.title}</span>
                    {l.completed && !l.adminCompleted && <span className="text-xs text-green-600">(đã làm bài)</span>}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
