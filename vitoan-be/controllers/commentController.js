const Comment = require("../models/Comment");

async function listByLesson(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [comments, total] = await Promise.all([
      Comment.find({ lesson: req.params.lessonId })
        .populate({ path: "user", select: "fullName avatarUrl role grade", populate: { path: "grade", select: "name" } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Comment.countDocuments({ lesson: req.params.lessonId }),
    ]);
    res.json({ success: true, data: comments, total });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { lesson, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung bình luận không được để trống" });
    }
    const comment = await Comment.create({ lesson, user: req.user._id, text: text.trim() });
    await comment.populate({ path: "user", select: "fullName avatarUrl role grade", populate: { path: "grade", select: "name" } });
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

async function toggleLike(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    const userId = req.user._id.toString();
    const idx = comment.likes.findIndex((id) => id.toString() === userId);
    if (idx >= 0) comment.likes.splice(idx, 1);
    else comment.likes.push(req.user._id);
    await comment.save();
    res.json({ success: true, data: { likeCount: comment.likes.length, liked: idx < 0 } });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Không có quyền xoá bình luận này" });
    }
    await comment.deleteOne();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { listByLesson, create, toggleLike, remove };
