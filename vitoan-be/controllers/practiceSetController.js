const { escapeRegExp } = require("../utils/regex");
const { dedupeQuestions } = require("../utils/dedupe");
const PracticeSet = require("../models/PracticeSet");
const Lesson = require("../models/Lesson");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");
const { isObjectId, diffFields, toBool } = require("../utils/excelSync");
const { isStaff } = require("../utils/rbac");

function stripQuestion(question) {
  const { _id, type, text, audioText, imageUrl, choices, choiceImages, difficulty, order, source } = question;
  return { _id, type, text, audioText, imageUrl, choices, choiceImages, difficulty, order, source };
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.search) filter.title = new RegExp(escapeRegExp(req.query.search.trim()), "i");
    if (req.query.level) filter.level = req.query.level;
    if (req.query.status === "draft") filter.isPublished = false;
    else if (req.query.status === "published") filter.isPublished = true;

    if (req.query.subject || req.query.grade || req.query.chapter) {
      const lessonFilter = {};
      if (req.query.subject) lessonFilter.subject = req.query.subject;
      if (req.query.grade) lessonFilter.grade = req.query.grade;
      if (req.query.chapter) lessonFilter.chapter = req.query.chapter;
      const lessonIds = await Lesson.find(lessonFilter).distinct("_id");
      filter.lesson = { $in: lessonIds };
    }

    const sets = await PracticeSet.find(filter)
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

    const data = sets.map((set) => ({
      _id: set._id,
      lesson: set.lesson,
      title: set.title,
      level: set.level,
      order: set.order,
      questionCount: set.questions.length,
      timeLimitSeconds: set.timeLimitSeconds,
      isPublished: set.isPublished,
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listByLesson(req, res, next) {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).select("isTrial");
    if (!lesson) return res.status(404).json({ success: false, message: "Không tìm thấy bài học" });
    if (!req.user && !lesson.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để xem bài luyện tập" });
    }

    const isAdmin = isStaff(req.user);
    const filter = { lesson: req.params.lessonId };
    if (!isAdmin) filter.isPublished = true;

    const sets = await PracticeSet.find(filter).sort({ order: 1, createdAt: 1 });

    let lastAttemptBySet = new Map();
    if (req.user) {
      const attempts = await Attempt.find({
        student: req.user._id,
        practiceSet: { $in: sets.map((s) => s._id) },
      }).sort({ createdAt: -1 });
      for (const attempt of attempts) {
        const key = String(attempt.practiceSet);
        if (!lastAttemptBySet.has(key)) lastAttemptBySet.set(key, attempt);
      }
    }

    const data = sets.map((set) => {
      const last = lastAttemptBySet.get(String(set._id));
      return {
        _id: set._id,
        lesson: set.lesson,
        title: set.title,
        level: set.level,
        order: set.order,
        questionCount: set.questions.length,
        timeLimitSeconds: set.timeLimitSeconds,
        lastAttempt: last
          ? { score: last.score, totalQuestions: last.totalQuestions, createdAt: last.createdAt }
          : null,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const set = await PracticeSet.findById(req.params.id).populate("questions");
    if (!set) return res.status(404).json({ success: false, message: "Không tìm thấy bài luyện tập" });
    const lesson = await Lesson.findById(set.lesson)
      .select("isTrial title chapter subject grade")
      .populate("subject", "name slug")
      .populate("grade", "name slug");
    if (!req.user && !lesson?.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để làm bài luyện tập này" });
    }
    const isAdmin = isStaff(req.user);
    res.json({
      success: true,
      data: {
        _id: set._id,
        lesson: set.lesson,
        lessonInfo: lesson
          ? { _id: lesson._id, title: lesson.title, chapter: lesson.chapter, subject: lesson.subject, grade: lesson.grade }
          : null,
        title: set.title,
        level: set.level,
        timeLimitSeconds: set.timeLimitSeconds,
        isPublished: set.isPublished,
        questions: isAdmin ? set.questions : dedupeQuestions(set.questions).map(stripQuestion),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const set = await PracticeSet.create(req.body);
    res.status(201).json({ success: true, data: set });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const set = await PracticeSet.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!set) return res.status(404).json({ success: false, message: "Không tìm thấy bài luyện tập" });
    res.json({ success: true, data: set });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await PracticeSet.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

// Xuất các bộ luyện tập của một bài: mỗi bộ một khối dòng, mỗi dòng một câu hỏi (kèm mã câu hỏi).
async function exportSets(req, res, next) {
  try {
    const { lesson } = req.query;
    if (!isObjectId(String(lesson))) return res.status(400).json({ success: false, message: "Thiếu bài học" });
    const sets = await PracticeSet.find({ lesson }).sort({ order: 1, createdAt: 1 }).populate("questions", "text type").lean();
    const rows = [];
    for (const s of sets) {
      const base = { setId: s._id, title: s.title, level: s.level, timeLimitSeconds: s.timeLimitSeconds || 0, isPublished: s.isPublished, order: s.order };
      if (!s.questions.length) rows.push({ ...base, questionId: "", questionText: "" });
      for (const q of s.questions) rows.push({ ...base, questionId: q._id, questionText: q.text });
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

// Nhập bộ luyện tập từ Excel. Dòng cùng "Mã bộ" (hoặc cùng tên nếu chưa có mã) gom thành một bộ.
// Bộ có mã: chỉ cập nhật phần đã đổi (tên, mức, thời gian, hiện/ẩn, thứ tự, danh sách câu). Không có mã: thêm bộ mới.
async function importSets(req, res, next) {
  try {
    const { lesson } = req.body;
    const items = Array.isArray(req.body.rows) ? req.body.rows.slice(0, 5000) : [];
    if (!isObjectId(String(lesson)) || !(await Lesson.exists({ _id: lesson }))) return res.status(400).json({ success: false, message: "Không tìm thấy bài học" });
    if (!items.length) return res.status(400).json({ success: false, message: "Không có dòng nào để nhập" });

    const lessonQuestionIds = new Set((await Question.find({ lesson }).distinct("_id")).map(String));
    const groups = new Map();
    const errors = [];
    items.forEach((raw, i) => {
      const row = raw.row || i + 2;
      const title = String(raw.title || "").trim();
      if (!title) { errors.push({ row, message: "Thiếu tên bộ luyện tập" }); return; }
      const key = raw.setId ? `id:${raw.setId}` : `new:${title.toLowerCase()}`;
      const g = groups.get(key) || { setId: raw.setId || "", title, first: row, rows: [], level: raw.level, timeLimitSeconds: raw.timeLimitSeconds, isPublished: raw.isPublished, order: raw.order };
      g.rows.push({ row, questionId: String(raw.questionId || "").trim() });
      groups.set(key, g);
    });

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    const last = await PracticeSet.findOne({ lesson }).sort({ order: -1 }).select("order");
    let nextOrder = last?.order || 0;
    for (const g of groups.values()) {
      const bad = g.rows.find((r) => r.questionId && (!isObjectId(r.questionId) || !lessonQuestionIds.has(r.questionId)));
      if (bad) { errors.push({ row: bad.row, message: `Mã câu hỏi "${bad.questionId}" không thuộc bài học này` }); continue; }
      const questions = [...new Set(g.rows.map((r) => r.questionId).filter(Boolean))];
      const level = ["easy", "medium", "hard"].includes(g.level) ? g.level : undefined;
      const next = {
        title: g.title,
        level,
        timeLimitSeconds: g.timeLimitSeconds === "" || g.timeLimitSeconds === undefined ? undefined : Math.max(0, Number(g.timeLimitSeconds) || 0),
        isPublished: toBool(g.isPublished, undefined),
        order: g.order === "" || g.order === undefined || Number.isNaN(Number(g.order)) ? undefined : Number(g.order),
        questions,
      };
      if (g.setId) {
        const set = isObjectId(String(g.setId)) ? await PracticeSet.findOne({ _id: g.setId, lesson }) : null;
        if (!set) { errors.push({ row: g.first, message: `Không tìm thấy bộ luyện tập có mã ${g.setId} trong bài này` }); continue; }
        const changed = diffFields(set, next);
        if (!Object.keys(changed).length) { unchanged++; continue; }
        await PracticeSet.updateOne({ _id: set._id }, { $set: changed });
        updated++;
      } else {
        await PracticeSet.create({ lesson, ...Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined)), order: next.order ?? ++nextOrder });
        inserted++;
      }
    }
    res.status(201).json({ success: true, data: { inserted, updated, unchanged, errors } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listByLesson, getOne, create, update, remove, exportSets, importSets };
