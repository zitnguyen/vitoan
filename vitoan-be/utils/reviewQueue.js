const Attempt = require("../models/Attempt");
const TestAttempt = require("../models/TestAttempt");
const ReviewLog = require("../models/ReviewLog");

const MASTER_STREAK = 2; // đúng liên tiếp 2 lần sau lần sai gần nhất thì coi là đã nhớ

// Dựng chuỗi kết quả theo thời gian của từng câu (luyện tập + kiểm tra + các lần ôn lại),
// rồi lọc ra các câu "cần ôn": đã từng sai và chưa đúng đủ MASTER_STREAK lần liên tiếp kể từ lần sai gần nhất.
async function reviewQueue(studentId) {
  const [attempts, tests, logs] = await Promise.all([
    Attempt.find({ student: studentId }).select("answers createdAt").lean(),
    TestAttempt.find({ student: studentId }).select("answers createdAt").lean(),
    ReviewLog.find({ student: studentId }).select("question correct createdAt").lean(),
  ]);
  const events = new Map(); // questionId -> [{ t, correct }]
  const push = (q, t, correct) => {
    const key = String(q);
    if (!events.has(key)) events.set(key, []);
    events.get(key).push({ t: new Date(t).getTime(), correct });
  };
  for (const a of attempts) for (const x of a.answers) push(x.question, a.createdAt, !!x.correct);
  for (const a of tests) for (const x of a.answers) push(x.question, a.createdAt, !!x.correct);
  for (const l of logs) push(l.question, l.createdAt, !!l.correct);

  const due = [];
  for (const [question, list] of events) {
    list.sort((a, b) => a.t - b.t);
    let lastWrong = -1;
    list.forEach((e, i) => {
      if (!e.correct) lastWrong = i;
    });
    if (lastWrong < 0) continue; // chưa từng sai
    const correctAfter = list.length - 1 - lastWrong;
    if (correctAfter >= MASTER_STREAK) continue; // đã nhớ
    const wrongCount = list.filter((e) => !e.correct).length;
    due.push({ question, wrongCount, lastWrongAt: list[lastWrong].t, correctAfter });
  }
  // Ưu tiên câu sai nhiều lần, rồi câu sai gần đây
  due.sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt - a.lastWrongAt);
  return due;
}

module.exports = { reviewQueue, MASTER_STREAK };
