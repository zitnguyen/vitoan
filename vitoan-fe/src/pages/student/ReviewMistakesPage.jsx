import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Gem, Volume2 } from "../../components/ui/icons.jsx";
import { reviewSessionService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import FillBlankPrompt from "../../components/quiz/FillBlankPrompt.jsx";
import QuestionImage from "../../components/quiz/QuestionImage.jsx";
import { Img3D } from "../../lib/icons3d.jsx";
import { playCorrectSound, playWrongSound } from "../../lib/sound.js";
import { speakQuestionText, stopSpeaking, FILL_TYPES } from "../../lib/speech.js";
import { cn } from "../../lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const TWO_COL = "grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]";

const STEPS = [
  { icon: "target", title: "ViToan chọn câu em hay sai", text: "Mỗi lượt gồm 10 câu em sai nhiều nhất." },
  { icon: "brain", title: "Em trả lời lại", text: "Có giải thích ngay sau mỗi câu để hiểu vì sao." },
  { icon: "star", title: "Đúng 2 lần liên tiếp = nhớ chắc", text: "Câu đã nhớ sẽ không xuất hiện nữa." },
  { icon: "gem", title: "Nhận điểm thưởng", text: "+2 điểm cho mỗi câu đúng, tối đa 10 câu mỗi ngày." },
];

function HowItWorks() {
  return (
    <section className="rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
      <h2 className="font-display text-xl font-black text-[#0b2340]">Ôn thông minh hoạt động thế nào?</h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50">
              <Img3D name={s.icon} className="h-7 w-7" />
            </span>
            <span>
              <span className="block font-black text-slate-800">
                {i + 1}. {s.title}
              </span>
              <span className="block text-sm font-semibold text-slate-500">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// "Ôn lại câu sai": ViToan chọn các câu em hay sai nhất; đúng 2 lần liên tiếp thì câu đó được coi là đã nhớ
// (lặp lại ngắt quãng — cách học giúp nhớ lâu hơn việc làm lại cả bài).
export default function ReviewMistakesPage() {
  const { refreshUser } = useAuth();
  const [summary, setSummary] = useState(null); // { due, byLesson }
  const [questions, setQuestions] = useState(null); // null = chưa bắt đầu
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [marks, setMarks] = useState([]);
  const [stats, setStats] = useState({ right: 0, mastered: 0, points: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const due = summary?.due ?? null;
  const loadSummary = useCallback(() => reviewSessionService.summary().then((r) => setSummary(r.data)).catch(() => setSummary({ due: 0, byLesson: [] })), []);
  useEffect(() => {
    loadSummary();
    return () => stopSpeaking();
  }, [loadSummary]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const res = await reviewSessionService.session();
      if (res.data.questions.length === 0) {
        setSummary({ due: 0, byLesson: [] });
        return;
      }
      setQuestions(res.data.questions);
      setIdx(0);
      setValue("");
      setFeedback(null);
      setMarks([]);
      setFinished(false);
      setStats({ right: 0, mastered: 0, points: 0 });
    } catch (e) {
      setError(e.apiMessage || "Chưa tải được câu hỏi");
    } finally {
      setBusy(false);
    }
  }

  const q = questions?.[idx];
  const isFill = q && FILL_TYPES.includes(q.type);

  async function submit(choiceIdx) {
    if (!q || feedback || busy) return;
    const payload = isFill ? { question: q._id, textAnswer: value.trim() } : { question: q._id, selectedIndex: choiceIdx };
    if (isFill && !payload.textAnswer) return;
    setBusy(true);
    try {
      const res = (await reviewSessionService.answer(payload)).data;
      setFeedback({ ...res, picked: choiceIdx });
      setMarks((m) => [...m, res.correct]);
      (res.correct ? playCorrectSound : playWrongSound)();
      setStats((s) => ({ right: s.right + (res.correct ? 1 : 0), mastered: s.mastered + (res.mastered ? 1 : 0), points: s.points + res.pointsEarned }));
      setSummary((s) => ({ ...(s || { byLesson: [] }), due: res.totalDue }));
    } catch (e) {
      setError(e.apiMessage || "Không chấm được câu này");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    stopSpeaking();
    if (idx + 1 >= questions.length) {
      setFinished(true);
      loadSummary();
      refreshUser?.().catch?.(() => {});
      return;
    }
    setIdx(idx + 1);
    setValue("");
    setFeedback(null);
  }

  // Cột phải khi đang ôn / vừa ôn xong: tiến độ lượt này + mẹo
  const sidebar = (
    <aside className="space-y-5">
      <section className="rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
        <h2 className="font-display text-xl font-black text-[#0b2340]">Lượt ôn này</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {(questions || []).map((_, i) => (
            <span
              key={i}
              className={cn(
                "flex h-10 items-center justify-center rounded-xl font-display text-base font-black",
                marks[i] === true ? "bg-emerald-500 text-white" : marks[i] === false ? "bg-rose-400 text-white" : i === idx && !finished ? "bg-primary/15 text-primary ring-2 ring-primary/40" : "bg-slate-100 text-slate-400"
              )}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-emerald-50 px-2 py-2.5">
            <p className="font-display text-2xl font-black text-emerald-600">{stats.right}</p>
            <p className="text-xs font-bold text-slate-500">câu đúng</p>
          </div>
          <div className="rounded-2xl bg-violet-50 px-2 py-2.5">
            <p className="font-display text-2xl font-black text-violet-600">{stats.mastered}</p>
            <p className="text-xs font-bold text-slate-500">đã nhớ chắc</p>
          </div>
          <div className="rounded-2xl bg-sky-50 px-2 py-2.5">
            <p className="flex items-center justify-center gap-1 font-display text-2xl font-black text-sky-600">
              <Gem className="h-5 w-5" />+{stats.points}
            </p>
            <p className="text-xs font-bold text-slate-500">điểm</p>
          </div>
        </div>
        {due !== null && <p className="mt-4 text-center text-sm font-semibold text-slate-500">Còn <b className="text-slate-700">{due}</b> câu cần ôn trong tổng số</p>}
      </section>
      <HowItWorks />
    </aside>
  );

  // ===== Kết thúc một lượt ôn =====
  if (finished) {
    return (
      <div className="page">
        <div className={TWO_COL}>
          <section className="rounded-[2rem] bg-white p-8 text-center shadow-elevation-2 sm:p-10">
            <OwlMascot className="mx-auto h-32 w-32" />
            <p className="mt-3 font-display text-4xl font-black text-slate-800">Ôn xong rồi! 🎉</p>
            <p className="mt-2 text-lg font-semibold text-slate-500">
              Đúng {stats.right}/{questions.length} câu · đã nhớ chắc <b className="text-primary">{stats.mastered}</b> câu
            </p>
            {stats.points > 0 && (
              <p className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full bg-sky-50 px-5 py-2 text-lg font-bold text-sky-700">
                <Gem className="h-6 w-6" /> +{stats.points} điểm thưởng
              </p>
            )}
            <p className="mt-4 text-slate-500">{due > 0 ? `Còn ${due} câu cần ôn — mỗi ngày ôn một lượt là đủ nhé!` : "Em đã ôn hết các câu hay sai. Giỏi quá!"}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {due > 0 && (
                <Button onClick={start} className="rounded-full px-8 py-3 text-lg">
                  <RotateCcw className="h-5 w-5" /> Ôn tiếp 10 câu
                </Button>
              )}
              <Button to="/" variant="outline" className="rounded-full px-8 py-3 text-lg">Về trang chủ</Button>
            </div>
          </section>
          {sidebar}
        </div>
      </div>
    );
  }

  // ===== Đang ôn =====
  if (q) {
    return (
      <div className="page">
        <div className={TWO_COL}>
          <section className="rounded-[2rem] bg-white p-6 shadow-elevation-2 sm:p-8">
            <div className="flex items-center gap-3">
              <p className="font-display text-xl font-black text-slate-800">
                Câu {idx + 1}/{questions.length}
              </p>
              <div className="flex flex-1 gap-1.5">
                {questions.map((_, i) => (
                  <span key={i} className={cn("h-2.5 flex-1 rounded-full", i < idx ? "bg-primary" : i === idx ? "bg-primary/40" : "bg-slate-200")} />
                ))}
              </div>
            </div>

            {q.imageUrl && (
              <div className="mt-4 flex justify-center rounded-2xl bg-slate-50 p-3">
                <QuestionImage src={q.imageUrl} zoom={100} />
              </div>
            )}
            {!isFill && <p className="mt-5 whitespace-pre-line text-2xl font-bold leading-relaxed text-slate-800 sm:text-3xl">{q.text}</p>}
            {(q.type === "listen_choice" || q.type === "listen_fill") && (
              <button type="button" onClick={() => speakQuestionText(q.audioText || q.text)} className="mt-3 flex items-center gap-2 rounded-full bg-sky-100 px-5 py-2 font-display text-lg font-black text-sky-700">
                <Volume2 className="h-5 w-5" /> Nghe câu hỏi
              </button>
            )}

            {isFill ? (
              <>
                <FillBlankPrompt text={q.text} value={value} onChange={setValue} disabled={!!feedback} />
                {!feedback && (
                  <Button onClick={() => submit()} disabled={!value.trim() || busy} className="mt-5 rounded-full px-8">Kiểm tra</Button>
                )}
              </>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {q.choices.map((c, i) => {
                  const right = feedback && i === feedback.correctIndex;
                  const wrong = feedback && feedback.picked === i && !feedback.correct;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!!feedback || busy}
                      onClick={() => submit(i)}
                      className={cn(
                        "relative min-h-[4.5rem] rounded-2xl px-12 py-3 text-center text-xl font-bold ring-2 transition",
                        right && "bg-emerald-50 text-emerald-700 ring-emerald-400",
                        wrong && "bg-rose-50 text-rose-600 ring-rose-400",
                        !feedback && "bg-white text-slate-700 shadow-[0_4px_0_0_#e2e8f0] ring-slate-200 hover:-translate-y-0.5 hover:ring-sky-300",
                        feedback && !right && !wrong && "bg-white text-slate-400 ring-slate-100"
                      )}
                    >
                      <span className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">{LETTERS[i]}</span>
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {feedback && (
              <div className={cn("mt-6 rounded-2xl px-5 py-4", feedback.correct ? "bg-emerald-50" : "bg-rose-50")}>
                <p className={cn("font-display text-xl font-black", feedback.correct ? "text-emerald-700" : "text-rose-600")}>
                  {feedback.correct ? (feedback.mastered ? "Đúng rồi — câu này em đã nhớ chắc! 🌟" : `Đúng rồi! Thêm ${feedback.needMore} lần đúng nữa là nhớ chắc 💪`) : "Chưa đúng — mình xem lại nhé"}
                </p>
                {!feedback.correct && isFill && <p className="mt-1 font-bold text-slate-700">Đáp án đúng: {feedback.correctText}</p>}
                {feedback.explanation && <p className="mt-1 font-semibold text-slate-600">💡 {feedback.explanation}</p>}
                <Button onClick={next} className="mt-4 rounded-full px-8">{idx + 1 >= questions.length ? "Xong" : "Câu tiếp theo"}</Button>
              </div>
            )}
            {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          </section>
          {sidebar}
        </div>
      </div>
    );
  }

  // ===== Màn giới thiệu =====
  return (
    <div className="page">
      <PageHeader icon={RotateCcw} tone="violet" title="Ôn lại câu sai" subtitle="ViToan nhắc em ôn đúng những câu hay sai — đúng 2 lần liên tiếp là nhớ chắc" />
      <div className={cn("mt-5", TWO_COL)}>
        <section className="rounded-[2rem] bg-white p-8 shadow-elevation-1 sm:p-10">
          {due === null ? (
            <div className="py-12"><Spinner /></div>
          ) : due === 0 ? (
            <div className="text-center">
              <OwlMascot className="mx-auto h-32 w-32" />
              <p className="mt-3 font-display text-3xl font-black text-slate-800">Em chưa có câu nào cần ôn 🎉</p>
              <p className="mt-2 text-lg text-slate-500">Khi làm bài và gặp câu sai, ViToan sẽ lưu lại ở đây để em ôn sau.</p>
              <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-lg font-black text-white shadow-[0_4px_0_0_#049245]">Đi học tiếp</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <div className="text-center sm:px-6">
                <p className="font-display text-8xl font-black leading-none text-violet-600">{due}</p>
                <p className="mt-2 font-display text-xl font-black text-slate-800">câu em cần ôn lại</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-600">Mỗi lượt ôn 10 câu — ưu tiên câu sai nhiều nhất. Trả lời đúng được +2 điểm thưởng (tối đa 10 câu mỗi ngày).</p>
                {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
                <Button onClick={start} disabled={busy} className="mt-5 rounded-full px-10 py-3 text-lg">{busy ? "Đang chuẩn bị..." : "Bắt đầu ôn"}</Button>
              </div>
            </div>
          )}

          {summary?.byLesson?.length > 0 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="font-display text-xl font-black text-[#0b2340]">Phần em cần ôn nhiều nhất</h2>
              <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
                {summary.byLesson.map((l) => (
                  <li key={l.lesson}>
                    <Link to={`/bai/${l.lesson}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                      <span className="min-w-0 flex-1 truncate font-bold text-slate-800">{l.title}</span>
                      <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-700">{l.count} câu</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <HowItWorks />
      </div>
    </div>
  );
}
