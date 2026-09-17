// Tính tiến độ nhiệm vụ theo kỳ (ngày/tuần) từ dữ liệu Attempt thật, không lưu
// tiến độ riêng — tránh lệch dữ liệu khi học sinh làm bài rồi tiến độ không cập
// nhật kịp. periodKey dùng để chống nhận thưởng 2 lần trong cùng 1 kỳ.
const Attempt = require("../models/Attempt");

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Thứ Hai
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function getPeriodRange(type, now = new Date()) {
  if (type === "weekly") {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end, periodKey: dayKey(start) };
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, periodKey: dayKey(start) };
}

async function computeMissionProgress(studentId, mission, now = new Date()) {
  const { start, end } = getPeriodRange(mission.type, now);
  const query = { student: studentId, createdAt: { $gte: start, $lt: end } };

  if (mission.goalType === "perfect_score") {
    return Attempt.countDocuments({ ...query, $expr: { $eq: ["$score", "$totalQuestions"] } });
  }
  if (mission.goalType === "lessons_completed") {
    const ids = await Attempt.distinct("lesson", query);
    return ids.length;
  }
  return Attempt.countDocuments(query);
}

module.exports = { getPeriodRange, computeMissionProgress };
