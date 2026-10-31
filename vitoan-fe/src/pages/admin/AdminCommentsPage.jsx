import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trash2, Heart } from "lucide-react";
import { adminStatsService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, Card, adminPageClass, inputClass } from "../../components/admin/adminUi.jsx";
import { useDialog } from "../../context/DialogContext.jsx";

// Kiểm duyệt bình luận ở các bài học: tìm theo nội dung / tên học sinh, xoá từng cái hoặc nhiều cái.
export default function AdminCommentsPage() {
  const dialog = useDialog();
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(new Set());
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    adminStatsService.comments({ q: search || undefined, page }).then((r) => {
      setItems(r.data);
      setTotal(r.total);
      setPages(r.pages);
      setSel(new Set());
    });
  }, [search, page, reload]);

  async function del(ids) {
    const ok = await dialog.confirm({ message: `Xoá ${ids.length} bình luận?`, danger: true, confirmText: "Xoá" });
    if (!ok) return;
    await adminStatsService.deleteComments(ids);
    setReload((n) => n + 1);
  }
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className={adminPageClass}>
      <AdminHeader
        title="Bình luận"
        subtitle={`${total.toLocaleString("vi-VN")} bình luận trong các bài học — xoá nội dung không phù hợp.`}
        actions={sel.size > 0 && <Button onClick={() => del([...sel])} className="bg-red-600 hover:bg-red-700"><Trash2 className="h-4 w-4" /> Xoá {sel.size} đã chọn</Button>}
      />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className={cn(inputClass, "pl-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo nội dung hoặc tên học sinh…" />
      </div>
      {!items ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <Card className="py-12 text-center text-slate-400">{search ? "Không có bình luận phù hợp." : "Chưa có bình luận nào."}</Card>
      ) : (
        <Card className="divide-y divide-slate-100 !p-0">
          {items.map((c) => (
            <div key={c._id} className="flex items-start gap-3 px-4 py-3">
              <input type="checkbox" className="mt-1.5 h-4 w-4 accent-primary" checked={sel.has(c._id)} onChange={() => toggle(c._id)} aria-label="Chọn bình luận" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500">
                  <b className="text-slate-700">{c.user?.fullName || "Đã xoá tài khoản"}</b> · {new Date(c.createdAt).toLocaleString("vi-VN")} · bài{" "}
                  {c.lesson ? <Link to={`/bai/${c.lesson._id}`} className="font-semibold text-primary hover:underline">{c.lesson.title}</Link> : "đã xoá"}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-slate-800">{c.text}</p>
              </div>
              <span className="mt-1 flex items-center gap-1 text-sm text-slate-400"><Heart className="h-3.5 w-3.5" />{c.likeCount}</span>
              <button type="button" title="Xoá" onClick={() => del([c._id])} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </Card>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
          <span className="text-sm font-semibold text-slate-600">Trang {page}/{pages}</span>
          <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
