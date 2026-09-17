const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const Lesson = require("../models/Lesson");
const Badge = require("../models/Badge");
const StudentBadge = require("../models/StudentBadge");
const { gradeAnswer } = require("../utils/grading");
const { computeBadgeStats } = require("../utils/badgeStats");

async function checkAndAwardBadges(studentId) {
  const badges = await Badge.find({ isActive: true });
  if (badges.length === 0) return [];

  const alreadyOwned = new Set(
    (await StudentBadge.find({ student: studentId }).select("badge")).map((sb) => String(sb.badge))
  );
  const candidates = badges.filter((b) => !alreadyOwned.has(String(b._id)));
  if (candidates.length === 0) return [];

  const stats = await computeBadgeStats(studentId);

  const awarded = [];
  for (const badge of candidates) {
    const stat = stats[badge.conditionType] ?? 0;
    if (stat >= badge.conditionValue) {
      await StudentBadge.create({ student: studentId, badge: badge._id });
      awarded.push(badge);
    }
  }
  return awarded;
}

async function submit(req, res, next) {
  try {
    const { lesson, practiceSet, answers, durationSeconds } = req.body;
    if (!lesson || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bài làm" });
    }
    const questionIds = answers.map((a) => a.question);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const gradedAnswers = answers.map((a) => {
      const question = questionMap.get(String(a.question));
      const correct = gradeAnswer(question, a);
      return { question: a.question, selectedIndex: a.selectedIndex ?? -1, textAnswer: a.textAnswer || "", correct };
    });
    const score = gradedAnswers.filter((a) => a.correct).length;

    const attempt = await Attempt.create({
      student: req.user._id,
      lesson,
      practiceSet: practiceSet || undefined,
      answers: gradedAnswers,
      score,
      totalQuestions: gradedAnswers.length,
      durationSeconds: durationSeconds || 0,
    });

    const newBadges = await checkAndAwardBadges(req.user._id);

    res.status(201).json({ success: true, data: attempt, newBadges });
  } catch (err) {
    next(err);
  }
}

async function submitGuest(req, res, next) {
  try {
    const { lesson: lessonId, answers, durationSeconds } = req.body;
    if (!lessonId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bài làm" });
    }
    const lesson = await Lesson.findById(lessonId).select("isTrial");
    if (!lesson || !lesson.isTrial) {
      return res.status(403).json({ success: false, message: "Bài học này yêu cầu đăng nhập để làm bài" });
    }

    const questionIds = answers.map((a) => a.question);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    const gradedAnswers = answers.map((a) => {
      const question = questionMap.get(String(a.question));
      const correct = gradeAnswer(question, a);
      return {
        question: question
          ? {
              _id: question._id,
              type: question.type,
              text: question.text,
              choices: question.choices,
              correctIndex: question.correctIndex,
              correctText: question.correctText,
              explanation: question.explanation,
            }
          : null,
        selectedIndex: a.selectedIndex ?? -1,
        textAnswer: a.textAnswer || "",
        correct,
      };
    });
    const score = gradedAnswers.filter((a) => a.correct).length;

    res.status(201).json({
      success: true,
      data: {
        isGuest: true,
        lesson: lessonId,
        answers: gradedAnswers,
        score,
        totalQuestions: gradedAnswers.length,
        durationSeconds: durationSeconds || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const attempt = await Attempt.findById(req.params.id).populate({
      path: "answers.question",
      select: "type text choices correctIndex correctText explanation",
    });
    if (!attempt) return res.status(404).json({ success: false, message: "Không tìm thấy lượt làm bài" });
    if (String(attempt.student) !== String(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Không có quyền xem" });
    }
    res.json({ success: true, data: attempt });
  } catch (err) {
    next(err);
  }
}

async function completedLessons(req, res, next) {
  try {
    const lessonIds = await Attempt.distinct("lesson", { student: req.user._id });
    res.json({ success: true, data: lessonIds });
  } catch (err) {
    next(err);
  }
}

async function lessonStatus(req, res, next) {
  try {
    const { chapter } = req.query;
    if (!chapter) return res.status(400).json({ success: false, message: "Thiếu tham số chapter" });

    const lessons = await Lesson.find({ chapter, isPublished: true }).sort({ order: 1, createdAt: 1 });
    const completedIds = new Set(
      (
        await Attempt.distinct("lesson", { student: req.user._id, lesson: { $in: lessons.map((l) => l._id) } })
      ).map(String)
    );

    let prevCompleted = true;
    const data = lessons.map((lesson) => {
      const completed = completedIds.has(String(lesson._id));
      const unlocked = prevCompleted;
      const status = completed ? "completed" : unlocked ? "in_progress" : "locked";
      prevCompleted = completed;
      return { lesson: lesson._id, status };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function myHistory(req, res, next) {
  try {
    const attempts = await Attempt.find({ student: req.user._id })
      .populate("lesson", "title")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: attempts });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, submitGuest, getOne, myHistory, completedLessons, lessonStatus };
