const Mission = require("../models/Mission");
const MissionClaim = require("../models/MissionClaim");
const User = require("../models/User");
const { getPeriodRange, computeMissionProgress } = require("../utils/missionStats");

async function list(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === "Admin";
    const filter = isAdmin ? {} : { isActive: true };
    const missions = await Mission.find(filter).sort({ type: 1, createdAt: 1 });

    if (!req.user || req.user.role !== "Student") {
      return res.json({ success: true, data: missions.map((m) => ({ ...m.toObject(), progress: 0, claimed: false })) });
    }

    const now = new Date();
    const data = await Promise.all(
      missions.map(async (mission) => {
        const { periodKey } = getPeriodRange(mission.type, now);
        const [progress, claim] = await Promise.all([
          computeMissionProgress(req.user._id, mission, now),
          MissionClaim.findOne({ student: req.user._id, mission: mission._id, periodKey }),
        ]);
        return { ...mission.toObject(), progress, claimed: !!claim, periodKey };
      })
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function claim(req, res, next) {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission || !mission.isActive) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhiệm vụ" });
    }

    const now = new Date();
    const { periodKey } = getPeriodRange(mission.type, now);
    const progress = await computeMissionProgress(req.user._id, mission, now);
    if (progress < mission.goalValue) {
      return res.status(400).json({ success: false, message: "Chưa hoàn thành nhiệm vụ này" });
    }

    try {
      await MissionClaim.create({
        student: req.user._id,
        mission: mission._id,
        periodKey,
        rewardPoints: mission.rewardPoints,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Nhiệm vụ này đã được nhận thưởng rồi" });
      }
      throw err;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { points: mission.rewardPoints } },
      { returnDocument: "after" }
    );

    res.json({ success: true, data: { points: user.points, rewardPoints: mission.rewardPoints } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const mission = await Mission.create(req.body);
    res.status(201).json({ success: true, data: mission });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!mission) return res.status(404).json({ success: false, message: "Không tìm thấy nhiệm vụ" });
    res.json({ success: true, data: mission });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, claim, create, update, remove };
