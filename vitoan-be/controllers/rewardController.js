const Reward = require("../models/Reward");
const RewardRedemption = require("../models/RewardRedemption");
const User = require("../models/User");

async function list(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === "Admin";
    const filter = isAdmin ? {} : { isActive: true };
    const rewards = await Reward.find(filter).sort({ costPoints: 1 });
    res.json({ success: true, data: rewards });
  } catch (err) {
    next(err);
  }
}

async function myRedemptions(req, res, next) {
  try {
    const redemptions = await RewardRedemption.find({ student: req.user._id })
      .populate("reward")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: redemptions });
  } catch (err) {
    next(err);
  }
}

async function redeem(req, res, next) {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward || !reward.isActive) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phần quà" });
    }
    if (reward.stock === 0) {
      return res.status(400).json({ success: false, message: "Phần quà này đã hết" });
    }

    const user = await User.findById(req.user._id);
    if (user.points < reward.costPoints) {
      return res.status(400).json({ success: false, message: "Em chưa đủ điểm để đổi phần quà này" });
    }

    user.points -= reward.costPoints;
    await user.save();
    if (reward.stock > 0) {
      reward.stock -= 1;
      await reward.save();
    }
    const redemption = await RewardRedemption.create({
      student: req.user._id,
      reward: reward._id,
      pointsSpent: reward.costPoints,
    });

    res.status(201).json({ success: true, data: { redemption, points: user.points } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const reward = await Reward.create(req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!reward) return res.status(404).json({ success: false, message: "Không tìm thấy phần quà" });
    res.json({ success: true, data: reward });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Reward.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, myRedemptions, redeem, create, update, remove };
