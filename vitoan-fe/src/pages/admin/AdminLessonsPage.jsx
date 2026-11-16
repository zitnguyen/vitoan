import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  ChevronRight,
  Video,
  BookOpen,
  ListChecks,
  Dumbbell,
  FolderOpen,
} from "lucide-react";
import { gradeService, subjectService, lessonService, chapterService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import IdBadge from "../../components/common/IdBadge.jsx";
import { AdminPage, Card, Field, IconButton, StatusChip, inputClass } from "../../components/admin/adminUi.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";
import ExcelButtons from "../../components/admin/ExcelButtons.jsx";
import { cellStr, readRows, saveSheet, stamp } from "../../lib/excelIO";

// Cột tệp Excel bài học (cột "readonly" là mã/thông tin tham khảo — đừng sửa).
const LESSON_COLUMNS = [
  { header: "Mã bài (đừng sửa; để trống = thêm bài mới)", width: 26, readonly: true },
  { header: "Học kỳ (1/2)", width: 10 },
  { header: "Chủ đề", width: 38 },
  { header: "Tên bài học", width: 40 },
  { header: "Mô tả ngắn", width: 36 },
  { header: "Thứ tự", width: 8 },
  { header: "Hiện cho học sinh (có/không)", width: 14 },
  { header: "Cho khách học thử (có/không)", width: 14 },
  { header: "Số câu ngẫu nhiên mỗi lượt luyện tập (0 = tất cả)", width: 18 },
  { header: "Lý thuyết", width: 60 },
  { header: "Ví dụ (mỗi dòng một ví dụ)", width: 40 },
  { header: "Link video", width: 36 },
  { header: "Số câu hỏi (chỉ để xem)", width: 12, readonly: true },
];
const yesNo = (v) => (v ? "có" : "không");

const EMPTY_CHAPTER = { title: "", semester: 1 };
const EMPTY_LESSON = { title: "", description: "", isPublished: true, isTrial: false, randomQuestionCount: 0 };

function Tabs({ items, value, onChange, getLabel }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item._id}
          type="button"
          onClick={() => onChange(item._id)}
          className={cn(
            "rounded-full px-4 py-1.5 font-bold transition",
            value === item._id ? "bg-primary text-white shadow-elevation-1" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          )}
        >
          {getLabel(item)}
        </button>
      ))}
    </div>
  );
}

// Tiền tố đánh số mặc định: "Chủ đề N: …" và "Bài N: …" (N theo vị trí trong danh sách).
const CHAPTER_LABEL = { word: "Chủ đề", re: /^\s*Chủ đề\s*\d+\s*[:.\-–]\s*/i };
const LESSON_LABEL = { word: "Bài", re: /^\s*Bài\s*\d+\s*[:.\-–]\s*/i };
const prefixOf = (label, n) => `${label.word} ${n}: `;

// Đánh lại thứ tự 1..n và số trong tên (chỉ với tên đã có tiền tố "Bài N:"/"Chủ đề N:"); chỉ gửi API cho phần tử thay đổi.
async function renumber(list, update, label) {
  await Promise.all(
    list.map((item, i) => {
      const patch = {};
      if (item.order !== i + 1) patch.order = i + 1;
      if (label.re.test(item.title)) {
        const title = prefixOf(label, i + 1) + item.title.replace(label.re, "");
        if (title !== item.title) patch.title = title;
      }
      return Object.keys(patch).length ? update(item._id, patch) : null;
    })
  );
}

// Đổi chỗ phần tử i với i+dir rồi đánh số lại.
async function moveItem(list, index, dir, update, label) {
  const target = index + dir;
  if (target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  await renumber(next, update, label);
}

// Danh sách chủ đề theo thứ tự thật: học kỳ 1 trước, học kỳ 2 sau.
const sortChapters = (list) => [...list].sort((a, b) => (a.semester || 1) - (b.semester || 1) || a.order - b.order);

function isLessonMissing(l) {
  return !l.hasVideo || !l.hasContent || l.questionCount === 0;
}

// Quản lý nội dung theo quan hệ 1-nhiều: Môn → Lớp → Chủ đề → Bài học.
// Bấm vào 1 bài học để mở trang chi tiết (tab Lý thuyết – Câu hỏi – Bài luyện tập).
export default function AdminLessonsPage() {
  const dialog = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [chapterForm, setChapterForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subjectId = searchParams.get("mon") || subjects[0]?._id || "";
  const gradeId = searchParams.get("lop") || grades[0]?._id || "";
  const chapterId = searchParams.get("chu-de") || "";
  const highlightLessonId = searchParams.get("bai") || "";
  const activeChapter = chapters.find((c) => c._id === chapterId) || null;
  const subject = subjects.find((s) => s._id === subjectId);
  const grade = grades.find((g) => g._id === gradeId);

  // Đổi Môn/Lớp/Chủ đề chỉ thay mục lịch sử hiện tại (replace) để bấm Lùi là thoát về trang trước,
  // không phải bấm nhiều lần qua từng tab đã chọn; vào bài học rồi Lùi vẫn về đúng chủ đề (tham số nằm trên URL).
  async function setParams(next, { replace = true } = {}) {
    const merged = { mon: subjectId, lop: gradeId, "chu-de": chapterId, ...next };
    Object.keys(merged).forEach((k) => !merged[k] && delete merged[k]);
    setSearchParams(merged, { replace });
  }

  useEffect(() => {
    Promise.all([gradeService.list(), subjectService.list()]).then(([gradesRes, subjectsRes]) => {
      setGrades(gradesRes.data);
      setSubjects(subjectsRes.data);
      setLoading(false);
    });
  }, []);

  async function loadChapters() {
    if (!subjectId || !gradeId) return;
    const res = await chapterService.list({ subject: subjectId, grade: gradeId });
    setChapters(res.data);
  }

  async function loadLessons() {
    if (!chapterId) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    const res = await lessonService.list({ chapter: chapterId, withCounts: 1 });
    setLessons(res.data);
    setLoadingLessons(false);
  }

  useEffect(() => {
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, gradeId]);

  useEffect(() => {
    loadLessons();
    setLessonForm(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  useEffect(() => {
    if (!chapterId && chapters.length > 0) setParams({ "chu-de": chapters[0]._id }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, chapterId]);

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  async function saveChapter(e) {
    e.preventDefault();
    run(async () => {
      const payload = { title: chapterForm.title.trim(), semester: chapterForm.semester, subject: subjectId, grade: gradeId };
      if (chapterForm._id) await chapterService.update(chapterForm._id, payload);
      else {
        const res = await chapterService.create({ ...payload, order: chapters.length + 1 });
        setParams({ "chu-de": res.data._id });
      }
      setChapterForm(null);
      await loadChapters();
    });
  }

  async function deleteChapter(chapter) {
    if (chapter.lessonCount > 0) {
      dialog.alert(`Chủ đề "${chapter.title}" còn ${chapter.lessonCount} bài học. Hãy xoá hoặc chuyển các bài học sang chủ đề khác trước.`);
      return;
    }
    if (!(await dialog.confirm({ message: `Xoá chủ đề "${chapter.title}"?`, danger: true, confirmText: "Xoá" }))) return;
    run(async () => {
      await chapterService.remove(chapter._id);
      setParams({ "chu-de": "" }, { replace: true });
      await renumber(sortChapters(chapters).filter((c) => c._id !== chapter._id), chapterService.update, CHAPTER_LABEL);
      await loadChapters();
    });
  }

  // Đánh số toàn môn/lớp (HK1 rồi HK2) để thứ tự không bị trộn giữa hai học kỳ.
  async function moveChapter(list, index, dir) {
    run(async () => {
      const all = sortChapters(chapters);
      await moveItem(all, all.findIndex((c) => c._id === list[index]._id), dir, chapterService.update, CHAPTER_LABEL);
      await loadChapters();
    });
  }

  async function saveLesson(e) {
    e.preventDefault();
    run(async () => {
      const targetChapter = lessonForm.chapter || chapterId;
      const payload = {
        title: lessonForm.title.trim(),
        description: lessonForm.description,
        isPublished: lessonForm.isPublished,
        isTrial: lessonForm.isTrial,
        randomQuestionCount: Math.max(0, Number(lessonForm.randomQuestionCount) || 0),
        subject: subjectId,
        grade: gradeId,
        chapter: targetChapter,
      };
      if (lessonForm._id) {
        // Chuyển sang chủ đề khác → đưa xuống cuối chủ đề mới.
        if (targetChapter !== chapterId) payload.order = 9999;
        await lessonService.update(lessonForm._id, payload);
      } else {
        await lessonService.create({ ...payload, order: lessons.length + 1 });
      }
      setLessonForm(null);
      await Promise.all([loadLessons(), loadChapters()]);
    });
  }

  async function deleteLesson(lesson) {
    if (!(await dialog.confirm({ message: `Xoá bài học "${lesson.title}"? Toàn bộ ${lesson.questionCount} câu hỏi của bài học cũng bị xoá.`, danger: true, confirmText: "Xoá" }))) return;
    run(async () => {
      await lessonService.remove(lesson._id);
      await renumber(lessons.filter((l) => l._id !== lesson._id), lessonService.update, LESSON_LABEL);
      await Promise.all([loadLessons(), loadChapters()]);
    });
  }

  async function exportLessons() {
    const res = await lessonService.exportRows({ subject: subjectId, grade: gradeId });
    const rows = res.data.map((l) => [l._id, l.semester, l.chapter, l.title, l.description, l.order, yesNo(l.isPublished), yesNo(l.isTrial), l.randomQuestionCount, l.content, (l.examples || []).join("\n"), l.videoUrl, l.questionCount]);
    await saveSheet(`bai-hoc-${subject?.name || "mon"}-${grade?.name || "lop"}-${stamp()}.xlsx`, LESSON_COLUMNS, rows);
  }

  async function importLessonsFile(file) {
    const parsed = await readRows(file);
    if (!parsed.length) throw new Error("Tệp không có dòng nào.");
    const rows = parsed.map(({ cells: c, row }) => ({
      row,
      _id: cellStr(c[0]),
      semester: cellStr(c[1]),
      chapter: cellStr(c[2]),
      title: cellStr(c[3]),
      description: cellStr(c[4]),
      order: cellStr(c[5]),
      isPublished: cellStr(c[6]),
      isTrial: cellStr(c[7]),
      randomQuestionCount: cellStr(c[8]),
      content: c[9] === null || c[9] === undefined ? "" : String(c[9]),
      examples: cellStr(c[10]).split(/\r?\n/),
      videoUrl: cellStr(c[11]),
    }));
    const res = await lessonService.importRows({ subject: subjectId, grade: gradeId, rows });
    return res.data;
  }

  function moveLesson(index, dir) {
    run(async () => {
      await moveItem(lessons, index, dir, lessonService.update, LESSON_LABEL);
      await loadLessons();
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const shownLessons = onlyMissing ? lessons.filter(isLessonMissing) : lessons;
  const missingCount = lessons.filter(isLessonMissing).length;

  return (
    <AdminPage
      title="Bài học & chủ đề"
      subtitle="Chọn Môn → Lớp → Chủ đề, rồi bấm vào một bài học để soạn lý thuyết, video, câu hỏi và bài luyện tập."
      actions={
        <ExcelButtons
          onExport={exportLessons}
          onImport={importLessonsFile}
          onDone={() => Promise.all([loadChapters(), loadLessons()])}
          importHint={`Nhập bài học cho ${subject?.name || ""} ${grade?.name || ""}: dòng có mã chỉ cập nhật nếu đã sửa, dòng không có mã là bài mới`}
        />
      }
    >
      <Card className="space-y-2.5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-12 shrink-0 font-bold text-slate-400">Môn</span>
          <Tabs items={subjects} value={subjectId} onChange={(id) => setParams({ mon: id, "chu-de": "" })} getLabel={(s) => s.name} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-12 shrink-0 font-bold text-slate-400">Lớp</span>
          <Tabs items={grades} value={gradeId} onChange={(id) => setParams({ lop: id, "chu-de": "" })} getLabel={(g) => g.name} />
        </div>
      </Card>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Chủ đề ── */}
        <Card className="p-3 lg:self-start">
          <div className="flex items-center justify-between px-1">
            <p className="font-display text-lg font-bold text-slate-800">Chủ đề ({chapters.length})</p>
            <Button onClick={() => setChapterForm({ ...EMPTY_CHAPTER, title: prefixOf(CHAPTER_LABEL, chapters.length + 1) })} className="px-3 py-1.5 text-sm">
              <Plus className="h-4 w-4" /> Thêm chủ đề
            </Button>
          </div>

          {chapterForm && (
            <form onSubmit={saveChapter} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="font-bold text-slate-700">
                {chapterForm._id ? "Sửa chủ đề" : "Chủ đề mới"} · {subject?.name} {grade?.name}
              </p>
              <Field label="Tên chủ đề" required>
                <input
                  className={inputClass}
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  autoFocus
                />
              </Field>
              <Field label="Học kỳ">
                <div className="flex gap-2">
                  {[1, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setChapterForm((f) => ({ ...f, semester: s }))}
                      className={cn(
                        "flex-1 rounded-xl py-2 font-bold ring-1",
                        chapterForm.semester === s ? "bg-primary text-white ring-primary" : "bg-white text-slate-600 ring-slate-200"
                      )}
                    >
                      Học kỳ {s}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy} className="flex-1">
                  {chapterForm._id ? "Lưu" : "Thêm"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setChapterForm(null)}>
                  Huỷ
                </Button>
              </div>
            </form>
          )}

          <div className="mt-2 space-y-3">
            {[1, 2].map((sem) => {
              const list = chapters.filter((c) => (c.semester || 1) === sem);
              if (list.length === 0) return null;
              return (
                <div key={sem}>
                  <p className="px-2 pb-1 text-sm font-bold uppercase tracking-wide text-slate-400">Học kỳ {sem}</p>
                  <div className="space-y-1">
                    {list.map((c, i) => {
                      const selected = c._id === chapterId;
                      return (
                        <div
                          key={c._id}
                          onClick={() => setParams({ "chu-de": c._id })}
                          className={cn(
                            "group cursor-pointer rounded-xl px-3 py-2.5 transition",
                            selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <FolderOpen className={cn("mt-0.5 h-5 w-5 shrink-0", selected ? "text-primary" : "text-slate-400")} />
                            <div className="min-w-0 flex-1">
                              <p className={cn("font-bold leading-snug", selected ? "text-primary" : "text-slate-700")}>{c.title}</p>
                              <p className="text-sm text-slate-400">{c.lessonCount} bài học</p>
                            </div>
                          </div>
                          <div
                            className={cn("mt-2 flex justify-end gap-1", selected ? "flex" : "hidden group-hover:flex")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconButton title="Lên trên" disabled={i === 0 || busy} onClick={() => moveChapter(list, i, -1)}>
                              <ArrowUp className="h-4 w-4" />
                            </IconButton>
                            <IconButton title="Xuống dưới" disabled={i === list.length - 1 || busy} onClick={() => moveChapter(list, i, 1)}>
                              <ArrowDown className="h-4 w-4" />
                            </IconButton>
                            <IconButton title="Sửa chủ đề" onClick={() => setChapterForm({ _id: c._id, title: c.title, semester: c.semester || 1 })}>
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                            <IconButton title="Xoá chủ đề" tone="danger" onClick={() => deleteChapter(c)}>
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {chapters.length === 0 && <p className="px-2 py-4 text-slate-400">Chưa có chủ đề nào. Bấm "Thêm chủ đề" để bắt đầu.</p>}
          </div>
        </Card>

        {/* ── Bài học ── */}
        <Card className="p-4">
          {!activeChapter ? (
            <p className="py-10 text-center text-slate-400">Chọn một chủ đề để xem các bài học.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-400">
                    {subject?.name} · {grade?.name} · Học kỳ {activeChapter.semester || 1}
                  </p>
                  <h2 className="font-display text-h3 leading-tight text-slate-800">{activeChapter.title}</h2>
                </div>
                <Button onClick={() => setLessonForm({ ...EMPTY_LESSON, title: prefixOf(LESSON_LABEL, lessons.length + 1) })}>
                  <Plus className="h-4 w-4" /> Thêm bài học
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setOnlyMissing(false)}
                  className={cn("rounded-full px-3 py-1 font-bold", !onlyMissing ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")}
                >
                  Tất cả ({lessons.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyMissing(true)}
                  className={cn("rounded-full px-3 py-1 font-bold", onlyMissing ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700")}
                >
                  Còn thiếu nội dung ({missingCount})
                </button>
              </div>

              {lessonForm && (
                <form onSubmit={saveLesson} className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-2">
                  <p className="font-bold text-slate-700 sm:col-span-2">{lessonForm._id ? "Sửa bài học" : "Bài học mới"}</p>
                  <Field label="Tên bài học" required className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                      required
                      autoFocus
                    />
                  </Field>
                  <Field label="Mô tả ngắn" hint="Không bắt buộc — hiện dưới tên bài học." className="sm:col-span-2">
                    <input
                      className={inputClass}
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </Field>
                  <Field
                    label="Số câu ngẫu nhiên mỗi lượt luyện tập"
                    hint="0 = học sinh làm toàn bộ câu hỏi của bài. Nhập 10 → mỗi lượt bốc ngẫu nhiên 10 câu."
                    className="sm:col-span-2"
                  >
                    <input
                      type="number"
                      min={0}
                      className={cn(inputClass, "w-40")}
                      value={lessonForm.randomQuestionCount ?? 0}
                      onChange={(e) => setLessonForm((f) => ({ ...f, randomQuestionCount: e.target.value }))}
                    />
                  </Field>
                  {lessonForm._id && (
                    <Field label="Thuộc chủ đề" className="sm:col-span-2">
                      <select
                        className={inputClass}
                        value={lessonForm.chapter || chapterId}
                        onChange={(e) => setLessonForm((f) => ({ ...f, chapter: e.target.value }))}
                      >
                        {chapters.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <label className="flex items-center gap-2 font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-primary"
                      checked={lessonForm.isPublished}
                      onChange={(e) => setLessonForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    />
                    Hiện cho học sinh
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-primary"
                      checked={lessonForm.isTrial}
                      onChange={(e) => setLessonForm((f) => ({ ...f, isTrial: e.target.checked }))}
                    />
                    Cho khách học thử (không cần đăng nhập)
                  </label>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={busy}>
                      {lessonForm._id ? "Lưu thay đổi" : "Thêm bài học"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setLessonForm(null)}>
                      <X className="h-4 w-4" /> Huỷ
                    </Button>
                  </div>
                </form>
              )}

              {loadingLessons ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-100">
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-400">
                    <span className="w-8 shrink-0 text-center">STT</span>
                    <span>Tên bài học</span>
                  </div>
                  {shownLessons.map((lesson) => {
                    const index = lessons.findIndex((l) => l._id === lesson._id);
                    return (
                      <div
                        key={lesson._id}
                        className={cn("flex items-center gap-3 p-3", lesson._id === highlightLessonId && "bg-primary/5")}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                          {index + 1}
                        </span>
                        <Link to={`/admin/bai-hoc/${lesson._id}/on-tap`} className="group min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold leading-snug text-slate-800 group-hover:text-primary">
                            {lesson.title}
                            {!lesson.isPublished && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">Đang ẩn</span>}
                            {lesson.isTrial && <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-bold text-secondary">Học thử</span>}
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary" />
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <StatusChip ok={lesson.hasVideo}>
                              <Video className="h-3.5 w-3.5" /> {lesson.hasVideo ? "Có video" : "Chưa có video"}
                            </StatusChip>
                            <StatusChip ok={lesson.hasContent}>
                              <BookOpen className="h-3.5 w-3.5" /> {lesson.hasContent ? "Có lý thuyết" : "Chưa có lý thuyết"}
                            </StatusChip>
                            <StatusChip ok={lesson.questionCount > 0} warn={lesson.questionCount === 0}>
                              <ListChecks className="h-3.5 w-3.5" /> {lesson.questionCount} câu hỏi
                            </StatusChip>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                              <Dumbbell className="h-3.5 w-3.5" />
                              {lesson.practiceSetCount > 0
                                ? `${lesson.practiceSetCount} bài luyện tập`
                                : lesson.randomQuestionCount > 0
                                ? `Luyện tập: ${lesson.randomQuestionCount} câu ngẫu nhiên`
                                : "Luyện tập bằng toàn bộ câu hỏi"}
                            </span>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          {!onlyMissing && (
                            <>
                              <IconButton title="Lên trên" disabled={index === 0 || busy} onClick={() => moveLesson(index, -1)}>
                                <ArrowUp className="h-4 w-4" />
                              </IconButton>
                              <IconButton title="Xuống dưới" disabled={index === lessons.length - 1 || busy} onClick={() => moveLesson(index, 1)}>
                                <ArrowDown className="h-4 w-4" />
                              </IconButton>
                            </>
                          )}
                          <IconButton
                            title="Sửa tên / trạng thái"
                            onClick={() =>
                              setLessonForm({
                                _id: lesson._id,
                                title: lesson.title,
                                description: lesson.description || "",
                                isPublished: lesson.isPublished,
                                isTrial: !!lesson.isTrial,
                                randomQuestionCount: lesson.randomQuestionCount || 0,
                                chapter: lesson.chapter,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <a
                            href={`/bai/${lesson._id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Xem như học sinh"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <IconButton title="Xoá bài học" tone="danger" onClick={() => deleteLesson(lesson)}>
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                          <IdBadge id={lesson._id} label="Bài học" always className="hidden xl:inline-flex" />
                        </div>
                      </div>
                    );
                  })}
                  {shownLessons.length === 0 && (
                    <p className="py-8 text-center text-slate-400">
                      {onlyMissing ? "Tất cả bài học đã đủ video, lý thuyết và câu hỏi 🎉" : "Chủ đề này chưa có bài học nào."}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}
