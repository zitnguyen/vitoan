const Lesson = require("../models/Lesson");
const Question = require("../models/Question");

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;
    if (!req.user || req.user.role !== "Admin") filter.isPublished = true;
    const lessons = await Lesson.find(filter)
      .populate("subject", "name slug")
      .populate("grade", "name slug order")
      .sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: lessons });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    if (req.query.trackView === "1") {
      await Lesson.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    }
    const lesson = await Lesson.findById(req.params.id).populate("subject", "name slug").populate("grade", "name slug order");
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    const data = lesson.toObject();
    data.likeCount = lesson.likedBy.length;
    data.likedByMe = !!(req.user && lesson.likedBy.some((id) => id.toString() === req.user._id.toString()));
    delete data.likedBy;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function toggleLike(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    const userId = req.user._id.toString();
    const idx = lesson.likedBy.findIndex((id) => id.toString() === userId);
    if (idx >= 0) lesson.likedBy.splice(idx, 1);
    else lesson.likedBy.push(req.user._id);
    await lesson.save();
    res.json({ success: true, data: { likeCount: lesson.likedBy.length, likedByMe: idx < 0 } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    res.json({ success: true, data: lesson });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ lesson: req.params.id });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, toggleLike, create, update, remove };
