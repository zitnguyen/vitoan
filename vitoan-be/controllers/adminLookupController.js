const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const PracticeSet = require("../models/PracticeSet");
const Test = require("../models/Test");
const ReviewContent = require("../models/ReviewContent");
const User = require("../models/User");

// Tra cứu nhanh 1 ID bất kỳ (copy từ URL/UI người dùng như /bai/<id>, /kiem-tra/<id>...)
// để admin biết nó là gì và nằm ở đâu trong cây Môn → Lớp → Chủ đề → Bài học.
async function lookup(req, res, next) {
  try {
    const raw = String(req.params.id || "");
    const id = (raw.match(/[a-f0-9]{24}/i) || [])[0];
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "ID không hợp lệ" });
    }

    const lessonPath = async (lessonId) => {
      const lesson = await Lesson.findById(lessonId)
        .select("title subject grade chapter")
        .populate("subject", "name slug")
        .populate("grade", "name slug")
        .populate("chapter", "title");
      return lesson
        ? { subject: lesson.subject, grade: lesson.grade, chapter: lesson.chapter, lesson: { _id: lesson._id, title: lesson.title } }
        : {};
    };

    const lesson = await Lesson.findById(id).select("_id");
    if (lesson) return res.json({ success: true, data: { type: "lesson", id, path: await lessonPath(id) } });

    const question = await Question.findById(id).select("lesson text");
    if (question) {
      return res.json({
        success: true,
        data: { type: "question", id, label: question.text, path: await lessonPath(question.lesson) },
      });
    }

    const chapter = await Chapter.findById(id).populate("subject", "name slug").populate("grade", "name slug");
    if (chapter) {
      return res.json({
        success: true,
        data: { type: "chapter", id, path: { subject: chapter.subject, grade: chapter.grade, chapter: { _id: chapter._id, title: chapter.title } } },
      });
    }

    const set = await PracticeSet.findById(id).select("lesson title");
    if (set) {
      return res.json({ success: true, data: { type: "practiceSet", id, label: set.title, path: await lessonPath(set.lesson) } });
    }

    const review = await ReviewContent.findById(id).select("lesson title");
    if (review) {
      return res.json({ success: true, data: { type: "reviewContent", id, label: review.title, path: await lessonPath(review.lesson) } });
    }

    const test = await Test.findById(id)
      .select("title subject grade chapter")
      .populate("subject", "name slug")
      .populate("grade", "name slug")
      .populate("chapter", "title");
    if (test) {
      return res.json({
        success: true,
        data: { type: "test", id, label: test.title, path: { subject: test.subject, grade: test.grade, chapter: test.chapter } },
      });
    }

    const subject = await Subject.findById(id);
    if (subject) return res.json({ success: true, data: { type: "subject", id, label: subject.name, path: { subject } } });
    const grade = await Grade.findById(id);
    if (grade) return res.json({ success: true, data: { type: "grade", id, label: grade.name, path: { grade } } });
    const user = await User.findById(id).select("fullName username");
    if (user) return res.json({ success: true, data: { type: "user", id, label: `${user.fullName} (@${user.username})`, path: {} } });

    res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu nào với ID này" });
  } catch (err) {
    next(err);
  }
}

module.exports = { lookup };
