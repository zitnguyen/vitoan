import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Download, ExternalLink, Search, Check } from "lucide-react";
import { articleService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { AdminPage, Card, Field, IconButton, StatusChip, inputClass } from "../../components/admin/adminUi.jsx";
import { CATEGORY_LABELS, NewsImage, formatNewsDate } from "../../components/news/newsUtils.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const EMPTY = {
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  category: "giao-duc",
  sourceName: "",
  sourceUrl: "",
  isPublished: true,
  isFeatured: false,
};

// ---------- Form thêm / sửa bài ----------
function ArticleForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial?._id ? { ...EMPTY, ...initial } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (initial?._id) await articleService.update(initial._id, form);
      else await articleService.create(form);
      onSaved();
    } catch (err) {
      setError(err.apiMessage || "Không lưu được bài viết");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <form onSubmit={submit} className="my-6 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-elevation-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-h3 text-slate-800">{initial?._id ? "Sửa bài viết" : "Thêm bài viết"}</h2>
          <IconButton title="Đóng" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Tiêu đề" required className="md:col-span-2">
            <input className={inputClass} value={form.title} onChange={set("title")} required />
          </Field>
          <Field label="Chuyên mục">
            <select className={inputClass} value={form.category} onChange={set("category")}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nguồn (tên báo)" hint="Để trống nếu là bài ViToan tự viết.">
            <input className={inputClass} value={form.sourceName} onChange={set("sourceName")} placeholder="VnExpress" />
          </Field>
          <Field label="Link bài gốc" className="md:col-span-2">
            <input className={inputClass} value={form.sourceUrl || ""} onChange={set("sourceUrl")} placeholder="https://…" />
          </Field>
          <Field label="Link ảnh (nhúng)" hint="Dán link ảnh từ bài gốc — ảnh không lưu trên máy chủ ViToan." className="md:col-span-2">
            <div className="flex gap-3">
              <input className={inputClass} value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…/anh.jpg" />
              <NewsImage src={form.imageUrl} alt="" className="aspect-video w-32 shrink-0 rounded-lg" />
            </div>
          </Field>
          <Field label="Tóm tắt" className="md:col-span-2">
            <textarea className={inputClass} rows={3} value={form.summary} onChange={set("summary")} />
          </Field>
          <Field label="Nội dung" hint="Chỉ dùng cho bài ViToan tự viết. Tin từ báo chỉ để tóm tắt + link gốc." className="md:col-span-2">
            <textarea className={inputClass} rows={6} value={form.content} onChange={set("content")} />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-5">
          <label className="flex items-center gap-2 font-semibold text-slate-700">
            <input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} className="h-4 w-4 accent-primary" /> Hiển thị
          </label>
          <label className="flex items-center gap-2 font-semibold text-slate-700">
            <input type="checkbox" checked={form.isFeatured} onChange={set("isFeatured")} className="h-4 w-4 accent-primary" /> Tin nổi bật (ghim đầu trang)
          </label>
        </div>

        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu bài viết"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- Lấy tin từ báo (RSS) ----------
function ImportPanel({ onClose, onImported }) {
  const [feeds, setFeeds] = useState([]);
  const [feed, setFeed] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [category, setCategory] = useState("giao-duc");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    articleService.feeds().then((res) => {
      setFeeds(res.data);
      setFeed(res.data[0]?.key || "");
    });
  }, []);

  useEffect(() => {
    if (!feed) return;
    setLoading(true);
    setItems([]);
    setSelected(new Set());
    setMessage("");
    articleService
      .previewFeed(feed)
      .then((res) => setItems(res.data))
      .catch((err) => setMessage(err.apiMessage || "Không đọc được nguồn tin"))
      .finally(() => setLoading(false));
  }, [feed]);

  const shown = items.filter((i) => !filter || i.title.toLowerCase().includes(filter.toLowerCase()));

  function toggle(url) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function doImport() {
    setImporting(true);
    try {
      const chosen = items.filter((i) => selected.has(i.sourceUrl));
      const res = await articleService.importItems({ items: chosen, category });
      setMessage(`Đã thêm ${res.added} bài${res.skipped ? `, bỏ qua ${res.skipped} bài trùng` : ""}.`);
      setItems((prev) => prev.map((i) => (selected.has(i.sourceUrl) ? { ...i, imported: true } : i)));
      setSelected(new Set());
      onImported();
    } catch (err) {
      setMessage(err.apiMessage || "Nhập tin thất bại");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="my-6 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-elevation-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-h3 text-slate-800">Lấy tin từ báo</h2>
            <p className="text-slate-500">Chọn tin muốn đăng — chỉ lưu tiêu đề, tóm tắt, ảnh (nhúng link) và link bài gốc.</p>
          </div>
          <IconButton title="Đóng" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {feeds.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFeed(f.key)}
              className={cn(
                "rounded-full px-4 py-1.5 font-bold",
                feed === f.key ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={cn(inputClass, "pl-9")} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Lọc theo tiêu đề (vd: tiểu học, lớp 1, sách giáo khoa)…" />
          </div>
          <select className={cn(inputClass, "w-48")} value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                Đăng vào: {v}
              </option>
            ))}
          </select>
        </div>

        {message && <p className="mt-3 rounded-xl bg-primary/10 px-4 py-2 font-semibold text-primary">{message}</p>}

        <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            shown.map((it) => {
              const on = selected.has(it.sourceUrl);
              return (
                <button
                  key={it.sourceUrl}
                  type="button"
                  disabled={it.imported}
                  onClick={() => toggle(it.sourceUrl)}
                  className={cn(
                    "flex w-full gap-3 rounded-xl p-2.5 text-left ring-1 transition",
                    it.imported ? "cursor-default bg-slate-50 opacity-60 ring-slate-100" : on ? "bg-primary/5 ring-primary" : "ring-slate-200 hover:ring-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      on || it.imported ? "border-primary bg-primary text-white" : "border-slate-300"
                    )}
                  >
                    {(on || it.imported) && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <NewsImage src={it.imageUrl} alt="" className="aspect-video w-28 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-bold text-slate-800">{it.title}</span>
                    <span className="line-clamp-2 text-sm text-slate-500">{it.summary}</span>
                    <span className="text-sm text-slate-400">
                      {formatNewsDate(it.publishedAt)} {it.imported && "· Đã có trên trang"}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-slate-500">Đã chọn {selected.size} tin</span>
          <Button onClick={doImport} disabled={!selected.size || importing}>
            <Download className="h-4 w-4" /> {importing ? "Đang thêm…" : `Thêm ${selected.size || ""} tin vào trang`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Trang quản lý ----------
export default function AdminNewsPage() {
  const dialog = useDialog();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);

  async function load() {
    setLoading(true);
    articleService
      .list({ all: 1, limit: 50, q: q || undefined })
      .then((res) => {
        setItems(res.data);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(a, data) {
    await articleService.update(a._id, data);
    setItems((prev) => prev.map((x) => (x._id === a._id ? { ...x, ...data } : x)));
  }

  async function remove(a) {
    if (!(await dialog.confirm({ message: `Xoá bài "${a.title}"?`, danger: true, confirmText: "Xoá" }))) return;
    await articleService.remove(a._id);
    load();
  }

  return (
    <AdminPage
      title="Tin tức"
      subtitle={`${total} bài viết — tin lấy từ báo chỉ hiển thị tóm tắt và dẫn link về bài gốc.`}
      actions={
        <>
          <Button variant="outline" onClick={() => setImporting(true)}>
            <Download className="h-4 w-4" /> Lấy tin từ báo
          </Button>
          <Button onClick={() => setEditing({})}>
            <Plus className="h-4 w-4" /> Thêm bài viết
          </Button>
        </>
      }
    >
      <Card className="p-0">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={cn(inputClass, "pl-9")} placeholder="Tìm theo tiêu đề…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-slate-400">Chưa có bài viết. Bấm "Lấy tin từ báo" để thêm nhanh.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((a) => (
              <li key={a._id} className="flex items-center gap-4 p-3">
                <NewsImage src={a.imageUrl} alt="" className="aspect-video w-28 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-bold text-slate-800">{a.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <StatusChip ok={a.isPublished}>{a.isPublished ? "Đang hiện" : "Đang ẩn"}</StatusChip>
                    {a.isFeatured && <StatusChip>Nổi bật</StatusChip>}
                    <span>{CATEGORY_LABELS[a.category]}</span>·<span>{a.sourceName || "ViToan"}</span>·
                    <span>{formatNewsDate(a.publishedAt)}</span>·<span>{a.viewCount} lượt xem</span>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {a.sourceUrl && (
                    <IconButton title="Mở bài gốc" onClick={() => window.open(a.sourceUrl, "_blank", "noopener")}>
                      <ExternalLink className="h-4 w-4" />
                    </IconButton>
                  )}
                  <IconButton title={a.isFeatured ? "Bỏ ghim nổi bật" : "Ghim nổi bật"} onClick={() => patch(a, { isFeatured: !a.isFeatured })}>
                    <Star className={cn("h-4 w-4", a.isFeatured && "fill-amber-400 text-amber-400")} />
                  </IconButton>
                  <IconButton title={a.isPublished ? "Ẩn bài" : "Hiện bài"} onClick={() => patch(a, { isPublished: !a.isPublished })}>
                    {a.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </IconButton>
                  <IconButton title="Sửa" onClick={() => setEditing(a)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton title="Xoá" tone="danger" onClick={() => remove(a)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <ArticleForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {importing && <ImportPanel onClose={() => setImporting(false)} onImported={load} />}
    </AdminPage>
  );
}
