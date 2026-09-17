// Xây dựng đầy đủ lộ trình Lớp 1 (Toán & Tiếng Việt) theo cấu trúc chương trình GDPT 2018.
// Toàn bộ tên chương/bài, nội dung lý thuyết và câu hỏi bên dưới do dự án tự biên soạn,
// chỉ tham khảo cấu trúc chủ đề công khai của chương trình phổ thông — không sao chép
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
  console.log("[expandLop1FullCurriculum] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const toan = subjects.find((s) => s.slug === "toan");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  let count = 0;
  async function add(cfg) {
    const lesson = await seedLessonWithQuestions(cfg);
    await seedReview(lesson, cfg.review);
    count++;
  }

  // Đưa các chương đã có về đúng vị trí trong lộ trình đầy đủ (không đổi bài học bên trong).
  await getChapter("Phép cộng, phép trừ trong phạm vi 10", toan, lop1, 4, 1);
  await getChapter("Các số trong phạm vi 20", toan, lop1, 5, 2);
  await getChapter("Âm - vần - chữ viết", tv, lop1, 2, 1);
  await getChapter("Từ và câu cơ bản", tv, lop1, 4, 2);

  // ===================== TOÁN LỚP 1 — HỌC KỲ 1 =====================

  await add({
    title: "Đếm và nhận biết các số 0 đến 5",
    description: "Làm quen với việc đếm số lượng đồ vật và nhận biết các số từ 0 đến 5.",
    subject: toan, grade: lop1, chapterTitle: "Làm quen với các số đến 10", chapterOrder: 1, semester: 1, order: 1, isTrial: true,
    questions: [
      { text: "Đếm số quả táo: 🍎🍎🍎. Có mấy quả táo?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "Đếm được 3 quả táo", difficulty: "easy" },
      { text: "Số nào đứng liền sau số 2?", choices: ["1", "2", "3", "4"], correctIndex: 2, explanation: "Số liền sau 2 là 3", difficulty: "easy" },
      { text: "Số 0 biểu thị điều gì?", choices: ["Có 1 vật", "Không có vật nào", "Có nhiều vật", "Không xác định"], correctIndex: 1, explanation: "Số 0 biểu thị không có vật nào", difficulty: "medium" },
      { text: "Số nào lớn hơn: 4 hay 2?", choices: ["4", "2", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "4 lớn hơn 2", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Đếm và nhận biết các số 0 đến 5",
      content: "Các số 0, 1, 2, 3, 4, 5 dùng để biểu thị số lượng đồ vật. Số 0 nghĩa là không có vật nào.\nKhi đếm, em đếm lần lượt từng vật một, mỗi vật ứng với một số.",
      examples: ["1 quả táo → số 1", "3 con mèo → số 3", "Không có bút nào → số 0"],
    },
  });

  await add({
    title: "Đếm và nhận biết các số 6 đến 10",
    description: "Làm quen với việc đếm số lượng đồ vật và nhận biết các số từ 6 đến 10.",
    subject: toan, grade: lop1, chapterTitle: "Làm quen với các số đến 10", chapterOrder: 1, semester: 1, order: 2, isTrial: false,
    questions: [
      { text: "Đếm: 🍎🍎🍎🍎🍎🍎🍎. Có mấy quả táo?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "Đếm được 7 quả táo", difficulty: "easy" },
      { text: "Số liền sau số 8 là số nào?", choices: ["7", "8", "9", "10"], correctIndex: 2, explanation: "Số liền sau 8 là 9", difficulty: "easy" },
      { text: "Số liền trước số 10 là số nào?", choices: ["8", "9", "11", "10"], correctIndex: 1, explanation: "Số liền trước 10 là 9", difficulty: "medium" },
      { text: "Số nào bé nhất trong các số 6, 9, 7, 10?", choices: ["6", "9", "7", "10"], correctIndex: 0, explanation: "6 là số bé nhất", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đếm và nhận biết các số 6 đến 10",
      content: "Các số 6, 7, 8, 9, 10 tiếp nối sau số 5. Mỗi số liền sau lớn hơn số liền trước 1 đơn vị.\nSố 10 là số lớn nhất trong phạm vi các số từ 0 đến 10.",
      examples: ["6, 7, 8, 9, 10 là các số liên tiếp", "Số liền sau 6 là 7", "10 là số lớn nhất trong phạm vi 10"],
    },
  });

  await add({
    title: "Đọc, viết các số từ 0 đến 10",
    description: "Luyện đọc và viết đúng các chữ số từ 0 đến 10.",
    subject: toan, grade: lop1, chapterTitle: "Làm quen với các số đến 10", chapterOrder: 1, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Số 'bảy' được viết là chữ số nào?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "'bảy' viết là số 7", difficulty: "easy" },
      { text: "Chữ số 5 đọc là gì?", choices: ["bốn", "năm", "sáu", "ba"], correctIndex: 1, explanation: "Chữ số 5 đọc là 'năm'", difficulty: "easy" },
      { text: "Số nào được viết bằng hai chữ số trong phạm vi 0-10?", choices: ["9", "10", "8", "7"], correctIndex: 1, explanation: "10 là số duy nhất viết bằng hai chữ số (1 và 0) trong phạm vi này", difficulty: "medium" },
      { text: "Viết đúng thứ tự các số từ bé đến lớn: 3, 1, 2 thì thứ tự là?", choices: ["1, 2, 3", "3, 2, 1", "2, 1, 3", "1, 3, 2"], correctIndex: 0, explanation: "Thứ tự từ bé đến lớn là 1, 2, 3", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đọc, viết các số từ 0 đến 10",
      content: "Mỗi số từ 0 đến 10 có một cách đọc và cách viết riêng: 0-không, 1-một, 2-hai, 3-ba, 4-bốn, 5-năm, 6-sáu, 7-bảy, 8-tám, 9-chín, 10-mười.\nSố 10 là số duy nhất trong phạm vi này được viết bằng hai chữ số.",
      examples: ["Số 7 đọc là 'bảy'", "Số 10 đọc là 'mười', viết bằng hai chữ số 1 và 0", "Số 0 đọc là 'không'"],
    },
  });

  await add({
    title: "Nhiều hơn, ít hơn, bằng nhau",
    description: "So sánh số lượng nhóm đồ vật: nhiều hơn, ít hơn, bằng nhau.",
    subject: toan, grade: lop1, chapterTitle: "So sánh các số trong phạm vi 10", chapterOrder: 2, semester: 1, order: 1, isTrial: true,
    questions: [
      { text: "Nhóm A có 5 quả bóng, nhóm B có 3 quả bóng. Nhóm nào nhiều hơn?", choices: ["Nhóm A", "Nhóm B", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "5 > 3 nên nhóm A nhiều hơn", difficulty: "easy" },
      { text: "Nhóm C có 4 bút chì, nhóm D có 4 bút chì. Hai nhóm như thế nào?", choices: ["Nhóm C nhiều hơn", "Nhóm D nhiều hơn", "Bằng nhau", "Không so sánh được"], correctIndex: 2, explanation: "4 = 4 nên hai nhóm bằng nhau", difficulty: "easy" },
      { text: "Nhóm E có 2 quả cam, nhóm F có 6 quả cam. Nhóm E như thế nào so với nhóm F?", choices: ["Nhiều hơn", "Ít hơn", "Bằng nhau", "Không xác định"], correctIndex: 1, explanation: "2 < 6 nên nhóm E ít hơn nhóm F", difficulty: "medium" },
      { text: "Muốn biết nhóm nào nhiều hơn, em làm thế nào?", choices: ["Đếm số lượng mỗi nhóm rồi so sánh", "Nhìn màu sắc", "Đoán ngẫu nhiên", "Không cần so sánh"], correctIndex: 0, explanation: "Đếm số lượng từng nhóm rồi so sánh các số đó", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhiều hơn, ít hơn, bằng nhau",
      content: "Để so sánh hai nhóm đồ vật, em đếm số lượng mỗi nhóm rồi so sánh các số vừa đếm được.\nNếu số của nhóm này lớn hơn thì nhóm đó nhiều hơn; nếu bằng nhau thì hai nhóm bằng nhau.",
      examples: ["5 quả bóng nhiều hơn 3 quả bóng", "4 bút chì bằng 4 bút chì", "2 quả cam ít hơn 6 quả cam"],
    },
  });

  await add({
    title: "So sánh các số trong phạm vi 10",
    description: "So sánh hai số bất kỳ trong phạm vi 10 bằng dấu >, <, =.",
    subject: toan, grade: lop1, chapterTitle: "So sánh các số trong phạm vi 10", chapterOrder: 2, semester: 1, order: 2, isTrial: false,
    questions: [
      { text: "So sánh: 7 ... 4", choices: ["7 < 4", "7 = 4", "7 > 4", "Không so sánh được"], correctIndex: 2, explanation: "7 > 4", difficulty: "easy" },
      { text: "So sánh: 3 ... 8", choices: ["3 < 8", "3 = 8", "3 > 8", "Không so sánh được"], correctIndex: 0, explanation: "3 < 8", difficulty: "easy" },
      { text: "Số nào lớn nhất: 6, 9, 2, 5?", choices: ["6", "9", "2", "5"], correctIndex: 1, explanation: "9 là số lớn nhất", difficulty: "medium" },
      { text: "Số nào bé nhất: 4, 1, 7, 3?", choices: ["4", "1", "7", "3"], correctIndex: 1, explanation: "1 là số bé nhất", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: So sánh các số trong phạm vi 10",
      content: "Dùng dấu > (lớn hơn), < (bé hơn), = (bằng) để so sánh hai số.\nSố đứng sau trong dãy đếm luôn lớn hơn số đứng trước.",
      examples: ["7 > 4", "3 < 8", "5 = 5"],
    },
  });

  await add({
    title: "Sắp xếp thứ tự các số trong phạm vi 10",
    description: "Luyện sắp xếp các số theo thứ tự từ bé đến lớn và từ lớn đến bé.",
    subject: toan, grade: lop1, chapterTitle: "So sánh các số trong phạm vi 10", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Sắp xếp từ bé đến lớn: 5, 2, 8. Số đứng đầu là số nào?", choices: ["5", "2", "8", "Không xác định"], correctIndex: 1, explanation: "Thứ tự: 2, 5, 8 — số bé nhất đứng đầu là 2", difficulty: "medium" },
      { text: "Sắp xếp từ lớn đến bé: 3, 9, 6. Số đứng đầu là số nào?", choices: ["3", "9", "6", "Không xác định"], correctIndex: 1, explanation: "Thứ tự: 9, 6, 3 — số lớn nhất đứng đầu là 9", difficulty: "medium" },
      { text: "Trong dãy số 1, 2, 3, 4, 5, số đứng giữa là số nào?", choices: ["1", "2", "3", "4"], correctIndex: 2, explanation: "Số đứng giữa dãy 1-5 là 3", difficulty: "easy" },
      { text: "Số liền sau và số liền trước của số 6 lần lượt là số nào?", choices: ["5 và 7", "7 và 5", "5 và 6", "6 và 7"], correctIndex: 1, explanation: "Số liền sau 6 là 7, số liền trước 6 là 5", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Sắp xếp thứ tự các số trong phạm vi 10",
      content: "Khi sắp xếp các số theo thứ tự từ bé đến lớn, em tìm số bé nhất đặt trước, tiếp tục tìm số bé nhất trong các số còn lại.\nSắp xếp từ lớn đến bé thì làm ngược lại.",
      examples: ["2, 5, 8 (từ bé đến lớn)", "9, 6, 3 (từ lớn đến bé)", "Số liền trước 6 là 5, liền sau là 7"],
    },
  });

  await add({
    title: "Nhận biết hình vuông, hình tròn, hình tam giác, hình chữ nhật",
    description: "Nhận biết và gọi tên các hình phẳng cơ bản xung quanh em.",
    subject: toan, grade: lop1, chapterTitle: "Hình phẳng và hình khối xung quanh em", chapterOrder: 3, semester: 1, order: 1, isTrial: true,
    questions: [
      { text: "Chiếc bánh chưng thường có hình gì?", choices: ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"], correctIndex: 1, explanation: "Bánh chưng thường có hình vuông", difficulty: "easy" },
      { text: "Cái đĩa thường có hình gì?", choices: ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"], correctIndex: 0, explanation: "Cái đĩa thường có hình tròn", difficulty: "easy" },
      { text: "Hình nào có 3 cạnh?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 2, explanation: "Hình tam giác có 3 cạnh", difficulty: "medium" },
      { text: "Hình vuông và hình chữ nhật giống nhau ở điểm nào?", choices: ["Đều có 3 cạnh", "Đều có 4 cạnh", "Đều không có cạnh", "Đều là hình tròn"], correctIndex: 1, explanation: "Cả hai đều có 4 cạnh, khác nhau ở độ dài các cạnh", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhận biết các hình phẳng cơ bản",
      content: "Các hình phẳng cơ bản gồm: hình vuông (4 cạnh bằng nhau), hình chữ nhật (4 cạnh, hai cạnh dài bằng nhau, hai cạnh ngắn bằng nhau), hình tròn (không có cạnh, không có góc), hình tam giác (3 cạnh).",
      examples: ["Bánh chưng: hình vuông", "Cái đĩa: hình tròn", "Biển báo giao thông tam giác: hình tam giác"],
    },
  });

  await add({
    title: "Nhận biết khối lập phương, khối hộp chữ nhật",
    description: "Nhận biết và phân biệt khối lập phương, khối hộp chữ nhật trong đời sống.",
    subject: toan, grade: lop1, chapterTitle: "Hình phẳng và hình khối xung quanh em", chapterOrder: 3, semester: 1, order: 2, isTrial: false,
    questions: [
      { text: "Viên xúc xắc (súc sắc) có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Khối trụ"], correctIndex: 0, explanation: "Viên xúc xắc có dạng khối lập phương (6 mặt vuông bằng nhau)", difficulty: "easy" },
      { text: "Chiếc hộp bút thường có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Khối trụ"], correctIndex: 1, explanation: "Hộp bút thường có dạng khối hộp chữ nhật", difficulty: "easy" },
      { text: "Khối lập phương có đặc điểm gì?", choices: ["Có 6 mặt đều là hình vuông bằng nhau", "Có 4 mặt", "Không có mặt nào", "Chỉ có 1 mặt"], correctIndex: 0, explanation: "Khối lập phương có 6 mặt đều là hình vuông bằng nhau", difficulty: "medium" },
      { text: "Quả bóng có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Khối trụ"], correctIndex: 2, explanation: "Quả bóng có dạng khối cầu (hình tròn trong không gian)", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhận biết khối lập phương, khối hộp chữ nhật",
      content: "Khối lập phương có 6 mặt đều là hình vuông bằng nhau (VD: viên xúc xắc).\nKhối hộp chữ nhật có 6 mặt là hình chữ nhật (VD: hộp bút, hộp quà).",
      examples: ["Viên xúc xắc: khối lập phương", "Hộp bút: khối hộp chữ nhật", "Quả bóng: khối cầu"],
    },
  });

  await add({
    title: "Giải bài toán có lời văn trong phạm vi 10",
    description: "Luyện đọc hiểu và giải các bài toán đố đơn giản trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 10", chapterOrder: 4, semester: 1, order: 4, isTrial: false,
    questions: [
      { text: "Nam có 4 viên bi, được chị cho thêm 3 viên. Hỏi Nam có tất cả bao nhiêu viên bi?", choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "4 + 3 = 7", difficulty: "medium" },
      { text: "Lớp có 9 bạn, có 3 bạn nghỉ học. Hỏi lớp còn lại bao nhiêu bạn đi học?", choices: ["5", "6", "7", "8"], correctIndex: 1, explanation: "9 - 3 = 6", difficulty: "medium" },
      { text: "Để giải bài toán có lời văn, bước đầu tiên em cần làm gì?", choices: ["Viết ngay phép tính", "Đọc kỹ đề bài để hiểu bài toán cho gì, hỏi gì", "Đoán đáp án", "Bỏ qua đề bài"], correctIndex: 1, explanation: "Bước đầu tiên là đọc kỹ đề để hiểu bài toán cho gì và hỏi gì", difficulty: "medium" },
      { text: "An có 6 quả bóng bay, cho em 2 quả. An còn lại mấy quả bóng bay?", choices: ["3", "4", "5", "8"], correctIndex: 1, explanation: "6 - 2 = 4", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Giải bài toán có lời văn trong phạm vi 10",
      content: "Khi giải bài toán có lời văn, em cần: (1) Đọc kỹ đề bài để biết bài toán cho gì, hỏi gì; (2) Xác định phép tính cần dùng (cộng nếu gộp thêm, trừ nếu bớt đi); (3) Tính toán và viết câu trả lời.",
      examples: ["Có 4 bi, thêm 3 bi → phép cộng: 4+3=7", "Có 9 bạn, 3 bạn nghỉ → phép trừ: 9-3=6", "Luôn ghi rõ câu trả lời sau khi tính"],
    },
  });

  // ===================== TOÁN LỚP 1 — HỌC KỲ 2 =====================

  await add({
    title: "Các số tròn chục",
    description: "Nhận biết các số tròn chục từ 10 đến 90.",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 100", chapterOrder: 6, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "Số nào là số tròn chục?", choices: ["25", "30", "47", "12"], correctIndex: 1, explanation: "30 là số tròn chục (chữ số hàng đơn vị là 0)", difficulty: "easy" },
      { text: "Số 50 gồm mấy chục?", choices: ["3 chục", "4 chục", "5 chục", "6 chục"], correctIndex: 2, explanation: "50 = 5 chục", difficulty: "easy" },
      { text: "Số tròn chục liền sau 60 là số nào?", choices: ["50", "70", "61", "80"], correctIndex: 1, explanation: "Số tròn chục liền sau 60 là 70", difficulty: "medium" },
      { text: "Trong các số 20, 35, 40, 90, số nào KHÔNG phải số tròn chục?", choices: ["20", "35", "40", "90"], correctIndex: 1, explanation: "35 có chữ số hàng đơn vị là 5, không phải số tròn chục", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Các số tròn chục",
      content: "Số tròn chục là các số có chữ số hàng đơn vị là 0: 10, 20, 30, 40, 50, 60, 70, 80, 90.\nMỗi số tròn chục gồm một số nguyên lần chục, ví dụ 50 = 5 chục.",
      examples: ["30 = 3 chục", "50 = 5 chục", "Số tròn chục liền sau 60 là 70"],
    },
  });

  await add({
    title: "Đọc, viết các số có hai chữ số",
    description: "Luyện đọc, viết và phân tích cấu tạo số có hai chữ số (hàng chục, hàng đơn vị).",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 100", chapterOrder: 6, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "Số 47 gồm mấy chục và mấy đơn vị?", choices: ["4 chục 7 đơn vị", "7 chục 4 đơn vị", "4 chục 0 đơn vị", "47 chục"], correctIndex: 0, explanation: "47 = 4 chục 7 đơn vị", difficulty: "easy" },
      { text: "Số gồm 6 chục và 3 đơn vị là số nào?", choices: ["36", "63", "60", "603"], correctIndex: 1, explanation: "6 chục 3 đơn vị = 63", difficulty: "easy" },
      { text: "Số 'tám mươi lăm' được viết là số nào?", choices: ["58", "85", "805", "580"], correctIndex: 1, explanation: "'tám mươi lăm' = 85", difficulty: "medium" },
      { text: "Số 99 gồm mấy chục và mấy đơn vị?", choices: ["9 chục 9 đơn vị", "99 chục", "9 chục 0 đơn vị", "0 chục 99 đơn vị"], correctIndex: 0, explanation: "99 = 9 chục 9 đơn vị", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đọc, viết các số có hai chữ số",
      content: "Một số có hai chữ số gồm chữ số hàng chục (đứng trước) và chữ số hàng đơn vị (đứng sau).\nVí dụ: 47 gồm 4 (hàng chục) và 7 (hàng đơn vị).",
      examples: ["47 = 4 chục 7 đơn vị", "63 = 6 chục 3 đơn vị", "'tám mươi lăm' = 85"],
    },
  });

  await add({
    title: "So sánh các số trong phạm vi 100",
    description: "So sánh hai số có hai chữ số bằng cách so sánh hàng chục rồi hàng đơn vị.",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 100", chapterOrder: 6, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "So sánh: 45 ... 38", choices: ["45 < 38", "45 = 38", "45 > 38", "Không so sánh được"], correctIndex: 2, explanation: "Hàng chục: 4 > 3, nên 45 > 38", difficulty: "medium" },
      { text: "So sánh: 62 ... 67", choices: ["62 < 67", "62 = 67", "62 > 67", "Không so sánh được"], correctIndex: 0, explanation: "Hàng chục bằng nhau (6=6), so hàng đơn vị: 2 < 7, nên 62 < 67", difficulty: "medium" },
      { text: "Số lớn nhất trong các số 54, 45, 59, 41 là số nào?", choices: ["54", "45", "59", "41"], correctIndex: 2, explanation: "59 là số lớn nhất (hàng chục đều là 4 hoặc 5, 59 có hàng chục 5 và đơn vị 9 lớn nhất)", difficulty: "hard" },
      { text: "Muốn so sánh hai số có hai chữ số, em so sánh hàng nào trước?", choices: ["Hàng đơn vị", "Hàng chục", "Cả hai cùng lúc", "Không cần so sánh theo hàng"], correctIndex: 1, explanation: "So sánh hàng chục trước, nếu bằng nhau mới so hàng đơn vị", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: So sánh các số trong phạm vi 100",
      content: "Muốn so sánh hai số có hai chữ số, em so sánh chữ số hàng chục trước. Nếu hàng chục bằng nhau thì so sánh tiếp chữ số hàng đơn vị.",
      examples: ["45 > 38 (4 chục > 3 chục)", "62 < 67 (cùng 6 chục, 2 đơn vị < 7 đơn vị)", "59 là số lớn nhất trong 54, 45, 59, 41"],
    },
  });

  await add({
    title: "Phép cộng trong phạm vi 100 không nhớ",
    description: "Học cách đặt tính và cộng hai số có hai chữ số, không nhớ.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 100 (không nhớ)", chapterOrder: 7, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "23 + 15 = ?", choices: ["36", "38", "37", "35"], correctIndex: 1, explanation: "23 + 15 = 38", difficulty: "easy" },
      { text: "42 + 34 = ?", choices: ["74", "76", "75", "77"], correctIndex: 2, explanation: "42 + 34 = 76", difficulty: "medium" },
      { text: "51 + 27 = ?", choices: ["76", "77", "78", "79"], correctIndex: 2, explanation: "51 + 27 = 78", difficulty: "medium" },
      { text: "Muốn cộng hai số có hai chữ số (không nhớ), em cộng hàng nào trước?", choices: ["Hàng chục", "Hàng đơn vị", "Cộng cả hai cùng lúc", "Không có quy tắc"], correctIndex: 1, explanation: "Em cộng hàng đơn vị trước, sau đó cộng hàng chục", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Phép cộng trong phạm vi 100 không nhớ",
      content: "Muốn cộng hai số có hai chữ số không nhớ, em đặt tính sao cho các chữ số cùng hàng thẳng cột, cộng hàng đơn vị trước, rồi cộng hàng chục.",
      examples: ["23 + 15 = 38 (3+5=8, 2+1=3)", "42 + 34 = 76 (2+4=6, 4+3=7)", "51 + 27 = 78 (1+7=8, 5+2=7)"],
    },
  });

  await add({
    title: "Phép trừ trong phạm vi 100 không nhớ",
    description: "Học cách đặt tính và trừ hai số có hai chữ số, không nhớ.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 100 (không nhớ)", chapterOrder: 7, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "58 - 23 = ?", choices: ["33", "34", "35", "36"], correctIndex: 2, explanation: "58 - 23 = 35", difficulty: "easy" },
      { text: "76 - 42 = ?", choices: ["32", "33", "34", "35"], correctIndex: 2, explanation: "76 - 42 = 34", difficulty: "medium" },
      { text: "89 - 35 = ?", choices: ["52", "53", "54", "55"], correctIndex: 2, explanation: "89 - 35 = 54", difficulty: "medium" },
      { text: "Muốn trừ hai số có hai chữ số (không nhớ), em trừ hàng nào trước?", choices: ["Hàng chục", "Hàng đơn vị", "Trừ cả hai cùng lúc", "Không có quy tắc"], correctIndex: 1, explanation: "Em trừ hàng đơn vị trước, sau đó trừ hàng chục", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Phép trừ trong phạm vi 100 không nhớ",
      content: "Muốn trừ hai số có hai chữ số không nhớ, em đặt tính sao cho các chữ số cùng hàng thẳng cột, trừ hàng đơn vị trước, rồi trừ hàng chục.",
      examples: ["58 - 23 = 35 (8-3=5, 5-2=3)", "76 - 42 = 34 (6-2=4, 7-4=3)", "89 - 35 = 54 (9-5=4, 8-3=5)"],
    },
  });

  await add({
    title: "Giải bài toán có lời văn trong phạm vi 100",
    description: "Luyện giải các bài toán đố có lời văn với số liệu trong phạm vi 100.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 100 (không nhớ)", chapterOrder: 7, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "Một vườn có 34 cây cam, trồng thêm 15 cây nữa. Hỏi vườn có tất cả bao nhiêu cây cam?", choices: ["48", "49", "50", "47"], correctIndex: 1, explanation: "34 + 15 = 49", difficulty: "medium" },
      { text: "Lớp có 45 quyển vở, đã phát cho học sinh 23 quyển. Hỏi còn lại bao nhiêu quyển vở?", choices: ["21", "22", "23", "24"], correctIndex: 1, explanation: "45 - 23 = 22", difficulty: "medium" },
      { text: "Bài toán cho biết 'có', 'thêm' thường dùng phép tính gì?", choices: ["Phép cộng", "Phép trừ", "Phép nhân", "Phép chia"], correctIndex: 0, explanation: "'thêm' thường tương ứng với phép cộng", difficulty: "medium" },
      { text: "Bài toán cho biết 'bớt', 'còn lại' thường dùng phép tính gì?", choices: ["Phép cộng", "Phép trừ", "Phép nhân", "Phép chia"], correctIndex: 1, explanation: "'còn lại', 'bớt' thường tương ứng với phép trừ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Giải bài toán có lời văn trong phạm vi 100",
      content: "Khi đề bài có từ 'thêm', 'tất cả', 'gộp lại' → dùng phép cộng. Khi đề bài có từ 'bớt', 'còn lại', 'cho đi' → dùng phép trừ.\nLuôn đọc kỹ đề, xác định đúng phép tính trước khi giải.",
      examples: ["'Trồng thêm' → phép cộng: 34+15=49", "'Còn lại' → phép trừ: 45-23=22"],
    },
  });

  await add({
    title: "Đo độ dài bằng gang tay, bước chân",
    description: "Làm quen với cách đo độ dài bằng các đơn vị đo tự nhiên như gang tay, bước chân, và đơn vị xăng-ti-mét.",
    subject: toan, grade: lop1, chapterTitle: "Đo lường: độ dài và thời gian", chapterOrder: 8, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "Đơn vị đo độ dài chính xác thường dùng trong toán học là gì?", choices: ["Gang tay", "Bước chân", "Xăng-ti-mét (cm)", "Cân nặng"], correctIndex: 2, explanation: "Xăng-ti-mét (cm) là đơn vị đo độ dài chính xác, thống nhất", difficulty: "medium" },
      { text: "Vì sao đo bằng gang tay của các bạn khác nhau lại cho kết quả khác nhau?", choices: ["Vì gang tay mỗi người dài ngắn khác nhau", "Vì đồ vật thay đổi", "Vì không có lý do gì", "Vì đo sai luôn luôn"], correctIndex: 0, explanation: "Gang tay mỗi người dài ngắn khác nhau nên kết quả đo không thống nhất", difficulty: "medium" },
      { text: "Muốn đo chính xác chiều dài quyển sách, em nên dùng gì?", choices: ["Gang tay", "Bước chân", "Thước có chia vạch cm", "Ước lượng bằng mắt"], correctIndex: 2, explanation: "Dùng thước có chia vạch cm để đo chính xác", difficulty: "medium" },
      { text: "Bút chì dài khoảng 15cm. Con số 15 đó cho biết điều gì?", choices: ["Số lượng bút chì", "Độ dài của bút chì tính theo cm", "Cân nặng bút chì", "Giá tiền bút chì"], correctIndex: 1, explanation: "Con số 15 cho biết độ dài bút chì là 15 xăng-ti-mét", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Đo độ dài bằng gang tay, bước chân",
      content: "Có thể đo độ dài bằng các đơn vị tự nhiên như gang tay, bước chân, nhưng kết quả sẽ khác nhau tùy người đo.\nĐể đo chính xác và thống nhất, người ta dùng đơn vị xăng-ti-mét (cm) với thước có chia vạch.",
      examples: ["Gang tay của mỗi người dài ngắn khác nhau", "Thước kẻ dùng để đo chính xác bằng cm", "Bút chì dài khoảng 15cm"],
    },
  });

  await add({
    title: "Xem giờ đúng trên đồng hồ",
    description: "Học cách xem giờ đúng (giờ tròn) trên mặt đồng hồ kim.",
    subject: toan, grade: lop1, chapterTitle: "Đo lường: độ dài và thời gian", chapterOrder: 8, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "Khi kim dài chỉ số 12 và kim ngắn chỉ số 3, đồng hồ chỉ mấy giờ?", choices: ["2 giờ", "3 giờ", "4 giờ", "12 giờ"], correctIndex: 1, explanation: "Kim ngắn chỉ giờ, kim ngắn chỉ số 3 nghĩa là 3 giờ đúng", difficulty: "medium" },
      { text: "Trên mặt đồng hồ, kim nào chỉ giờ?", choices: ["Kim dài", "Kim ngắn", "Cả hai kim", "Không kim nào"], correctIndex: 1, explanation: "Kim ngắn chỉ giờ, kim dài chỉ phút", difficulty: "easy" },
      { text: "Khi xem giờ đúng, kim dài luôn chỉ vào số nào?", choices: ["Số 3", "Số 6", "Số 9", "Số 12"], correctIndex: 3, explanation: "Giờ đúng (giờ tròn) là khi kim dài chỉ đúng số 12", difficulty: "medium" },
      { text: "Em thường đi ngủ lúc 9 giờ tối. Kim ngắn trên đồng hồ lúc đó chỉ vào số nào?", choices: ["Số 6", "Số 9", "Số 12", "Số 3"], correctIndex: 1, explanation: "Kim ngắn chỉ số 9 ứng với 9 giờ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Xem giờ đúng trên đồng hồ",
      content: "Đồng hồ kim có hai kim: kim ngắn chỉ giờ, kim dài chỉ phút.\nKhi xem giờ đúng (giờ tròn), kim dài luôn chỉ vào số 12, còn kim ngắn chỉ vào số giờ tương ứng.",
      examples: ["Kim ngắn chỉ số 3, kim dài chỉ số 12 → 3 giờ đúng", "Kim ngắn chỉ số 9 → liên quan đến 9 giờ", "Giờ đúng: kim dài luôn ở số 12"],
    },
  });

  await add({
    title: "Các ngày trong tuần",
    description: "Làm quen với tên gọi và thứ tự các ngày trong tuần.",
    subject: toan, grade: lop1, chapterTitle: "Đo lường: độ dài và thời gian", chapterOrder: 8, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "Một tuần có mấy ngày?", choices: ["5 ngày", "6 ngày", "7 ngày", "8 ngày"], correctIndex: 2, explanation: "Một tuần có 7 ngày", difficulty: "easy" },
      { text: "Ngày đầu tiên trong tuần (theo lịch Việt Nam) thường là ngày nào?", choices: ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Bảy"], correctIndex: 1, explanation: "Theo lịch thường dùng ở Việt Nam, tuần thường bắt đầu từ Thứ Hai", difficulty: "medium" },
      { text: "Ngày liền sau Thứ Ba là ngày nào?", choices: ["Thứ Hai", "Thứ Tư", "Thứ Năm", "Chủ nhật"], correctIndex: 1, explanation: "Ngày liền sau Thứ Ba là Thứ Tư", difficulty: "easy" },
      { text: "Hai ngày cuối tuần thường được nghỉ học là ngày nào?", choices: ["Thứ Hai, Thứ Ba", "Thứ Sáu, Thứ Bảy", "Thứ Bảy, Chủ nhật", "Thứ Tư, Thứ Năm"], correctIndex: 2, explanation: "Thứ Bảy và Chủ nhật là hai ngày cuối tuần", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Các ngày trong tuần",
      content: "Một tuần gồm 7 ngày, theo thứ tự: Thứ Hai, Thứ Ba, Thứ Tư, Thứ Năm, Thứ Sáu, Thứ Bảy, Chủ nhật.\nThứ Bảy và Chủ nhật thường là hai ngày cuối tuần, được nghỉ học, nghỉ làm.",
      examples: ["Một tuần có 7 ngày", "Thứ Tư liền sau Thứ Ba", "Cuối tuần: Thứ Bảy, Chủ nhật"],
    },
  });

  await add({
    title: "Ôn tập các số và phép tính trong phạm vi 100",
    description: "Ôn tập tổng hợp về đọc, viết, so sánh số và các phép cộng, trừ trong phạm vi 100.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập cuối năm", chapterOrder: 9, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "35 + 24 = ?", choices: ["58", "59", "60", "57"], correctIndex: 1, explanation: "35 + 24 = 59", difficulty: "medium" },
      { text: "67 - 25 = ?", choices: ["41", "42", "43", "44"], correctIndex: 1, explanation: "67 - 25 = 42", difficulty: "medium" },
      { text: "So sánh: 78 ... 87", choices: ["78 > 87", "78 = 87", "78 < 87", "Không so sánh được"], correctIndex: 2, explanation: "78 < 87 vì hàng chục 7 < 8", difficulty: "medium" },
      { text: "Số liền sau số 99 là số nào?", choices: ["98", "100", "9", "90"], correctIndex: 1, explanation: "Số liền sau 99 là 100", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Ôn tập các số và phép tính trong phạm vi 100",
      content: "Ôn lại: cách đọc, viết, so sánh các số trong phạm vi 100; cách đặt tính cộng, trừ không nhớ; cách giải bài toán có lời văn.",
      examples: ["35 + 24 = 59", "67 - 25 = 42", "78 < 87"],
    },
  });

  await add({
    title: "Ôn tập hình học và đo lường",
    description: "Ôn tập tổng hợp về các hình phẳng, hình khối và đơn vị đo độ dài, thời gian đã học.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập cuối năm", chapterOrder: 9, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "Hình nào có 4 cạnh bằng nhau?", choices: ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"], correctIndex: 1, explanation: "Hình vuông có 4 cạnh bằng nhau", difficulty: "easy" },
      { text: "Khối nào có 6 mặt đều là hình vuông?", choices: ["Khối cầu", "Khối lập phương", "Khối hộp chữ nhật", "Khối trụ"], correctIndex: 1, explanation: "Khối lập phương có 6 mặt đều là hình vuông", difficulty: "medium" },
      { text: "Đơn vị nào dùng để đo độ dài chính xác?", choices: ["Gang tay", "Xăng-ti-mét", "Bước chân", "Sải tay"], correctIndex: 1, explanation: "Xăng-ti-mét (cm) là đơn vị đo độ dài chính xác, thống nhất", difficulty: "medium" },
      { text: "Một tuần có mấy ngày?", choices: ["5", "6", "7", "8"], correctIndex: 2, explanation: "Một tuần có 7 ngày", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập hình học và đo lường",
      content: "Ôn lại các hình phẳng (vuông, tròn, tam giác, chữ nhật), khối hình (lập phương, hộp chữ nhật, cầu), và cách đo độ dài, xem giờ, các ngày trong tuần.",
      examples: ["Hình vuông: 4 cạnh bằng nhau", "Khối lập phương: 6 mặt vuông", "1 tuần = 7 ngày"],
    },
  });

  // ===================== TIẾNG VIỆT LỚP 1 — HỌC KỲ 1 =====================

  await add({
    title: "Các nét cơ bản trong chữ viết",
    description: "Làm quen với các nét chữ cơ bản: nét thẳng, nét cong, nét móc, nét khuyết.",
    subject: tv, grade: lop1, chapterTitle: "Làm quen chữ cái và nét cơ bản", chapterOrder: 1, semester: 1, order: 1, isTrial: true,
    questions: [
      { text: "Nét chữ nào là nét thẳng đứng?", choices: ["|", "○", "~", "\\"], correctIndex: 0, explanation: "'|' là nét thẳng đứng", difficulty: "easy" },
      { text: "Chữ cái nào được viết bằng một nét cong tròn khép kín?", choices: ["o", "l", "t", "i"], correctIndex: 0, explanation: "Chữ 'o' được viết bằng một nét cong tròn khép kín", difficulty: "easy" },
      { text: "Nét cơ bản nào thường xuất hiện trong chữ 'l', 'i', 'h'?", choices: ["Nét cong", "Nét thẳng đứng", "Nét khuyết trên", "Nét móc"], correctIndex: 1, explanation: "Chữ 'l', 'i', 'h' đều có nét thẳng đứng", difficulty: "medium" },
      { text: "Vì sao cần luyện viết các nét cơ bản trước khi viết chữ cái?", choices: ["Không cần thiết", "Giúp viết chữ cái đúng và đẹp hơn", "Chỉ để trang trí", "Không có lý do"], correctIndex: 1, explanation: "Luyện nét cơ bản giúp em viết các chữ cái chính xác và đẹp hơn", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Các nét cơ bản trong chữ viết",
      content: "Các nét chữ cơ bản gồm: nét thẳng (ngang, đứng, xiên), nét cong (cong kín, cong hở), nét móc, nét khuyết.\nMỗi chữ cái được tạo thành từ một hoặc nhiều nét cơ bản kết hợp lại.",
      examples: ["Chữ 'o': nét cong kín", "Chữ 'l': nét thẳng đứng có nét khuyết", "Chữ 'i': nét thẳng đứng ngắn"],
    },
  });

  await add({
    title: "Làm quen nhóm chữ cái a, b, c, d, đ",
    description: "Nhận biết mặt chữ và cách đọc các chữ cái a, b, c, d, đ.",
    subject: tv, grade: lop1, chapterTitle: "Làm quen chữ cái và nét cơ bản", chapterOrder: 1, semester: 1, order: 2, isTrial: false,
    questions: [
      { text: "Chữ 'a' đọc là gì?", choices: ["a", "b", "c", "d"], correctIndex: 0, explanation: "Chữ 'a' đọc là 'a'", difficulty: "easy" },
      { text: "Chữ nào có dấu móc phía trên để phân biệt với chữ 'd'?", choices: ["a", "b", "c", "đ"], correctIndex: 3, explanation: "Chữ 'đ' có nét ngang thêm vào chữ 'd' để phân biệt", difficulty: "medium" },
      { text: "Từ 'ba' được ghép từ những chữ cái nào?", choices: ["b, a", "a, b", "d, a", "c, a"], correctIndex: 0, explanation: "'ba' ghép từ chữ 'b' và chữ 'a'", difficulty: "medium" },
      { text: "Chữ nào đứng đầu trong nhóm a, b, c, d, đ theo thứ tự bảng chữ cái?", choices: ["b", "a", "c", "d"], correctIndex: 1, explanation: "'a' đứng đầu trong bảng chữ cái tiếng Việt", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhóm chữ cái a, b, c, d, đ",
      content: "Đây là 5 chữ cái đầu tiên trong bảng chữ cái tiếng Việt. Chữ 'đ' khác chữ 'd' ở nét ngang thêm vào giữa thân chữ.\nCác chữ cái này có thể ghép với nhau hoặc với các âm khác để tạo thành tiếng.",
      examples: ["a, b, c, d, đ là 5 chữ cái đầu bảng chữ cái", "'ba' = b + a", "'đa' khác 'da' vì chữ đầu khác nhau"],
    },
  });

  await add({
    title: "Làm quen nhóm chữ cái e, ê, g, h, i",
    description: "Nhận biết mặt chữ và cách đọc các chữ cái e, ê, g, h, i.",
    subject: tv, grade: lop1, chapterTitle: "Làm quen chữ cái và nét cơ bản", chapterOrder: 1, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Chữ 'ê' khác chữ 'e' ở điểm nào?", choices: ["Không khác gì", "Có thêm dấu mũ trên đầu", "Có thêm dấu móc", "Viết ngược lại"], correctIndex: 1, explanation: "Chữ 'ê' có thêm dấu mũ (^) trên đầu chữ 'e'", difficulty: "medium" },
      { text: "Từ 'ghế' được ghép từ những chữ cái nào?", choices: ["g, h, ê", "g, ê", "h, ê", "g, h, e"], correctIndex: 0, explanation: "'ghế' ghép từ 'gh' (g, h) và 'ê' cùng dấu sắc", difficulty: "medium" },
      { text: "Chữ 'i' thường được viết với nét gì phía trên?", choices: ["Dấu chấm nhỏ", "Dấu mũ", "Dấu móc", "Không có gì"], correctIndex: 0, explanation: "Chữ 'i' viết thường có dấu chấm nhỏ phía trên", difficulty: "easy" },
      { text: "Chữ nào trong nhóm này là nguyên âm: e, g, h, i?", choices: ["g", "h", "e và i", "Không có nguyên âm nào"], correctIndex: 2, explanation: "'e' và 'i' là nguyên âm, còn 'g', 'h' là phụ âm", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhóm chữ cái e, ê, g, h, i",
      content: "Nhóm chữ cái này gồm 2 nguyên âm (e, ê, i — thực chất e, ê, i đều là nguyên âm) và 2 phụ âm (g, h).\nChữ 'ê' có dấu mũ phân biệt với chữ 'e'.",
      examples: ["e, ê, i là nguyên âm", "g, h là phụ âm", "'ghế' = gh + ê + dấu sắc"],
    },
  });

  await add({
    title: "Ghép âm đầu với vần tạo thành tiếng",
    description: "Luyện ghép âm đầu (phụ âm) với vần để tạo thành tiếng có nghĩa.",
    subject: tv, grade: lop1, chapterTitle: "Ghép âm, vần, tiếng", chapterOrder: 3, semester: 1, order: 1, isTrial: true,
    questions: [
      { text: "Ghép âm 'b' với vần 'a' được tiếng gì?", choices: ["ba", "ab", "ab", "bà"], correctIndex: 0, explanation: "'b' + 'a' = 'ba'", difficulty: "easy" },
      { text: "Ghép âm 'm' với vần 'e' được tiếng gì?", choices: ["em", "me", "mê", "am"], correctIndex: 1, explanation: "'m' + 'e' = 'me'", difficulty: "easy" },
      { text: "Tiếng 'ca' được ghép từ âm và vần nào?", choices: ["c + a", "a + c", "k + a", "q + a"], correctIndex: 0, explanation: "'ca' = âm 'c' ghép với vần 'a'", difficulty: "medium" },
      { text: "Muốn tạo thành tiếng, ta cần có ít nhất bộ phận nào?", choices: ["Chỉ cần âm đầu", "Chỉ cần vần", "Cần có vần (có thể có hoặc không có âm đầu)", "Không cần gì cả"], correctIndex: 2, explanation: "Một tiếng bắt buộc phải có vần, âm đầu có thể có hoặc không", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Ghép âm đầu với vần tạo thành tiếng",
      content: "Một tiếng trong tiếng Việt thường gồm âm đầu (phụ âm) ghép với vần. Ví dụ: 'b' + 'a' = 'ba'.\nMột số tiếng chỉ có vần mà không có âm đầu, ví dụ: 'ăn', 'em'.",
      examples: ["b + a = ba", "m + e = me", "c + a = ca"],
    },
  });

  await add({
    title: "Vần có âm cuối đơn giản (an, at, am...)",
    description: "Làm quen với các vần có âm cuối đơn giản như an, at, am, ac.",
    subject: tv, grade: lop1, chapterTitle: "Ghép âm, vần, tiếng", chapterOrder: 3, semester: 1, order: 2, isTrial: false,
    questions: [
      { text: "Vần 'an' gồm những âm nào?", choices: ["a + n", "a + m", "a + t", "a + c"], correctIndex: 0, explanation: "Vần 'an' gồm âm 'a' và âm cuối 'n'", difficulty: "easy" },
      { text: "Tiếng 'bàn' có vần gì?", choices: ["an", "at", "am", "ac"], correctIndex: 0, explanation: "'bàn' có vần 'an' (b + an + dấu huyền)", difficulty: "medium" },
      { text: "Tiếng 'mát' có vần gì?", choices: ["an", "at", "am", "ac"], correctIndex: 1, explanation: "'mát' có vần 'at' (m + at + dấu sắc)", difficulty: "medium" },
      { text: "Từ nào có vần 'am'?", choices: ["bàn", "mát", "làm", "bác"], correctIndex: 2, explanation: "'làm' có vần 'am' (l + am + dấu huyền)", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Vần có âm cuối đơn giản",
      content: "Vần có âm cuối là vần gồm âm chính kết hợp với một âm cuối, ví dụ: an (a+n), at (a+t), am (a+m), ac (a+c).\nCác tiếng có vần này thường gặp trong nhiều từ quen thuộc hằng ngày.",
      examples: ["bàn: có vần 'an'", "mát: có vần 'at'", "làm: có vần 'am'"],
    },
  });

  await add({
    title: "Luyện đọc tiếng, từ có vần đơn giản",
    description: "Luyện đọc trơn các tiếng, từ ngữ đã học có chứa vần đơn giản.",
    subject: tv, grade: lop1, chapterTitle: "Ghép âm, vần, tiếng", chapterOrder: 3, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Từ 'con cá' gồm mấy tiếng?", choices: ["1 tiếng", "2 tiếng", "3 tiếng", "4 tiếng"], correctIndex: 1, explanation: "'con cá' gồm 2 tiếng: 'con' và 'cá'", difficulty: "easy" },
      { text: "Tiếng nào trong từ 'bà ngoại' có dấu huyền?", choices: ["bà", "ngoại", "Cả hai", "Không tiếng nào"], correctIndex: 0, explanation: "'bà' mang dấu huyền", difficulty: "medium" },
      { text: "Đọc trơn nghĩa là đọc như thế nào?", choices: ["Đọc từng chữ cái rời rạc", "Đọc liền mạch cả tiếng, cả từ không đánh vần", "Không đọc gì cả", "Chỉ đọc âm đầu"], correctIndex: 1, explanation: "Đọc trơn là đọc liền mạch cả tiếng mà không cần đánh vần từng âm", difficulty: "medium" },
      { text: "Từ nào sau đây có 2 tiếng: 'mẹ', 'bố mẹ', 'con'?", choices: ["mẹ", "bố mẹ", "con", "Không từ nào"], correctIndex: 1, explanation: "'bố mẹ' gồm 2 tiếng: 'bố' và 'mẹ'", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện đọc tiếng, từ có vần đơn giản",
      content: "Đọc trơn là kỹ năng đọc liền mạch cả tiếng, cả từ mà không cần đánh vần từng âm một, giúp em đọc nhanh và hiểu nghĩa nhanh hơn.\nMột từ có thể gồm một hoặc nhiều tiếng ghép lại.",
      examples: ["'con cá' = 2 tiếng", "'bố mẹ' = 2 tiếng", "Đọc trơn: đọc liền mạch không đánh vần"],
    },
  });

  // ===================== TIẾNG VIỆT LỚP 1 — HỌC KỲ 2 =====================

  await add({
    title: "Đọc hiểu đoạn văn ngắn về gia đình",
    description: "Luyện đọc và trả lời câu hỏi đơn giản về một đoạn văn ngắn kể về gia đình.",
    subject: tv, grade: lop1, chapterTitle: "Luyện đọc đoạn văn ngắn", chapterOrder: 5, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "Đọc đoạn văn: 'Nhà em có bốn người: bố, mẹ, em và em trai. Mỗi tối cả nhà cùng ăn cơm vui vẻ.' Nhà bạn nhỏ có mấy người?", choices: ["3 người", "4 người", "5 người", "2 người"], correctIndex: 1, explanation: "Đoạn văn nói nhà có 4 người: bố, mẹ, em và em trai", difficulty: "easy" },
      { text: "Trong đoạn văn trên, gia đình thường làm gì vào mỗi tối?", choices: ["Đi chơi", "Cùng ăn cơm vui vẻ", "Xem phim", "Không làm gì"], correctIndex: 1, explanation: "Đoạn văn nói cả nhà cùng ăn cơm vui vẻ mỗi tối", difficulty: "easy" },
      { text: "Muốn hiểu một đoạn văn, em cần làm gì trước tiên?", choices: ["Đọc kỹ từng câu trong đoạn", "Đoán nội dung mà không đọc", "Bỏ qua đoạn văn", "Chỉ đọc câu cuối"], correctIndex: 0, explanation: "Cần đọc kỹ từng câu để hiểu đúng nội dung đoạn văn", difficulty: "medium" },
      { text: "Em trai trong đoạn văn là ai trong gia đình?", choices: ["Người lớn tuổi nhất", "Em nhỏ trong nhà", "Hàng xóm", "Bạn học"], correctIndex: 1, explanation: "'em trai' là người em nhỏ trong gia đình bạn nhỏ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đọc hiểu đoạn văn ngắn về gia đình",
      content: "Khi đọc một đoạn văn ngắn, em cần đọc kỹ từng câu, chú ý các từ ngữ chỉ người, chỉ hoạt động để trả lời đúng câu hỏi về nội dung đoạn văn.",
      examples: ["Đoạn văn về gia đình thường kể tên các thành viên", "Chú ý các từ chỉ số lượng người trong nhà", "Chú ý hoạt động chung của gia đình"],
    },
  });

  await add({
    title: "Đọc hiểu đoạn văn ngắn về trường lớp",
    description: "Luyện đọc và trả lời câu hỏi đơn giản về một đoạn văn ngắn kể về trường lớp.",
    subject: tv, grade: lop1, chapterTitle: "Luyện đọc đoạn văn ngắn", chapterOrder: 5, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "Đọc đoạn văn: 'Lớp em có cô giáo hiền và các bạn thân thiện. Giờ ra chơi, chúng em cùng nhảy dây.' Giờ ra chơi các bạn làm gì?", choices: ["Học bài", "Cùng nhảy dây", "Ngủ trưa", "Ăn cơm"], correctIndex: 1, explanation: "Đoạn văn nói giờ ra chơi các bạn cùng nhảy dây", difficulty: "easy" },
      { text: "Cô giáo trong đoạn văn được miêu tả như thế nào?", choices: ["Nghiêm khắc", "Hiền", "Buồn bã", "Không được nhắc đến"], correctIndex: 1, explanation: "Đoạn văn miêu tả cô giáo hiền", difficulty: "easy" },
      { text: "Từ 'thân thiện' trong đoạn văn có nghĩa gần với từ nào?", choices: ["Dễ mến, hòa đồng", "Khó gần", "Lạnh lùng", "Nóng giận"], correctIndex: 0, explanation: "'thân thiện' nghĩa là dễ mến, hòa đồng với mọi người", difficulty: "medium" },
      { text: "Đoạn văn trên nói về nội dung gì?", choices: ["Gia đình bạn nhỏ", "Lớp học và giờ ra chơi", "Một chuyến du lịch", "Một món ăn"], correctIndex: 1, explanation: "Đoạn văn nói về lớp học và hoạt động giờ ra chơi", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đọc hiểu đoạn văn ngắn về trường lớp",
      content: "Khi đọc đoạn văn về trường lớp, em chú ý các từ ngữ miêu tả thầy cô, bạn bè và các hoạt động ở trường để trả lời đúng câu hỏi.",
      examples: ["Chú ý từ miêu tả tính cách (hiền, thân thiện)", "Chú ý hoạt động ở trường (ra chơi, học bài)", "Đọc kỹ để trả lời đúng câu hỏi nội dung"],
    },
  });

  await add({
    title: "Luyện nói về bản thân và gia đình",
    description: "Luyện kỹ năng nói giới thiệu về bản thân và các thành viên trong gia đình.",
    subject: tv, grade: lop1, chapterTitle: "Luyện nói và kể chuyện đơn giản", chapterOrder: 6, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "Khi tự giới thiệu về bản thân, em nên nói điều gì đầu tiên?", choices: ["Tên của em", "Món ăn yêu thích", "Màu sắc yêu thích", "Không cần nói gì"], correctIndex: 0, explanation: "Khi giới thiệu bản thân, nên nói tên của mình trước tiên", difficulty: "easy" },
      { text: "Câu nào là câu giới thiệu bản thân phù hợp?", choices: ["Hôm nay trời đẹp.", "Em tên là Lan, em học lớp 1A.", "Con mèo đang ngủ.", "Bàn ghế màu nâu."], correctIndex: 1, explanation: "'Em tên là Lan, em học lớp 1A.' là câu giới thiệu bản thân phù hợp", difficulty: "medium" },
      { text: "Khi giới thiệu về gia đình, em có thể nói về điều gì?", choices: ["Số người trong nhà, tên bố mẹ", "Chỉ nói về đồ chơi", "Không nói gì về gia đình", "Chỉ nói về trường học"], correctIndex: 0, explanation: "Có thể giới thiệu số người trong nhà, tên bố mẹ, anh chị em", difficulty: "medium" },
      { text: "Khi nói trước lớp, em nên nói như thế nào?", choices: ["Nói thật nhỏ, không rõ ràng", "Nói rõ ràng, tự tin, đủ nghe", "Nói thật nhanh không cần rõ", "Không cần nhìn mọi người"], correctIndex: 1, explanation: "Nên nói rõ ràng, tự tin và đủ để mọi người nghe thấy", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện nói về bản thân và gia đình",
      content: "Khi giới thiệu về bản thân, em nói rõ tên, lớp học. Khi giới thiệu gia đình, em có thể nói về số người trong nhà, tên bố mẹ, anh chị em.\nKhi nói, cần nói rõ ràng, tự tin, đủ to để người nghe hiểu.",
      examples: ["'Em tên là Lan, em học lớp 1A.'", "'Nhà em có bốn người: bố, mẹ, em và em trai.'", "Nói rõ ràng, tự tin trước lớp"],
    },
  });

  await add({
    title: "Kể lại một câu chuyện ngắn đã nghe",
    description: "Luyện kỹ năng kể lại một câu chuyện ngắn theo đúng trình tự đã nghe hoặc đã đọc.",
    subject: tv, grade: lop1, chapterTitle: "Luyện nói và kể chuyện đơn giản", chapterOrder: 6, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "Khi kể lại câu chuyện, em cần kể theo trình tự nào?", choices: ["Trình tự diễn ra của câu chuyện", "Kể ngẫu nhiên không theo thứ tự", "Chỉ kể đoạn cuối", "Không cần trình tự"], correctIndex: 0, explanation: "Cần kể theo đúng trình tự diễn ra của câu chuyện để người nghe dễ hiểu", difficulty: "medium" },
      { text: "Một câu chuyện thường có phần nào sau đây?", choices: ["Chỉ có phần đầu", "Mở đầu, diễn biến, kết thúc", "Chỉ có phần kết", "Không có phần nào cụ thể"], correctIndex: 1, explanation: "Câu chuyện thường có phần mở đầu, diễn biến và kết thúc", difficulty: "medium" },
      { text: "Khi kể chuyện, giọng nói nên như thế nào?", choices: ["Đều đều không cảm xúc", "Có ngữ điệu, thể hiện cảm xúc phù hợp", "Nói thật nhanh không rõ", "Không cần diễn cảm"], correctIndex: 1, explanation: "Giọng kể nên có ngữ điệu, thể hiện cảm xúc để câu chuyện sinh động hơn", difficulty: "medium" },
      { text: "Nếu quên một chi tiết trong câu chuyện, em nên làm gì?", choices: ["Dừng lại và không kể tiếp", "Kể tiếp phần mình nhớ, không cần lo lắng", "Khóc", "Bỏ cuộc"], correctIndex: 1, explanation: "Nên bình tĩnh kể tiếp phần mình nhớ, không cần quá lo lắng về chi tiết nhỏ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Kể lại một câu chuyện ngắn đã nghe",
      content: "Khi kể lại câu chuyện, em cần kể theo đúng trình tự: mở đầu, diễn biến, kết thúc. Giọng kể nên có ngữ điệu phù hợp với nội dung câu chuyện.",
      examples: ["Kể theo trình tự: đầu tiên... sau đó... cuối cùng...", "Giọng kể vui khi kể đoạn vui, giọng trầm khi kể đoạn buồn", "Không cần lo lắng nếu quên chi tiết nhỏ"],
    },
  });

  await add({
    title: "Luyện viết chữ hoa cơ bản",
    description: "Luyện viết một số chữ cái viết hoa cơ bản đúng nét, đúng độ cao.",
    subject: tv, grade: lop1, chapterTitle: "Luyện viết chữ và chính tả cơ bản", chapterOrder: 7, semester: 2, order: 1, isTrial: true,
    questions: [
      { text: "Chữ hoa thường được viết ở đâu trong câu?", choices: ["Giữa câu", "Đầu câu và tên riêng", "Cuối câu", "Không có quy tắc"], correctIndex: 1, explanation: "Chữ hoa thường viết ở đầu câu và khi viết tên riêng", difficulty: "medium" },
      { text: "Tên riêng của người, ví dụ 'Lan', cần viết chữ cái đầu như thế nào?", choices: ["Viết thường", "Viết hoa", "Không viết", "Viết in nghiêng"], correctIndex: 1, explanation: "Tên riêng luôn viết hoa chữ cái đầu", difficulty: "medium" },
      { text: "Câu 'em đi học.' viết đúng chính tả cần sửa gì?", choices: ["Không cần sửa gì", "Viết hoa chữ 'Em' đầu câu", "Bỏ dấu chấm", "Viết hoa chữ 'học'"], correctIndex: 1, explanation: "Đầu câu cần viết hoa: 'Em đi học.'", difficulty: "medium" },
      { text: "Chữ hoa 'B' và chữ thường 'b' khác nhau ở điểm nào?", choices: ["Không khác gì", "Chữ hoa thường lớn hơn và có hình dáng khác", "Chữ thường luôn lớn hơn", "Không có sự khác biệt về hình dáng"], correctIndex: 1, explanation: "Chữ hoa thường có kích thước lớn hơn và hình dáng nét chữ khác với chữ thường", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện viết chữ hoa cơ bản",
      content: "Chữ hoa được dùng ở đầu câu và khi viết tên riêng (tên người, tên địa danh...).\nKhi viết chữ hoa, cần chú ý đúng độ cao, đúng nét theo mẫu chữ.",
      examples: ["Đầu câu viết hoa: 'Em đi học.'", "Tên riêng viết hoa: 'Lan', 'Hà Nội'", "Chữ hoa có hình dáng và độ cao khác chữ thường"],
    },
  });

  await add({
    title: "Chính tả: nghe viết từ, câu ngắn",
    description: "Luyện kỹ năng nghe và viết đúng chính tả các từ, câu ngắn đơn giản.",
    subject: tv, grade: lop1, chapterTitle: "Luyện viết chữ và chính tả cơ bản", chapterOrder: 7, semester: 2, order: 2, isTrial: false,
    questions: [
      { text: "Khi viết chính tả, em cần làm gì trước khi viết?", choices: ["Viết ngay không cần nghe kỹ", "Nghe kỹ từ hoặc câu được đọc", "Đoán chữ ngẫu nhiên", "Không cần chú ý"], correctIndex: 1, explanation: "Cần nghe kỹ từ hoặc câu trước khi viết để viết đúng", difficulty: "medium" },
      { text: "Từ nào viết đúng chính tả: 'sách' hay 'xách'?", choices: ["Cả hai đều đúng và giống nghĩa", "Tùy theo nghĩa của từ trong câu", "Luôn luôn là 'sách'", "Luôn luôn là 'xách'"], correctIndex: 1, explanation: "'sách' (đồ vật để đọc) và 'xách' (mang, cầm) là hai từ khác nghĩa, viết khác nhau tùy ngữ cảnh", difficulty: "hard" },
      { text: "Cuối câu kể, em cần viết dấu gì?", choices: ["Dấu phẩy", "Dấu chấm", "Dấu hỏi", "Không cần dấu gì"], correctIndex: 1, explanation: "Cuối câu kể cần có dấu chấm", difficulty: "easy" },
      { text: "Khi viết sai chính tả một từ, em nên làm gì?", choices: ["Để nguyên không sửa", "Sửa lại cho đúng và ghi nhớ", "Xóa cả câu", "Không cần quan tâm"], correctIndex: 1, explanation: "Nên sửa lại từ viết sai và ghi nhớ để lần sau viết đúng", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Chính tả — nghe viết từ, câu ngắn",
      content: "Khi viết chính tả, em cần nghe kỹ từ hoặc câu được đọc, sau đó viết lại chính xác, chú ý dấu câu và dấu thanh.\nCuối câu kể cần có dấu chấm, đầu câu cần viết hoa.",
      examples: ["Nghe kỹ trước khi viết", "Cuối câu kể: dùng dấu chấm", "Đầu câu: viết hoa chữ cái đầu tiên"],
    },
  });

  console.log(`[expandLop1FullCurriculum] Hoàn tất: đã thêm ${count} chủ điểm mới, hoàn thiện lộ trình đầy đủ Lớp 1.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
