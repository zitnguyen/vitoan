const Reward = require("../models/Reward");
const RewardRedemption = require("../models/RewardRedemption");
const User = require("../models/User");

// Đồ trang trí chỉ cần đổi 1 lần là sở hữu vĩnh viễn; VIP thì đổi thêm để cộng dồn thời hạn.
const COSMETIC_TYPES = ["frame", "avatar", "title", "name_color"];

function avatarFromStyle(style, user) {
  const seed = encodeURIComponent(user.username || String(user._id));
  return `https://api.dicebear.com/9.x/${encodeURIComponent(style)}/svg?seed=${seed}`;
}

function publicCosmetics(user) {
  return {
    points: user.points || 0,
    avatarUrl: user.avatarUrl || "",
    equippedFrame: user.equippedFrame || "",
    equippedTitle: user.equippedTitle || "",
    nameColor: user.nameColor || "",
    vipUntil: user.vipUntil || null,
  };
}

// Áp dụng 1 món đồ lên tài khoản (trang bị). Trả về false nếu loại quà không áp dụng được.
function applyReward(user, reward) {
  if (reward.type === "frame") user.equippedFrame = reward.value;
  else if (reward.type === "title") user.equippedTitle = reward.value;
  else if (reward.type === "name_color") user.nameColor = reward.value;
  else if (reward.type === "avatar") user.avatarUrl = avatarFromStyle(reward.value, user);
  else return false;
  return true;
}

async function ownedRewardIds(studentId) {
  return new Set((await RewardRedemption.distinct("reward", { student: studentId })).map(String));
}

async function list(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === "Admin";
    const filter = isAdmin ? {} : { isActive: true };
    const rewards = await Reward.find(filter).sort({ type: 1, costPoints: 1 });
    let owned = new Set();
    if (req.user && !isAdmin) owned = await ownedRewardIds(req.user._id);
    res.json({
      success: true,
      data: rewards.map((r) => ({ ...r.toObject(), owned: COSMETIC_TYPES.includes(r.type) && owned.has(String(r._id)) })),
    });
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

// Tủ đồ: các món trang trí em đã sở hữu + món đang dùng.
async function inventory(req, res, next) {
  try {
    const owned = await ownedRewardIds(req.user._id);
    const items = await Reward.find({ _id: { $in: [...owned] }, type: { $in: COSMETIC_TYPES } }).sort({ costPoints: 1 });
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { items, ...publicCosmetics(user) } });
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
    if (COSMETIC_TYPES.includes(reward.type)) {
      const already = await RewardRedemption.exists({ student: req.user._id, reward: reward._id });
      if (already) return res.status(400).json({ success: false, message: "Em đã có món này rồi, vào Tủ đồ để dùng nhé!" });
    }

    // Trừ điểm nguyên tử để tránh bấm đổi 2 lần cùng lúc làm âm điểm.
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, points: { $gte: reward.costPoints } },
      { $inc: { points: -reward.costPoints } },
      { returnDocument: "after" }
    );
    if (!user) {
      return res.status(400).json({ success: false, message: "Em chưa đủ điểm để đổi phần quà này" });
    }
    if (reward.stock > 0) {
      reward.stock -= 1;
      await reward.save();
    }
    const redemption = await RewardRedemption.create({
      student: req.user._id,
      reward: reward._id,
      pointsSpent: reward.costPoints,
    });

    // Đổi xong là dùng luôn cho bé thấy ngay; VIP thì cộng dồn thời hạn.
    if (reward.type === "vip") {
      const base = user.vipUntil && user.vipUntil > new Date() ? user.vipUntil : new Date();
      user.vipUntil = new Date(base.getTime() + (reward.durationDays || 7) * 24 * 60 * 60 * 1000);
    } else {
      applyReward(user, reward);
    }
    await user.save();

    res.status(201).json({ success: true, data: { redemption, ...publicCosmetics(user) } });
  } catch (err) {
    next(err);
  }
}

// Trang bị / bỏ trang bị 1 loại đồ. rewardId rỗng = bỏ (về mặc định).
async function equip(req, res, next) {
  try {
    const { type, rewardId } = req.body;
    if (!COSMETIC_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Loại đồ không hợp lệ" });
    }
    const user = await User.findById(req.user._id);
    if (!rewardId) {
      if (type === "frame") user.equippedFrame = "";
      else if (type === "title") user.equippedTitle = "";
      else if (type === "name_color") user.nameColor = "";
      else if (type === "avatar") user.avatarUrl = undefined;
    } else {
      const reward = await Reward.findById(rewardId);
      if (!reward || reward.type !== type) {
        return res.status(404).json({ success: false, message: "Không tìm thấy món đồ" });
      }
      const owned = await RewardRedemption.exists({ student: req.user._id, reward: reward._id });
      if (!owned) return res.status(403).json({ success: false, message: "Em chưa sở hữu món này" });
      applyReward(user, reward);
    }
    await user.save();
    res.json({ success: true, data: publicCosmetics(user) });
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

module.exports = { list, myRedemptions, inventory, redeem, equip, create, update, remove };
