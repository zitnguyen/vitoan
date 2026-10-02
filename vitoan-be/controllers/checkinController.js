const CheckIn = require("../models/CheckIn");
const User = require("../models/User");
const { checkInStatus, rewardForStreak, vnDayKey, prevDayKey } = require("../utils/checkin");

// Điểm danh hằng ngày (chép từ ViChess): mỗi ngày 1 lần, thưởng tăng dần theo vòng 7 ngày liên tiếp.
async function status(req, res, next) {
  try {
    res.json({ success: true, data: await checkInStatus(req.user._id) });
  } catch (err) {
    next(err);
  }
}

async function checkIn(req, res, next) {
  try {
    const today = vnDayKey();
    const last = await CheckIn.findOne({ student: req.user._id }).sort({ dayKey: -1 }).lean();
    if (last?.dayKey === today) {
      return res.status(409).json({ success: false, message: "Hôm nay em đã điểm danh rồi, mai quay lại nhé!" });
    }
    const streak = last?.dayKey === prevDayKey(today) ? last.streak + 1 : 1;
    const rewardPoints = rewardForStreak(streak);
    try {
      await CheckIn.create({ student: req.user._id, dayKey: today, streak, rewardPoints });
    } catch (err) {
      // 2 lần bấm cùng lúc: chỉ 1 lần được ghi (index unique student + dayKey)
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Hôm nay em đã điểm danh rồi, mai quay lại nhé!" });
      }
      throw err;
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $inc: { points: rewardPoints } }, { returnDocument: "after" });
    res.json({ success: true, data: { rewardPoints, streak, points: user.points, status: await checkInStatus(req.user._id) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { status, checkIn };
