const Question = require("../models/Question");
const Lesson = require("../models/Lesson");
const Chapter = require("../models/Chapter");

function levelRemark(percent) {
  if (percent >= 90) return { level: "Xuất sắc", message: "Em nắm rất chắc kiến thức, tiếp tục phát huy nhé!" };
  if (percent >= 80) return { level: "Tốt", message: "Em làm tốt lắm, chỉ còn vài chỗ nhỏ cần chú ý." };
  if (percent >= 65) return { level: "Khá", message: "Em đã hiểu phần lớn kiến thức, hãy ôn lại các phần còn sai." };
  if (percent >= 50) return { level: "Đạt", message: "Em cần ôn thêm lý thuyết và luyện tập các phần còn yếu." };
  return { level: "Cần cố gắng", message: "Em nên xem lại video, lý thuyết rồi luyện tập thêm trước khi làm lại." };
}

// Gom kết quả theo bài học (lesson) — mỗi câu hỏi thuộc về 1 lesson, nên tỉ lệ sai
// theo lesson chính là "phần kiến thức" em hay sai.
async function breakdownByLesson(answers) {
  const questionIds = answers.map((a) => a.question?._id || a.question);
  const questions = await Question.find({ _id: { $in: questionIds } }).select("lesson").lean();
  const lessonOfQuestion = new Map(questions.map((q) => [String(q._id), String(q.lesson)]));
  const lessons = await Lesson.find({ _id: { $in: [...new Set(lessonOfQuestion.values())] } })
    .select("title chapter")
    .lean();
  const lessonMap = new Map(lessons.map((l) => [String(l._id), l]));

  const groups = new Map();
  for (const a of answers) {
    const lessonId = lessonOfQuestion.get(String(a.question?._id || a.question));
    if (!lessonId) continue;
    const g = groups.get(lessonId) || { lesson: lessonId, title: lessonMap.get(lessonId)?.title || "", total: 0, wrong: 0 };
    g.total += 1;
    if (!a.correct) g.wrong += 1;
    groups.set(lessonId, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, correctPercent: Math.round(((g.total - g.wrong) / g.total) * 100) }))
    .sort((x, y) => x.correctPercent - y.correctPercent);
}

// Nhận xét cho 1 lượt kiểm tra, có so sánh với các lượt trước của cùng bài kiểm tra.
async function buildTestFeedback(attempt, previousAttempts) {
  const percent = attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
  const byLesson = await breakdownByLesson(attempt.answers);
  const remarks = [];
  const { level, message } = levelRemark(percent);
  remarks.push(message);

  const prev = previousAttempts[0];
  if (prev) {
    const diff = attempt.score - prev.score;
    if (diff > 0) remarks.push(`Em đã tiến bộ hơn lần trước ${diff} câu đúng — rất đáng khen!`);
    else if (diff < 0) remarks.push(`Lần này ít hơn lần trước ${-diff} câu đúng, em hãy làm chậm và đọc kỹ đề hơn nhé.`);
    else remarks.push("Kết quả bằng lần trước — ôn lại phần sai để lần sau cao hơn nhé.");
  }
  const best = Math.max(attempt.score, ...previousAttempts.map((a) => a.score));
  if (previousAttempts.length > 0 && attempt.score === best && attempt.score > prev.score) {
    remarks.push("Đây là điểm cao nhất của em ở bài kiểm tra này!");
  }

  const weak = byLesson.filter((g) => g.wrong > 0 && g.correctPercent < 80);
  if (weak.length > 0) {
    remarks.push(`Em cần ôn lại: ${weak.slice(0, 3).map((g) => `"${g.title}"`).join(", ")}.`);
  }
  const strong = byLesson.filter((g) => g.wrong === 0);
  if (strong.length > 0 && weak.length > 0) {
    remarks.push(`Em đã làm đúng hết phần ${strong.slice(0, 2).map((g) => `"${g.title}"`).join(", ")}.`);
  }

  // Câu sai lặp lại qua nhiều lượt — dấu hiệu hổng kiến thức thật chứ không phải sơ ý.
  const wrongNow = new Set(attempt.answers.filter((a) => !a.correct).map((a) => String(a.question?._id || a.question)));
  const repeatedWrong = new Set();
  for (const p of previousAttempts) {
    for (const a of p.answers || []) {
      const id = String(a.question?._id || a.question);
      if (!a.correct && wrongNow.has(id)) repeatedWrong.add(id);
    }
  }
  if (repeatedWrong.size > 0) {
    remarks.push(`Có ${repeatedWrong.size} câu em sai lặp lại nhiều lần — hãy xem kỹ phần giải thích của các câu này.`);
  }

  return {
    percent,
    level,
    remarks,
    byLesson,
    repeatedWrong: [...repeatedWrong],
    bestScore: best,
    attemptCount: previousAttempts.length + 1,
  };
}

// Thống kê lỗi sai trên toàn bộ lịch sử làm bài (luyện tập + kiểm tra) của học sinh,
// gom theo bài học & chủ đề để chỉ ra phần kiến thức em hay sai.
async function weakKnowledge(attempts, { subject } = {}) {
  const tally = new Map(); // questionId -> { total, wrong }
  for (const attempt of attempts) {
    for (const a of attempt.answers || []) {
      const id = String(a.question);
      const t = tally.get(id) || { total: 0, wrong: 0 };
      t.total += 1;
      if (!a.correct) t.wrong += 1;
      tally.set(id, t);
    }
  }
  const questions = await Question.find({ _id: { $in: [...tally.keys()] } })
    .select("lesson text type choices correctIndex correctText")
    .lean();
  const lessonIds = [...new Set(questions.map((q) => String(q.lesson)))];
  const lessonFilter = { _id: { $in: lessonIds } };
  if (subject) lessonFilter.subject = subject;
  const lessons = await Lesson.find(lessonFilter)
    .select("title chapter subject grade")
    .populate("subject", "name slug")
    .populate("grade", "name slug")
    .lean();
  const lessonMap = new Map(lessons.map((l) => [String(l._id), l]));
  const chapters = await Chapter.find({ _id: { $in: lessons.map((l) => l.chapter).filter(Boolean) } })
    .select("title")
    .lean();
  const chapterMap = new Map(chapters.map((c) => [String(c._id), c]));

  const byLesson = new Map();
  const questionStats = [];
  for (const q of questions) {
    const lesson = lessonMap.get(String(q.lesson));
    if (!lesson) continue;
    const t = tally.get(String(q._id));
    const key = String(lesson._id);
    const g = byLesson.get(key) || {
      lesson: key,
      title: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      chapter: lesson.chapter ? { _id: lesson.chapter, title: chapterMap.get(String(lesson.chapter))?.title || "" } : null,
      total: 0,
      wrong: 0,
    };
    g.total += t.total;
    g.wrong += t.wrong;
    byLesson.set(key, g);
    if (t.wrong > 0) {
      questionStats.push({
        question: { _id: q._id, text: q.text, type: q.type, choices: q.choices, correctIndex: q.correctIndex, correctText: q.correctText },
        lessonTitle: lesson.title,
        lesson: key,
        total: t.total,
        wrong: t.wrong,
      });
    }
  }

  const lessonsStats = [...byLesson.values()]
    .map((g) => ({ ...g, wrongPercent: Math.round((g.wrong / g.total) * 100) }))
    .sort((a, b) => b.wrongPercent - a.wrongPercent || b.wrong - a.wrong);

  const chapterTally = new Map();
  for (const g of lessonsStats) {
    if (!g.chapter) continue;
    const key = String(g.chapter._id);
    const c = chapterTally.get(key) || { chapter: key, title: g.chapter.title, subject: g.subject, total: 0, wrong: 0 };
    c.total += g.total;
    c.wrong += g.wrong;
    chapterTally.set(key, c);
  }
  const chaptersStats = [...chapterTally.values()]
    .map((c) => ({ ...c, wrongPercent: Math.round((c.wrong / c.total) * 100) }))
    .sort((a, b) => b.wrongPercent - a.wrongPercent);

  const weakLessons = lessonsStats.filter((g) => g.wrong > 0 && g.wrongPercent >= 30);
  const remarks = [];
  const totalAnswered = lessonsStats.reduce((s, g) => s + g.total, 0);
  const totalWrong = lessonsStats.reduce((s, g) => s + g.wrong, 0);
  if (totalAnswered === 0) {
    remarks.push("Em chưa làm bài nào — hãy bắt đầu luyện tập để ViToan nhận xét nhé!");
  } else if (weakLessons.length === 0) {
    remarks.push("Em làm rất tốt, chưa có phần kiến thức nào hay sai. Tiếp tục giữ vững nhé!");
  } else {
    for (const g of weakLessons.slice(0, 3)) {
      remarks.push(
        `Em hay sai ở "${g.title}"${g.chapter?.title ? ` (${g.chapter.title})` : ""}: sai ${g.wrong}/${g.total} câu (${g.wrongPercent}%). Hãy xem lại lý thuyết và luyện tập thêm.`
      );
    }
    if (chaptersStats[0] && chaptersStats[0].wrongPercent >= 30) {
      remarks.push(`Chủ đề cần chú ý nhất: "${chaptersStats[0].title}" (sai ${chaptersStats[0].wrongPercent}%).`);
    }
  }

  return {
    totalAnswered,
    totalWrong,
    correctPercent: totalAnswered ? Math.round(((totalAnswered - totalWrong) / totalAnswered) * 100) : 0,
    remarks,
    lessons: lessonsStats,
    chapters: chaptersStats,
    frequentWrongQuestions: questionStats.sort((a, b) => b.wrong - a.wrong).slice(0, 8),
  };
}

module.exports = { levelRemark, breakdownByLesson, buildTestFeedback, weakKnowledge };
