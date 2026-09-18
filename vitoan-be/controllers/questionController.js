const Question = require("../models/Question");
const Lesson = require("../models/Lesson");
const { gradeAnswer } = require("../utils/grading");
const { chatCompletion, parseJsonLoose } = require("../utils/openai");

const DIFFICULTY_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

function stripAnswer(question) {
  const { _id, lesson, type, text, audioText, imageUrl, choices, difficulty, order } = question;
  return { _id, lesson, type, text, audioText, imageUrl, choices, difficulty, order };
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.search) filter.text = new RegExp(req.query.search.trim(), "i");
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.type = req.query.type;

    if (req.query.subject || req.query.grade || req.query.chapter) {
      const lessonFilter = {};
      if (req.query.subject) lessonFilter.subject = req.query.subject;
      if (req.query.grade) lessonFilter.grade = req.query.grade;
      if (req.query.chapter) lessonFilter.chapter = req.query.chapter;
      const lessonIds = await Lesson.find(lessonFilter).distinct("_id");
      filter.lesson = { $in: lessonIds };
    }

    const questions = await Question.find(filter)
      .populate({
        path: "lesson",
        select: "title subject grade chapter",
        populate: [
          { path: "subject", select: "name" },
          { path: "grade", select: "name" },
          { path: "chapter", select: "title" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: questions });
  } catch (err) {
    next(err);
  }
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

async function aiGenerate(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.body.lessonId)
      .populate("subject", "name")
      .populate("grade", "name")
      .populate("chapter", "title");
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });

    const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 10);
    const difficulty = ["easy", "medium", "hard"].includes(req.body.difficulty) ? req.body.difficulty : "easy";

    const prompt = `Soạn ${count} câu hỏi trắc nghiệm 4 đáp án, mức độ "${DIFFICULTY_LABEL[difficulty]}", cho học sinh ${
      lesson.grade?.name || ""
    } môn ${lesson.subject?.name || ""}, bài học "${lesson.title}"${
      lesson.chapter?.title ? ` (chủ đề "${lesson.chapter.title}")` : ""
    }. Mỗi câu chỉ có DUY NHẤT 1 đáp án đúng.
Chỉ trả về ĐÚNG JSON là một mảng, không thêm chữ nào khác, theo đúng cấu trúc:
[{"text": "nội dung câu hỏi", "choices": ["đáp án 1", "đáp án 2", "đáp án 3", "đáp án 4"], "correctIndex": 0, "explanation": "giải thích ngắn gọn"}]`;

    const raw = await chatCompletion([{ role: "user", content: prompt }], { maxTokens: 1800, temperature: 0.7 });
    const drafts = parseJsonLoose(raw);
    const data = drafts.map((q) => ({
      type: "multiple_choice",
      text: q.text || "",
      choices: Array.isArray(q.choices) ? q.choices : ["", "", "", ""],
      correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
      explanation: q.explanation || "",
      difficulty,
    }));
    res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    if (err instanceof SyntaxError) {
      return res.status(502).json({ success: false, message: "AI trả về dữ liệu không hợp lệ, thử lại nhé" });
    }
    next(err);
  }
}

async function checkAnswer(req, res, next) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });

    const lesson = await Lesson.findById(question.lesson).select("isTrial");
    if (!req.user && !lesson?.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để làm bài học này" });
    }

    const correct = gradeAnswer(question, req.body);
    res.json({
      success: true,
      data: {
        correct,
        correctIndex: question.correctIndex,
        correctText: question.correctText,
        explanation: question.explanation,
      },
    });
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

module.exports = { list, listByLesson, aiGenerate, checkAnswer, create, update, remove };
