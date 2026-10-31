const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Comment = require("../models/Comment");
const Reward = require("../models/Reward");
const RewardRedemption = require("../models/RewardRedemption");
const Notification = require("../models/Notification");
const Broadcast = require("../models/Broadcast");
const User = require("../models/User");
const ArenaChallenge = require("../models/ArenaChallenge");
const ArenaRun = require("../models/ArenaRun");

const PAGE = 20;
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- Lớp & Môn ----------
async function catalog(req, res, next) {
  try {
    const [grades, subjects, chByGrade, chBySubject, lessonByGrade, students] = await Promise.all([
      Grade.find().sort({ order: 1 }).lean(),
      Subject.find().sort({ name: 1 }).lean(),
      Chapter.aggregate([{ $group: { _id: "$grade", n: { $sum: 1 } } }]),
      Chapter.aggregate([{ $group: { _id: "$subject", n: { $sum: 1 } } }]),
      Lesson.aggregate([
        { $lookup: { from: "chapters", localField: "chapter", foreignField: "_id", as: "c" } },
        { $unwind: "$c" },
        { $group: { _id: "$c.grade", n: { $sum: 1 } } },
      ]),
      User.aggregate([{ $match: { role: "Student" } }, { $group: { _id: "$grade", n: { $sum: 1 } } }]),
    ]);
    const m = (arr) => new Map(arr.map((x) => [String(x._id), x.n]));
    const cg = m(chByGrade);
    const cs = m(chBySubject);
    const lg = m(lessonByGrade);
    const st = m(students);
    res.json({
      success: true,
      data: {
        grades: grades.map((g) => ({ ...g, chapters: cg.get(String(g._id)) || 0, lessons: lg.get(String(g._id)) || 0, students: st.get(String(g._id)) || 0 })),
        subjects: subjects.map((s) => ({ ...s, chapters: cs.get(String(s._id)) || 0 })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Bình luận ----------
async function listComments(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = {};
    if (req.query.q) {
      const re = new RegExp(escapeRe(req.query.q.trim()), "i");
      const users = await User.find({ $or: [{ fullName: re }, { username: re }] }).select("_id").limit(200).lean();
      filter.$or = [{ text: re }, { user: { $in: users.map((u) => u._id) } }];
    }
    const [items, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE)
        .limit(PAGE)
        .populate("user", "fullName username avatarUrl")
        .populate("lesson", "title")
        .lean(),
      Comment.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((c) => ({ ...c, likeCount: (c.likes || []).length, likes: undefined })),
      total,
      pages: Math.max(1, Math.ceil(total / PAGE)),
    });
  } catch (err) {
    next(err);
  }
}

async function bulkDeleteComments(req, res, next) {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const r = await Comment.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, data: { deleted: r.deletedCount } });
  } catch (err) {
    next(err);
  }
}

// ---------- Đơn đổi quà ----------
async function listRedemptions(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.kind === "physical") {
      filter.reward = { $in: await Reward.find({ type: "other" }).distinct("_id") };
    }
    if (req.query.q) {
      const re = new RegExp(escapeRe(req.query.q.trim()), "i");
      const users = await User.find({ $or: [{ fullName: re }, { username: re }] }).select("_id").limit(200).lean();
      filter.student = { $in: users.map((u) => u._id) };
    }
    const [items, total, pending] = await Promise.all([
      RewardRedemption.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE)
        .limit(PAGE)
        .populate("student", "fullName username")
        .populate("reward", "name type icon")
        .lean(),
      RewardRedemption.countDocuments(filter),
      RewardRedemption.countDocuments({ status: "pending" }),
    ]);
    res.json({ success: true, data: items, total, pending, pages: Math.max(1, Math.ceil(total / PAGE)) });
  } catch (err) {
    next(err);
  }
}

async function updateRedemption(req, res, next) {
  try {
    const { status, note } = req.body;
    const patch = {};
    if (status !== undefined) {
      if (!["pending", "done", "cancelled"].includes(status)) return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
      patch.status = status;
    }
    if (note !== undefined) patch.note = String(note).slice(0, 300);
    const r = await RewardRedemption.findByIdAndUpdate(req.params.id, patch, { returnDocument: "after" }).populate("reward", "name costPoints type");
    if (!r) return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });
    // Huỷ đơn thì hoàn điểm cho em (chỉ một lần).
    if (status === "cancelled" && !r.refunded) {
      await User.updateOne({ _id: r.student }, { $inc: { points: r.pointsSpent } });
      r.refunded = true;
      await r.save();
    }
    if (status === "done" && r.reward?.type === "other") {
      await Notification.create({ user: r.student, type: "gift", icon: "🎁", title: `Quà “${r.reward.name}” đã sẵn sàng!`, body: "Thầy cô đã xử lý đơn đổi quà của em.", link: "/doi-diem" });
    }
    res.json({ success: true, data: r });
  } catch (err) {
    next(err);
  }
}

// ---------- Thông báo chung ----------
async function listBroadcasts(req, res, next) {
  try {
    const items = await Broadcast.find().sort({ createdAt: -1 }).limit(50).populate("grade", "name").lean();
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

async function sendBroadcast(req, res, next) {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "Nhập tiêu đề thông báo" });
    const body = String(req.body.body || "").trim().slice(0, 500);
    const icon = String(req.body.icon || "📢").slice(0, 8);
    let link = String(req.body.link || "").trim();
    if (link && !link.startsWith("/")) return res.status(400).json({ success: false, message: "Liên kết phải là đường dẫn trong web, bắt đầu bằng “/” (vd /dau-truong)" });
    link = link.slice(0, 200);
    const filter = { role: "Student", isActive: { $ne: false } };
    if (req.body.grade) filter.grade = req.body.grade;
    const ids = await User.find(filter).distinct("_id");
    if (!ids.length) return res.status(400).json({ success: false, message: "Không có học sinh nào trong nhóm này" });
    await Notification.insertMany(ids.map((user) => ({ user, type: "broadcast", icon, title, body, link })));
    const b = await Broadcast.create({ title, body, icon, link, grade: req.body.grade || undefined, recipients: ids.length, sentBy: req.user._id });
    res.status(201).json({ success: true, data: b });
  } catch (err) {
    next(err);
  }
}

// ---------- Đấu trường ----------
async function arenaOverview(req, res, next) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [byStatus, runs7, players7, recent, topRaw] = await Promise.all([
      ArenaChallenge.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      ArenaRun.countDocuments({ createdAt: { $gte: since }, status: { $ne: "playing" } }),
      ArenaRun.distinct("student", { createdAt: { $gte: since } }),
      ArenaChallenge.find().sort({ createdAt: -1 }).limit(15).populate("creator opponent winner", "fullName").populate("subject", "name").lean(),
      ArenaRun.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $ne: "playing" } } },
        { $group: { _id: "$student", runs: { $sum: 1 }, best: { $max: "$score" }, total: { $sum: "$score" } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
    ]);
    const users = await User.find({ _id: { $in: topRaw.map((t) => t._id) } }).select("fullName username").lean();
    const um = new Map(users.map((u) => [String(u._id), u]));
    res.json({
      success: true,
      data: {
        challenges: Object.fromEntries(byStatus.map((x) => [x._id, x.n])),
        runs7,
        players7: players7.length,
        recent: recent.map((c) => ({
          _id: c._id,
          status: c.status,
          createdAt: c.createdAt,
          subject: c.subject?.name,
          creator: c.creator?.fullName,
          opponent: c.opponent?.fullName || "Cả lớp",
          winner: c.draw ? "Hoà" : c.winner?.fullName || "",
        })),
        top: topRaw.map((t) => ({ ...t, name: um.get(String(t._id))?.fullName || "?", username: um.get(String(t._id))?.username })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { catalog, listComments, bulkDeleteComments, listRedemptions, updateRedemption, listBroadcasts, sendBroadcast, arenaOverview };
