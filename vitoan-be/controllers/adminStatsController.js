const User = require("../models/User");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const PracticeSet = require("../models/PracticeSet");
const Test = require("../models/Test");
const Attempt = require("../models/Attempt");
const TestAttempt = require("../models/TestAttempt");

async function overview(req, res, next) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalAdmins,
      totalLessons,
      totalQuestions,
      totalPracticeSets,
      totalTests,
      practiceAttemptsToday,
      testAttemptsToday,
      recentStudents,
    ] = await Promise.all([
      User.countDocuments({ role: "Student" }),
      User.countDocuments({ role: "Admin" }),
      Lesson.countDocuments(),
      Question.countDocuments(),
      PracticeSet.countDocuments(),
      Test.countDocuments(),
      Attempt.countDocuments({ createdAt: { $gte: startOfToday } }),
      TestAttempt.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.find({ role: "Student" }).sort({ createdAt: -1 }).limit(5).populate("grade", "name"),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalAdmins,
        totalLessons,
        totalQuestions,
        totalPracticeSets,
        totalTests,
        attemptsToday: practiceAttemptsToday + testAttemptsToday,
        recentStudents: recentStudents.map((s) => ({
          id: s._id,
          fullName: s.fullName,
          username: s.username,
          grade: s.grade,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };
