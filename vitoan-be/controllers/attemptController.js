const Question = require("../models/Question");
const Attempt = require("../models/Attempt");
const Lesson = require("../models/Lesson");
const Subject = require("../models/Subject");
const Badge = require("../models/Badge");
const StudentBadge = require("../models/StudentBadge");
const { gradeAnswer } = require("../utils/grading");
const { computeBadgeStats, computeStreak } = require("../utils/badgeStats");

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

async function stats(req, res, next) {
  try {
    const studentId = req.user._id;
    const attempts = await Attempt.find({ student: studentId })
      .select("lesson score totalQuestions createdAt")
      .populate("lesson", "subject");

    const totalAttempts = attempts.length;
    const avgPercent = totalAttempts
      ? Math.round((attempts.reduce((sum, a) => sum + a.score / a.totalQuestions, 0) / totalAttempts) * 100)
      : 0;
    const streak = await computeStreak(studentId);

    const bySubjectAgg = new Map();
    for (const a of attempts) {
      const sid = a.lesson?.subject ? String(a.lesson.subject) : null;
      if (!sid) continue;
      const entry = bySubjectAgg.get(sid) || { count: 0, correct: 0, total: 0 };
      entry.count += 1;
      entry.correct += a.score;
      entry.total += a.totalQuestions;
      bySubjectAgg.set(sid, entry);
    }
    const subjects = await Subject.find({ _id: { $in: [...bySubjectAgg.keys()] } });
    const subjectNameById = new Map(subjects.map((s) => [String(s._id), s.name]));
    const bySubject = [...bySubjectAgg.entries()].map(([sid, v]) => ({
      subject: subjectNameById.get(sid) || "Khác",
      count: v.count,
      avgPercent: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const byDate = days.map((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayAttempts = attempts.filter((a) => a.createdAt >= d && a.createdAt < next);
      const correct = dayAttempts.reduce((sum, a) => sum + a.score, 0);
      const total = dayAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
      return {
        date: d.toISOString().slice(0, 10),
        attempts: dayAttempts.length,
        avgPercent: total ? Math.round((correct / total) * 100) : 0,
      };
    });

    res.json({ success: true, data: { totalAttempts, avgPercent, streak, bySubject, byDate } });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, submitGuest, getOne, myHistory, completedLessons, lessonStatus, stats };
