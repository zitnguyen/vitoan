import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Swords, Clock, Trophy, RotateCcw, Flame, Crown, Users, Gem, Target } from "../../components/ui/icons.jsx";
import { arenaService, subjectService } from "../../api/services";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { playCorrectSound, playWrongSound } from "../../lib/sound.js";
import { speakQuestionText, stopSpeaking } from "../../lib/speech.js";
import { cn } from "../../lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const NEXT_DELAY = 1500;

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const MEDAL = ["🥇", "🥈", "🥉"];

function countdownText(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "sắp kết thúc";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? `${d} ngày ${h} giờ` : `${h} giờ`;
}

// ---------- Bảng xếp hạng ----------
function Board({ data, label }) {
  if (!data) return <Spinner />;
  const { top, me } = data;
  if (top.length === 0) return <p className="py-6 text-center font-semibold text-slate-400">Chưa ai thi đấu {label} — em hãy là người đầu tiên! 🚀</p>;
  const meInTop = top.some((r) => r.isMe);
  return (
    <ol className="space-y-2">
      {top.map((r) => (
        <li
          key={r.student}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5",
            r.isMe ? "bg-primary/10 ring-2 ring-primary/30" : r.rank <= 3 ? "bg-amber-50" : "bg-slate-50"
          )}
        >
          <span className="w-8 text-center font-display text-xl font-black text-slate-500">{MEDAL[r.rank - 1] || r.rank}</span>
          <span className="min-w-0 flex-1 truncate font-bold text-slate-800">
            {r.name}
            {r.isMe && <span className="ml-1 text-primary"> (em)</span>}
          </span>
          <span className="font-display text-lg font-black text-emerald-600">
            {r.score}/{r.totalQuestions}
          </span>
          <span className="flex w-20 items-center justify-end gap-1 font-semibold text-slate-500">
            <Clock className="h-4 w-4" />
            {mmss(r.durationSeconds)}
          </span>
        </li>
      ))}
      {me && !meInTop && (
        <li className="mt-1 flex items-center gap-3 rounded-2xl bg-primary/10 px-3 py-2.5 ring-2 ring-primary/30">
          <span className="w-8 text-center font-display text-xl font-black text-slate-500">{me.rank}</span>
          <span className="flex-1 font-bold text-slate-800">Em</span>
          <span className="font-display text-lg font-black text-emerald-600">
            {me.score}/{me.totalQuestions}
          </span>
          <span className="flex w-20 items-center justify-end gap-1 font-semibold text-slate-500">
            <Clock className="h-4 w-4" />
            {mmss(me.durationSeconds)}
          </span>
        </li>
      )}
    </ol>
  );
}

// ---------- Vòng đếm ngược ----------
function TimerRing({ remaining, total }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, remaining / total);
  const low = remaining <= 5;
  return (
    <div className={cn("relative h-16 w-16 shrink-0", low && "animate-pulse")}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#e2e8f0" strokeWidth="7" fill="none" />
        <circle cx="32" cy="32" r={r} stroke={low ? "#ef4444" : "#00b14f"} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center font-display text-2xl font-black", low ? "text-red-500" : "text-slate-800")}>{Math.ceil(remaining)}</span>
    </div>
  );
}

export default function ArenaPage() {
  const { user, refreshUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [ov, setOv] = useState(null);
  const [tab, setTab] = useState("week");
  const [phase, setPhase] = useState("lobby"); // lobby | play | result
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [friends, setFriends] = useState(null);
  const [duelOpen, setDuelOpen] = useState(false);
  const [target, setTarget] = useState("");

  // --- trạng thái đang chơi ---
  const [run, setRun] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hidden, setHidden] = useState([]);
  const [lifeUsed, setLifeUsed] = useState(false);
  const [marks, setMarks] = useState([]);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(20);
  const [result, setResult] = useState(null);
  const qStart = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    subjectService.list().then((r) => {
      setSubjects(r.data);
      setSubjectId(r.data[0]?._id || "");
    });
  }, []);

  const loadOverview = useCallback(() => {
    if (!subjectId) return;
    arenaService
      .overview(subjectId)
      .then((r) => setOv(r.data))
      .catch((e) => setError(e.apiMessage || "Không tải được Đấu trường"));
  }, [subjectId]);

  useEffect(() => {
    setOv(null);
    loadOverview();
  }, [loadOverview]);

  const secondsPerQuestion = run?.secondsPerQuestion || 20;

  // Câu "nghe rồi chọn": tự đọc khi sang câu mới (có nút nghe lại); rời màn chơi thì tắt tiếng.
  useEffect(() => {
    if (phase !== "play" || !run) return undefined;
    const q = run.questions[idx];
    if (q?.type === "listen_choice") speakQuestionText(q.audioText || q.text);
    return () => stopSpeaking();
  }, [phase, run, idx]);

  // ---- vào trận ----
  function beginRun(data) {
    setRun(data);
    setIdx(0);
    setPicked(null);
    setFeedback(null);
    setHidden([]);
    setLifeUsed(false);
    setMarks([]);
    setCombo(0);
    setScore(0);
    setResult(null);
    setRemaining(data.secondsPerQuestion);
    locked.current = false;
    qStart.current = Date.now();
    setPhase("play");
  }

  async function startSolo() {
    setError("");
    setBusy(true);
    try {
      beginRun((await arenaService.startRun({ subject: subjectId })).data);
    } catch (e) {
      setError(e.apiMessage || "Chưa thể bắt đầu lúc này");
    } finally {
      setBusy(false);
    }
  }

  async function openDuelPicker() {
    setDuelOpen((o) => !o);
    if (!friends) arenaService.classmates().then((r) => setFriends(r.data)).catch(() => setFriends([]));
  }

  async function startChallenge() {
    setError("");
    setBusy(true);
    try {
      beginRun((await arenaService.createChallenge({ subject: subjectId, opponent: target || undefined })).data);
    } catch (e) {
      setError(e.apiMessage || "Chưa gửi được thách đấu");
    } finally {
      setBusy(false);
    }
  }

  async function acceptChallenge(id) {
    setError("");
    setBusy(true);
    try {
      beginRun((await arenaService.startRun({ challengeId: id })).data);
    } catch (e) {
      setError(e.apiMessage || "Không nhận được thách đấu này");
      loadOverview();
    } finally {
      setBusy(false);
    }
  }

  // ---- trả lời một câu ----
  const submitAnswer = useCallback(
    async (selectedIndex) => {
      if (locked.current || !run) return;
      locked.current = true;
      const q = run.questions[idx];
      const ms = Math.min(Date.now() - qStart.current, (run.secondsPerQuestion + 2) * 1000);
      setPicked(selectedIndex);
      try {
        const res = (await arenaService.answer(run.runId, { question: q._id, selectedIndex, ms })).data;
        setFeedback(res);
        setCombo(res.combo);
        setScore(res.score);
        setMarks((m) => [...m, res.correct]);
        (res.correct ? playCorrectSound : playWrongSound)();
      } catch {
        setFeedback({ correct: false, correctIndex: -1, explanation: "", combo: 0, score });
        setMarks((m) => [...m, false]);
      }
    },
    [run, idx, score]
  );

  // ---- đồng hồ đếm ngược từng câu ----
  useEffect(() => {
    if (phase !== "play" || feedback) return undefined;
    const t = setInterval(() => {
      const left = run.secondsPerQuestion - (Date.now() - qStart.current) / 1000;
      setRemaining(Math.max(0, left));
      if (left <= 0) submitAnswer(-1);
    }, 100);
    return () => clearInterval(t);
  }, [phase, feedback, run, submitAnswer]);

  // ---- sang câu kế / kết thúc sau khi xem đáp án ----
  const advance = useCallback(async () => {
    if (!run) return;
    if (idx + 1 < run.questions.length) {
      setIdx(idx + 1);
      setPicked(null);
      setFeedback(null);
      setHidden([]);
      setRemaining(run.secondsPerQuestion);
      locked.current = false;
      qStart.current = Date.now();
      return;
    }
    setBusy(true);
    try {
      const res = (await arenaService.finish(run.runId)).data;
      setResult(res);
      setPhase("result");
      refreshUser?.().catch?.(() => {});
      loadOverview();
    } catch (e) {
      setError(e.apiMessage || "Không nộp được bài thi");
      setPhase("lobby");
    } finally {
      setBusy(false);
    }
  }, [run, idx, refreshUser, loadOverview]);

  useEffect(() => {
    if (!feedback) return undefined;
    const t = setTimeout(advance, NEXT_DELAY + (feedback.explanation && !feedback.correct ? 1200 : 0));
    return () => clearTimeout(t);
  }, [feedback, advance]);

  async function useFifty() {
    if (lifeUsed || feedback || !run) return;
    try {
      const res = (await arenaService.fifty(run.runId, run.questions[idx]._id)).data;
      setHidden(res.hide);
      setLifeUsed(true);
    } catch (e) {
      setError(e.apiMessage || "Không dùng được quyền trợ giúp");
    }
  }

  const subjectName = useMemo(() => subjects.find((s) => s._id === subjectId)?.name, [subjects, subjectId]);

  if (!user?.grade) return <Navigate to="/chon-lop" replace />;

  // ====================== MÀN CHƠI ======================
  if (phase === "play" && run) {
    const q = run.questions[idx];
    const isFifty = q.choices.length >= 3;
    return (
      <div>
        <div className="page">
          <div className="rounded-[2rem] bg-white p-5 shadow-elevation-2 sm:p-7">
            {/* HUD */}
            <div className="flex flex-wrap items-center gap-4">
              <TimerRing remaining={feedback ? Math.max(remaining, 0) : remaining} total={secondsPerQuestion} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-black text-slate-800">
                  Câu {idx + 1}/{run.total} <span className="ml-1 text-sm font-bold text-slate-400">· {subjectName}</span>
                </p>
                <div className="mt-2 flex gap-1.5">
                  {run.questions.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2.5 flex-1 rounded-full transition-all",
                        marks[i] === true ? "bg-emerald-500" : marks[i] === false ? "bg-rose-400" : i === idx ? "bg-primary/40" : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 font-display text-lg font-black transition", combo >= 3 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500")}>
                  <Flame className="h-6 w-6" /> x{combo}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 font-display text-lg font-black text-emerald-700">
                  <Target className="h-6 w-6" /> {score}
                </span>
                <button
                  type="button"
                  onClick={useFifty}
                  disabled={lifeUsed || !!feedback || !isFifty}
                  title="Bỏ bớt 2 đáp án sai (1 lần mỗi trận)"
                  className="rounded-full bg-violet-100 px-3 py-1.5 font-display text-lg font-black text-violet-700 transition hover:bg-violet-200 disabled:opacity-40"
                >
                  50:50
                </button>
              </div>
            </div>

            {/* Câu hỏi */}
            {q.imageUrl && <img src={q.imageUrl} alt="" className="mx-auto mt-5 max-h-56 rounded-2xl" />}
            <p className="mt-5 whitespace-pre-line text-2xl font-bold leading-relaxed text-slate-800 sm:text-3xl">{q.text}</p>
            {q.type === "listen_choice" && (
              <button type="button" onClick={() => speakQuestionText(q.audioText || q.text)} className="mt-3 flex items-center gap-2 rounded-full bg-sky-100 px-5 py-2 font-display text-lg font-black text-sky-700 transition hover:bg-sky-200 active:scale-95">
                🔊 Nghe lại
              </button>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {q.choices.map((c, i) => {
                if (hidden.includes(i)) return <div key={i} className="min-h-[4.5rem] rounded-2xl bg-slate-50 ring-2 ring-dashed ring-slate-200" />;
                const showRight = feedback && i === feedback.correctIndex;
                const showWrong = feedback && picked === i && !feedback.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!!feedback}
                    onClick={() => submitAnswer(i)}
                    className={cn(
                      "relative min-h-[4.5rem] rounded-2xl px-12 py-3 text-center text-xl font-bold ring-2 transition",
                      showRight && "bg-emerald-50 text-emerald-700 ring-emerald-400",
                      showWrong && "bg-rose-50 text-rose-600 ring-rose-400",
                      !feedback && "bg-white text-slate-700 shadow-[0_4px_0_0_#e2e8f0] ring-slate-200 hover:-translate-y-0.5 hover:ring-sky-300 active:translate-y-0.5",
                      feedback && !showRight && !showWrong && "bg-white text-slate-400 ring-slate-100"
                    )}
                  >
                    <span className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">{LETTERS[i]}</span>
                    {c}
                    {showRight && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">✅</span>}
                    {showWrong && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">❌</span>}
                  </button>
                );
              })}
            </div>

            {/* Phản hồi tức thì */}
            <div className="mt-5 min-h-[3.5rem]">
              {feedback && (
                <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3", feedback.correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700")}>
                  <OwlMascot className="h-10 w-10 shrink-0" animated={false} covering={!feedback.correct} />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-black">
                      {picked === -1 ? "Hết giờ rồi! ⏰" : feedback.correct ? (feedback.combo >= 3 ? `Đúng rồi! Combo x${feedback.combo} 🔥` : "Chính xác! 🎉") : "Chưa đúng rồi 😅"}
                    </p>
                    {!feedback.correct && feedback.explanation && <p className="text-sm font-semibold">💡 {feedback.explanation}</p>}
                  </div>
                </div>
              )}
              {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================== MÀN KẾT QUẢ ======================
  if (phase === "result" && result) {
    const duel = result.duel;
    const banner =
      duel?.role === "opponent"
        ? duel.result === "win"
          ? { text: "Em đã THẮNG! 🏆", cls: "from-amber-400 to-orange-500", sub: `${result.score} – ${duel.theirScore} câu đúng` }
          : duel.result === "draw"
          ? { text: "Hoà nhau! 🤝", cls: "from-sky-400 to-indigo-500", sub: `${result.score} – ${duel.theirScore} câu đúng` }
          : { text: "Tiếc quá, thua rồi 💪", cls: "from-slate-500 to-slate-700", sub: `${result.score} – ${duel.theirScore} câu đúng · đòi lại nhé!` }
        : duel?.role === "creator"
        ? { text: "Đã gửi thách đấu! ⚔️", cls: "from-violet-500 to-indigo-600", sub: "Khi bạn chơi xong, kết quả sẽ hiện ở mục Thách đấu của em" }
        : { text: result.score >= 9 ? "Xuất sắc! 🌟" : result.score >= 6 ? "Giỏi lắm! 👏" : "Cố lên nào! 💪", cls: "from-primary to-emerald-500", sub: `${subjectName} · ${result.total} câu` };
    return (
      <div>
        <div className="page">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="min-w-0">
            <div className={cn("relative overflow-clip rounded-[2rem] bg-gradient-to-br p-7 text-center text-white shadow-elevation-2", banner.cls)}>
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
              <OwlMascot className="mx-auto h-24 w-24 drop-shadow-lg" covering={result.score < 4} />
              <p className="mt-2 font-display text-3xl font-black">{banner.text}</p>
              <p className="font-semibold text-white/85">{banner.sub}</p>
              <p className="mt-3 font-display text-7xl font-black drop-shadow">
                {result.score}
                <span className="text-3xl text-white/70">/{result.total}</span>
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold">
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1"><Clock className="h-4 w-4" /> {mmss(result.durationSeconds)}</span>
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1"><Flame className="h-4 w-4" /> Combo tốt nhất x{result.maxCombo}</span>
                {result.weeklyRank && <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1"><Trophy className="h-4 w-4" /> Hạng {result.weeklyRank} tuần này</span>}
              </div>
            </div>

            {result.tierUp && (
              <div className="mt-4 rounded-3xl bg-gradient-to-r from-amber-100 to-yellow-50 p-5 text-center ring-2 ring-amber-300">
                <p className="text-5xl">{result.tierUp.emoji}</p>
                <p className="mt-1 font-display text-2xl font-black text-amber-700">Lên hạng {result.tierUp.name}!</p>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-elevation-1">
                <p className="font-display text-lg font-black text-slate-800">Điểm xếp hạng +{result.gain}</p>
                <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-600">
                  <li className="flex justify-between"><span>Câu đúng</span><b>+{result.breakdown.correct}</b></li>
                  {result.breakdown.combo > 0 && <li className="flex justify-between"><span>Thưởng combo 🔥</span><b>+{result.breakdown.combo}</b></li>}
                  {result.breakdown.speed > 0 && <li className="flex justify-between"><span>Trả lời nhanh ⚡</span><b>+{result.breakdown.speed}</b></li>}
                  {result.breakdown.perfect > 0 && <li className="flex justify-between"><span>Tuyệt đối 10/10 ⭐</span><b>+{result.breakdown.perfect}</b></li>}
                  {result.breakdown.duel > 0 && <li className="flex justify-between"><span>Thưởng thách đấu ⚔️</span><b>+{result.breakdown.duel}</b></li>}
                </ul>
                <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700">
                  <Gem className="h-5 w-5" />
                  {result.pointsEarned > 0 ? `+${result.pointsEarned} điểm thưởng vào ví` : "Hôm nay đã hết lượt có thưởng"}
                  {result.paidLeft > 0 && <span className="ml-auto text-xs text-sky-500">còn {result.paidLeft} lượt có thưởng</span>}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-elevation-1">
                <p className="font-display text-lg font-black text-slate-800">
                  Hạng {result.tier.emoji} {result.tier.name} · {result.rating} điểm
                </p>
                <div className="mt-3 h-3 overflow-clip rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 transition-all duration-700" style={{ width: `${result.tier.progress}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {result.tier.next ? `Còn ${result.tier.next.need} điểm nữa để lên ${result.tier.next.emoji} ${result.tier.next.name}` : "Em đang ở hạng cao nhất!"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {marks.map((m, i) => (
                    <span key={i} className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white", m ? "bg-emerald-500" : "bg-rose-400")}>{i + 1}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => { setPhase("lobby"); setOv(null); loadOverview(); }} className="rounded-full bg-primary px-8 py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5">
                <RotateCcw className="mr-1 inline h-5 w-5" /> Về sảnh đấu trường
              </button>
            </div>
            </div>

            {/* Cột phải: bảng xếp hạng tuần để thấy ngay mình đứng đâu */}
            <aside className="space-y-5">
              <section className="rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
                <h2 className="flex items-center gap-2 font-display text-xl font-black text-slate-800"><Crown className="h-7 w-7" /> Bảng xếp hạng tuần này</h2>
                <div className="mt-4">
                  <Board data={ov ? { top: ov.weekly.top.slice(0, 5), me: ov.weekly.me } : null} label="trong tuần này" />
                </div>
              </section>
              <section className="rounded-[1.75rem] bg-gradient-to-br from-violet-50 to-sky-50 p-6 shadow-elevation-1">
                <p className="font-display text-lg font-black text-slate-800">Muốn lên hạng nhanh hơn?</p>
                <ul className="mt-2 space-y-1.5 text-sm font-semibold text-slate-600">
                  <li>🔥 Trả lời đúng liên tiếp để có combo (+5 mỗi câu từ combo x3)</li>
                  <li>⚡ Trả lời nhanh, trung bình dưới 8 giây mỗi câu (+10)</li>
                  <li>⚔️ Thách đấu bạn: thắng được thêm +30 điểm</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ====================== SẢNH ======================
  const tier = ov?.tier;
  return (
    <div>
      <div className="page">
        {/* Hero: hạng + tiến độ */}
        <section className="relative overflow-clip rounded-[2.25rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-6 text-white shadow-elevation-2 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-white/15 text-6xl shadow-inner ring-2 ring-white/30">{tier ? tier.emoji : "⚔️"}</div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/70"><Swords className="h-5 w-5" /> Đấu trường {user.grade.name}</p>
              <h1 className="font-display text-4xl font-black sm:text-5xl">{tier ? `Hạng ${tier.name}` : "Đấu trường"}</h1>
              {tier && (
                <div className="mt-3 max-w-md">
                  <div className="h-3.5 overflow-clip rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-400 transition-all duration-700" style={{ width: `${tier.progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-white/85">
                    {ov.rating} điểm · {tier.next ? `còn ${tier.next.need} điểm lên ${tier.next.emoji} ${tier.next.name}` : "hạng cao nhất 🎉"}
                  </p>
                </div>
              )}
            </div>
            {ov && (
              <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
                {[
                  { v: ov.stats.runs, l: "trận đã chơi" },
                  { v: `${ov.stats.best}/${ov.config.questions}`, l: "điểm cao nhất" },
                  { v: `${ov.stats.wins}-${ov.stats.losses}`, l: "thắng – thua" },
                  { v: ov.stats.paidLeft, l: "lượt có thưởng" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
                    <p className="font-display text-2xl font-black">{s.v}</p>
                    <p className="text-xs font-bold text-white/75">{s.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {ov?.lastWeek?.mine?.length > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-50 px-5 py-3 ring-2 ring-amber-200">
            <span className="text-3xl">🏆</span>
            <p className="font-bold text-amber-800">
              Giải đấu tuần trước: em đạt{" "}
              {ov.lastWeek.mine.map((w) => `hạng ${w.rank} (+${w.reward} điểm)`).join(", ")} — phần thưởng đã vào ví!
            </p>
          </div>
        )}

        {/* Chọn môn */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-black text-slate-700">Môn thi đấu:</span>
          {subjects.map((s) => (
            <button key={s._id} type="button" onClick={() => setSubjectId(s._id)} className={cn("pill", subjectId === s._id && "pill-active")}>
              {s.name}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}

        {/* 3 chế độ chơi */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">⚡</span>
            <h2 className="mt-3 font-display text-2xl font-black text-slate-800">Luyện nhanh</h2>
            <p className="mt-1 flex-1 text-slate-500">{ov?.config.questions || 10} câu ngẫu nhiên, mỗi câu {ov?.config.secondsPerQuestion || 20} giây. Trả lời liên tiếp đúng để có combo 🔥 và điểm thưởng.</p>
            <button type="button" onClick={startSolo} disabled={busy || !subjectId} className="mt-4 rounded-full bg-primary px-6 py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5 disabled:opacity-60">
              {busy ? "Đang chuẩn bị..." : "Chơi ngay"}
            </button>
          </div>

          <div className="flex flex-col rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-3xl">⚔️</span>
            <h2 className="mt-3 font-display text-2xl font-black text-slate-800">Thách đấu bạn</h2>
            <p className="mt-1 flex-1 text-slate-500">Em chơi trước, bạn nhận thách đấu chơi đúng bộ câu hỏi đó. Ai đúng nhiều và nhanh hơn thì thắng (+30 điểm).</p>
            {duelOpen ? (
              <div className="mt-3 space-y-2">
                <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold">
                  <option value="">Thách cả lớp (ai nhận trước thì đấu)</option>
                  {(friends || []).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button type="button" onClick={startChallenge} disabled={busy} className="w-full rounded-full bg-violet-600 px-6 py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#5b21b6] transition hover:-translate-y-0.5 disabled:opacity-60">
                  Gửi thách đấu &amp; chơi trước
                </button>
              </div>
            ) : (
              <button type="button" onClick={openDuelPicker} disabled={!subjectId} className="mt-4 rounded-full bg-violet-600 px-6 py-3 font-display text-lg font-black text-white shadow-[0_4px_0_0_#5b21b6] transition hover:-translate-y-0.5">
                Thách đấu
              </button>
            )}
          </div>

          <div className="flex flex-col rounded-[1.75rem] bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-elevation-1 ring-1 ring-amber-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-200 text-3xl">🏆</span>
            <h2 className="mt-3 font-display text-2xl font-black text-slate-800">Giải đấu tuần</h2>
            <p className="mt-1 flex-1 text-slate-600">
              Mọi trận trong tuần đều được tính. Top 3 mỗi môn nhận <b>{(ov?.config.weeklyRewards || [200, 120, 60]).join(" / ")}</b> điểm khi tuần kết thúc.
            </p>
            {ov && (
              <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 font-bold text-amber-800">
                ⏳ Còn {countdownText(ov.weekly.endsAt)} ·{" "}
                {ov.weekly.me ? `em đang hạng ${ov.weekly.me.rank}` : "em chưa có thành tích tuần này"}
              </p>
            )}
          </div>
        </div>

        {/* Thách đấu đang chờ em */}
        {ov?.incoming?.length > 0 && (
          <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-elevation-1 ring-2 ring-violet-200">
            <h2 className="flex items-center gap-2 font-display text-xl font-black text-slate-800"><Swords className="h-7 w-7" /> Thách đấu đang chờ em ({ov.incoming.length})</h2>
            <ul className="mt-3 space-y-2">
              {ov.incoming.map((c) => (
                <li key={c._id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3">
                  <span className="text-2xl">{c.direct ? "🎯" : "📣"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800">
                      {c.creator.name} {c.direct ? "thách đấu riêng em" : "thách cả lớp"} · {c.subject}
                    </p>
                    <p className="text-sm font-semibold text-slate-500">Điểm cần vượt: {c.creatorScore}/{ov.config.questions} trong {mmss(c.creatorSeconds || 0)}</p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => acceptChallenge(c._id)} className="rounded-full bg-violet-600 px-5 py-2 font-display font-black text-white shadow-[0_3px_0_0_#5b21b6] hover:-translate-y-0.5 disabled:opacity-60">
                    Nhận thách đấu
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Bảng xếp hạng */}
          <section className="rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-black text-slate-800"><Crown className="h-7 w-7" /> Bảng xếp hạng {subjectName}</h2>
              <div className="flex rounded-full bg-slate-100 p-1">
                {[{ k: "week", l: "Tuần này" }, { k: "all", l: "Mọi thời đại" }].map((t) => (
                  <button key={t.k} type="button" onClick={() => setTab(t.k)} className={cn("rounded-full px-4 py-1.5 font-bold transition", tab === t.k ? "bg-white text-slate-800 shadow" : "text-slate-500")}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Board data={ov ? (tab === "week" ? ov.weekly : ov.allTime) : null} label={tab === "week" ? "trong tuần này" : "ở môn này"} />
            </div>
          </section>

          {/* Hạng & lịch sử thách đấu */}
          <div className="space-y-5">
            <section className="rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
              <h2 className="flex items-center gap-2 font-display text-xl font-black text-slate-800"><Users className="h-7 w-7" /> Thách đấu của em</h2>
              {!ov ? (
                <Spinner />
              ) : ov.challenges.length === 0 ? (
                <p className="mt-3 text-sm font-semibold text-slate-400">Chưa có trận thách đấu nào. Hãy thách một người bạn!</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {ov.challenges.map((c) => (
                    <li key={c._id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-lg">{c.result === "win" ? "🏆" : c.result === "lose" ? "💪" : c.result === "draw" ? "🤝" : "⏳"}</span>
                      <span className="min-w-0 flex-1 truncate font-bold text-slate-700">vs {c.vs}</span>
                      <span className="font-semibold text-slate-500">{c.status === "done" ? `${c.myScore}–${c.theirScore}` : "chờ bạn"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[1.75rem] bg-white p-6 shadow-elevation-1">
              <h2 className="font-display text-xl font-black text-slate-800">Các hạng</h2>
              <ul className="mt-3 space-y-1.5">
                {(ov?.tiers || []).map((t) => (
                  <li key={t.key} className={cn("flex items-center gap-3 rounded-xl px-3 py-2", ov?.tier.key === t.key ? "bg-primary/10 ring-2 ring-primary/30" : "bg-slate-50")}>
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="flex-1 font-bold text-slate-700">{t.name}</span>
                    <span className="text-sm font-semibold text-slate-400">từ {t.min} điểm</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-slate-400">Điểm xếp hạng = 10/câu đúng + thưởng combo, nhanh, tuyệt đối, thắng thách đấu.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
