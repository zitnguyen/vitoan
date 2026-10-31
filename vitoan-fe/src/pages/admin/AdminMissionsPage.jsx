import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Eye, EyeOff, X } from "lucide-react";
import { missionService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, Card, Field, IconButton, adminPageClass, inputClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

// Loại mục tiêu → cách đo + đơn vị, để admin hiểu "số lượng mục tiêu" nghĩa là gì.
const GOAL_TYPES = {
  attempts_count: { label: "Số lượt luyện tập", unit: "lượt" },
  lessons_completed: { label: "Số bài học khác nhau đã luyện tập", unit: "bài" },
  perfect_score: { label: "Số lần đạt điểm tuyệt đối", unit: "lần" },
  checkin_days: { label: "Số ngày điểm danh", unit: "ngày" },
  tests_completed: { label: "Số bài kiểm tra đã làm", unit: "bài" },
  correct_answers: { label: "Tổng số câu trả lời đúng", unit: "câu" },
};
const TYPE_LABEL = { daily: "Hằng ngày", weekly: "Hằng tuần" };
const EMPTY = { title: "", description: "", type: "daily", goalType: "attempts_count", goalValue: 3, rewardPoints: 10, isActive: true };

export default function AdminMissionsPage() {
  const dialog = useDialog();
  const [missions, setMissions] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => missionService.list().then((r) => setMissions(r.data));
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Nhập tên nhiệm vụ");
    setSaving(true);
    try {
      const body = { ...form, title: form.title.trim(), goalValue: Number(form.goalValue), rewardPoints: Number(form.rewardPoints) };
      if (form._id) await missionService.update(form._id, body);
      else await missionService.create(body);
      setForm(null);
      await load();
    } catch (err) {
      setError(err.apiMessage || "Không lưu được nhiệm vụ");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(m) {
    await missionService.update(m._id, { isActive: !m.isActive });
    load();
  }

  async function remove(m) {
    if (!(await dialog.confirm({ message: `Xoá nhiệm vụ "${m.title}"? Lịch sử nhận thưởng cũ vẫn được giữ.`, danger: true, confirmText: "Xoá" }))) return;
    await missionService.remove(m._id);
    load();
  }

  const groups = ["daily", "weekly"].map((t) => ({ type: t, items: (missions || []).filter((m) => m.type === t) }));
  const unit = GOAL_TYPES[form?.goalType]?.unit || "";

  return (
    <div className={adminPageClass}>
      <AdminHeader
        className="mb-0"
        title="Nhiệm vụ"
        subtitle="Nhiệm vụ hằng ngày / tuần giúp học sinh quay lại học đều. Tiến độ tự tính từ bài làm của các em."
        actions={
          <Button onClick={() => { setError(""); setForm({ ...EMPTY }); }}>
            <Plus className="h-4 w-4" /> Thêm nhiệm vụ
          </Button>
        }
      />

      {form && (
        <Card className="mt-5 p-5">
          <form onSubmit={save} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-black text-slate-800">{form._id ? "Sửa nhiệm vụ" : "Nhiệm vụ mới"}</p>
              <IconButton title="Đóng" onClick={() => setForm(null)} type="button">
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tên nhiệm vụ" required>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Làm 3 bài luyện tập" />
              </Field>
              <Field label="Chu kỳ" hint="Hằng ngày: làm mới 0h mỗi ngày. Hằng tuần: làm mới thứ Hai.">
                <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Cách tính tiến độ">
                <select className={inputClass} value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value })}>
                  {Object.entries(GOAL_TYPES).map(([v, g]) => (
                    <option key={v} value={v}>{g.label}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`Mục tiêu (${unit})`}>
                  <input type="number" min="1" className={inputClass} value={form.goalValue} onChange={(e) => setForm({ ...form, goalValue: e.target.value })} />
                </Field>
                <Field label="Điểm thưởng">
                  <input type="number" min="0" className={inputClass} value={form.rewardPoints} onChange={(e) => setForm({ ...form, rewardPoints: e.target.value })} />
                </Field>
              </div>
              <Field label="Mô tả ngắn" className="md:col-span-2">
                <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Hiện dưới tên nhiệm vụ cho học sinh" />
              </Field>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : form._id ? "Cập nhật" : "Thêm nhiệm vụ"}</Button>
              <Button type="button" variant="outline" onClick={() => setForm(null)}>Huỷ</Button>
            </div>
          </form>
        </Card>
      )}

      {!missions ? (
        <div className="mt-8 flex justify-center"><Spinner /></div>
      ) : (
        groups.map((g) => (
          <section key={g.type} className="mt-6">
            <h2 className="font-display text-lg font-black text-slate-800">{TYPE_LABEL[g.type]} ({g.items.length})</h2>
            <div className="mt-3 space-y-2.5">
              {g.items.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-400 shadow-elevation-1">Chưa có nhiệm vụ nào.</p>}
              {g.items.map((m) => (
                <div key={m._id} className={cn("flex items-center gap-3 rounded-2xl bg-white p-4 shadow-elevation-1 ring-1 ring-slate-100", !m.isActive && "opacity-60")}>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-slate-800">
                      {m.title}
                      {!m.isActive && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">Đang ẩn</span>}
                    </p>
                    <p className="text-sm text-slate-500">
                      {GOAL_TYPES[m.goalType]?.label}: {m.goalValue} {GOAL_TYPES[m.goalType]?.unit} · thưởng <b className="text-sky-600">{m.rewardPoints}</b> điểm
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconButton title={m.isActive ? "Ẩn khỏi học sinh" : "Hiện cho học sinh"} onClick={() => toggle(m)}>
                      {m.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </IconButton>
                    <IconButton title="Sửa" onClick={() => { setError(""); setForm({ ...m }); }}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton title="Xoá" tone="danger" onClick={() => remove(m)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
