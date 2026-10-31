import { useEffect, useState } from "react";
import { adminStatsService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { AdminHeader, Card, adminPageClass } from "../../components/admin/adminUi.jsx";

const STATUS = { waiting: "Chờ bạn nhận", open: "Thách cả lớp", accepted: "Đang đấu", done: "Đã xong" };

function Stat({ label, value }) {
  return (
    <Card className="text-center">
      <p className="font-display text-3xl font-black text-slate-800">{value}</p>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </Card>
  );
}

// Theo dõi sức sống của Đấu trường: lượt thi, người chơi 7 ngày qua, thách đấu gần đây và top tuần.
export default function AdminArenaPage() {
  const [d, setD] = useState(null);
  useEffect(() => {
    adminStatsService.arena().then((r) => setD(r.data));
  }, []);
  if (!d) return <div className="flex justify-center py-20"><Spinner /></div>;
  const ch = d.challenges;

  return (
    <div className={adminPageClass}>
      <AdminHeader title="Đấu trường" subtitle="Theo dõi mức độ học sinh tham gia thi đấu trong 7 ngày gần nhất." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Lượt thi (7 ngày)" value={d.runs7} />
        <Stat label="Người chơi (7 ngày)" value={d.players7} />
        <Stat label="Thách đấu đã xong" value={ch.done || 0} />
        <Stat label="Thách đấu đang chờ" value={(ch.waiting || 0) + (ch.open || 0) + (ch.accepted || 0)} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-800">Top điểm tuần này</h2>
          {d.top.length === 0 ? <p className="text-slate-400">Tuần này chưa ai thi đấu.</p> : (
            <ol className="divide-y divide-slate-100">
              {d.top.map((t, i) => (
                <li key={t._id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-black text-amber-700">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-bold text-slate-800">{t.name}</span>
                  <span className="text-sm text-slate-500">{t.runs} lượt · cao nhất {t.best}</span>
                  <span className="w-14 text-right font-black text-primary">{t.total}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-lg font-bold text-slate-800">Thách đấu gần đây</h2>
          {d.recent.length === 0 ? <p className="text-slate-400">Chưa có thách đấu nào.</p> : (
            <ul className="divide-y divide-slate-100">
              {d.recent.map((c) => (
                <li key={c._id} className="py-2.5">
                  <p className="font-semibold text-slate-800">{c.creator} ⚔️ {c.opponent}</p>
                  <p className="text-sm text-slate-500">{c.subject} · {STATUS[c.status] || c.status}{c.winner && ` · thắng: ${c.winner}`} · {new Date(c.createdAt).toLocaleDateString("vi-VN")}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
