const Test = require("../models/Test");
const TestAttempt = require("../models/TestAttempt");

function stripQuestion(question) {
  const { _id, type, text, audioText, imageUrl, choices, difficulty, order } = question;
  return { _id, type, text, audioText, imageUrl, choices, difficulty, order };
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.testType) filter.testType = req.query.testType;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.chapter) filter.chapter = req.query.chapter;
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.level) filter.level = req.query.level;
    if (req.query.search) filter.title = new RegExp(req.query.search.trim(), "i");
    const isAdmin = req.user && req.user.role === "Admin";
    if (!isAdmin) filter.isActive = true;
    else if (req.query.status === "draft") filter.isActive = false;
    else if (req.query.status === "published") filter.isActive = true;

    const tests = await Test.find(filter)
      .populate("subject", "name slug")
      .populate("grade", "name slug order")
      .populate("chapter", "title")
      .sort({ createdAt: -1 });

    const lastAttemptByTest = new Map();
    const statsByTest = new Map();
    if (req.user) {
      const attempts = await TestAttempt.find({
        student: req.user._id,
        test: { $in: tests.map((t) => t._id) },
      })
        .select("test score totalQuestions createdAt")
        .sort({ createdAt: -1 });
      for (const attempt of attempts) {
        const key = String(attempt.test);
        if (!lastAttemptByTest.has(key)) lastAttemptByTest.set(key, attempt);
        const st = statsByTest.get(key) || { attemptCount: 0, bestScore: 0 };
        st.attemptCount += 1;
        st.bestScore = Math.max(st.bestScore, attempt.score);
        statsByTest.set(key, st);
      }
    }

    res.json({
      success: true,
      data: tests.map((t) => {
        const obj = t.toObject();
        obj.questionCount = obj.questions.length;
        delete obj.questions;
        const last = lastAttemptByTest.get(String(t._id));
        obj.lastAttempt = last
          ? { _id: last._id, score: last.score, totalQuestions: last.totalQuestions, createdAt: last.createdAt }
          : null;
        const st = statsByTest.get(String(t._id));
        obj.attemptCount = st?.attemptCount || 0;
        obj.bestScore = st?.bestScore ?? null;
        return obj;
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const test = await Test.findById(req.params.id)
      .populate("questions")
      .populate("subject", "name slug")
      .populate("grade", "name slug")
      .populate("chapter", "title");
    if (!test) return res.status(404).json({ success: false, message: "Không tìm thấy bài kiểm tra" });
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để làm bài kiểm tra" });
    }
    const isAdmin = req.user.role === "Admin";
    res.json({
      success: true,
      data: {
        _id: test._id,
        title: test.title,
        testType: test.testType,
        subject: test.subject,
        grade: test.grade,
        chapter: test.chapter,
        semester: test.semester,
        level: test.level,
        timeLimitSeconds: test.timeLimitSeconds,
        questions: isAdmin ? test.questions : test.questions.map(stripQuestion),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const test = await Test.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!test) return res.status(404).json({ success: false, message: "Không tìm thấy bài kiểm tra" });
    res.json({ success: true, data: test });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Test.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
