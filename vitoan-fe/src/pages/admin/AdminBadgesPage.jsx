import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Eye, EyeOff, X, Award } from "lucide-react";
import { badgeService, subjectService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, Card, Field, IconButton, adminPageClass, inputClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

// Điều kiện đạt huy hiệu (khớp utils/badgeStats.js ở backend).
const CONDITIONS = {
  lessons_completed: { label: "Số bài học đã học xong (đạt từ 80%)", unit: "bài" },
  perfect_score: { label: "Số lần đạt điểm tuyệt đối", unit: "lần" },
  streak: { label: "Số ngày học liên tiếp", unit: "ngày" },
};
const EMPTY = { name: "", description: "", conditionType: "lessons_completed", conditionValue: 5, subject: "", isActive: true };

export default function AdminBadgesPage() {
  const dialog = useDialog();
  const [badges, setBadges] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => badgeService.list().then((r) => setBadges(r.data));
  useEffect(() => {
    load();
    subjectService.list().then((r) => setSubjects(r.data));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Nhập tên huy hiệu");
    setSaving(true);
    try {
      const body = { ...form, name: form.name.trim(), conditionValue: Number(form.conditionValue), subject: form.subject || undefined };
      if (form._id) await badgeService.update(form._id, body);
      else await badgeService.create(body);
      setForm(null);
      await load();
    } catch (err) {
      setError(err.apiMessage || "Không lưu được huy hiệu");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(b) {
    await badgeService.update(b._id, { isActive: !b.isActive });
    load();
  }

  async function remove(b) {
    if (
      !(await dialog.confirm({
        message: `Xoá huy hiệu "${b.name}"? ${b.earnedCount > 0 ? `${b.earnedCount} học sinh đã đạt sẽ mất huy hiệu này.` : ""}`,
        danger: true,
        confirmText: "Xoá",
      }))
    )
      return;
    await badgeService.remove(b._id);
    load();
  }

  const unit = CONDITIONS[form?.conditionType]?.unit || "";

  return (
    <div className={adminPageClass}>
      <AdminHeader
        className="mb-0"
        title="Huy hiệu"
        subtitle="Huy hiệu tự trao khi học sinh đạt điều kiện. Cột “đã đạt” cho biết huy hiệu quá dễ hay quá khó."
        actions={
          <Button onClick={() => { setError(""); setForm({ ...EMPTY }); }}>
            <Plus className="h-4 w-4" /> Thêm huy hiệu
          </Button>
        }
      />

      {form && (
        <Card className="mt-5 p-5">
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-black text-slate-800">{form._id ? "Sửa huy hiệu" : "Huy hiệu mới"}</p>
              <IconButton title="Đóng" onClick={() => setForm(null)} type="button">
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tên huy hiệu" required>
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Chăm học" />
              </Field>
              <Field label="Mô tả ngắn">
                <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="VD: Học xong 5 bài" />
              </Field>
              <Field label="Điều kiện đạt">
                <select className={inputClass} value={form.conditionType} onChange={(e) => setForm({ ...form, conditionType: e.target.value })}>
                  {Object.entries(CONDITIONS).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`Cần đạt (${unit})`}>
                  <input type="number" min="1" className={inputClass} value={form.conditionValue} onChange={(e) => setForm({ ...form, conditionValue: e.target.value })} />
                </Field>
                <Field label="Chỉ tính môn" hint="Để trống = mọi môn">
                  <select className={inputClass} value={form.subject || ""} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    <option value="">Mọi môn</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : form._id ? "Cập nhật" : "Thêm huy hiệu"}</Button>
              <Button type="button" variant="outline" onClick={() => setForm(null)}>Huỷ</Button>
            </div>
          </form>
        </Card>
      )}

      {!badges ? (
        <div className="mt-8 flex justify-center"><Spinner /></div>
      ) : (
        <div className="mt-6 space-y-2.5">
          {badges.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-400 shadow-elevation-1">Chưa có huy hiệu nào.</p>}
          {badges.map((b) => (
            <div key={b._id} className={cn("flex items-center gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100", !b.isActive && "opacity-60")}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
                <Award className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-slate-800">
                  {b.name}
                  {!b.isActive && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">Đang ẩn</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {CONDITIONS[b.conditionType]?.label}: {b.conditionValue} {CONDITIONS[b.conditionType]?.unit}
                  {b.subject && ` · môn ${subjects.find((s) => s._id === (b.subject._id || b.subject))?.name || ""}`}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">{b.earnedCount ?? 0} em đã đạt</span>
              <div className="flex shrink-0 gap-1">
                <IconButton title={b.isActive ? "Ẩn" : "Hiện"} onClick={() => toggle(b)}>
                  {b.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </IconButton>
                <IconButton title="Sửa" onClick={() => { setError(""); setForm({ ...b, subject: b.subject?._id || b.subject || "" }); }}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton title="Xoá" tone="danger" onClick={() => remove(b)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
