const { escapeRegExp } = require("../utils/regex");
const Test = require("../models/Test");
const TestAttempt = require("../models/TestAttempt");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const User = require("../models/User");
const { lessonProgressMap } = require("../utils/progress");

// Ràng buộc "học rồi mới kiểm tra": chỉ tính các bài học mà câu hỏi của đề thực sự lấy từ đó
// (không bắt học cả chương trình nếu đề không hỏi tới). Đề chủ đề: phải học xong tất cả các bài đó;
// đề giữa/cuối kỳ phủ rộng hơn nên chỉ cần học xong ít nhất REQUIRED_RATIO số bài.
// "Học xong" = đã có lượt luyện tập đạt từ 80% (xem utils/progress.js).
const REQUIRED_RATIO = 0.7;

async function learningScope(test) {
  const lessonIds = await Question.find({ _id: { $in: test.questions || [] } }).distinct("lesson");
  return Lesson.find({ _id: { $in: lessonIds }, isPublished: true }).select("_id title");
}

async function learningStatus(test, studentId, cache) {
  const key = String(test._id);
  let lessons = cache.get(key);
  if (!lessons) {
    lessons = await learningScope(test);
    cache.set(key, lessons);
  }
  const progress = await lessonProgressMap(studentId, lessons.map((l) => l._id));
  const missing = lessons.filter((l) => !progress.get(String(l._id))?.passed);
  const total = lessons.length;
  const required = test.testType === "topic" ? total : Math.ceil(total * REQUIRED_RATIO);
  const learned = total - missing.length;
  return { totalLessons: total, requiredLessons: required, learnedLessons: learned, locked: learned < required, missing: missing.map((l) => ({ _id: l._id, title: l.title })) };
}

function stripQuestion(question) {
  const { _id, type, text, audioText, imageUrl, choices, difficulty, order, source } = question;
  return { _id, type, text, audioText, imageUrl, choices, difficulty, order, source };
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
    if (req.query.search) filter.title = new RegExp(escapeRegExp(req.query.search.trim()), "i");
    const isAdmin = req.user && req.user.role === "Admin";
    if (!isAdmin) filter.isActive = true;
    else if (req.query.status === "draft") filter.isActive = false;
    else if (req.query.status === "published") filter.isActive = true;

    const tests = await Test.find(filter)
      .populate("subject", "name slug")
      .populate("grade", "name slug order")
      .populate("chapter", "title order semester")
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

    // Quản trị viên xem thêm lượt làm và điểm trung bình của từng đề (bỏ tài khoản thử nghiệm).
    const adminStats = new Map();
    if (isAdmin) {
      const testers = await User.find({ isTest: true }).distinct("_id");
      const rows = await TestAttempt.aggregate([
        { $match: { test: { $in: tests.map((t) => t._id) }, student: { $nin: testers }, totalQuestions: { $gt: 0 } } },
        { $group: { _id: "$test", n: { $sum: 1 }, avg: { $avg: { $divide: ["$score", "$totalQuestions"] } } } },
      ]);
      for (const r of rows) adminStats.set(String(r._id), { attempts: r.n, avgPercent: Math.round(r.avg * 100) });
    }
    const isStudent = req.user && req.user.role === "Student";
    const statusByTest = new Map();
    if (isStudent) {
      const cache = new Map();
      for (const t of tests) statusByTest.set(String(t._id), await learningStatus(t, req.user._id, cache));
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
        if (isAdmin) obj.adminStats = adminStats.get(String(t._id)) || { attempts: 0, avgPercent: null };
        obj.attemptCount = st?.attemptCount || 0;
        obj.bestScore = st?.bestScore ?? null;
        const ls = statusByTest.get(String(t._id));
        if (ls) {
          obj.totalLessons = ls.totalLessons;
          obj.requiredLessons = ls.requiredLessons;
          obj.learnedLessons = ls.learnedLessons;
          obj.locked = ls.locked;
        }
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
    if (!isAdmin) {
      const ls = await learningStatus(test, req.user._id, new Map());
      if (ls.locked) {
        return res.status(403).json({
          success: false,
          message: `Em cần học xong các bài mà đề này hỏi tới trước (mới xong ${ls.learnedLessons}/${ls.requiredLessons} bài cần thiết).`,
          lock: {
            title: test.title,
            testType: test.testType,
            learned: ls.learnedLessons,
            required: ls.requiredLessons,
            total: ls.totalLessons,
            missing: ls.missing.slice(0, 30),
          },
        });
      }
    }
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

// Nhân bản đề (để soạn đề mới từ đề có sẵn): bản sao ở trạng thái Nháp.
async function duplicate(req, res, next) {
  try {
    const src = await Test.findById(req.params.id).lean();
    if (!src) return res.status(404).json({ success: false, message: "Không tìm thấy bài kiểm tra" });
    const { _id, createdAt, updatedAt, __v, ...rest } = src;
    const copy = await Test.create({ ...rest, title: `${src.title} (bản sao)`, isActive: false });
    res.status(201).json({ success: true, data: copy });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, duplicate, learningStatus };
