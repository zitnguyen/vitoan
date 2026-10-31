const Notification = require("../models/Notification");
const Mission = require("../models/Mission");
const MissionClaim = require("../models/MissionClaim");
const Attempt = require("../models/Attempt");
const { getPeriodRange, computeMissionProgress } = require("../utils/missionStats");
const { computeStreak } = require("../utils/badgeStats");
const { vnDayKey } = require("../utils/checkin");

const dayStart = (key) => new Date(`${key}T00:00:00Z`).getTime() - 7 * 3600 * 1000;

// Nhắc nhở sinh theo thời điểm (không lưu): giữ chuỗi ngày học, nhiệm vụ đã xong chờ nhận thưởng.
async function liveReminders(user) {
  const out = [];
  const now = new Date();
  const [streak, today] = await Promise.all([
    computeStreak(user._id),
    Attempt.countDocuments({ student: user._id, createdAt: { $gte: new Date(dayStart(vnDayKey())) } }),
  ]);
  if (streak >= 2 && today === 0) {
    out.push({ _id: "live-streak", live: true, icon: "🔥", title: `Giữ chuỗi ${streak} ngày học!`, body: "Hôm nay em chưa học bài nào — làm 1 bài luyện tập để không mất chuỗi nhé.", link: "/" });
  }
  const missions = await Mission.find({ isActive: true }).lean();
  let ready = 0;
  for (const m of missions) {
    const { periodKey } = getPeriodRange(m.type, now);
    const [progress, claim] = await Promise.all([computeMissionProgress(user._id, m, now), MissionClaim.exists({ student: user._id, mission: m._id, periodKey })]);
    if (progress >= m.goalValue && !claim) ready += 1;
  }
  if (ready > 0) out.push({ _id: "live-missions", live: true, icon: "🎁", title: `${ready} nhiệm vụ đã xong — nhận thưởng thôi!`, body: "Bấm để nhận điểm thưởng.", link: "/nhiem-vu" });
  return out;
}

async function list(req, res, next) {
  try {
    const [stored, unreadStored, live] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean(),
      Notification.countDocuments({ user: req.user._id, readAt: { $exists: false } }),
      liveReminders(req.user),
    ]);
    res.json({
      success: true,
      data: {
        items: [...live, ...stored.map((n) => ({ ...n, read: !!n.readAt }))],
        unread: unreadStored + live.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { readAt: new Date() } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
