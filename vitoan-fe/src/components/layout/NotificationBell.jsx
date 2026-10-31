import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { notificationService } from "../../api/services";
import { cn } from "../../lib/utils";

function timeAgo(date) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  if (m < 1440) return `${Math.floor(m / 60)} giờ trước`;
  return `${Math.floor(m / 1440)} ngày trước`;
}

// Chuông thông báo: thách đấu, kết quả trận, giải đấu tuần + nhắc giữ chuỗi ngày học / nhận thưởng nhiệm vụ.
export default function NotificationBell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const ref = useRef(null);

  const load = useCallback(() => {
    notificationService.list().then((r) => setData(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load, pathname]);
  useEffect(() => {
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function openItem(n) {
    setOpen(false);
    if (!n.live && !n.read) await notificationService.markRead(n._id).catch(() => {});
    if (n.link) navigate(n.link);
    load();
  }

  async function readAll() {
    await notificationService.readAll().catch(() => {});
    load();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Thông báo${data.unread ? `, ${data.unread} chưa đọc` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-primary/10 hover:text-primary active:scale-95"
      >
        <Bell className="h-6 w-6" />
        {data.unread > 0 && (
          <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-black text-white ring-2 ring-white">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-2 shadow-[0_24px_60px_-20px_rgba(11,35,64,0.45)]">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-display text-lg font-black text-slate-800">Thông báo</p>
            {data.items.some((n) => !n.live && !n.read) && (
              <button type="button" onClick={readAll} className="text-sm font-bold text-primary hover:underline">Đánh dấu đã đọc</button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {data.items.length === 0 ? (
              <p className="px-3 py-8 text-center font-semibold text-slate-400">Chưa có thông báo nào 🔔</p>
            ) : (
              data.items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn("flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50", !n.live && !n.read && "bg-primary/5")}
                >
                  <span className="mt-0.5 text-2xl">{n.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-snug text-slate-800">{n.title}</span>
                    {n.body && <span className="block text-sm text-slate-500">{n.body}</span>}
                    {!n.live && <span className="mt-0.5 block text-xs font-semibold text-slate-400">{timeAgo(n.createdAt)}</span>}
                  </span>
                  {(n.live || !n.read) && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
