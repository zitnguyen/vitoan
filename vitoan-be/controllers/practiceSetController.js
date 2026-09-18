const PracticeSet = require("../models/PracticeSet");
const Lesson = require("../models/Lesson");
const Attempt = require("../models/Attempt");

function stripQuestion(question) {
  const { _id, type, text, audioText, imageUrl, choices, difficulty, order } = question;
  return { _id, type, text, audioText, imageUrl, choices, difficulty, order };
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.search) filter.title = new RegExp(req.query.search.trim(), "i");
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

    const isAdmin = req.user && req.user.role === "Admin";
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
    const lesson = await Lesson.findById(set.lesson).select("isTrial");
    if (!req.user && !lesson?.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để làm bài luyện tập này" });
    }
    const isAdmin = req.user && req.user.role === "Admin";
    res.json({
      success: true,
      data: {
        _id: set._id,
        lesson: set.lesson,
        title: set.title,
        level: set.level,
        timeLimitSeconds: set.timeLimitSeconds,
        questions: isAdmin ? set.questions : set.questions.map(stripQuestion),
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

module.exports = { list, listByLesson, getOne, create, update, remove };
