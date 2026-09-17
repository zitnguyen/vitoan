const Badge = require("../models/Badge");
const StudentBadge = require("../models/StudentBadge");
const { computeBadgeStats } = require("../utils/badgeStats");

async function progress(req, res, next) {
  try {
    const stats = await computeBadgeStats(req.user._id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (!req.user || req.user.role !== "Admin") filter.isActive = true;
    const badges = await Badge.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: badges });
  } catch (err) {
    next(err);
  }
}

async function myBadges(req, res, next) {
  try {
    const earned = await StudentBadge.find({ student: req.user._id })
      .populate("badge")
      .sort({ achievedAt: -1 });
    res.json({ success: true, data: earned });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const badge = await Badge.create(req.body);
    res.status(201).json({ success: true, data: badge });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!badge) return res.status(404).json({ success: false, message: "Không tìm thấy huy hiệu" });
    res.json({ success: true, data: badge });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Badge.findByIdAndDelete(req.params.id);
    await StudentBadge.deleteMany({ badge: req.params.id });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

async function award(req, res, next) {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "Thiếu mã học sinh" });
    }
    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ success: false, message: "Không tìm thấy huy hiệu" });

    const existing = await StudentBadge.findOne({ student: studentId, badge: badge._id });
    if (existing) {
      return res.status(409).json({ success: false, message: "Học sinh đã có huy hiệu này" });
    }
    const record = await StudentBadge.create({ student: studentId, badge: badge._id });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, myBadges, progress, create, update, remove, award };
