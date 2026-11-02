import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, ChevronDown, Pencil, Trash2, FolderTree, X } from "lucide-react";
import { gradeService, questionService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, adminPageClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";
const filterSelectClass =
  "w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

const LEVEL_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const LEVEL_COLOR = { easy: "bg-primary/10 text-primary", medium: "bg-amber-100 text-amber-700", hard: "bg-rose-100 text-rose-600" };
const TYPE_LABEL = {
  multiple_choice: "Trắc nghiệm",
  listen_choice: "Nghe & chọn",
  true_false: "Đúng / Sai",
  fill_blank: "Điền chỗ trống",
  listen_fill: "Nghe & điền",
};
const FILL_TYPES = ["fill_blank", "listen_fill"];
const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Cây danh mục bên trái: Môn → Chủ đề → Bài học, kèm số câu ở mỗi nút (giống "question bank categories" của Moodle).
function CategoryTree({ tree, scope, onPick }) {
  const [open, setOpen] = useState({});
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const node = (active, depth) =>
    cn(
      "flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-sm transition hover:bg-slate-100",
      depth === 0 && "font-black text-slate-800",
      depth === 1 && "pl-4 font-bold text-slate-700",
      depth === 2 && "pl-9 font-medium text-slate-600",
      active && "bg-primary/10 text-primary hover:bg-primary/10"
    );
  return (
    <div className="space-y-0.5">
      {tree.map((s) => (
        <div key={s._id}>
          <button type="button" className={node(scope.subject === s._id && !scope.chapter && !scope.lesson, 0)} onClick={() => { onPick({ subject: s._id }); setOpen((o) => ({ ...o, [s._id]: true })); }}>
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition", !open[s._id] && "-rotate-90")} onClick={(e) => { e.stopPropagation(); toggle(s._id); }} />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="text-xs font-bold text-slate-400">{s.total}</span>
          </button>
          {open[s._id] &&
            s.chapters.map((c) => (
              <div key={c._id}>
                <button type="button" className={node(scope.chapter === c._id && !scope.lesson, 1)} onClick={() => { onPick({ subject: s._id, chapter: c._id }); setOpen((o) => ({ ...o, [c._id]: true })); }}>
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition", !open[c._id] && "-rotate-90")} onClick={(e) => { e.stopPropagation(); toggle(c._id); }} />
                  <span className="flex-1 truncate">{c.title}</span>
                  <span className="text-xs font-bold text-slate-400">{c.total}</span>
                </button>
                {open[c._id] &&
                  c.lessons.map((l) => (
                    <button key={l._id} type="button" className={node(scope.lesson === l._id, 2)} onClick={() => onPick({ subject: s._id, chapter: c._id, lesson: l._id })}>
                      <span className="flex-1 truncate">{l.title}</span>
                      <span className={cn("text-xs font-bold", l.total === 0 ? "text-rose-400" : "text-slate-400")}>{l.total}</span>
                    </button>
                  ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function QuestionPreview({ q }) {
  const isFill = FILL_TYPES.includes(q.type);
  return (
    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm">
      {q.imageUrl && <img src={q.imageUrl} alt="" className="mb-2 max-h-40 rounded-lg" />}
      <p className="whitespace-pre-line font-semibold text-slate-800">{q.text}</p>
      {isFill ? (
        <p className="mt-2 font-bold text-primary">Đáp án đúng: {q.correctText}</p>
      ) : (
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {(q.choices || []).map((c, i) => (
            <li key={i} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-1.5", (q.type === "multi_choice" ? (q.correctIndexes || []).includes(i) : i === q.correctIndex) ? "bg-primary/10 font-bold text-primary" : "bg-white text-slate-600")}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">{LETTERS[i]}</span>
              {c}
            </li>
          ))}
        </ul>
      )}
      {q.explanation && <p className="mt-2 text-slate-500">💡 {q.explanation}</p>}
    </div>
  );
}

export default function AdminQuestionBankPage() {
  const dialog = useDialog();
  const [grades, setGrades] = useState([]);
  const [grade, setGrade] = useState(null); // null = đang tải danh sách lớp
  const [tree, setTree] = useState([]);
  const [customCount, setCustomCount] = useState(0);
  const [scope, setScope] = useState({}); // { subject, chapter, lesson }
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("");
  const [sel, setSel] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showTree, setShowTree] = useState(false);

  useEffect(() => {
    gradeService.list().then((r) => {
      setGrades(r.data);
      setGrade([...r.data].sort((a, b) => (a.order || 0) - (b.order || 0))[0]?._id || "");
    });
  }, []);

  useEffect(() => {
    if (grade === null) return;
    setScope({});
    questionService.tree({ grade: grade || undefined }).then((r) => {
      setTree(r.data);
      setCustomCount(r.customCount || 0);
    });
  }, [grade, reloadKey]);

  useEffect(() => {
    if (grade === null) return undefined;
    setLoading(true);
    const timer = setTimeout(() => {
      questionService
        .list({
          search: search || undefined,
          ...(scope.custom ? { testOnly: "1" } : { grade: grade || undefined, subject: scope.subject, chapter: scope.chapter, lesson: scope.lesson }),
          difficulty: difficulty || undefined,
          type: type || undefined,
          sort: sort || undefined,
          page,
        })
        .then((res) => {
          setQuestions(res.data);
          setTotal(res.total ?? res.data.length);
          setPages(res.pages || 1);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [grade, scope, search, difficulty, type, sort, page, reloadKey]);

  // Đổi bộ lọc thì về trang 1 và bỏ chọn.
  useEffect(() => {
    setPage(1);
    setSel(new Set());
    setExpanded(null);
  }, [grade, scope, search, difficulty, type, sort]);

  const scopeLabel = useMemo(() => {
    if (scope.custom) return "Câu riêng của đề kiểm tra";
    const s = tree.find((x) => x._id === scope.subject);
    const c = s?.chapters.find((x) => x._id === scope.chapter);
    const l = c?.lessons.find((x) => x._id === scope.lesson);
    return [s?.name, c?.title, l?.title].filter(Boolean).join(" › ");
  }, [tree, scope]);

  const allOnPage = questions.length > 0 && questions.every((q) => sel.has(q._id));
  function toggleSel(id) {
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function bulk(action, value) {
    const ids = [...sel];
    if (action === "delete") {
      const ok = await dialog.confirm({
        message: `Xoá ${ids.length} câu hỏi đã chọn? Câu đang dùng trong bài kiểm tra sẽ được giữ lại.`,
        danger: true,
        confirmText: "Xoá",
      });
      if (!ok) return;
    }
    const res = await questionService.bulk({ ids, action, value });
    if (action === "delete" && res.data.skippedInUse > 0) {
      await dialog.confirm({ message: `Đã xoá ${res.data.deleted} câu. Giữ lại ${res.data.skippedInUse} câu vì đang dùng trong bài kiểm tra.`, confirmText: "Đã hiểu", cancelText: "Đóng" });
    }
    setSel(new Set());
    setReloadKey((k) => k + 1);
  }

  return (
    <div className={adminPageClass}>
      <AdminHeader
        className="mb-0"
        title="Ngân hàng câu hỏi"
        subtitle={`${total.toLocaleString("vi-VN")} câu hỏi${scopeLabel ? ` trong "${scopeLabel}"` : ""} — chọn danh mục bên trái, bấm vào câu để xem nhanh, chọn nhiều câu để sửa hàng loạt.`}
      />

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ===== Cây danh mục ===== */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <button type="button" onClick={() => setShowTree((v) => !v)} className="mb-2 flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-elevation-1 lg:hidden">
            <FolderTree className="h-4 w-4" /> Danh mục {scopeLabel && `· ${scopeLabel}`}
          </button>
          <div className={cn("rounded-2xl bg-white p-3 shadow-elevation-1 ring-1 ring-slate-100 lg:block", !showTree && "hidden")}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {grades.map((g) => (
                <button key={g._id} type="button" onClick={() => setGrade(g._id)} className={cn("pill !px-3 !py-1 text-sm", grade === g._id && "pill-active")}>
                  {g.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setScope({})}
              className={cn("mb-1 flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm font-black text-slate-800 hover:bg-slate-100", !scope.subject && "bg-primary/10 text-primary")}
            >
              Tất cả câu hỏi
            </button>
            <button
              type="button"
              onClick={() => setScope({ custom: true })}
              className={cn("mb-1 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-bold text-violet-700 hover:bg-violet-50", scope.custom && "bg-violet-100")}
            >
              <span>Câu riêng của đề kiểm tra</span>
              <span className="rounded-full bg-violet-100 px-2 text-xs font-black">{customCount}</span>
            </button>
            <div className="max-h-[65vh] overflow-y-auto pr-1">
              <CategoryTree tree={tree} scope={scope} onPick={(s) => { setScope(s); setShowTree(false); }} />
            </div>
            <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-400">Số đỏ = bài học chưa có câu hỏi nào.</p>
          </div>
        </aside>

        {/* ===== Danh sách ===== */}
        <section className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${inputClass} pl-9`} placeholder="Tìm theo nội dung câu hỏi" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className={filterSelectClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Mọi loại</option>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select className={filterSelectClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">Mọi mức độ</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
            <select className={filterSelectClass} value={sort} onChange={(e) => setSort(e.target.value)} title="Xem câu học sinh hay làm sai để xem lại đáp án/đề">
              <option value="">Mới nhất trước</option>
              <option value="wrong">Học sinh hay sai nhất</option>
            </select>
          </div>

          {/* Thanh thao tác hàng loạt */}
          {sel.size > 0 && (
            <div className="sticky top-2 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-elevation-2">
              <b>Đã chọn {sel.size} câu</b>
              <span className="text-white/50">|</span>
              <label className="flex items-center gap-1.5">
                Đổi mức độ:
                <select className="rounded-lg bg-white/10 px-2 py-1 text-white" defaultValue="" onChange={(e) => e.target.value && bulk("difficulty", e.target.value)}>
                  <option value="" className="text-slate-800">Chọn…</option>
                  <option value="easy" className="text-slate-800">Dễ</option>
                  <option value="medium" className="text-slate-800">Trung bình</option>
                  <option value="hard" className="text-slate-800">Khó</option>
                </select>
              </label>
              <button type="button" onClick={() => bulk("delete")} className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1 font-bold hover:bg-rose-600">
                <Trash2 className="h-4 w-4" /> Xoá
              </button>
              <button type="button" onClick={() => setSel(new Set())} className="ml-auto flex items-center gap-1 text-white/70 hover:text-white">
                <X className="h-4 w-4" /> Bỏ chọn
              </button>
            </div>
          )}

          <div className="mt-3 overflow-clip rounded-2xl bg-white shadow-elevation-1 ring-1 ring-slate-100">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-400">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={allOnPage}
                onChange={() => setSel(allOnPage ? new Set() : new Set(questions.map((q) => q._id)))}
                aria-label="Chọn tất cả câu trên trang"
              />
              <span className="flex-1">Câu hỏi</span>
              <span className="hidden w-24 sm:block">Mức độ</span>
              <span className="hidden w-28 md:block">Học sinh làm sai</span>
              <span className="hidden w-20 text-center lg:block">Dùng trong</span>
              <span className="w-8" />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : questions.length === 0 ? (
              <p className="p-10 text-center text-slate-400">Không có câu hỏi phù hợp.</p>
            ) : (
              questions.map((q) => {
                const wrongPct = q.stats?.total >= 3 ? Math.round((q.stats.wrong / q.stats.total) * 100) : null;
                const isOpen = expanded === q._id;
                return (
                  <div key={q._id} className={cn("border-b border-slate-100 last:border-0", sel.has(q._id) && "bg-primary/5")}>
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-primary" checked={sel.has(q._id)} onChange={() => toggleSel(q._id)} aria-label="Chọn câu hỏi" />
                      <button type="button" onClick={() => setExpanded(isOpen ? null : q._id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        <ChevronRight className={cn("h-4 w-4 shrink-0 text-slate-300 transition", isOpen && "rotate-90")} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-800">{q.text.replace(/\n/g, " ")}</span>
                          <span className="block truncate text-xs text-slate-400">
                            {TYPE_LABEL[q.type] || "Trắc nghiệm"} · {q.lesson?.title || (q.testOnly ? "Câu riêng của đề" : "—")}
                          </span>
                        </span>
                      </button>
                      <span className={cn("hidden w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-bold sm:block", LEVEL_COLOR[q.difficulty])}>{LEVEL_LABEL[q.difficulty]}</span>
                      <span
                        className={cn("hidden w-28 shrink-0 text-xs font-bold md:block", wrongPct === null ? "text-slate-300" : wrongPct >= 50 ? "text-rose-600" : "text-slate-600")}
                        title="Tỉ lệ làm sai (luyện tập + kiểm tra)"
                      >
                        {wrongPct === null ? "Chưa đủ dữ liệu" : `${wrongPct}% · ${q.stats.total} lượt`}
                      </span>
                      <span className="hidden w-20 shrink-0 text-center text-xs font-bold text-slate-500 lg:block">{q.usedInTests > 0 ? `${q.usedInTests} đề` : "—"}</span>
                      <Link
                        to={q.lesson?._id ? `/admin/bai-hoc/${q.lesson._id}/cau-hoi?q=${q._id}` : "/admin/kiem-tra"}
                        title={q.lesson?._id ? "Sửa câu hỏi" : "Câu riêng của đề — sửa trong trang Bài kiểm tra"}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </div>
                    {isOpen && <QuestionPreview q={q} />}
                  </div>
                );
              })
            )}
          </div>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm font-bold text-slate-600">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 disabled:opacity-40">‹ Trước</button>
              <span>Trang {page}/{pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 disabled:opacity-40">Sau ›</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
