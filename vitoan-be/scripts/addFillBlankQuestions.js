// Thêm 2 loại câu hỏi mới vào chương trình có sẵn:
// 1) "fill_blank" (điền vào chỗ trống) — cho các bài Toán cộng/trừ lớp 1, đúng
//    kiểu "A - B = ___" mà người dùng yêu cầu.
// 2) "listen_fill" (nghe rồi điền vào chỗ trống) — cho 16 bài học chữ cái đầu
//    tiên (Bài 1-20, trừ 4 bài Ôn tập) của Tiếng Việt lớp 1, dành cho bé chưa
//    đọc rành: nghe cô đọc qua audioText rồi tự gõ lại chữ cái đã nghe.
// Chỉ thêm CÂU HỎI MỚI (giữ nguyên toàn bộ nội dung cũ), không sửa bài học nào.
require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");

async function addQuestion({ lesson, type, text, audioText, correctText, explanation, difficulty }) {
  const existing = await Question.findOne({ lesson: lesson._id, type, text });
  if (existing) return false; // đã có đúng câu này rồi, tránh thêm trùng khi chạy lại script
  const maxOrderDoc = await Question.findOne({ lesson: lesson._id }).sort({ order: -1 });
  await Question.create({
    lesson: lesson._id,
    type,
    text,
    audioText: audioText || "",
    correctText,
    explanation: explanation || "",
    difficulty: difficulty || "easy",
    order: (maxOrderDoc?.order ?? -1) + 1,
  });
  return true;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const toan = await Subject.findOne({ slug: "toan" });
  const tv = await Subject.findOne({ slug: "tieng-viet" });
  const lop1 = await Grade.findOne({ slug: "lop-1" });

  // ===== 1) Toán lớp 1 — fill_blank =====
  const TOAN_FILL = [
    { title: "Phép cộng trong phạm vi 10", pairs: [[3, 4], [5, 2]] },
    { title: "Phép trừ trong phạm vi 10", pairs: [[8, 3], [9, 4]], op: "-" },
    { title: "Phép cộng số có hai chữ số với số có một chữ số", pairs: [[24, 5], [31, 7]] },
    { title: "Phép trừ số có hai chữ số cho số có một chữ số", pairs: [[38, 6], [45, 3]], op: "-" },
    { title: "Phép cộng số có hai chữ số với số có hai chữ số", pairs: [[23, 14], [35, 21]] },
    { title: "Phép trừ số có hai chữ số cho số có hai chữ số", pairs: [[56, 23], [78, 34]], op: "-" },
    { title: "Bảng cộng, bảng trừ trong phạm vi 10", pairs: [[6, 2], [7, 5]] },
  ];

  let toanAdded = 0;
  for (const item of TOAN_FILL) {
    const lesson = await Lesson.findOne({ title: item.title, subject: toan._id, grade: lop1._id });
    if (!lesson) {
      console.log(`  [bỏ qua] Không tìm thấy bài Toán: "${item.title}"`);
      continue;
    }
    for (const [a, b] of item.pairs) {
      const op = item.op || "+";
      const result = op === "-" ? a - b : a + b;
      const added = await addQuestion({
        lesson,
        type: "fill_blank",
        text: `Bạn hãy điền số thích hợp vào ô trống.\n${a} ${op} ${b} = ___`,
        correctText: String(result),
        explanation: `${a} ${op} ${b} = ${result}.`,
      });
      if (added) toanAdded++;
    }
  }

  // ===== 2) Tiếng Việt lớp 1 (Bài 1-20) — listen_fill =====
  const TV_LISTEN = [
    ["Bài 1: A, a", "a"],
    ["Bài 2: B, b, dấu huyền", "b"],
    ["Bài 3: C, c, dấu sắc", "c"],
    ["Bài 4: E, e; Ê, ê", "e"],
    ["Bài 6: O, o", "o"],
    ["Bài 7: Ô, ô", "ô"],
    ["Bài 8: D, d; Đ, đ", "d"],
    ["Bài 9: Ơ, ơ, dấu ngã", "ơ"],
    ["Bài 11: I, i; K, k", "i"],
    ["Bài 12: H, h; L, l", "h"],
    ["Bài 13: U, u; Ư, ư", "u"],
    ["Bài 14: Ch, ch; Kh, kh", "ch"],
    ["Bài 16: M, m; N, n", "m"],
    ["Bài 17: G, g; Gi, gi", "g"],
    ["Bài 18: Gh, gh; Nh, nh", "gh"],
    ["Bài 19: Ng, ng; Ngh, ngh", "ng"],
  ];

  let tvAdded = 0;
  for (const [title, letter] of TV_LISTEN) {
    const lesson = await Lesson.findOne({ title, subject: tv._id, grade: lop1._id });
    if (!lesson) {
      console.log(`  [bỏ qua] Không tìm thấy bài Tiếng Việt: "${title}"`);
      continue;
    }
    const added = await addQuestion({
      lesson,
      type: "listen_fill",
      text: "Nghe cô đọc rồi điền đúng chữ cái em vừa nghe vào ô trống.\n___",
      audioText: `Nghe cô đọc rồi điền đúng chữ cái em vừa nghe vào ô trống. Chữ ${letter}.`,
      correctText: letter,
      explanation: `Chữ cái em vừa nghe là "${letter}".`,
    });
    if (added) tvAdded++;
  }

  console.log(`\nĐã thêm ${toanAdded} câu "điền vào chỗ trống" cho Toán lớp 1.`);
  console.log(`Đã thêm ${tvAdded} câu "nghe rồi điền" cho Tiếng Việt lớp 1 (Bài 1-20).`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
