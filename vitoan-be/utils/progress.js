const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");

// Điều kiện "đã học xong" một bài học: có ít nhất 1 lượt luyện tập đạt từ
// PASS_PERCENT% số câu đúng trở lên. Làm bài nhưng chưa đạt chỉ tính là "đang học",
// tránh việc bấm nộp bừa cũng được đánh dấu hoàn thành.
const PASS_PERCENT = 80;

function isPassed(score, totalQuestions) {
  return totalQuestions > 0 && (score / totalQuestions) * 100 >= PASS_PERCENT;
}

// Trả về Map lessonId -> { bestPercent, attempts, passed } cho các lesson học sinh đã làm.
async function lessonProgressMap(studentId, lessonIds) {
  const match = { student: new mongoose.Types.ObjectId(String(studentId)) };
  if (lessonIds) match.lesson = { $in: lessonIds.map((id) => new mongoose.Types.ObjectId(String(id))) };
  const rows = await Attempt.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$lesson",
        attempts: { $sum: 1 },
        bestPercent: {
          $max: {
            $cond: [
              { $gt: ["$totalQuestions", 0] },
              { $multiply: [{ $divide: ["$score", "$totalQuestions"] }, 100] },
              0,
            ],
          },
        },
      },
    },
  ]);
  return new Map(
    rows.map((r) => {
      const bestPercent = Math.round(r.bestPercent);
      return [String(r._id), { bestPercent, attempts: r.attempts, passed: r.bestPercent >= PASS_PERCENT }];
    })
  );
}

async function passedLessonIds(studentId) {
  const map = await lessonProgressMap(studentId);
  return [...map.entries()].filter(([, v]) => v.passed).map(([id]) => id);
}

// ===== Tiến độ học 1 bài học (để hiện "em đã học được bao nhiêu") =====
// Mỗi bài gồm tối đa 3 bước; bước nào bài học không có (vd chưa có video) thì bỏ qua
// và chia lại trọng số cho các bước còn lại.
const STEP_WEIGHTS = { video: 30, theory: 20, practice: 50 };
const VIDEO_BUCKET_SECONDS = 10;
const VIDEO_DONE_RATIO = 0.9;

function videoBucketTotal(duration) {
  return duration > 0 ? Math.ceil(duration / VIDEO_BUCKET_SECONDS) : 0;
}

function summarizeLearning({ hasVideo, hasTheory, questionCount, lp, attempt, practice }) {
  const steps = {};
  if (hasVideo) {
    const duration = lp?.videoDuration || 0;
    const total = videoBucketTotal(duration);
    const buckets = lp?.videoBuckets || [];
    // Dữ liệu cũ (trước khi đếm theo đoạn) thì tạm dùng mốc xa nhất.
    const ratio = total && buckets.length ? buckets.length / total : duration ? (lp?.videoSeconds || 0) / duration : 0;
    const done = !!lp?.videoDone;
    steps.video = {
      done,
      percent: done ? 100 : Math.min(99, Math.round(ratio * 100)),
      watchedSeconds: Math.min(duration, buckets.length * VIDEO_BUCKET_SECONDS),
      duration,
      position: lp?.videoPosition || 0,
      buckets,
      bucketSeconds: VIDEO_BUCKET_SECONDS,
    };
  }
  if (hasTheory) {
    const done = !!lp?.theoryDone;
    steps.theory = { done, percent: done ? 100 : 0 };
  }
  if (questionCount > 0) {
    const passed = !!attempt?.passed;
    const best = attempt?.bestPercent ?? null;
    const answered = practice?.answered || 0;
    const total = practice?.total || questionCount;
    const partial = Math.max(best ? (best / PASS_PERCENT) * 100 : 0, total ? (answered / total) * 100 : 0);
    steps.practice = {
      done: passed,
      percent: passed ? 100 : Math.min(99, Math.round(partial)),
      bestPercent: best,
      answered,
      total,
      inProgress: answered > 0,
      attempts: attempt?.attempts || 0,
    };
  }
  const keys = Object.keys(steps);
  const weightSum = keys.reduce((s, k) => s + STEP_WEIGHTS[k], 0);
  const percent = weightSum ? Math.round(keys.reduce((s, k) => s + STEP_WEIGHTS[k] * steps[k].percent, 0) / weightSum) : 0;
  const weights = Object.fromEntries(keys.map((k) => [k, STEP_WEIGHTS[k]]));
  return { percent, steps, weights, completed: !!steps.practice?.done, passPercent: PASS_PERCENT };
}

// Tính tiến độ học cho nhiều bài cùng lúc — Map lessonId -> summarizeLearning(...).
async function learningForLessons(studentId, lessonIds) {
  const ReviewContent = require("../models/ReviewContent");
  const Question = require("../models/Question");
  const LessonProgress = require("../models/LessonProgress");
  const PracticeProgress = require("../models/PracticeProgress");
  const ids = lessonIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const [reviews, qCounts, lps, practices, attempts] = await Promise.all([
    ReviewContent.find({ lesson: { $in: ids } }).select("lesson videoUrl content examples").lean(),
    Question.aggregate([{ $match: { lesson: { $in: ids } } }, { $group: { _id: "$lesson", n: { $sum: 1 } } }]),
    LessonProgress.find({ student: studentId, lesson: { $in: ids } }).lean(),
    PracticeProgress.find({ student: studentId, lesson: { $in: ids } }).select("lesson answers questionOrder").lean(),
    lessonProgressMap(studentId, ids),
  ]);
  const rMap = new Map(reviews.map((r) => [String(r.lesson), r]));
  const qMap = new Map(qCounts.map((q) => [String(q._id), q.n]));
  const lpMap = new Map(lps.map((l) => [String(l.lesson), l]));
  const pMap = new Map();
  for (const p of practices) {
    const key = String(p.lesson);
    const cur = { answered: p.answers.length, total: p.questionOrder.length };
    const prev = pMap.get(key);
    if (!prev || cur.answered / (cur.total || 1) > prev.answered / (prev.total || 1)) pMap.set(key, cur);
  }
  const result = new Map();
  for (const id of lessonIds) {
    const key = String(id);
    const r = rMap.get(key);
    result.set(
      key,
      summarizeLearning({
        hasVideo: !!r?.videoUrl,
        hasTheory: !!(r?.content || r?.examples?.length),
        questionCount: qMap.get(key) || 0,
        lp: lpMap.get(key),
        attempt: attempts.get(key),
        practice: pMap.get(key),
      })
    );
  }
  return result;
}

module.exports = {
  PASS_PERCENT,
  VIDEO_BUCKET_SECONDS,
  VIDEO_DONE_RATIO,
  videoBucketTotal,
  isPassed,
  lessonProgressMap,
  passedLessonIds,
  summarizeLearning,
  learningForLessons,
};
