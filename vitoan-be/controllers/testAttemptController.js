const Question = require("../models/Question");
const Test = require("../models/Test");
const TestAttempt = require("../models/TestAttempt");
const { gradeAnswer } = require("../utils/grading");
const { chatCompletion } = require("../utils/openai");

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

async function aiReview(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({ path: "answers.question", select: "type text explanation" })
      .populate("test", "title");
    if (!attempt) return res.status(404).json({ success: false, message: "Không tìm thấy lượt làm bài" });
    if (String(attempt.student) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xem" });
    }

    const wrongTopics = attempt.answers
      .filter((a) => !a.correct && a.question)
      .map((a) => `- ${a.question.text}${a.question.explanation ? ` (Kiến thức: ${a.question.explanation})` : ""}`)
      .join("\n");

    const prompt = `Học sinh vừa làm bài kiểm tra "${attempt.test?.title || ""}", đạt ${attempt.score}/${attempt.totalQuestions} câu đúng.
${wrongTopics ? `Các câu làm sai:\n${wrongTopics}` : "Học sinh làm đúng hết tất cả các câu."}
Hãy viết một nhận xét ngắn gọn (3-4 câu), động viên học sinh, chỉ ra điểm cần cải thiện (nếu có) và gợi ý nội dung nên ôn tập lại. Dùng tiếng Việt, giọng điệu thân thiện với trẻ em.`;

    const review = await chatCompletion([{ role: "user", content: prompt }], { maxTokens: 300 });
    res.json({ success: true, data: { review } });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
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

module.exports = { submit, getOne, myHistory, aiReview };
