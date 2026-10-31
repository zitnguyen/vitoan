const { escapeRegExp } = require("../utils/regex");
const { dedupeQuestions } = require("../utils/dedupe");
const Question = require("../models/Question");
const Lesson = require("../models/Lesson");
const Chapter = require("../models/Chapter");
const Subject = require("../models/Subject");
const Test = require("../models/Test");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const TestAttempt = require("../models/TestAttempt");
const { gradeAnswer } = require("../utils/grading");
const { chatCompletion, parseJsonLoose } = require("../utils/openai");

const DIFFICULTY_LABEL = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

function stripAnswer(question) {
  const { _id, lesson, type, text, audioText, imageUrl, choices, difficulty, order, source } = question;
  return { _id, lesson, type, text, audioText, imageUrl, choices, difficulty, order, source };
}

// Tỉ lệ làm sai của từng câu (gộp luyện tập + kiểm tra) → Map questionId -> { total, wrong }.
// Câu sai nhiều thường là câu khó thật, đáp án sai hoặc đề mơ hồ — admin cần xem lại.
async function answerStats(ids) {
  const testStudents = await User.find({ isTest: true }).distinct("_id");
  const pipeline = (extra) => [
    { $match: { student: { $nin: testStudents }, ...(ids ? { "answers.question": { $in: ids } } : {}) } },
    { $unwind: "$answers" },
    ...(ids ? [{ $match: { "answers.question": { $in: ids } } }] : []),
    { $group: { _id: "$answers.question", total: { $sum: 1 }, wrong: { $sum: { $cond: ["$answers.correct", 0, 1] } } } },
    ...extra,
  ];
  const [a, b] = await Promise.all([Attempt.aggregate(pipeline([])), TestAttempt.aggregate(pipeline([]))]);
  const map = new Map();
  for (const r of [...a, ...b]) {
    const cur = map.get(String(r._id)) || { total: 0, wrong: 0 };
    cur.total += r.total;
    cur.wrong += r.wrong;
    map.set(String(r._id), cur);
  }
  return map;
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.search) filter.text = new RegExp(escapeRegExp(req.query.search.trim()), "i");
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.source === "self") filter["source.kind"] = { $in: ["self", null] };
    else if (["sgk", "sbt", "other"].includes(req.query.source)) filter["source.kind"] = req.query.source;

    if (req.query.testOnly === "1") {
      filter.testOnly = true; // chỉ các câu riêng của đề kiểm tra
    } else if (req.query.lesson) {
      filter.lesson = req.query.lesson;
    } else if (req.query.subject || req.query.grade || req.query.chapter) {
      const lessonFilter = {};
      if (req.query.subject) lessonFilter.subject = req.query.subject;
      if (req.query.grade) lessonFilter.grade = req.query.grade;
      if (req.query.chapter) lessonFilter.chapter = req.query.chapter;
      const lessonIds = await Lesson.find(lessonFilter).distinct("_id");
      filter.lesson = { $in: lessonIds };
    }

    // Sắp xếp "hay sai nhất": chỉ xét câu đã có ít nhất 3 lượt làm, xếp theo tỉ lệ sai giảm dần.
    let orderedIds = null;
    if (req.query.sort === "wrong") {
      const stats = await answerStats(null);
      const candidates = await Question.find(filter).distinct("_id");
      const allowed = new Set(candidates.map(String));
      orderedIds = [...stats.entries()]
        .filter(([id, st]) => allowed.has(id) && st.total >= 3 && st.wrong > 0)
        .sort((x, y) => y[1].wrong / y[1].total - x[1].wrong / x[1].total || y[1].total - x[1].total)
        .map(([id]) => id);
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const total = orderedIds ? orderedIds.length : await Question.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(Number(req.query.page) || 1, 1), pages);
    const pageFilter = orderedIds ? { _id: { $in: orderedIds.slice((page - 1) * limit, page * limit) } } : filter;
    const questions = await Question.find(pageFilter)
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
      .skip(orderedIds ? 0 : (page - 1) * limit)
      .limit(limit);
    const pageIds = questions.map((q) => q._id);
    const stats = await answerStats(pageIds);
    // Mỗi câu đang được dùng trong bao nhiêu bài kiểm tra (xoá/sửa câu có ảnh hưởng tới các đề đó).
    const usage = await Test.aggregate([{ $unwind: "$questions" }, { $match: { questions: { $in: pageIds } } }, { $group: { _id: "$questions", n: { $sum: 1 } } }]);
    const usedBy = new Map(usage.map((u) => [String(u._id), u.n]));
    let data = questions.map((q) => ({ ...q.toObject(), stats: stats.get(String(q._id)) || { total: 0, wrong: 0 }, usedInTests: usedBy.get(String(q._id)) || 0 }));
    if (orderedIds) {
      const rank = new Map(orderedIds.map((id, i) => [id, i]));
      data = data.sort((x, y) => rank.get(String(x._id)) - rank.get(String(y._id)));
    }
    res.json({ success: true, data, total, page, pages });
  } catch (err) {
    next(err);
  }
}

// Cây danh mục cho ngân hàng câu hỏi: Môn → Chủ đề → Bài học, kèm số câu hỏi ở từng nút (giống "question bank categories" của Moodle).
async function tree(req, res, next) {
  try {
    const grade = req.query.grade;
    const [counts, chapters, lessons, subjects] = await Promise.all([
      Question.aggregate([{ $group: { _id: "$lesson", n: { $sum: 1 } } }]),
      Chapter.find(grade ? { grade } : {}).sort({ semester: 1, order: 1 }).lean(),
      Lesson.find(grade ? { grade } : {}).select("title chapter subject order").sort({ order: 1 }).lean(),
      Subject.find({}).sort({ name: 1 }).lean(),
    ]);
    const countBy = new Map(counts.map((c) => [String(c._id), c.n]));
    const lessonsByChapter = new Map();
    for (const l of lessons) {
      const key = String(l.chapter || "none");
      const arr = lessonsByChapter.get(key) || [];
      arr.push({ _id: l._id, title: l.title, total: countBy.get(String(l._id)) || 0 });
      lessonsByChapter.set(key, arr);
    }
    const customCount = await Question.countDocuments({ testOnly: true });
    const data = subjects
      .map((s) => {
        const chs = chapters
          .filter((c) => String(c.subject) === String(s._id))
          .map((c) => {
            const ls = lessonsByChapter.get(String(c._id)) || [];
            return { _id: c._id, title: c.title, semester: c.semester || 1, total: ls.reduce((a, l) => a + l.total, 0), lessons: ls };
          });
        return { _id: s._id, name: s.name, total: chs.reduce((a, c) => a + c.total, 0), chapters: chs };
      })
      .filter((s) => s.chapters.length > 0);
    res.json({ success: true, data, customCount });
  } catch (err) {
    next(err);
  }
}

// Thao tác hàng loạt trên nhiều câu đã chọn: đổi mức độ hoặc xoá (không xoá câu đang dùng trong đề kiểm tra).
async function bulk(req, res, next) {
  try {
    const { ids, action, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return res.status(400).json({ success: false, message: "Chọn từ 1 đến 500 câu hỏi" });
    }
    if (action === "difficulty") {
      if (!["easy", "medium", "hard"].includes(value)) return res.status(400).json({ success: false, message: "Mức độ không hợp lệ" });
      const r = await Question.updateMany({ _id: { $in: ids } }, { $set: { difficulty: value } });
      return res.json({ success: true, data: { updated: r.modifiedCount } });
    }
    if (action === "delete") {
      const inUse = await Test.aggregate([{ $unwind: "$questions" }, { $match: { questions: { $in: ids.map((i) => new (require("mongoose").Types.ObjectId)(String(i))) } } }, { $group: { _id: "$questions" } }]);
      const blocked = new Set(inUse.map((u) => String(u._id)));
      const deletable = ids.filter((i) => !blocked.has(String(i)));
      const r = await Question.deleteMany({ _id: { $in: deletable } });
      return res.json({ success: true, data: { deleted: r.deletedCount, skippedInUse: blocked.size } });
    }
    return res.status(400).json({ success: false, message: "Thao tác không hợp lệ" });
  } catch (err) {
    next(err);
  }
}

async function listByLesson(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).select("isTrial grade");
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    }
    if (!req.user && !lesson.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để làm bài học này" });
    }
    if (req.user?.role === "Student" && req.user.grade && String(lesson.grade) !== String(req.user.grade._id || req.user.grade)) {
      return res.status(403).json({ success: false, message: "Bài học này không thuộc lớp em đã chọn" });
    }
    const questions = await Question.find({ lesson: req.params.lessonId }).sort({ order: 1, createdAt: 1 });
    const isAdmin = req.user && req.user.role === "Admin";
    res.json({ success: true, data: isAdmin ? questions : dedupeQuestions(questions).map(stripAnswer) });
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

    // Gợi ý câu tương tự: lấy một câu có sẵn làm mẫu (cùng dạng, cùng kỹ năng, đổi số liệu/ngữ cảnh).
    const sample = req.body.similarTo ? await Question.findById(req.body.similarTo) : null;
    const sampleNote = sample
      ? `\nHãy soạn các câu TƯƠNG TỰ câu mẫu sau (cùng dạng bài, cùng kỹ năng, nhưng đổi số liệu/ngữ cảnh, không chép lại câu mẫu): "${sample.text}"${
          sample.choices?.length ? ` — các đáp án mẫu: ${sample.choices.join(" | ")}` : ""
        }.`
      : "";

    const prompt = `Soạn ${count} câu hỏi trắc nghiệm 4 đáp án, mức độ "${DIFFICULTY_LABEL[difficulty]}", cho học sinh ${
      lesson.grade?.name || ""
    } môn ${lesson.subject?.name || ""}, bài học "${lesson.title}"${
      lesson.chapter?.title ? ` (chủ đề "${lesson.chapter.title}")` : ""
    }. Mỗi câu chỉ có DUY NHẤT 1 đáp án đúng.${sampleNote}
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

// Nhập nhiều câu một lần (từ tệp Excel ở trang quản trị). Mỗi câu kiểm tra riêng;
// câu lỗi được báo lại theo số dòng, câu hợp lệ vẫn được lưu.
async function importMany(req, res, next) {
  try {
    const items = Array.isArray(req.body.questions) ? req.body.questions.slice(0, 500) : [];
    if (!items.length) return res.status(400).json({ success: false, message: "Không có câu hỏi nào để nhập" });
    const lessonIds = [...new Set(items.map((q) => String(q.lesson || "")))].filter(Boolean);
    const found = new Set((await Lesson.find({ _id: { $in: lessonIds.filter((id) => /^[a-f0-9]{24}$/i.test(id)) } }).select("_id")).map((l) => String(l._id)));
    const maxOrder = {};
    for (const id of found) {
      const last = await Question.findOne({ lesson: id }).sort({ order: -1 }).select("order");
      maxOrder[id] = last?.order || 0;
    }
    const errors = [];
    const docs = [];
    items.forEach((raw, i) => {
      const row = raw.row || i + 2;
      if (!found.has(String(raw.lesson))) { errors.push({ row, message: "Không tìm thấy bài học" }); return; }
      const doc = new Question({ ...raw, row: undefined, order: ++maxOrder[String(raw.lesson)] });
      const err = doc.validateSync();
      if (err) { errors.push({ row, message: Object.values(err.errors).map((e) => e.message).join("; ") }); return; }
      docs.push(doc);
    });
    if (docs.length) await Question.insertMany(docs);
    res.status(201).json({ success: true, data: { inserted: docs.length, errors } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  tree,
  bulk, list, listByLesson, aiGenerate, checkAnswer, create, update, remove, importMany };
