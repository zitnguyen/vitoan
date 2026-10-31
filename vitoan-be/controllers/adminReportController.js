const mongoose = require("mongoose");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const TestAttempt = require("../models/TestAttempt");
const Lesson = require("../models/Lesson");
const { PASS_PERCENT } = require("../utils/progress");
const { weakKnowledge } = require("../utils/analysis");

const oid = (id) => new mongoose.Types.ObjectId(String(id));

// Báo cáo học tập theo lớp: mỗi học sinh làm được bao nhiêu, đúng bao nhiêu %, lần cuối học khi nào,
// và những bài học cả lớp hay làm sai (để quản trị viên/giáo viên biết nên bổ sung giải thích ở đâu).
async function classReport(req, res, next) {
  try {
    const userFilter = { role: "Student", isTest: { $ne: true } };
    if (req.query.grade) userFilter.grade = req.query.grade;
    const students = await User.find(userFilter).select("fullName username grade createdAt").populate("grade", "name").lean();
    const ids = students.map((s) => s._id);

    const [perStudent, bestPerLesson, tests, weakRows] = await Promise.all([
      Attempt.aggregate([
        { $match: { student: { $in: ids } } },
        {
          $group: {
            _id: "$student",
            attempts: { $sum: 1 },
            score: { $sum: "$score" },
            total: { $sum: "$totalQuestions" },
            lastActiveAt: { $max: "$createdAt" },
          },
        },
      ]),
      Attempt.aggregate([
        { $match: { student: { $in: ids }, totalQuestions: { $gt: 0 } } },
        { $group: { _id: { student: "$student", lesson: "$lesson" }, best: { $max: { $divide: ["$score", "$totalQuestions"] } } } },
        { $match: { best: { $gte: PASS_PERCENT / 100 } } },
        { $group: { _id: "$_id.student", passed: { $sum: 1 } } },
      ]),
      TestAttempt.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: "$student", n: { $sum: 1 }, last: { $max: "$createdAt" } } }]),
      Attempt.aggregate([
        { $match: { student: { $in: ids } } },
        { $group: { _id: "$lesson", score: { $sum: "$score" }, total: { $sum: "$totalQuestions" }, students: { $addToSet: "$student" } } },
        { $match: { total: { $gte: 20 } } },
      ]),
    ]);

    const stat = new Map(perStudent.map((r) => [String(r._id), r]));
    const passed = new Map(bestPerLesson.map((r) => [String(r._id), r.passed]));
    const testMap = new Map(tests.map((r) => [String(r._id), r]));
    const rows = students
      .map((s) => {
        const st = stat.get(String(s._id));
        const t = testMap.get(String(s._id));
        const last = [st?.lastActiveAt, t?.last].filter(Boolean).sort((a, b) => b - a)[0] || null;
        return {
          id: s._id,
          fullName: s.fullName,
          username: s.username,
          grade: s.grade?.name || "",
          attempts: st?.attempts || 0,
          testAttempts: t?.n || 0,
          avgPercent: st?.total ? Math.round((st.score / st.total) * 100) : null,
          lessonsPassed: passed.get(String(s._id)) || 0,
          lastActiveAt: last,
        };
      })
      .sort((a, b) => (b.lastActiveAt ? +new Date(b.lastActiveAt) : 0) - (a.lastActiveAt ? +new Date(a.lastActiveAt) : 0));

    const lessons = await Lesson.find({ _id: { $in: weakRows.map((r) => r._id) } })
      .select("title grade subject")
      .populate("subject", "name")
      .populate("grade", "name")
      .lean();
    const lessonMap = new Map(lessons.map((l) => [String(l._id), l]));
    const weakLessons = weakRows
      .map((r) => ({
        lesson: r._id,
        title: lessonMap.get(String(r._id))?.title || "",
        context: [lessonMap.get(String(r._id))?.grade?.name, lessonMap.get(String(r._id))?.subject?.name].filter(Boolean).join(" · "),
        students: r.students.length,
        answered: r.total,
        wrongPercent: Math.round((1 - r.score / r.total) * 100),
      }))
      .filter((r) => r.wrongPercent >= 30)
      .sort((a, b) => b.wrongPercent - a.wrongPercent)
      .slice(0, 8);

    res.json({ success: true, data: { students: rows, weakLessons } });
  } catch (err) {
    next(err);
  }
}

// Chi tiết 1 học sinh: phần kiến thức em hay sai + nhận xét tự động (dùng chung bộ phân tích với trang Thống kê của học sinh).
async function studentReport(req, res, next) {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "Student" }).select("fullName username grade").populate("grade", "name");
    if (!student) return res.status(404).json({ success: false, message: "Không tìm thấy học sinh" });
    const [attempts, testAttempts] = await Promise.all([
      Attempt.find({ student: student._id }).select("answers").lean(),
      TestAttempt.find({ student: student._id }).select("answers").lean(),
    ]);
    const weak = await weakKnowledge([...attempts, ...testAttempts], {});
    res.json({
      success: true,
      data: {
        student: { id: student._id, fullName: student.fullName, username: student.username, grade: student.grade?.name || "" },
        totalAnswered: weak.totalAnswered,
        correctPercent: weak.correctPercent,
        remarks: weak.remarks,
        weakLessons: weak.lessons.filter((g) => g.wrong > 0).slice(0, 6),
        frequentWrongQuestions: weak.frequentWrongQuestions.slice(0, 5),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { classReport, studentReport };
