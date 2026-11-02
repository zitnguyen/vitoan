const Question = require("../models/Question");
const Test = require("../models/Test");
const TestAttempt = require("../models/TestAttempt");
const { gradeAnswer } = require("../utils/grading");
const { chatCompletion } = require("../utils/ai");
const { buildTestFeedback } = require("../utils/analysis");
const { learningStatus } = require("./testController");
const User = require("../models/User");
const { checkAndAwardBadges } = require("./attemptController");

// Điểm tích luỹ khi làm bài kiểm tra: cũng chỉ cộng phần tiến bộ so với lần tốt nhất trước đó của
// cùng đề (15 điểm/câu đúng thêm, +30 lần đầu đạt tuyệt đối) để không "cày" một đề dễ.
const TEST_POINTS_PER_CORRECT = 15;
const TEST_PERFECT_BONUS = 30;

async function testPointsEarned(studentId, attempt) {
  const previous = await TestAttempt.find({ student: studentId, test: attempt.test, _id: { $ne: attempt._id } })
    .select("score totalQuestions")
    .lean();
  const prevBest = previous.reduce((m, a) => Math.max(m, a.score), 0);
  const hadPerfect = previous.some((a) => a.totalQuestions > 0 && a.score === a.totalQuestions);
  let points = Math.max(0, attempt.score - prevBest) * TEST_POINTS_PER_CORRECT;
  if (attempt.totalQuestions > 0 && attempt.score === attempt.totalQuestions && !hadPerfect) points += TEST_PERFECT_BONUS;
  return { points, previousBest: prevBest };
}

async function submit(req, res, next) {
  try {
    const { test: testId, answers, durationSeconds } = req.body;
    if (!testId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bài làm" });
    }
    const test = await Test.findById(testId).select("_id questions subject grade chapter semester isActive");
    if (!test || (!test.isActive && req.user.role !== "Admin")) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài kiểm tra" });
    }
    if (req.user.role === "Student") {
      const ls = await learningStatus(test, req.user._id, new Map());
      if (ls.locked) {
        return res.status(403).json({ success: false, message: "Em cần học xong các bài trong phạm vi đề trước khi nộp bài kiểm tra" });
      }
    }

    // Chấm theo đúng danh sách câu của đề: câu lạ/trùng bị bỏ qua, câu không trả lời tính là sai.
    const questions = await Question.find({ _id: { $in: test.questions } });
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));
    const givenById = new Map();
    for (const a of answers) if (!givenById.has(String(a.question))) givenById.set(String(a.question), a);

    const gradedAnswers = test.questions.map((id) => {
      const question = questionMap.get(String(id));
      const a = givenById.get(String(id)) || {};
      const correct = gradeAnswer(question, a);
      return { question: id, selectedIndex: a.selectedIndex ?? -1, selectedIndexes: a.selectedIndexes || [], textAnswer: a.textAnswer || "", correct };
    });
    const score = gradedAnswers.filter((a) => a.correct).length;

    const attempt = await TestAttempt.create({
      student: req.user._id,
      test: testId,
      answers: gradedAnswers,
      score,
      totalQuestions: gradedAnswers.length,
      durationSeconds: Math.max(0, Math.min(Number(durationSeconds) || 0, 6 * 3600)),
    });

    // Admin làm thử không cộng điểm/huy hiệu.
    let pointsEarned = 0;
    let previousBest = 0;
    let totalPoints;
    let newBadges = [];
    if (req.user.role === "Student") {
      ({ points: pointsEarned, previousBest } = await testPointsEarned(req.user._id, attempt));
      if (pointsEarned > 0) {
        const updated = await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } }, { returnDocument: "after" }).select("points");
        totalPoints = updated.points;
      }
      newBadges = await checkAndAwardBadges(req.user._id);
    }

    res.status(201).json({ success: true, data: attempt, newBadges, pointsEarned, previousBest, totalPoints });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({ path: "answers.question", select: "type text imageUrl choices correctIndex correctIndexes correctText explanation lesson", populate: { path: "lesson", select: "title order chapter", populate: { path: "chapter", select: "title order" } } })
      .populate({
        path: "test",
        select: "title testType level subject grade chapter",
        populate: [
          { path: "subject", select: "name slug" },
          { path: "grade", select: "name slug" },
          { path: "chapter", select: "title" },
        ],
      });
    if (!attempt) return res.status(404).json({ success: false, message: "Không tìm thấy lượt làm bài" });
    if (String(attempt.student) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xem" });
    }

    // Nhận xét + so sánh với các lượt làm trước của cùng bài kiểm tra (làm nhiều lần).
    const allAttempts = await TestAttempt.find({ student: attempt.student, test: attempt.test?._id })
      .select("score totalQuestions durationSeconds createdAt answers")
      .sort({ createdAt: -1 })
      .lean();
    const previous = allAttempts.filter((a) => a.createdAt < attempt.createdAt);
    const data = attempt.toObject();
    data.feedback = await buildTestFeedback(attempt, previous);
    data.history = allAttempts.map((a) => ({
      _id: a._id,
      score: a.score,
      totalQuestions: a.totalQuestions,
      durationSeconds: a.durationSeconds,
      createdAt: a.createdAt,
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function aiReview(req, res, next) {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({ path: "answers.question", select: "type text explanation" })
      .populate("test", "title");
    if (!attempt) return res.status(404).json({ success: false, message: "Không tìm thấy lượt làm bài" });
    if (String(attempt.student) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xem" });
    }

    const wrongTopics = attempt.answers
      .filter((a) => !a.correct && a.question)
      .map((a) => `- ${a.question.text}${a.question.explanation ? ` (Kiến thức: ${a.question.explanation})` : ""}`)
      .join("\n");

    const prompt = `Học sinh vừa làm bài kiểm tra "${attempt.test?.title || ""}", đạt ${attempt.score}/${attempt.totalQuestions} câu đúng.
${wrongTopics ? `Các câu làm sai:\n${wrongTopics}` : "Học sinh làm đúng hết tất cả các câu."}
Hãy viết một nhận xét ngắn gọn (3-4 câu), động viên học sinh, chỉ ra điểm cần cải thiện (nếu có) và gợi ý nội dung nên ôn tập lại. Dùng tiếng Việt, giọng điệu thân thiện với trẻ em.`;

    const review = await chatCompletion([{ role: "user", content: prompt }], { maxTokens: 300 });
    res.json({ success: true, data: { review } });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
}

async function myHistory(req, res, next) {
  try {
    const filter = { student: req.user._id };
    if (req.query.test) filter.test = req.query.test;
    const attempts = await TestAttempt.find(filter)
      .select("-answers")
      .populate({ path: "test", select: "title testType level subject", populate: { path: "subject", select: "name slug" } })
      .sort({ createdAt: -1 })
      .limit(50);
    const total = await TestAttempt.countDocuments(filter);
    res.json({ success: true, data: attempts, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, getOne, myHistory, aiReview };
