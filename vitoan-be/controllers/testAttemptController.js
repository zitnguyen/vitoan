const Question = require("../models/Question");
const Test = require("../models/Test");
const TestAttempt = require("../models/TestAttempt");
const { gradeAnswer } = require("../utils/grading");

async function submit(req, res, next) {
  try {
    const { test: testId, answers, durationSeconds } = req.body;
    if (!testId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bài làm" });
    }
    const test = await Test.findById(testId).select("_id");
    if (!test) return res.status(404).json({ success: false, message: "Không tìm thấy bài kiểm tra" });

    const questionIds = answers.map((a) => a.question);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const gradedAnswers = answers.map((a) => {
      const question = questionMap.get(String(a.question));
      const correct = gradeAnswer(question, a);
      return { question: a.question, selectedIndex: a.selectedIndex ?? -1, textAnswer: a.textAnswer || "", correct };
    });
    const score = gradedAnswers.filter((a) => a.correct).length;

    const attempt = await TestAttempt.create({
      student: req.user._id,
      test: testId,
      answers: gradedAnswers,
      score,
      totalQuestions: gradedAnswers.length,
      durationSeconds: durationSeconds || 0,
    });

    res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({ path: "answers.question", select: "type text choices correctIndex correctText explanation" })
      .populate("test", "title testType level");
    if (!attempt) return res.status(404).json({ success: false, message: "Không tìm thấy lượt làm bài" });
    if (String(attempt.student) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xem" });
    }
    res.json({ success: true, data: attempt });
  } catch (err) {
    next(err);
  }
}

async function myHistory(req, res, next) {
  try {
    const attempts = await TestAttempt.find({ student: req.user._id })
      .populate("test", "title testType level")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: attempts });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, getOne, myHistory };
