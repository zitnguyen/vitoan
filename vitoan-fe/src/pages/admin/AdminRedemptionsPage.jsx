import { useEffect, useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { adminStatsService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, Card, StatusChip, adminPageClass, inputClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

const TABS = [
  { v: "pending", label: "Chờ xử lý" },
  { v: "done", label: "Đã xử lý" },
  { v: "cancelled", label: "Đã huỷ" },
  { v: "", label: "Tất cả" },
];

// Đơn đổi quà của học sinh. Quà hiện vật (loại “khác”) vào trạng thái Chờ xử lý: phát quà xong thì bấm Hoàn tất;
// huỷ đơn sẽ hoàn điểm lại cho em.
export default function AdminRedemptionsPage() {
  const dialog = useDialog();
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [status, search]);
  useEffect(() => {
    adminStatsService.redemptions({ status: status || undefined, q: search || undefined, page }).then(setRes);
  }, [status, search, page, reload]);

  async function setState(r, next) {
    if (next === "cancelled") {
      const ok = await dialog.confirm({ message: `Huỷ đơn “${r.reward?.name}” của ${r.student?.fullName}? Hệ thống hoàn ${r.pointsSpent} điểm cho em.`, danger: true, confirmText: "Huỷ đơn & hoàn điểm" });
      if (!ok) return;
    }
    await adminStatsService.updateRedemption(r._id, { status: next });
    setReload((n) => n + 1);
  }

  return (
    <div className={adminPageClass}>
      <AdminHeader title="Đơn đổi quà" subtitle="Theo dõi học sinh đã đổi gì, xử lý quà hiện vật và hoàn điểm khi cần." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.v} type="button" onClick={() => setStatus(t.v)} className={cn("pill", status === t.v && "pill-active")}>
            {t.label}
            {t.v === "pending" && res?.pending > 0 && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 text-xs font-black text-white">{res.pending}</span>}
          </button>
        ))}
        <input className={cn(inputClass, "ml-auto !w-full sm:!w-64")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên học sinh…" />
      </div>
      {!res ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : res.data.length === 0 ? (
        <Card className="py-12 text-center text-slate-400">Không có đơn nào.</Card>
      ) : (
        <Card className="divide-y divide-slate-100 !p-0">
          {res.data.map((r) => (
            <div key={r._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">{r.reward?.name || "Quà đã xoá"} <span className="font-normal text-slate-400">· {r.pointsSpent} điểm</span></p>
                <p className="text-sm text-slate-500">{r.student?.fullName || "?"} (@{r.student?.username}) · {new Date(r.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <StatusChip ok={r.status === "done"} warn={r.status === "cancelled"}>{r.status === "pending" ? "Chờ xử lý" : r.status === "cancelled" ? "Đã huỷ" : "Hoàn tất"}</StatusChip>
              {r.status === "pending" && <Button onClick={() => setState(r, "done")}><Check className="h-4 w-4" /> Hoàn tất</Button>}
              {r.status !== "cancelled" && (
                <Button variant="outline" onClick={() => setState(r, "cancelled")}><Undo2 className="h-4 w-4" /> Huỷ & hoàn điểm</Button>
              )}
            </div>
          ))}
        </Card>
      )}
      {res?.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
          <span className="text-sm font-semibold text-slate-600">Trang {page}/{res.pages}</span>
          <Button variant="outline" disabled={page >= res.pages} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
