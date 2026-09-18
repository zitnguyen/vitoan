const ReviewContent = require("../models/ReviewContent");
const Lesson = require("../models/Lesson");
const { chatCompletion, parseJsonLoose } = require("../utils/openai");

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.chapter) filter.chapter = req.query.chapter;
    if (req.query.search) filter.title = new RegExp(req.query.search.trim(), "i");

    const lessons = await Lesson.find(filter)
      .populate("subject", "name slug")
      .populate("grade", "name slug")
      .populate("chapter", "title")
      .sort({ order: 1, createdAt: 1 });

    const reviews = await ReviewContent.find({ lesson: { $in: lessons.map((l) => l._id) } }).select(
      "lesson title updatedAt"
    );
    const reviewByLesson = new Map(reviews.map((r) => [String(r.lesson), r]));

    const data = lessons.map((lesson) => ({
      lesson,
      review: reviewByLesson.get(String(lesson._id)) || null,
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

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

async function aiGenerate(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.body.lessonId)
      .populate("subject", "name")
      .populate("grade", "name")
      .populate("chapter", "title");
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });

    const prompt = `Soạn nội dung "kiến thức cần nhớ" ngắn gọn, dễ hiểu cho học sinh ${lesson.grade?.name || ""} môn ${
      lesson.subject?.name || ""
    }, bài học "${lesson.title}"${lesson.chapter?.title ? ` (chủ đề "${lesson.chapter.title}")` : ""}.
Chỉ trả về ĐÚNG JSON, không thêm chữ nào khác, theo đúng cấu trúc:
{"content": "đoạn văn kiến thức cần nhớ, 3-6 câu, dễ hiểu với trẻ em", "examples": ["ví dụ minh hoạ 1", "ví dụ minh hoạ 2", "ví dụ minh hoạ 3"]}`;

    const raw = await chatCompletion([{ role: "user", content: prompt }], { maxTokens: 600, temperature: 0.6 });
    const data = parseJsonLoose(raw);
    res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    if (err instanceof SyntaxError) {
      return res.status(502).json({ success: false, message: "AI trả về dữ liệu không hợp lệ, thử lại nhé" });
    }
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

module.exports = { list, getByLesson, aiGenerate, create, update, remove };
