const Question = require("../models/Question");
const Lesson = require("../models/Lesson");

function stripAnswer(question) {
  const { _id, lesson, type, text, audioText, imageUrl, choices, difficulty, order } = question;
  return { _id, lesson, type, text, audioText, imageUrl, choices, difficulty, order };
}

async function listByLesson(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).select("isTrial");
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    }
    if (!req.user && !lesson.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để làm bài học này" });
    }
    const questions = await Question.find({ lesson: req.params.lessonId }).sort({ order: 1, createdAt: 1 });
    const isAdmin = req.user && req.user.role === "Admin";
    res.json({ success: true, data: isAdmin ? questions : questions.map(stripAnswer) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { listByLesson, create, update, remove };
