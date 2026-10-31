import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Eye, EyeOff, X } from "lucide-react";
import { adminStatsService, gradeService, subjectService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, Card, Field, IconButton, StatusChip, adminPageClass, inputClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Quản lý Lớp (hiện/ẩn với học sinh) và Môn học — trước đây chỉ sửa được trong DB.
export default function AdminCatalogPage() {
  const dialog = useDialog();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null); // { kind: "grade"|"subject", ...fields }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => adminStatsService.catalog().then((r) => setData(r.data));
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Nhập tên");
    setSaving(true);
    try {
      const slug = form.slug?.trim() || slugify(form.name);
      if (form.kind === "grade") {
        const body = { name: form.name.trim(), slug, order: Number(form.order) || 1, isPublished: form.isPublished };
        form._id ? await gradeService.update(form._id, body) : await gradeService.create(body);
      } else {
        const body = { name: form.name.trim(), slug };
        form._id ? await subjectService.update(form._id, body) : await subjectService.create(body);
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err.apiMessage || "Không lưu được (tên hoặc mã có thể đã tồn tại)");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(g) {
    if (g.isPublished !== false) {
      const ok = await dialog.confirm({ message: `Ẩn ${g.name} khỏi học sinh và khách? ${g.students} học sinh lớp này sẽ không thấy nội dung lớp.`, confirmText: "Ẩn lớp" });
      if (!ok) return;
    }
    await gradeService.update(g._id, { isPublished: g.isPublished === false });
    load();
  }

  async function remove(kind, item) {
    const ok = await dialog.confirm({ message: `Xoá ${item.name}?`, danger: true, confirmText: "Xoá" });
    if (!ok) return;
    try {
      await (kind === "grade" ? gradeService : subjectService).remove(item._id);
      load();
    } catch (err) {
      await dialog.alert({ message: err.apiMessage || "Không xoá được" });
    }
  }

  if (!data) return <div className="flex justify-center py-20"><Spinner /></div>;
  const nextOrder = Math.max(0, ...data.grades.map((g) => g.order || 0)) + 1;

  return (
    <div className={adminPageClass}>
      <AdminHeader title="Lớp & Môn học" subtitle="Bật/tắt hiển thị từng lớp với học sinh, thêm môn học mới. Lớp còn chương học thì không xoá được — hãy ẩn đi." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-800">Lớp ({data.grades.length})</h2>
            <Button onClick={() => { setError(""); setForm({ kind: "grade", name: "", slug: "", order: nextOrder, isPublished: false }); }}><Plus className="h-4 w-4" /> Thêm lớp</Button>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.grades.map((g) => (
              <li key={g._id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">{g.name}</p>
                  <p className="text-sm text-slate-500">{g.chapters} chương · {g.lessons} bài · {g.students} học sinh</p>
                </div>
                <StatusChip ok={g.isPublished !== false}>{g.isPublished !== false ? "Đang hiển thị" : "Đang ẩn"}</StatusChip>
                <IconButton title={g.isPublished !== false ? "Ẩn lớp" : "Hiện lớp"} onClick={() => togglePublish(g)}>
                  {g.isPublished !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </IconButton>
                <IconButton title="Sửa" onClick={() => { setError(""); setForm({ kind: "grade", ...g, isPublished: g.isPublished !== false }); }}><Pencil className="h-4 w-4" /></IconButton>
                <IconButton title="Xoá" tone="danger" onClick={() => remove("grade", g)}><Trash2 className="h-4 w-4" /></IconButton>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-800">Môn học ({data.subjects.length})</h2>
            <Button onClick={() => { setError(""); setForm({ kind: "subject", name: "", slug: "" }); }}><Plus className="h-4 w-4" /> Thêm môn</Button>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.subjects.map((s) => (
              <li key={s._id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">Mã: {s.slug} · {s.chapters} chương</p>
                </div>
                <IconButton title="Sửa" onClick={() => { setError(""); setForm({ kind: "subject", ...s }); }}><Pencil className="h-4 w-4" /></IconButton>
                <IconButton title="Xoá" tone="danger" onClick={() => remove("subject", s)}><Trash2 className="h-4 w-4" /></IconButton>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-elevation-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-slate-800">{form._id ? "Sửa" : "Thêm"} {form.kind === "grade" ? "lớp" : "môn học"}</h3>
              <button type="button" onClick={() => setForm(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
            </div>
            <Field label="Tên" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.kind === "grade" ? "VD: Lớp 2" : "VD: Tiếng Anh"} autoFocus /></Field>
            <Field label="Mã (tự tạo nếu để trống)" hint="Chữ thường không dấu, dùng trong đường dẫn."><input className={inputClass} value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            {form.kind === "grade" && (
              <>
                <Field label="Thứ tự hiển thị"><input type="number" min={1} className={inputClass} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></Field>
                <label className="flex items-center gap-2 font-semibold text-slate-700">
                  <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                  Hiển thị với học sinh
                </label>
              </>
            )}
            {error && <p className={cn("text-sm font-semibold text-red-600")}>{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
              <Button type="button" variant="outline" onClick={() => setForm(null)}>Huỷ</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
