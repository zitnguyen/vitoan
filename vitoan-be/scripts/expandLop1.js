// Mở rộng nội dung Lớp 1 (Toán & Tiếng Việt) theo cấu trúc chương trình GDPT 2018.
// Toàn bộ nội dung lý thuyết và câu hỏi bên dưới do dự án tự biên soạn — không sao chép
// từ bất kỳ sách giáo khoa, ngân hàng đề hay nền tảng học tập nào khác.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

const chapterCache = new Map();
async function getChapter(chapterTitle, subject, grade, order, semester) {
  const key = `${subject._id}:${grade._id}:${chapterTitle}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const chapter = await Chapter.findOneAndUpdate(
    { title: chapterTitle, subject: subject._id, grade: grade._id },
    { title: chapterTitle, subject: subject._id, grade: grade._id, order, semester },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  chapterCache.set(key, chapter);
  return chapter;
}

async function seedLessonWithQuestions({ title, description, subject, grade, chapterTitle, chapterOrder, semester, order, isTrial, questions }) {
  const chapter = await getChapter(chapterTitle, subject, grade, chapterOrder, semester);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true, isTrial: Boolean(isTrial) },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  const existingCount = await Question.countDocuments({ lesson: lesson._id });
  if (existingCount === 0) {
    await Question.insertMany(questions.map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
  }
  return lesson;
}

async function seedReview(lesson, { title, content, examples }) {
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { lesson: lesson._id, title, content, examples },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[expandLop1] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const toan = subjects.find((s) => s.slug === "toan");
  const tiengViet = subjects.find((s) => s.slug === "tieng-viet");

  // ===== TOÁN LỚP 1 =====

  const t1 = await seedLessonWithQuestions({
    title: "Ôn tập phép cộng, phép trừ trong phạm vi 10",
    description: "Củng cố kỹ năng cộng, trừ các số trong phạm vi 10 qua bài tập tổng hợp.",
    subject: toan,
    grade: lop1,
    chapterTitle: "Phép cộng, phép trừ trong phạm vi 10",
    chapterOrder: 1,
    semester: 1,
    order: 3,
    isTrial: false,
    questions: [
      { text: "3 + 4 = ?", choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "3 + 4 = 7", difficulty: "easy" },
      { text: "9 - 5 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "9 - 5 = 4", difficulty: "easy" },
      { text: "Số nào cộng với 6 thì được 10?", choices: ["3", "4", "5", "2"], correctIndex: 1, explanation: "6 + 4 = 10", difficulty: "medium" },
      { text: "Lan có 7 quả bóng, cho bạn 2 quả. Lan còn lại mấy quả?", choices: ["4", "5", "6", "9"], correctIndex: 1, explanation: "7 - 2 = 5", difficulty: "medium" },
      { text: "2 + 5 và 5 + 2 có kết quả như thế nào?", choices: ["Khác nhau", "Bằng nhau", "Không so sánh được", "2+5 lớn hơn"], correctIndex: 1, explanation: "Phép cộng có tính chất giao hoán nên 2+5 = 5+2 = 7", difficulty: "medium" },
      { text: "10 - 10 = ?", choices: ["0", "1", "10", "Không tính được"], correctIndex: 0, explanation: "10 - 10 = 0", difficulty: "easy" },
      { text: "Có 4 con gà và 3 con vịt. Hỏi có tất cả bao nhiêu con?", choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "4 + 3 = 7", difficulty: "medium" },
    ],
  });
  await seedReview(t1, {
    title: "Kiến thức: Ôn tập phép cộng, phép trừ trong phạm vi 10",
    content:
      "Phép cộng là gộp hai số lại với nhau, phép trừ là bớt đi một phần từ một số ban đầu.\nPhép cộng có tính chất giao hoán: đổi chỗ hai số hạng, kết quả không thay đổi (2 + 5 = 5 + 2).\nMuốn kiểm tra kết quả phép trừ, em có thể lấy hiệu cộng với số trừ để ra số bị trừ ban đầu.",
    examples: ["3 + 4 = 7 và 4 + 3 = 7 (kết quả giống nhau)", "9 - 5 = 4, kiểm tra lại: 4 + 5 = 9 (đúng)", "Có 7 quả bóng, cho đi 2 quả còn 5 quả: 7 - 2 = 5"],
  });

  const t2 = await seedLessonWithQuestions({
    title: "Phép cộng trong phạm vi 20 không nhớ",
    description: "Học cách cộng một số có hai chữ số với một số có một chữ số, không nhớ, trong phạm vi 20.",
    subject: toan,
    grade: lop1,
    chapterTitle: "Các số trong phạm vi 20",
    chapterOrder: 3,
    semester: 2,
    order: 2,
    isTrial: true,
    questions: [
      { text: "12 + 3 = ?", choices: ["14", "15", "16", "13"], correctIndex: 1, explanation: "12 + 3 = 15", difficulty: "easy" },
      { text: "15 + 4 = ?", choices: ["18", "19", "20", "17"], correctIndex: 1, explanation: "15 + 4 = 19", difficulty: "easy" },
      { text: "11 + 7 = ?", choices: ["17", "18", "19", "16"], correctIndex: 1, explanation: "11 + 7 = 18", difficulty: "medium" },
      { text: "10 + 9 = ?", choices: ["18", "19", "20", "17"], correctIndex: 1, explanation: "10 + 9 = 19", difficulty: "easy" },
      { text: "13 + 5 = ?", choices: ["17", "18", "19", "16"], correctIndex: 1, explanation: "13 + 5 = 18", difficulty: "medium" },
      { text: "Bạn An có 14 viên bi, mẹ cho thêm 5 viên. An có tất cả bao nhiêu viên bi?", choices: ["18", "19", "20", "17"], correctIndex: 1, explanation: "14 + 5 = 19", difficulty: "medium" },
      { text: "16 + 3 = ?", choices: ["18", "19", "20", "17"], correctIndex: 1, explanation: "16 + 3 = 19", difficulty: "medium" },
    ],
  });
  await seedReview(t2, {
    title: "Kiến thức: Phép cộng trong phạm vi 20 không nhớ",
    content:
      "Để cộng một số có hai chữ số với một số có một chữ số trong phạm vi 20, em cộng chữ số hàng đơn vị trước, giữ nguyên chữ số hàng chục (vì tổng không vượt quá 20 nên không cần nhớ sang hàng chục).\nVí dụ: 12 + 3, ta lấy 2 (đơn vị của 12) cộng 3 = 5, giữ nguyên 1 chục, kết quả là 15.",
    examples: ["12 + 3 = 15 (2 + 3 = 5, giữ 1 chục)", "15 + 4 = 19 (5 + 4 = 9, giữ 1 chục)", "10 + 9 = 19 (0 + 9 = 9, giữ 1 chục)"],
  });

  const t3 = await seedLessonWithQuestions({
    title: "Phép trừ trong phạm vi 20 không nhớ",
    description: "Học cách trừ một số có hai chữ số cho một số có một chữ số, không nhớ, trong phạm vi 20.",
    subject: toan,
    grade: lop1,
    chapterTitle: "Các số trong phạm vi 20",
    chapterOrder: 3,
    semester: 2,
    order: 3,
    isTrial: false,
    questions: [
      { text: "18 - 5 = ?", choices: ["12", "13", "14", "11"], correctIndex: 1, explanation: "18 - 5 = 13", difficulty: "easy" },
      { text: "19 - 7 = ?", choices: ["11", "12", "13", "10"], correctIndex: 1, explanation: "19 - 7 = 12", difficulty: "easy" },
      { text: "16 - 4 = ?", choices: ["11", "12", "13", "10"], correctIndex: 1, explanation: "16 - 4 = 12", difficulty: "medium" },
      { text: "20 - 9 = ?", choices: ["10", "11", "12", "9"], correctIndex: 1, explanation: "20 - 9 = 11", difficulty: "medium" },
      { text: "Có 17 quyển vở, đã dùng hết 6 quyển. Còn lại mấy quyển?", choices: ["10", "11", "12", "9"], correctIndex: 1, explanation: "17 - 6 = 11", difficulty: "medium" },
      { text: "14 - 3 = ?", choices: ["10", "11", "12", "9"], correctIndex: 1, explanation: "14 - 3 = 11", difficulty: "easy" },
      { text: "19 - 9 = ?", choices: ["9", "10", "11", "8"], correctIndex: 1, explanation: "19 - 9 = 10", difficulty: "medium" },
    ],
  });
  await seedReview(t3, {
    title: "Kiến thức: Phép trừ trong phạm vi 20 không nhớ",
    content:
      "Để trừ một số có hai chữ số cho một số có một chữ số trong phạm vi 20 (không nhớ), em lấy chữ số hàng đơn vị trừ đi số đó, giữ nguyên chữ số hàng chục.\nVí dụ: 18 - 5, ta lấy 8 (đơn vị của 18) trừ 5 = 3, giữ nguyên 1 chục, kết quả là 13.",
    examples: ["18 - 5 = 13 (8 - 5 = 3, giữ 1 chục)", "19 - 7 = 12 (9 - 7 = 2, giữ 1 chục)", "16 - 4 = 12 (6 - 4 = 2, giữ 1 chục)"],
  });

  // ===== TIẾNG VIỆT LỚP 1 =====

  const v1 = await seedLessonWithQuestions({
    title: "Bảng chữ cái tiếng Việt",
    description: "Làm quen với bảng chữ cái tiếng Việt, phân biệt nguyên âm và phụ âm cơ bản.",
    subject: tiengViet,
    grade: lop1,
    chapterTitle: "Âm - vần - chữ viết",
    chapterOrder: 2,
    semester: 1,
    order: 2,
    isTrial: true,
    questions: [
      { text: "Chữ cái nào là nguyên âm?", choices: ["b", "a", "c", "d"], correctIndex: 1, explanation: "a là một nguyên âm trong tiếng Việt", difficulty: "easy" },
      { text: "Chữ cái nào là phụ âm?", choices: ["o", "e", "m", "u"], correctIndex: 2, explanation: "m là một phụ âm trong tiếng Việt", difficulty: "easy" },
      { text: "Trong các chữ sau, đâu là nguyên âm: i, k, l, n?", choices: ["k", "l", "i", "n"], correctIndex: 2, explanation: "i là nguyên âm, còn k, l, n là phụ âm", difficulty: "medium" },
      { text: "Chữ cái đứng đầu bảng chữ cái tiếng Việt là chữ nào?", choices: ["b", "a", "c", "ă"], correctIndex: 1, explanation: "Chữ 'a' đứng đầu bảng chữ cái tiếng Việt", difficulty: "easy" },
      { text: "Từ 'mẹ' được ghép từ những chữ cái nào?", choices: ["m, e", "m, ẹ", "m, e, dấu nặng", "e, m"], correctIndex: 2, explanation: "'mẹ' gồm phụ âm 'm', nguyên âm 'e' và dấu nặng", difficulty: "medium" },
      { text: "Chữ nào sau đây KHÔNG phải là nguyên âm: a, e, o, t?", choices: ["a", "e", "o", "t"], correctIndex: 3, explanation: "t là phụ âm, không phải nguyên âm", difficulty: "medium" },
    ],
  });
  await seedReview(v1, {
    title: "Kiến thức: Bảng chữ cái tiếng Việt",
    content:
      "Bảng chữ cái tiếng Việt gồm 29 chữ cái, chia thành hai nhóm chính: nguyên âm và phụ âm.\nNguyên âm là những âm phát ra khi luồng hơi đi tự do, ví dụ: a, ă, â, e, ê, i, o, ô, ơ, u, ư, y.\nPhụ âm là những âm phát ra khi luồng hơi bị cản lại một phần, ví dụ: b, c, d, đ, g, h, k, l, m, n...",
    examples: ["Nguyên âm: a, e, i, o, u", "Phụ âm: b, c, d, m, n", "Từ 'ba' gồm phụ âm 'b' và nguyên âm 'a'"],
  });

  const v2 = await seedLessonWithQuestions({
    title: "Dấu thanh trong tiếng Việt",
    description: "Nhận biết 6 thanh điệu trong tiếng Việt: ngang, huyền, sắc, hỏi, ngã, nặng.",
    subject: tiengViet,
    grade: lop1,
    chapterTitle: "Âm - vần - chữ viết",
    chapterOrder: 2,
    semester: 1,
    order: 3,
    isTrial: false,
    questions: [
      { text: "Tiếng Việt có tất cả bao nhiêu thanh điệu?", choices: ["4", "5", "6", "7"], correctIndex: 2, explanation: "Tiếng Việt có 6 thanh điệu: ngang, huyền, sắc, hỏi, ngã, nặng", difficulty: "easy" },
      { text: "Từ 'mẹ' mang thanh gì?", choices: ["Thanh ngang", "Thanh huyền", "Thanh nặng", "Thanh sắc"], correctIndex: 2, explanation: "'mẹ' mang dấu nặng", difficulty: "easy" },
      { text: "Từ 'bà' mang thanh gì?", choices: ["Thanh ngang", "Thanh huyền", "Thanh sắc", "Thanh hỏi"], correctIndex: 1, explanation: "'bà' mang dấu huyền", difficulty: "easy" },
      { text: "Từ nào mang thanh sắc trong các từ sau: cá, cà, cả, cã?", choices: ["cá", "cà", "cả", "cã"], correctIndex: 0, explanation: "'cá' mang dấu sắc", difficulty: "medium" },
      { text: "Từ 'mã' và 'mả' khác nhau ở điểm nào?", choices: ["Khác âm đầu", "Khác vần", "Khác thanh điệu", "Không khác gì"], correctIndex: 2, explanation: "'mã' mang thanh ngã, 'mả' mang thanh hỏi — khác nhau về thanh điệu", difficulty: "hard" },
      { text: "Từ không mang dấu thanh nào (thanh ngang) là từ nào?", choices: ["ba", "bà", "bá", "bạ"], correctIndex: 0, explanation: "'ba' không có dấu, mang thanh ngang", difficulty: "medium" },
    ],
  });
  await seedReview(v2, {
    title: "Kiến thức: Dấu thanh trong tiếng Việt",
    content:
      "Tiếng Việt có 6 thanh điệu: thanh ngang (không dấu), thanh huyền (dấu \\), thanh sắc (dấu /), thanh hỏi (dấu ?), thanh ngã (dấu ~), thanh nặng (dấu .).\nMỗi thanh điệu làm thay đổi nghĩa của từ, dù âm và vần giữ nguyên.\nDấu thanh thường được đặt trên hoặc dưới nguyên âm chính của tiếng.",
    examples: ["ba (ngang) - bà (huyền) - bá (sắc) - bả (hỏi) - bã (ngã) - bạ (nặng)", "'mẹ' mang thanh nặng", "'cá' mang thanh sắc, 'cà' mang thanh huyền"],
  });

  const v3 = await seedLessonWithQuestions({
    title: "Từ ngữ chỉ sự vật xung quanh em",
    description: "Nhận biết và sử dụng các từ ngữ chỉ người, con vật, đồ vật, cây cối quen thuộc.",
    subject: tiengViet,
    grade: lop1,
    chapterTitle: "Từ và câu cơ bản",
    chapterOrder: 3,
    semester: 2,
    order: 2,
    isTrial: true,
    questions: [
      { text: "Từ nào chỉ con vật?", choices: ["bàn", "mèo", "sách", "cây"], correctIndex: 1, explanation: "'mèo' là từ chỉ con vật", difficulty: "easy" },
      { text: "Từ nào chỉ đồ vật?", choices: ["cá", "hoa", "ghế", "chim"], correctIndex: 2, explanation: "'ghế' là từ chỉ đồ vật", difficulty: "easy" },
      { text: "Từ nào chỉ người?", choices: ["cô giáo", "bàn ghế", "quyển vở", "cái cặp"], correctIndex: 0, explanation: "'cô giáo' là từ chỉ người", difficulty: "easy" },
      { text: "Từ nào chỉ cây cối?", choices: ["chó", "cây bàng", "xe đạp", "bút chì"], correctIndex: 1, explanation: "'cây bàng' là từ chỉ cây cối", difficulty: "medium" },
      { text: "Trong câu 'Con mèo nằm trên ghế', từ nào chỉ đồ vật?", choices: ["Con mèo", "nằm", "ghế", "trên"], correctIndex: 2, explanation: "'ghế' là từ chỉ đồ vật trong câu này", difficulty: "medium" },
      { text: "Từ nào KHÔNG phải là từ chỉ sự vật: chạy, bàn, mèo, hoa?", choices: ["chạy", "bàn", "mèo", "hoa"], correctIndex: 0, explanation: "'chạy' là từ chỉ hoạt động, không phải từ chỉ sự vật", difficulty: "medium" },
    ],
  });
  await seedReview(v3, {
    title: "Kiến thức: Từ ngữ chỉ sự vật xung quanh em",
    content:
      "Từ chỉ sự vật là những từ dùng để gọi tên người, con vật, đồ vật, cây cối, hiện tượng xung quanh em.\nVí dụ về từ chỉ người: bố, mẹ, cô giáo, bạn bè.\nVí dụ về từ chỉ con vật: mèo, chó, gà, cá.\nVí dụ về từ chỉ đồ vật: bàn, ghế, sách, bút.",
    examples: ["Người: bố, mẹ, cô giáo", "Con vật: mèo, chó, gà", "Đồ vật: bàn, ghế, cặp sách"],
  });

  const v4 = await seedLessonWithQuestions({
    title: "Câu đơn giản trong giao tiếp",
    description: "Nhận biết cấu trúc câu đơn giản và cách đặt câu kể, câu hỏi cơ bản.",
    subject: tiengViet,
    grade: lop1,
    chapterTitle: "Từ và câu cơ bản",
    chapterOrder: 3,
    semester: 2,
    order: 3,
    isTrial: false,
    questions: [
      { text: "Câu 'Em đi học.' là loại câu gì?", choices: ["Câu hỏi", "Câu kể", "Câu cảm", "Câu cầu khiến"], correctIndex: 1, explanation: "Đây là câu kể, dùng để nói lên một sự việc", difficulty: "easy" },
      { text: "Câu nào là câu hỏi?", choices: ["Em đi học.", "Bạn tên là gì?", "Trời đẹp quá!", "Hãy ngồi xuống."], correctIndex: 1, explanation: "Câu hỏi thường kết thúc bằng dấu chấm hỏi", difficulty: "easy" },
      { text: "Câu 'Trời đẹp quá!' là loại câu gì?", choices: ["Câu kể", "Câu hỏi", "Câu cảm", "Câu cầu khiến"], correctIndex: 2, explanation: "Câu cảm thán bộc lộ cảm xúc, thường kết thúc bằng dấu chấm than", difficulty: "medium" },
      { text: "Một câu đơn giản thường có mấy phần chính?", choices: ["1 phần", "2 phần (ai/cái gì - làm gì/thế nào)", "3 phần", "4 phần"], correctIndex: 1, explanation: "Câu đơn giản gồm 2 phần chính: phần nêu sự vật và phần nêu hoạt động/đặc điểm", difficulty: "medium" },
      { text: "Trong câu 'Bé Na hát rất hay.', đâu là phần nêu sự vật?", choices: ["hát", "rất hay", "Bé Na", "Cả câu"], correctIndex: 2, explanation: "'Bé Na' là phần nêu sự vật (ai)", difficulty: "medium" },
      { text: "Câu nào kết thúc bằng dấu chấm hỏi?", choices: ["Em rất vui.", "Bạn có khỏe không?", "Trời mưa to quá!", "Hãy đi ngủ sớm."], correctIndex: 1, explanation: "Câu hỏi kết thúc bằng dấu chấm hỏi (?)", difficulty: "easy" },
    ],
  });
  await seedReview(v4, {
    title: "Kiến thức: Câu đơn giản trong giao tiếp",
    content:
      "Một câu đơn giản thường gồm hai phần: phần nêu sự vật (trả lời câu hỏi Ai? hoặc Cái gì?) và phần nêu hoạt động, đặc điểm (trả lời câu hỏi Làm gì? hoặc Thế nào?).\nCó 4 loại câu thường gặp: câu kể (kể lại sự việc, kết thúc bằng dấu chấm), câu hỏi (kết thúc bằng dấu chấm hỏi), câu cảm (bộc lộ cảm xúc, kết thúc bằng dấu chấm than), câu cầu khiến (yêu cầu, đề nghị).",
    examples: ["Câu kể: Em đi học.", "Câu hỏi: Bạn tên là gì?", "Câu cảm: Trời đẹp quá!", "Câu cầu khiến: Hãy ngồi xuống."],
  });

  console.log("[expandLop1] Hoàn tất: đã thêm 7 chủ điểm mới cho Lớp 1 (Toán + Tiếng Việt).");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
