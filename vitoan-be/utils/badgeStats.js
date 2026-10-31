// Số liệu dùng để xét điều kiện huy hiệu — tách riêng khỏi attemptController để
// trang "Thành tích" cũng dùng được (hiển thị tiến độ tới huy hiệu chưa đạt).
const Attempt = require("../models/Attempt");
const CheckIn = require("../models/CheckIn");
const { passedLessonIds } = require("./progress");
const { vnDayKey, prevDayKey } = require("./checkin");

// Ngày theo giờ Việt Nam (không phải UTC) để chuỗi ngày học khớp với ngày thật của bé.
const dayKey = (date) => vnDayKey(date);

// Chuỗi ngày học liên tiếp. Hôm nay chưa học thì chuỗi vẫn còn nếu hôm qua có học
// (bé còn cả ngày để giữ lửa) — chỉ về 0 khi bỏ lỡ trọn một ngày.
// Một ngày tính là "có học" nếu bé làm bài luyện tập HOẶC điểm danh — để mọi nơi hiển thị cùng một con số.
async function computeStreak(studentId) {
  const [attempts, checkIns] = await Promise.all([
    Attempt.find({ student: studentId }).select("createdAt").lean(),
    CheckIn.find({ student: studentId }).select("dayKey").lean(),
  ]);
  const days = new Set([...attempts.map((a) => dayKey(a.createdAt)), ...checkIns.map((c) => c.dayKey)]);
  let key = dayKey(new Date());
  if (!days.has(key)) key = prevDayKey(key);
  let streak = 0;
  while (days.has(key)) {
    streak += 1;
    key = prevDayKey(key);
  }
  return streak;
}

async function computeBadgeStats(studentId) {
  const [distinctLessons, perfectCount, streak] = await Promise.all([
    // "Hoàn thành" bài học = đạt điều kiện (>= PASS_PERCENT), không chỉ là đã làm bài.
    passedLessonIds(studentId),
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
