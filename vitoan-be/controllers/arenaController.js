const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const User = require("../models/User");
const ArenaRun = require("../models/ArenaRun");
const ArenaChallenge = require("../models/ArenaChallenge");
const ArenaSettlement = require("../models/ArenaSettlement");
const { gradeAnswer } = require("../utils/grading");
const { dedupeQuestions } = require("../utils/dedupe");
const { vnDayKey, prevDayKey } = require("../utils/checkin");
const { notify } = require("../utils/notify");

const ARENA_SIZE = 10;
const QUESTION_SECONDS = 20;
const CHOICE_TYPES = ["multiple_choice", "true_false", "listen_choice"];
const CHALLENGE_HOURS = 48;
const DAILY_PAID_RUNS = 5; // chỉ 5 lượt đầu mỗi ngày được quy đổi ra điểm thưởng (chống cày điểm)
const WEEKLY_REWARDS = [200, 120, 60];

// Hạng (league) theo tổng điểm xếp hạng tích luỹ.
const TIERS = [
  { key: "dong", name: "Đồng", min: 0, emoji: "🥉" },
  { key: "bac", name: "Bạc", min: 150, emoji: "🥈" },
  { key: "vang", name: "Vàng", min: 400, emoji: "🥇" },
  { key: "bachkim", name: "Bạch kim", min: 800, emoji: "💠" },
  { key: "kimcuong", name: "Kim cương", min: 1500, emoji: "💎" },
];

function tierInfo(rating) {
  let idx = 0;
  TIERS.forEach((t, i) => {
    if (rating >= t.min) idx = i;
  });
  const cur = TIERS[idx];
  const next = TIERS[idx + 1] || null;
  return {
    ...cur,
    next: next ? { name: next.name, emoji: next.emoji, need: next.min - rating, min: next.min } : null,
    progress: next ? Math.round(((rating - cur.min) / (next.min - cur.min)) * 100) : 100,
  };
}

// ---------- thời gian (giờ Việt Nam) ----------
function weekStartKey(date = new Date()) {
  const key = vnDayKey(date);
  const dow = new Date(`${key}T00:00:00Z`).getUTCDay(); // 0 = CN
  let k = key;
  for (let i = 0; i < (dow + 6) % 7; i++) k = prevDayKey(k);
  return k;
}
const dayStartMs = (key) => new Date(`${key}T00:00:00Z`).getTime() - 7 * 3600 * 1000;
function weekRange(key) {
  return { start: new Date(dayStartMs(key)), end: new Date(dayStartMs(key) + 7 * 86400000) };
}
function prevWeekKey(key) {
  let k = key;
  for (let i = 0; i < 7; i++) k = prevDayKey(k);
  return k;
}

const publicQuestion = (q) => ({ _id: q._id, type: q.type, text: q.text, audioText: q.audioText, imageUrl: q.imageUrl, choices: q.choices });

async function pickQuestions(gradeId, subjectId, n = ARENA_SIZE) {
  const lessons = await Lesson.find({ grade: gradeId, subject: subjectId, isPublished: true }).select("_id");
  const pool = dedupeQuestions(await Question.find({ lesson: { $in: lessons.map((l) => l._id) }, type: { $in: CHOICE_TYPES } }).lean());
  if (pool.length < n) return null;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, n);
}

async function ratingOf(studentId) {
  const rows = await ArenaRun.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(String(studentId)), status: { $ne: "playing" } } },
    { $group: { _id: null, r: { $sum: { $ifNull: ["$rating", { $multiply: ["$score", 10] }] } } } },
  ]);
  return rows[0]?.r || 0;
}

// Bảng xếp hạng theo khoảng thời gian: mỗi bạn lấy lượt tốt nhất (nhiều câu đúng → nhanh hơn).
async function boardFor({ grade, subject, from, to, meId, limit = 10 }) {
  const match = { grade: new mongoose.Types.ObjectId(String(grade)), subject: new mongoose.Types.ObjectId(String(subject)), status: { $ne: "playing" } };
  if (from) match.createdAt = { $gte: from, $lt: to };
  const rows = await ArenaRun.aggregate([
    { $match: match },
    { $sort: { score: -1, durationSeconds: 1 } },
    { $group: { _id: "$student", score: { $first: "$score" }, totalQuestions: { $first: "$totalQuestions" }, durationSeconds: { $first: "$durationSeconds" }, runs: { $sum: 1 } } },
    { $sort: { score: -1, durationSeconds: 1 } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "u" } },
    { $unwind: "$u" },
    { $match: { "u.isTest": { $ne: true } } },
  ]);
  const ranked = rows.map((r, i) => ({
    rank: i + 1,
    student: String(r._id),
    name: r.u.fullName,
    equippedFrame: r.u.equippedFrame || "",
    nameColor: r.u.nameColor || "",
    score: r.score,
    totalQuestions: r.totalQuestions,
    durationSeconds: r.durationSeconds,
    runs: r.runs,
    isMe: String(r._id) === String(meId),
  }));
  const me = ranked.find((r) => r.isMe) || null;
  return { top: ranked.slice(0, limit), me };
}

// Chốt giải đấu tuần trước (đúng một lần): top 3 mỗi môn nhận điểm thưởng.
async function settleLastWeek(grade) {
  const lastKey = prevWeekKey(weekStartKey());
  const existing = await ArenaSettlement.findOne({ weekKey: lastKey }).lean();
  if (existing) return existing;
  const { start, end } = weekRange(lastKey);
  const subjects = await ArenaRun.distinct("subject", { grade, createdAt: { $gte: start, $lt: end }, status: { $ne: "playing" } });
  const winners = [];
  for (const subject of subjects) {
    const { top } = await boardFor({ grade, subject, from: start, to: end, limit: 3 });
    top.forEach((r, i) => winners.push({ student: r.student, subject, rank: i + 1, reward: WEEKLY_REWARDS[i] }));
  }
  try {
    const doc = await ArenaSettlement.create({ weekKey: lastKey, winners });
    for (const w of winners) {
      await User.updateOne({ _id: w.student }, { $inc: { points: w.reward } });
      await notify(w.student, { type: "weekly-prize", icon: "🏆", title: `Giải đấu tuần: em đạt hạng ${w.rank}!`, body: `+${w.reward} điểm thưởng đã vào ví.`, link: "/dau-truong" });
    }
    return doc.toObject();
  } catch (err) {
    if (err.code === 11000) return ArenaSettlement.findOne({ weekKey: lastKey }).lean();
    throw err;
  }
}

// ---------- GET /arena/overview?subject= ----------
async function overview(req, res, next) {
  try {
    if (!req.user.grade) return res.status(400).json({ success: false, message: "Em cần chọn lớp trước" });
    const grade = req.user.grade._id || req.user.grade;
    const subject = req.query.subject;
    const me = req.user._id;
    await settleLastWeek(grade);

    const rating = await ratingOf(me);
    const now = new Date();
    const wk = weekStartKey();
    const { start, end } = weekRange(wk);
    const todayStart = new Date(dayStartMs(vnDayKey()));

    const [weekly, allTime, myRuns, runsToday, incoming, mine, lastSettlement] = await Promise.all([
      subject ? boardFor({ grade, subject, from: start, to: end, meId: me }) : { top: [], me: null },
      subject ? boardFor({ grade, subject, meId: me }) : { top: [], me: null },
      ArenaRun.find({ student: me, status: { $ne: "playing" } }).select("score totalQuestions mode challenge").lean(),
      ArenaRun.countDocuments({ student: me, status: "done", createdAt: { $gte: todayStart } }),
      ArenaChallenge.find({ grade, status: "open", expiresAt: { $gt: now }, creator: { $ne: me }, $or: [{ opponent: me }, { opponent: { $exists: false } }, { opponent: null }] })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("creator", "fullName equippedFrame nameColor")
        .populate("creatorRun", "score durationSeconds")
        .populate("subject", "name")
        .lean(),
      ArenaChallenge.find({ $or: [{ creator: me }, { opponent: me }], status: { $ne: "waiting" } })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate("creator", "fullName")
        .populate("opponent", "fullName")
        .populate("creatorRun", "score durationSeconds")
        .populate("opponentRun", "score durationSeconds")
        .populate("subject", "name")
        .lean(),
      ArenaSettlement.findOne({ weekKey: prevWeekKey(wk) }).lean(),
    ]);

    const duels = mine.filter((c) => c.status === "done");
    const wins = duels.filter((c) => String(c.winner) === String(me)).length;
    const draws = duels.filter((c) => c.draw).length;
    const best = myRuns.reduce((m, r) => Math.max(m, r.score), 0);

    res.json({
      success: true,
      data: {
        config: { questions: ARENA_SIZE, secondsPerQuestion: QUESTION_SECONDS, dailyPaidRuns: DAILY_PAID_RUNS, weeklyRewards: WEEKLY_REWARDS },
        rating,
        tier: tierInfo(rating),
        tiers: TIERS,
        stats: { runs: myRuns.length, best, wins, losses: duels.length - wins - draws, draws, runsToday, paidLeft: Math.max(0, DAILY_PAID_RUNS - runsToday) },
        weekly: { weekKey: wk, endsAt: end, ...weekly },
        allTime,
        incoming: incoming.map((c) => ({
          _id: c._id,
          creator: { id: String(c.creator._id), name: c.creator.fullName },
          direct: !!c.opponent,
          subject: c.subject?.name,
          creatorScore: c.creatorRun?.score ?? null,
          creatorSeconds: c.creatorRun?.durationSeconds ?? null,
          expiresAt: c.expiresAt,
        })),
        challenges: mine.map((c) => {
          const iAmCreator = String(c.creator._id) === String(me);
          const myRun = iAmCreator ? c.creatorRun : c.opponentRun;
          const theirRun = iAmCreator ? c.opponentRun : c.creatorRun;
          return {
            _id: c._id,
            subject: c.subject?.name,
            vs: iAmCreator ? c.opponent?.fullName || "Cả lớp" : c.creator.fullName,
            status: c.status,
            result: c.status !== "done" ? null : c.draw ? "draw" : String(c.winner) === String(me) ? "win" : "lose",
            myScore: myRun?.score ?? null,
            theirScore: theirRun?.score ?? null,
          };
        }),
        lastWeek: lastSettlement
          ? { weekKey: lastSettlement.weekKey, mine: lastSettlement.winners.filter((w) => String(w.student) === String(me)), total: lastSettlement.winners.length }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------- GET /arena/classmates ----------
async function classmates(req, res, next) {
  try {
    const grade = req.user.grade?._id || req.user.grade;
    const users = await User.find({ role: "Student", grade, isActive: true, _id: { $ne: req.user._id }, isTest: { $ne: true } })
      .select("fullName")
      .sort({ fullName: 1 })
      .limit(60)
      .lean();
    res.json({ success: true, data: users.map((u) => ({ id: String(u._id), name: u.fullName })) });
  } catch (err) {
    next(err);
  }
}

const startPayload = (run, qs) => ({
  runId: run._id,
  total: run.questions.length,
  secondsPerQuestion: QUESTION_SECONDS,
  questions: run.questions.map((id) => publicQuestion(qs.find((q) => String(q._id) === String(id)))),
});

// ---------- POST /arena/runs  { subject } hoặc { challengeId } ----------
async function startRun(req, res, next) {
  try {
    if (!req.user.grade) return res.status(400).json({ success: false, message: "Em cần chọn lớp trước" });
    const grade = req.user.grade._id || req.user.grade;
    const me = req.user._id;
    let { subject } = req.body;
    const { challengeId } = req.body;
    let questionIds;
    let challenge = null;
    let mode = "solo";

    if (challengeId) {
      challenge = await ArenaChallenge.findById(challengeId);
      const mineOnly = challenge && challenge.opponent && String(challenge.opponent) === String(me);
      const openToAll = challenge && !challenge.opponent;
      if (!challenge || challenge.status !== "open" || challenge.expiresAt < new Date() || String(challenge.creator) === String(me) || !(mineOnly || openToAll)) {
        return res.status(400).json({ success: false, message: "Thách đấu này không còn nhận được nữa" });
      }
      subject = challenge.subject;
      questionIds = challenge.questions;
      mode = "duel";
      challenge.opponent = me;
      challenge.status = "accepted";
      await challenge.save();
    } else {
      if (!subject) return res.status(400).json({ success: false, message: "Chọn môn để thi đấu" });
      const picked = await pickQuestions(grade, subject);
      if (!picked) return res.status(400).json({ success: false, message: "Môn này chưa đủ câu hỏi để thi đấu" });
      questionIds = picked.map((q) => q._id);
    }

    const run = await ArenaRun.create({ student: me, grade, subject, mode, status: "playing", challenge: challenge?._id, questions: questionIds, totalQuestions: questionIds.length });
    const qs = await Question.find({ _id: { $in: questionIds } }).lean();
    res.status(201).json({ success: true, data: startPayload(run, qs) });
  } catch (err) {
    next(err);
  }
}

// ---------- POST /arena/challenges  { subject, opponent? } — người thách chơi trước ----------
async function createChallenge(req, res, next) {
  try {
    if (!req.user.grade) return res.status(400).json({ success: false, message: "Em cần chọn lớp trước" });
    const grade = req.user.grade._id || req.user.grade;
    const me = req.user._id;
    const { subject, opponent } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: "Chọn môn để thách đấu" });
    if (opponent) {
      const friend = await User.findOne({ _id: opponent, role: "Student", grade, isActive: true }).select("_id");
      if (!friend || String(friend._id) === String(me)) return res.status(400).json({ success: false, message: "Không tìm thấy bạn này trong lớp" });
    }
    const active = await ArenaChallenge.countDocuments({ creator: me, status: { $in: ["waiting", "open", "accepted"] }, expiresAt: { $gt: new Date() } });
    if (active >= 3) return res.status(400).json({ success: false, message: "Em đang có 3 thách đấu chưa xong, đợi các bạn nhận rồi thách tiếp nhé" });
    const picked = await pickQuestions(grade, subject);
    if (!picked) return res.status(400).json({ success: false, message: "Môn này chưa đủ câu hỏi để thi đấu" });
    const questionIds = picked.map((q) => q._id);
    const challenge = await ArenaChallenge.create({
      creator: me,
      opponent: opponent || undefined,
      grade,
      subject,
      questions: questionIds,
      expiresAt: new Date(Date.now() + CHALLENGE_HOURS * 3600 * 1000),
    });
    const run = await ArenaRun.create({ student: me, grade, subject, mode: "duel", status: "playing", challenge: challenge._id, questions: questionIds, totalQuestions: questionIds.length });
    const qs = await Question.find({ _id: { $in: questionIds } }).lean();
    res.status(201).json({ success: true, data: { ...startPayload(run, qs), challengeId: challenge._id } });
  } catch (err) {
    next(err);
  }
}

async function loadRun(req, res) {
  const run = await ArenaRun.findOne({ _id: req.params.id, student: req.user._id });
  if (!run || run.status !== "playing") {
    res.status(404).json({ success: false, message: "Lượt thi này không còn nữa" });
    return null;
  }
  return run;
}

// ---------- POST /arena/runs/:id/answer { question, selectedIndex, ms } ----------
async function answer(req, res, next) {
  try {
    const run = await loadRun(req, res);
    if (!run) return;
    const { question, selectedIndex } = req.body;
    const ms = Math.max(0, Math.min(Number(req.body.ms) || 0, (QUESTION_SECONDS + 3) * 1000));
    if (!run.questions.some((id) => String(id) === String(question))) return res.status(400).json({ success: false, message: "Câu hỏi không thuộc lượt thi này" });
    if (run.answers.some((a) => String(a.question) === String(question))) return res.status(409).json({ success: false, message: "Câu này đã trả lời rồi" });
    const q = await Question.findById(question).lean();
    const idx = Number.isInteger(selectedIndex) ? selectedIndex : -1;
    const correct = idx >= 0 && gradeAnswer(q, { selectedIndex: idx });
    run.answers.push({ question, selectedIndex: idx, correct, ms });
    await run.save();
    // combo hiện tại = số câu đúng liên tiếp tính đến câu này
    let combo = 0;
    for (const a of run.answers) combo = a.correct ? combo + 1 : 0;
    res.json({ success: true, data: { correct, correctIndex: q.correctIndex, explanation: q.explanation || "", combo, score: run.answers.filter((a) => a.correct).length, answered: run.answers.length } });
  } catch (err) {
    next(err);
  }
}

// ---------- POST /arena/runs/:id/fifty { question } — quyền trợ giúp 50:50, 1 lần/lượt ----------
async function fifty(req, res, next) {
  try {
    const run = await loadRun(req, res);
    if (!run) return;
    if (run.lifelineUsed) return res.status(400).json({ success: false, message: "Em đã dùng quyền trợ giúp 50:50 rồi" });
    const { question } = req.body;
    if (!run.questions.some((id) => String(id) === String(question)) || run.answers.some((a) => String(a.question) === String(question))) {
      return res.status(400).json({ success: false, message: "Không dùng được cho câu này" });
    }
    const q = await Question.findById(question).lean();
    const wrong = q.choices.map((_, i) => i).filter((i) => i !== q.correctIndex);
    if (wrong.length < 3) return res.status(400).json({ success: false, message: "Câu này quá ít đáp án để dùng 50:50" });
    const hide = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    run.lifelineUsed = true;
    await run.save();
    res.json({ success: true, data: { hide } });
  } catch (err) {
    next(err);
  }
}

// ---------- POST /arena/runs/:id/finish ----------
async function finish(req, res, next) {
  try {
    const run = await loadRun(req, res);
    if (!run) return;
    // câu chưa trả lời tính là sai
    for (const id of run.questions) {
      if (!run.answers.some((a) => String(a.question) === String(id))) run.answers.push({ question: id, selectedIndex: -1, correct: false, ms: QUESTION_SECONDS * 1000 });
    }
    const correctAnswers = run.answers.filter((a) => a.correct);
    let combo = 0;
    let maxCombo = 0;
    let comboBonus = 0;
    for (const a of run.answers) {
      combo = a.correct ? combo + 1 : 0;
      maxCombo = Math.max(maxCombo, combo);
      if (a.correct && combo >= 3) comboBonus += 5;
    }
    const score = correctAnswers.length;
    const totalMs = run.answers.reduce((s, a) => s + a.ms, 0);
    const avgCorrectMs = correctAnswers.length ? correctAnswers.reduce((s, a) => s + a.ms, 0) / correctAnswers.length : Infinity;
    const speedBonus = avgCorrectMs < 8000 ? 10 : 0;
    const perfectBonus = score === run.totalQuestions ? 20 : 0;
    const durationSeconds = Math.round(totalMs / 1000);

    let duel = null;
    let duelBonus = 0;
    if (run.mode === "duel" && run.challenge) {
      const ch = await ArenaChallenge.findById(run.challenge);
      if (ch) {
        const isCreator = String(ch.creator) === String(run.student);
        if (isCreator) {
          ch.creatorRun = run._id;
          ch.status = "open";
          await ch.save();
          duel = { role: "creator", status: "waiting-for-friend" };
          if (ch.opponent) {
            const me = await User.findById(run.student).select("fullName").lean();
            await notify(ch.opponent, { type: "challenge", icon: "⚔️", title: `${me?.fullName || "Một bạn"} thách đấu em!`, body: `Điểm cần vượt: ${score}/${run.totalQuestions}. Nhận thách đấu trong 48 giờ nhé.`, link: "/dau-truong" });
          }
        } else {
          const first = await ArenaRun.findById(ch.creatorRun).lean();
          const b = { score: first?.score ?? 0, sec: first?.durationSeconds ?? 0 };
          const draw = score === b.score && durationSeconds === b.sec;
          const iWin = score > b.score || (score === b.score && durationSeconds < b.sec);
          ch.opponentRun = run._id;
          ch.status = "done";
          ch.draw = draw;
          ch.winner = draw ? undefined : iWin ? run.student : ch.creator;
          await ch.save();
          duelBonus = draw ? 10 : iWin ? 30 : 5;
          duel = { role: "opponent", result: draw ? "draw" : iWin ? "win" : "lose", theirScore: b.score, theirSeconds: b.sec };
          // người thách cũng nhận thưởng thắng/hoà/thua khi trận có kết quả
          await ArenaRun.updateOne({ _id: ch.creatorRun }, { $inc: { rating: draw ? 10 : iWin ? 5 : 30 } });
          const opp = await User.findById(run.student).select("fullName").lean();
          await notify(ch.creator, {
            type: "challenge-result",
            icon: draw ? "🤝" : iWin ? "💪" : "🏆",
            title: draw ? `Hoà với ${opp?.fullName || "bạn"}` : iWin ? `${opp?.fullName || "Bạn"} đã thắng trận thách đấu` : `Em đã THẮNG ${opp?.fullName || "bạn"}!`,
            body: `Tỉ số ${first?.score ?? 0} – ${score} câu đúng.`,
            link: "/dau-truong",
          });
        }
      }
    }

    const gain = score * 10 + comboBonus + speedBonus + perfectBonus + duelBonus;
    const before = await ratingOf(run.student);
    run.status = "done";
    run.score = score;
    run.durationSeconds = durationSeconds;
    run.maxCombo = maxCombo;
    run.rating = gain;
    run.finishedAt = new Date();
    await run.save();
    const after = before + gain;

    // quy đổi ra điểm thưởng (5 lượt đầu mỗi ngày)
    const todayStart = new Date(dayStartMs(vnDayKey()));
    const doneToday = await ArenaRun.countDocuments({ student: run.student, status: "done", createdAt: { $gte: todayStart } });
    let pointsEarned = 0;
    if (doneToday <= DAILY_PAID_RUNS) {
      pointsEarned = Math.round(gain / 4);
      if (pointsEarned > 0) await User.updateOne({ _id: run.student }, { $inc: { points: pointsEarned } });
    }

    // hạng trong tuần
    const { start, end } = weekRange(weekStartKey());
    const weekly = await boardFor({ grade: run.grade, subject: run.subject, from: start, to: end, meId: run.student, limit: 3 });
    const tierBefore = tierInfo(before);
    const tierAfter = tierInfo(after);

    res.json({
      success: true,
      data: {
        score,
        total: run.totalQuestions,
        durationSeconds,
        maxCombo,
        gain,
        breakdown: { correct: score * 10, combo: comboBonus, speed: speedBonus, perfect: perfectBonus, duel: duelBonus },
        pointsEarned,
        paidLeft: Math.max(0, DAILY_PAID_RUNS - doneToday),
        rating: after,
        tier: tierAfter,
        tierUp: tierAfter.key !== tierBefore.key ? tierAfter : null,
        weeklyRank: weekly.me?.rank || null,
        duel,
        review: run.answers.map((a) => ({ question: a.question, correct: a.correct })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview, classmates, startRun, createChallenge, answer, fifty, finish };
