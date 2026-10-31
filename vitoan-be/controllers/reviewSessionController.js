const Question = require("../models/Question");
const ReviewLog = require("../models/ReviewLog");
const User = require("../models/User");
const { gradeAnswer } = require("../utils/grading");
const { reviewQueue, MASTER_STREAK } = require("../utils/reviewQueue");
const Lesson = require("../models/Lesson");
const { vnDayKey } = require("../utils/checkin");

const SESSION_SIZE = 10;
const POINTS_PER_CORRECT = 2;
const DAILY_PAID = 10;
const dayStart = (key) => new Date(`${key}T00:00:00Z`).getTime() - 7 * 3600 * 1000;

const pub = (q) => ({ _id: q._id, type: q.type, text: q.text, audioText: q.audioText, imageUrl: q.imageUrl, choices: q.choices });

// GET /practice-review/summary — có bao nhiêu câu cần ôn (hiện ở trang chủ / thống kê)
async function summary(req, res, next) {
  try {
    const due = await reviewQueue(req.user._id);
    // Gom câu cần ôn theo bài học để em thấy mình yếu phần nào
    const qs = await Question.find({ _id: { $in: due.map((d) => d.question) } }).select("lesson").lean();
    const lessonOf = new Map(qs.filter((q) => q.lesson).map((q) => [String(q._id), String(q.lesson)]));
    const tally = new Map();
    for (const d of due) {
      const l = lessonOf.get(String(d.question));
      if (l) tally.set(l, (tally.get(l) || 0) + 1);
    }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const lessons = await Lesson.find({ _id: { $in: top.map(([id]) => id) } }).select("title").lean();
    const titleOf = new Map(lessons.map((l) => [String(l._id), l.title]));
    res.json({
      success: true,
      data: {
        due: due.length,
        sessionSize: SESSION_SIZE,
        byLesson: top.map(([id, count]) => ({ lesson: id, title: titleOf.get(id) || "", count })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /practice-review/session — 10 câu cần ôn nhất
async function session(req, res, next) {
  try {
    const due = await reviewQueue(req.user._id);
    const ids = due.slice(0, SESSION_SIZE).map((d) => d.question);
    const found = await Question.find({ _id: { $in: ids } }).lean();
    const byId = new Map(found.map((q) => [String(q._id), q]));
    const questions = ids.map((id) => byId.get(String(id))).filter(Boolean).map(pub);
    res.json({ success: true, data: { questions, totalDue: due.length } });
  } catch (err) {
    next(err);
  }
}

// POST /practice-review/answer { question, selectedIndex | textAnswer }
async function answer(req, res, next) {
  try {
    const q = await Question.findById(req.body.question);
    if (!q) return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });
    const correct = gradeAnswer(q, req.body);
    const todayStart = new Date(dayStart(vnDayKey()));
    const paidToday = await ReviewLog.countDocuments({ student: req.user._id, paid: true, createdAt: { $gte: todayStart } });
    const paid = correct && paidToday < DAILY_PAID;
    await ReviewLog.create({ student: req.user._id, question: q._id, correct, paid });
    if (paid) await User.updateOne({ _id: req.user._id }, { $inc: { points: POINTS_PER_CORRECT } });
    // câu này đã nhớ chưa (sau lượt vừa rồi)?
    const due = await reviewQueue(req.user._id);
    const stillDue = due.find((d) => String(d.question) === String(q._id));
    res.json({
      success: true,
      data: {
        correct,
        correctIndex: q.correctIndex,
        correctText: q.correctText,
        explanation: q.explanation || "",
        mastered: correct && !stillDue,
        needMore: correct && stillDue ? MASTER_STREAK - stillDue.correctAfter : 0,
        pointsEarned: paid ? POINTS_PER_CORRECT : 0,
        totalDue: due.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, session, answer };
