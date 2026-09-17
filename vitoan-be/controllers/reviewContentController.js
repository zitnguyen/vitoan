const ReviewContent = require("../models/ReviewContent");
const Lesson = require("../models/Lesson");

async function getByLesson(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).select("isTrial");
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    }
    if (!req.user && !lesson.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để xem lý thuyết bài này" });
    }
    const review = await ReviewContent.findOne({ lesson: req.params.lessonId });
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const review = await ReviewContent.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const review = await ReviewContent.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy nội dung ôn tập" });
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await ReviewContent.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getByLesson, create, update, remove };
