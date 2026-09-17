// Số liệu dùng để xét điều kiện huy hiệu — tách riêng khỏi attemptController để
// trang "Thành tích" cũng dùng được (hiển thị tiến độ tới huy hiệu chưa đạt).
const Attempt = require("../models/Attempt");

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function computeStreak(studentId) {
  const attempts = await Attempt.find({ student: studentId }).select("createdAt").sort({ createdAt: -1 });
  const days = new Set(attempts.map((a) => dayKey(a.createdAt)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    if (!days.has(dayKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function computeBadgeStats(studentId) {
  const [distinctLessons, perfectCount, streak] = await Promise.all([
    Attempt.distinct("lesson", { student: studentId }),
    Attempt.countDocuments({ student: studentId, $expr: { $eq: ["$score", "$totalQuestions"] } }),
    computeStreak(studentId),
  ]);
  return {
    lessons_completed: distinctLessons.length,
    perfect_score: perfectCount,
    streak,
  };
}

module.exports = { computeStreak, computeBadgeStats };
