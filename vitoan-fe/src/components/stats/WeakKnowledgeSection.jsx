import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, MessageSquareQuote, PenLine, Target, XCircle } from "../ui/icons.jsx";
import { attemptService, subjectService } from "../../api/services";
import Spinner from "../ui/Spinner.jsx";
import { cn } from "../../lib/utils";

function WrongBar({ percent }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full", percent >= 50 ? "bg-red-400" : percent >= 30 ? "bg-amber-400" : "bg-green-500")}
        style={{ width: `${Math.max(percent, 3)}%` }}
      />
    </div>
  );
}

// Thống kê lỗi sai trên toàn bộ bài luyện tập + kiểm tra, gom theo bài học/chủ đề,
// kèm nhận xét phần kiến thức em hay sai và các câu sai nhiều nhất.
export default function WeakKnowledgeSection() {
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [weak, setWeak] = useState(null);

  useEffect(() => {
    subjectService
      .list()
      .then((res) => setSubjects(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setWeak(null);
    attemptService
      .weakKnowledge({ subject: subjectFilter || undefined })
      .then((res) => setWeak(res.data))
      .catch(() => setWeak({ remarks: [], lessons: [], chapters: [], frequentWrongQuestions: [], totalAnswered: 0 }));
  }, [subjectFilter]);

  const weakLessons = weak?.lessons?.filter((g) => g.wrong > 0) || [];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">
          <AlertTriangle className="h-6 w-6 text-amber-500" /> Kiến thức em hay sai
        </h2>
        <div className="flex flex-wrap gap-2">
          {[{ _id: "", name: "Tất cả môn" }, ...subjects].map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => setSubjectFilter(s._id)}
              className={cn("pill", subjectFilter === s._id && "pill-active")}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {!weak ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-elevation-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display font-bold text-slate-800">
                <MessageSquareQuote className="h-5 w-5 text-secondary" /> Nhận xét của ViToan
              </p>
              {weak.totalAnswered > 0 && (
                <p className="text-sm text-slate-500">
                  Đã làm <b>{weak.totalAnswered}</b> câu · sai <b className="text-red-500">{weak.totalWrong}</b> · đúng{" "}
                  <b className="text-primary">{weak.correctPercent}%</b>
                </p>
              )}
            </div>
            <ul className="mt-2 space-y-1.5">
              {weak.remarks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-body text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" /> {r}
                </li>
              ))}
            </ul>
          </div>

          {weakLessons.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-elevation-1">
              <p className="font-display font-bold text-slate-800">Tỉ lệ sai theo bài học</p>
              <div className="mt-3 space-y-3">
                {weakLessons.slice(0, 10).map((g) => (
                  <div key={g.lesson} className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate font-bold text-slate-800">{g.title}</p>
                      <p className="truncate text-xs text-slate-400">
                        {[g.subject?.name, g.grade?.name, g.chapter?.title].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="w-36">
                      <WrongBar percent={g.wrongPercent} />
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        Sai {g.wrong}/{g.total} ({g.wrongPercent}%)
                      </p>
                    </div>
                    <Link
                      to={`/bai/${g.lesson}`}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/20"
                    >
                      <PenLine className="h-3.5 w-3.5" /> Ôn lại
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weak.chapters?.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-elevation-1">
              <p className="flex items-center gap-2 font-display font-bold text-slate-800">
                <Target className="h-5 w-5 text-violet-500" /> Tỉ lệ sai theo chủ đề
              </p>
              <div className="mt-3 space-y-2">
                {weak.chapters.map((c) => (
                  <div key={c.chapter} className="flex items-center gap-3">
                    <span className="w-1/2 truncate text-sm font-semibold text-slate-700">{c.title}</span>
                    <div className="flex-1">
                      <WrongBar percent={c.wrongPercent} />
                    </div>
                    <span className="w-12 text-right text-sm font-bold text-slate-500">{c.wrongPercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weak.frequentWrongQuestions?.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-elevation-1">
              <p className="flex items-center gap-2 font-display font-bold text-slate-800">
                <XCircle className="h-5 w-5 text-red-400" /> Các câu em hay sai nhất
              </p>
              <div className="mt-3 space-y-2">
                {weak.frequentWrongQuestions.map((item) => {
                  const q = item.question;
                  const isFill = q.type === "fill_blank" || q.type === "listen_fill";
                  const answer = isFill ? q.correctText : q.choices?.[q.correctIndex];
                  return (
                    <div key={q._id} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-semibold text-slate-800">{q.text.replace(/___/g, "…").replace(/\n/g, " ")}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Sai {item.wrong}/{item.total} lần · Đáp án đúng: <b className="text-primary">{answer}</b> ·{" "}
                        <Link to={`/bai/${item.lesson}`} className="font-semibold text-secondary hover:underline">
                          {item.lessonTitle}
                        </Link>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
