const User = require("../models/User");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const PracticeSet = require("../models/PracticeSet");
const Test = require("../models/Test");
const Attempt = require("../models/Attempt");
const TestAttempt = require("../models/TestAttempt");
const CheckIn = require("../models/CheckIn");
const Article = require("../models/Article");
const RewardRedemption = require("../models/RewardRedemption");
const Reward = require("../models/Reward");
const { vnDayKey } = require("../utils/checkin");

// Đếm số bản ghi theo ngày (giờ Việt Nam) trong `days` ngày gần nhất → [{ day, count }]
async function countByDay(Model, since) {
  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

// Những việc quản trị viên nên xử lý: nội dung còn thiếu hoặc dễ gây khó chịu cho học sinh.
async function attentionItems() {
  const MIN_TEST_QUESTIONS = 8;
  const [perLesson, publishedLessons, tests, rewardsOut, recentActive, students] = await Promise.all([
    Question.aggregate([{ $group: { _id: "$lesson", n: { $sum: 1 } } }]),
    Lesson.find({ isPublished: true }).select("title grade subject").populate("grade", "name").populate("subject", "name").lean(),
    Test.find({ isActive: true }).select("title questions grade subject").populate("grade", "name").populate("subject", "name").lean(),
    Reward.find({ isActive: true, stock: 0 }).select("name").lean(),
    Attempt.distinct("student", { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 3600 * 1000) } }),
    User.countDocuments({ role: "Student", status: "active" }),
  ]);
  const withQuestions = new Set(perLesson.map((r) => String(r._id)));
  const emptyLessons = publishedLessons.filter((l) => !withQuestions.has(String(l._id)));
  const thinTests = tests.filter((t) => (t.questions || []).length < MIN_TEST_QUESTIONS);
  const label = (x) => [x.grade?.name, x.subject?.name].filter(Boolean).join(" · ");
  const items = [];
  if (emptyLessons.length)
    items.push({
      key: "empty-lessons",
      level: "warn",
      title: `${emptyLessons.length} bài học đang hiện nhưng chưa có câu hỏi`,
      hint: "Học sinh vào bài không có gì để luyện tập.",
      to: `/admin/bai-hoc/${emptyLessons[0]._id}/cau-hoi`,
      samples: emptyLessons.slice(0, 4).map((l) => ({ text: `${label(l)} — ${l.title}`, to: `/admin/bai-hoc/${l._id}/cau-hoi` })),
    });
  if (thinTests.length)
    items.push({
      key: "thin-tests",
      level: "warn",
      title: `${thinTests.length} bài kiểm tra có dưới ${MIN_TEST_QUESTIONS} câu`,
      hint: "Đề quá ngắn nên điểm không phản ánh đúng năng lực.",
      to: "/admin/kiem-tra",
      samples: thinTests.slice(0, 4).map((t) => ({ text: `${t.title} (${(t.questions || []).length} câu)`, to: `/admin/kiem-tra?edit=${t._id}` })),
    });
  if (rewardsOut.length)
    items.push({
      key: "rewards-out",
      level: "info",
      title: `${rewardsOut.length} phần quà đang hiện nhưng đã hết hàng`,
      hint: "Ẩn hoặc nhập thêm số lượng để học sinh không bấm đổi bị báo hết.",
      to: "/admin/doi-diem",
      samples: rewardsOut.slice(0, 4).map((r) => ({ text: r.name, to: "/admin/doi-diem" })),
    });
  const inactive = Math.max(0, students - recentActive.length);
  if (students > 0 && inactive / students > 0.5)
    items.push({
      key: "inactive",
      level: "info",
      title: `${inactive}/${students} học sinh chưa làm bài nào trong 14 ngày qua`,
      hint: "Cân nhắc đăng tin, thêm nhiệm vụ hoặc quà để kéo các em quay lại.",
      to: "/admin/tai-khoan",
      samples: [],
    });
  return items;
}

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
      checkinsToday,
      totalArticles,
      totalRedemptions,
    ] = await Promise.all([
      User.countDocuments({ role: "Student" }),
      User.countDocuments({ role: "Admin" }),
      Lesson.countDocuments(),
      Question.countDocuments(),
      PracticeSet.countDocuments(),
      Test.countDocuments(),
      Attempt.countDocuments({ createdAt: { $gte: startOfToday } }),
      TestAttempt.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.find({ role: "Student" }).sort({ createdAt: -1 }).limit(6).populate("grade", "name"),
      CheckIn.countDocuments({ dayKey: vnDayKey() }),
      Article.countDocuments(),
      RewardRedemption.countDocuments(),
    ]);

    // Hoạt động 7 ngày gần nhất: lượt luyện tập + lượt kiểm tra + học sinh mới
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [practiceByDay, testByDay, signupByDay] = await Promise.all([
      countByDay(Attempt, since),
      countByDay(TestAttempt, since),
      User.aggregate([
        { $match: { role: "Student", createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, count: { $sum: 1 } } },
      ]).then((rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]))),
    ]);
    const activity = Array.from({ length: 7 }, (_, i) => {
      const day = vnDayKey(new Date(Date.now() - (6 - i) * 24 * 3600 * 1000));
      return { day, practice: practiceByDay[day] || 0, tests: testByDay[day] || 0, signups: signupByDay[day] || 0 };
    });

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
        checkinsToday,
        totalArticles,
        totalRedemptions,
        activity,
        attention: await attentionItems(),
        recentStudents: recentStudents.map((s) => ({
          id: s._id,
          fullName: s.fullName,
          username: s.username,
          avatarUrl: s.avatarUrl,
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
