import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { adminStatsService, gradeService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { AdminHeader, Card, Field, adminPageClass, inputClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

const ICONS = ["📢", "🎉", "🎁", "📚", "⚔️", "⭐", "🏆", "⏰"];
const LINKS = [
  { v: "", label: "Không kèm liên kết" },
  { v: "/dau-truong", label: "Đấu trường" },
  { v: "/kiem-tra", label: "Bài kiểm tra" },
  { v: "/doi-diem", label: "Đổi quà" },
  { v: "/nhiem-vu", label: "Nhiệm vụ" },
  { v: "/tin-tuc", label: "Tin tức" },
];
const EMPTY = { title: "", body: "", icon: "📢", link: "", grade: "" };

// Gửi thông báo cho học sinh (tất cả hoặc một lớp): hiện ở chuông thông báo; có lịch sử đã gửi.
export default function AdminBroadcastPage() {
  const dialog = useDialog();
  const [form, setForm] = useState(EMPTY);
  const [grades, setGrades] = useState([]);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => adminStatsService.broadcasts().then((r) => setHistory(r.data));
  useEffect(() => {
    load();
    gradeService.list().then((r) => setGrades(r.data));
  }, []);

  async function send(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Nhập tiêu đề thông báo");
    const who = form.grade ? grades.find((g) => g._id === form.grade)?.name : "tất cả học sinh";
    const ok = await dialog.confirm({ message: `Gửi thông báo “${form.title.trim()}” tới ${who}? Không thể thu hồi sau khi gửi.`, confirmText: "Gửi ngay" });
    if (!ok) return;
    setSending(true);
    try {
      const r = await adminStatsService.sendBroadcast({ ...form, grade: form.grade || undefined });
      await dialog.alert({ message: `Đã gửi tới ${r.data.recipients} học sinh.` });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.apiMessage || "Không gửi được");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={adminPageClass}>
      <AdminHeader title="Thông báo chung" subtitle="Báo tin cho học sinh: có bài kiểm tra mới, sự kiện đấu trường, lịch nghỉ… Em sẽ thấy ở chuông thông báo." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <Card>
          <form onSubmit={send} className="space-y-4">
            <Field label="Gửi tới">
              <select className={inputClass} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                <option value="">Tất cả học sinh</option>
                {grades.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Tiêu đề" required><input className={inputClass} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Đề kiểm tra giữa kỳ đã mở!" /></Field>
            <Field label="Nội dung (tuỳ chọn)"><textarea className={inputClass} rows={3} maxLength={500} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            <Field label="Biểu tượng">
              <div className="flex flex-wrap gap-2">
                {ICONS.map((i) => (
                  <button key={i} type="button" onClick={() => setForm({ ...form, icon: i })} className={`h-10 w-10 rounded-xl text-xl ring-1 ${form.icon === i ? "bg-primary/10 ring-primary" : "ring-slate-200 hover:bg-slate-50"}`}>{i}</button>
                ))}
              </div>
            </Field>
            <Field label="Bấm vào thông báo thì mở">
              <select className={inputClass} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}>
                {LINKS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </Field>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <Button type="submit" disabled={sending}><Send className="h-4 w-4" /> {sending ? "Đang gửi..." : "Gửi thông báo"}</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-800">Đã gửi gần đây</h2>
          {!history ? <Spinner /> : history.length === 0 ? <p className="text-slate-400">Chưa gửi thông báo nào.</p> : (
            <ul className="divide-y divide-slate-100">
              {history.map((b) => (
                <li key={b._id} className="flex gap-3 py-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800">{b.title}</p>
                    {b.body && <p className="text-sm text-slate-600">{b.body}</p>}
                    <p className="mt-0.5 text-sm text-slate-400">{new Date(b.createdAt).toLocaleString("vi-VN")} · {b.grade?.name || "Tất cả"} · {b.recipients} học sinh</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
