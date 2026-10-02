const CheckIn = require("../models/CheckIn");

// Thưởng theo vòng 7 ngày: ngày thứ 7 liên tục thưởng lớn, sau đó bắt đầu vòng mới.
const CHECKIN_REWARDS = [5, 5, 10, 10, 15, 15, 30];
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// Ngày theo giờ Việt Nam (UTC+7), dạng "YYYY-MM-DD"
function vnDayKey(date = new Date()) {
  return new Date(new Date(date).getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function prevDayKey(key) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const rewardForStreak = (streak) => CHECKIN_REWARDS[(Math.max(1, streak) - 1) % CHECKIN_REWARDS.length];

async function bestCheckInStreak(studentId) {
  const best = await CheckIn.findOne({ student: studentId }).sort({ streak: -1 }).select("streak").lean();
  return best?.streak || 0;
}

// Trạng thái điểm danh: đã điểm danh hôm nay chưa, chuỗi hiện tại, kỷ lục, thưởng hôm nay
async function checkInStatus(studentId, now = new Date()) {
  const today = vnDayKey(now);
  const [last, bestStreak, total] = await Promise.all([
    CheckIn.findOne({ student: studentId }).sort({ dayKey: -1 }).lean(),
    bestCheckInStreak(studentId),
    CheckIn.countDocuments({ student: studentId }),
  ]);
  const checkedToday = last?.dayKey === today;
  // Chuỗi còn giữ nếu lần cuối là hôm nay hoặc hôm qua
  const streak = checkedToday || last?.dayKey === prevDayKey(today) ? last.streak : 0;
  const todayStreak = checkedToday ? streak : streak + 1; // chuỗi sau khi điểm danh hôm nay
  return {
    today,
    checkedToday,
    streak,
    bestStreak,
    totalDays: total,
    todayReward: checkedToday ? last.rewardPoints : rewardForStreak(todayStreak),
    cycleDay: ((todayStreak - 1) % CHECKIN_REWARDS.length) + 1, // hôm nay là ngày mấy trong vòng 7 ngày
    rewards: CHECKIN_REWARDS,
  };
}

module.exports = { CHECKIN_REWARDS, vnDayKey, prevDayKey, rewardForStreak, bestCheckInStreak, checkInStatus };
