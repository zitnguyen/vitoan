import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { adminStatsService, gradeService } from "../../api/services";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { AdminHeader, Card, adminPageClass } from "../../components/admin/adminUi.jsx";

function daysAgo(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function lastActiveText(date) {
  const d = daysAgo(date);
  if (d === null) return "Chưa học";
  if (d <= 0) return "Hôm nay";
  return `${d} ngày trước`;
}

function StudentDetail({ id }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    adminStatsService.studentReport(id).then((r) => setData(r.data)).catch(() => setData({ remarks: ["Không tải được báo cáo"], weakLessons: [], frequentWrongQuestions: [] }));
  }, [id]);
  if (!data) return <div className="py-4"><Spinner /></div>;
  return (
    <div className="grid gap-4 bg-slate-50 px-4 py-4 md:grid-cols-2">
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400">Nhận xét tự động</p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          {data.remarks.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
        {data.totalAnswered > 0 && <p className="mt-2 text-sm text-slate-500">Đã trả lời {data.totalAnswered} câu, đúng {data.correctPercent}%.</p>}
      </div>
      <div>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400">Bài học em hay sai</p>
        {data.weakLessons.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Chưa có bài nào sai đáng kể.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.weakLessons.map((g) => (
              <li key={g.lesson} className="flex items-center justify-between gap-3">
                <Link to={`/admin/bai-hoc/${g.lesson}/cau-hoi`} className="min-w-0 truncate font-semibold text-primary hover:underline">
                  {g.title}
                </Link>
                <span className="shrink-0 font-bold text-rose-600">
                  sai {g.wrongPercent}% ({g.wrong}/{g.total})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminReportPage() {
  const [grades, setGrades] = useState([]);
  const [grade, setGrade] = useState(null); // null = chưa chọn xong; mặc định Lớp 1 (khối đang triển khai)
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    gradeService.list().then((r) => {
      setGrades(r.data);
      setGrade([...r.data].sort((a, b) => (a.order || 0) - (b.order || 0))[0]?._id || "");
    });
  }, []);

  useEffect(() => {
    if (grade === null) return;
    setData(null);
    setOpen(null);
    adminStatsService.report({ grade: grade || undefined }).then((r) => setData(r.data));
  }, [grade]);

  const students = data?.students || [];
  const active = students.filter((s) => daysAgo(s.lastActiveAt) !== null && daysAgo(s.lastActiveAt) <= 7).length;
  const inactive = students.filter((s) => daysAgo(s.lastActiveAt) === null || daysAgo(s.lastActiveAt) > 7).length;

  return (
    <div className={adminPageClass}>
      <AdminHeader
        className="mb-0"
        title="Báo cáo học tập"
        subtitle="Ai đang học đều, ai cần nhắc nhở, và những bài học cả lớp hay làm sai. Tài khoản thử nghiệm không được tính."
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {[{ _id: "", name: "Tất cả lớp" }, ...grades].map((g) => (
          <button key={g._id} type="button" onClick={() => setGrade(g._id)} className={cn("pill", grade === g._id && "pill-active")}>
            {g.name}
          </button>
        ))}
      </div>

      <Card className="mt-4 bg-sky-50/60 p-4 ring-sky-100">
        <p className="font-display font-black text-sky-800">Cách đọc báo cáo</p>
        <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
          <li>• <b>Số lượt làm bài</b>: số lần học sinh nộp bài luyện tập; phần “… bài kiểm tra” là số lần nộp bài kiểm tra (chủ đề, giữa kỳ, cuối kỳ).</li>
          <li>• <b>% câu đúng TB</b>: tổng số câu đúng chia tổng số câu đã làm (gộp luyện tập và kiểm tra), không phải điểm trung bình các lượt.</li>
          <li>• <b>Bài đã đạt</b>: số bài học đạt từ 80% ở bài luyện tập trở lên nên được đánh dấu “Đã học”.</li>
          <li>• <b>Học lần cuối</b>: lần gần nhất có nộp bài; quá 7 ngày hoặc chưa học bị tính là “cần nhắc nhở”.</li>
          <li>• Bấm vào một học sinh để xem nhận xét tự động và các bài/câu em hay sai, nhóm theo bài học.</li>
        </ul>
      </Card>

      {!data ? (
        <div className="mt-10 flex justify-center"><Spinner /></div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Học sinh", value: students.length, tone: "text-slate-800" },
              { label: "Học trong 7 ngày qua", value: active, tone: "text-emerald-600" },
              { label: "Cần nhắc nhở", value: inactive, tone: "text-amber-600" },
            ].map((x) => (
              <Card key={x.label} className="p-4 text-center">
                <p className={cn("font-display text-3xl font-black", x.tone)}>{x.value}</p>
                <p className="text-sm font-semibold text-slate-500">{x.label}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-5 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-black text-slate-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Bài học cả lớp hay sai
            </h2>
            {data.weakLessons.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Chưa đủ dữ liệu (cần ít nhất 20 câu đã làm ở một bài) hoặc chưa có bài nào sai nhiều.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.weakLessons.map((l) => (
                  <li key={l.lesson} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <Link to={`/admin/bai-hoc/${l.lesson}/cau-hoi`} className="font-bold text-primary hover:underline">
                      {l.title}
                    </Link>
                    <span className="text-slate-400">{l.context}</span>
                    <span className="ml-auto font-bold text-rose-600">
                      sai {l.wrongPercent}% · {l.students} em · {l.answered} câu
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-400">Gợi ý: bài sai nhiều có thể do đáp án nhập nhầm, câu hỏi mơ hồ hoặc phần lý thuyết chưa đủ rõ — mở bài để xem lại.</p>
          </Card>

          <Card className="mt-5 overflow-clip">
            <div className="hidden grid-cols-[minmax(0,2fr)_80px_80px_90px_100px_120px_32px] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400 md:grid">
              <span>Học sinh</span>
              <span>Lớp</span>
              <span>Số lượt làm bài</span>
              <span>% câu đúng TB</span>
              <span>Bài đã đạt</span>
              <span>Học lần cuối</span>
              <span />
            </div>
            {students.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Chưa có học sinh nào.</p>}
            {students.map((s) => {
              const idle = daysAgo(s.lastActiveAt) === null || daysAgo(s.lastActiveAt) > 7;
              return (
                <div key={s.id} className="border-b border-slate-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpen(open === s.id ? null : s.id)}
                    className="grid w-full grid-cols-2 items-center gap-x-3 gap-y-1 px-4 py-3 text-left text-sm hover:bg-slate-50 md:grid-cols-[minmax(0,2fr)_80px_80px_90px_100px_120px_32px]"
                  >
                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <span className="block truncate font-bold text-slate-800">{s.fullName}</span>
                      <span className="block truncate text-xs text-slate-400">@{s.username}</span>
                    </span>
                    <span className="text-slate-600">{s.grade || "—"}</span>
                    <span className="text-slate-600">{s.attempts} lượt{s.testAttempts > 0 && ` · ${s.testAttempts} bài kiểm tra`}</span>
                    <span className={cn("font-bold", s.avgPercent === null ? "text-slate-300" : s.avgPercent >= 80 ? "text-emerald-600" : s.avgPercent >= 50 ? "text-amber-600" : "text-rose-600")}>
                      {s.avgPercent === null ? "—" : `${s.avgPercent}%`}
                    </span>
                    <span className="text-slate-600">{s.lessonsPassed} bài</span>
                    <span className={cn("font-semibold", idle ? "text-amber-600" : "text-slate-600")}>{lastActiveText(s.lastActiveAt)}</span>
                    <ChevronDown className={cn("hidden h-4 w-4 text-slate-400 transition md:block", open === s.id && "rotate-180")} />
                  </button>
                  {open === s.id && <StudentDetail id={s.id} />}
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
