require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const seedAdmin = require("./seedAdmin");

const GRADES = [
  { name: "Lớp 1", slug: "lop-1", order: 1 },
  { name: "Lớp 2", slug: "lop-2", order: 2 },
  { name: "Lớp 3", slug: "lop-3", order: 3 },
  { name: "Lớp 4", slug: "lop-4", order: 4 },
  { name: "Lớp 5", slug: "lop-5", order: 5 },
];

const SUBJECTS = [
  { name: "Toán", slug: "toan" },
  { name: "Tiếng Việt", slug: "tieng-viet" },
];

async function upsert(Model, filterKey, docs) {
  const results = [];
  for (const doc of docs) {
    const found = await Model.findOneAndUpdate(
      { [filterKey]: doc[filterKey] },
      doc,
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    results.push(found);
  }
  return results;
}

const chapterCache = new Map();
async function getChapter(chapterTitle, subject, grade) {
  const key = `${subject._id}:${grade._id}:${chapterTitle}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const order = chapterCache.size + 1;
  const chapter = await Chapter.findOneAndUpdate(
    { title: chapterTitle, subject: subject._id, grade: grade._id },
    { title: chapterTitle, subject: subject._id, grade: grade._id, order },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  chapterCache.set(key, chapter);
  return chapter;
}

async function seedLessonWithQuestions({ title, description, subject, grade, chapterTitle, order, isTrial = false, questions }) {
  const chapter = await getChapter(chapterTitle, subject, grade);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true, isTrial },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  const existingCount = await Question.countDocuments({ lesson: lesson._id });
  if (existingCount === 0) {
    await Question.insertMany(
      questions.map((q, idx) => ({ ...q, lesson: lesson._id, order: idx }))
    );
  }
  return lesson;
}

// Simple original counting illustration (a + b objects), embedded as inline SVG — no external/copyrighted assets.
function countingImage(a, b) {
  const dotsA = Array.from({ length: a }, (_, i) => `<circle cx="${24 + i * 34}" cy="40" r="14" fill="#00b14f" />`).join("");
  const dotsB = Array.from({ length: b }, (_, i) => `<circle cx="${24 + (a + i) * 34 + 30}" cy="40" r="14" fill="#ff8a00" />`).join("");
  const plusX = 24 + a * 34 + 5;
  const width = 24 + (a + b) * 34 + 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 80" width="${width}" height="80">${dotsA}<text x="${plusX}" y="48" font-size="28" font-weight="bold" fill="#0b2340">+</text>${dotsB}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[seed] Đã kết nối MongoDB");

  await seedAdmin();

  const grades = await upsert(Grade, "slug", GRADES);
  const subjects = await upsert(Subject, "slug", SUBJECTS);

  const lop1 = grades.find((g) => g.slug === "lop-1");
  const lop2 = grades.find((g) => g.slug === "lop-2");
  const lop3 = grades.find((g) => g.slug === "lop-3");
  const lop4 = grades.find((g) => g.slug === "lop-4");
  const lop5 = grades.find((g) => g.slug === "lop-5");
  const toan = subjects.find((s) => s.slug === "toan");
  const tiengViet = subjects.find((s) => s.slug === "tieng-viet");

  await seedLessonWithQuestions({
    title: "Phép cộng trong phạm vi 10",
    description: "Luyện tập cộng hai số có tổng không quá 10.",
    subject: toan,
    grade: lop1,
    chapterTitle: "Phép cộng, phép trừ trong phạm vi 10",
    order: 1,
    isTrial: true,
    questions: [
      { text: "2 + 3 = ?", imageUrl: countingImage(2, 3), choices: ["4", "5", "6", "7"], correctIndex: 1, explanation: "2 + 3 = 5" },
      { text: "4 + 4 = ?", imageUrl: countingImage(4, 4), choices: ["7", "8", "9", "6"], correctIndex: 1, explanation: "4 + 4 = 8" },
      { text: "1 + 6 = ?", imageUrl: countingImage(1, 6), choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "1 + 6 = 7" },
      { text: "5 + 5 = ?", imageUrl: countingImage(5, 5), choices: ["9", "10", "11", "8"], correctIndex: 1, explanation: "5 + 5 = 10" },
      { text: "3 + 3 = ?", imageUrl: countingImage(3, 3), choices: ["5", "6", "7", "4"], correctIndex: 1, explanation: "3 + 3 = 6" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Phép trừ trong phạm vi 10",
    description: "Luyện tập trừ hai số trong phạm vi 10.",
    subject: toan,
    grade: lop1,
    chapterTitle: "Phép cộng, phép trừ trong phạm vi 10",
    order: 2,
    questions: [
      { text: "9 - 4 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "9 - 4 = 5" },
      { text: "7 - 2 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "7 - 2 = 5" },
      { text: "10 - 6 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "10 - 6 = 4" },
      { text: "8 - 3 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "8 - 3 = 5" },
      { text: "6 - 1 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "6 - 1 = 5" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Phép nhân bảng 2",
    description: "Luyện tập nhân với 2.",
    subject: toan,
    grade: lop2,
    chapterTitle: "Phép nhân và phép cộng nâng cao",
    order: 1,
    questions: [
      { text: "2 x 3 = ?", choices: ["4", "6", "8", "5"], correctIndex: 1, explanation: "2 x 3 = 6" },
      { text: "2 x 5 = ?", choices: ["8", "10", "12", "9"], correctIndex: 1, explanation: "2 x 5 = 10" },
      { text: "2 x 7 = ?", choices: ["12", "14", "16", "13"], correctIndex: 1, explanation: "2 x 7 = 14" },
      { text: "2 x 9 = ?", choices: ["16", "18", "20", "17"], correctIndex: 1, explanation: "2 x 9 = 18" },
      { text: "2 x 4 = ?", choices: ["6", "8", "10", "7"], correctIndex: 1, explanation: "2 x 4 = 8" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Dấu câu cơ bản",
    description: "Nhận biết dấu chấm, dấu phẩy, dấu hỏi.",
    subject: tiengViet,
    grade: lop1,
    chapterTitle: "Từ và câu cơ bản",
    order: 1,
    isTrial: true,
    questions: [
      {
        text: "Câu hỏi thường kết thúc bằng dấu gì?",
        choices: ["Dấu chấm", "Dấu hỏi", "Dấu phẩy", "Dấu chấm than"],
        correctIndex: 1,
        explanation: "Câu hỏi kết thúc bằng dấu hỏi (?)",
      },
      {
        text: "Câu kể thường kết thúc bằng dấu gì?",
        choices: ["Dấu chấm", "Dấu hỏi", "Dấu phẩy", "Dấu ngoặc kép"],
        correctIndex: 0,
        explanation: "Câu kể thường kết thúc bằng dấu chấm (.)",
      },
      {
        text: "Từ nào sau đây là danh từ?",
        choices: ["Chạy", "Đẹp", "Cái bàn", "Nhanh"],
        correctIndex: 2,
        explanation: "'Cái bàn' là danh từ chỉ sự vật",
      },
      {
        text: "Từ nào sau đây là động từ?",
        choices: ["Học", "Cây", "Nhà", "Xanh"],
        correctIndex: 0,
        explanation: "'Học' là động từ chỉ hành động",
      },
      {
        text: "Từ nào sau đây là tính từ?",
        choices: ["Bàn", "Chạy", "Xanh", "Học sinh"],
        correctIndex: 2,
        explanation: "'Xanh' là tính từ chỉ đặc điểm",
      },
    ],
  });

  await seedLessonWithQuestions({
    title: "Phép cộng có nhớ trong phạm vi 100",
    description: "Luyện tập cộng hai số có nhớ.",
    subject: toan,
    grade: lop2,
    chapterTitle: "Phép nhân và phép cộng nâng cao",
    order: 2,
    questions: [
      { text: "27 + 15 = ?", choices: ["42", "32", "41", "52"], correctIndex: 0, explanation: "27 + 15 = 42" },
      { text: "38 + 26 = ?", choices: ["54", "64", "63", "74"], correctIndex: 1, explanation: "38 + 26 = 64" },
      { text: "45 + 19 = ?", choices: ["54", "64", "63", "74"], correctIndex: 1, explanation: "45 + 19 = 64" },
      { text: "56 + 28 = ?", choices: ["74", "84", "94", "64"], correctIndex: 1, explanation: "56 + 28 = 84" },
      { text: "19 + 17 = ?", choices: ["26", "36", "46", "16"], correctIndex: 1, explanation: "19 + 17 = 36" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Từ chỉ sự vật, hoạt động, đặc điểm",
    description: "Phân biệt các loại từ cơ bản trong câu.",
    subject: tiengViet,
    grade: lop2,
    chapterTitle: "Từ loại tiếng Việt",
    order: 1,
    questions: [
      { text: "Từ nào chỉ sự vật?", choices: ["Chạy", "Cây bàng", "Đẹp", "Nhanh"], correctIndex: 1, explanation: "'Cây bàng' là từ chỉ sự vật" },
      { text: "Từ nào chỉ hoạt động?", choices: ["Bơi lội", "Con mèo", "Xinh xắn", "Cái bút"], correctIndex: 0, explanation: "'Bơi lội' là từ chỉ hoạt động" },
      { text: "Từ nào chỉ đặc điểm?", choices: ["Học tập", "Bàn ghế", "Cao lớn", "Chạy nhảy"], correctIndex: 2, explanation: "'Cao lớn' là từ chỉ đặc điểm" },
      { text: "Trong câu 'Bạn Lan hát rất hay', từ nào chỉ hoạt động?", choices: ["Bạn Lan", "Hát", "Rất", "Hay"], correctIndex: 1, explanation: "'Hát' là từ chỉ hoạt động" },
      { text: "Từ nào chỉ đặc điểm của con vật?", choices: ["Nhảy", "Con thỏ", "Nhanh nhẹn", "Ăn cỏ"], correctIndex: 2, explanation: "'Nhanh nhẹn' là từ chỉ đặc điểm" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Bảng nhân 3, 4, 5",
    description: "Luyện tập các bảng nhân 3, 4, 5.",
    subject: toan,
    grade: lop3,
    chapterTitle: "Bảng nhân",
    order: 1,
    questions: [
      { text: "3 x 6 = ?", choices: ["16", "18", "21", "15"], correctIndex: 1, explanation: "3 x 6 = 18" },
      { text: "4 x 7 = ?", choices: ["24", "28", "32", "21"], correctIndex: 1, explanation: "4 x 7 = 28" },
      { text: "5 x 8 = ?", choices: ["35", "40", "45", "30"], correctIndex: 1, explanation: "5 x 8 = 40" },
      { text: "4 x 9 = ?", choices: ["32", "36", "40", "28"], correctIndex: 1, explanation: "4 x 9 = 36" },
      { text: "5 x 6 = ?", choices: ["25", "30", "35", "20"], correctIndex: 1, explanation: "5 x 6 = 30" },
      { text: "3 x 9 = ?", choices: ["24", "27", "30", "21"], correctIndex: 1, explanation: "3 x 9 = 27" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Từ đồng nghĩa, trái nghĩa",
    description: "Nhận biết và sử dụng từ đồng nghĩa, trái nghĩa.",
    subject: tiengViet,
    grade: lop3,
    chapterTitle: "Từ vựng nâng cao",
    order: 1,
    questions: [
      { text: "Từ nào đồng nghĩa với 'chăm chỉ'?", choices: ["Lười biếng", "Siêng năng", "Nhanh nhẹn", "Vui vẻ"], correctIndex: 1, explanation: "'Siêng năng' đồng nghĩa với 'chăm chỉ'" },
      { text: "Từ nào trái nghĩa với 'cao'?", choices: ["To", "Thấp", "Dài", "Rộng"], correctIndex: 1, explanation: "'Thấp' trái nghĩa với 'cao'" },
      { text: "Từ nào đồng nghĩa với 'to lớn'?", choices: ["Nhỏ bé", "Khổng lồ", "Xinh xắn", "Mảnh mai"], correctIndex: 1, explanation: "'Khổng lồ' đồng nghĩa với 'to lớn'" },
      { text: "Từ nào trái nghĩa với 'vui vẻ'?", choices: ["Hạnh phúc", "Buồn bã", "Sôi nổi", "Hào hứng"], correctIndex: 1, explanation: "'Buồn bã' trái nghĩa với 'vui vẻ'" },
      { text: "Từ nào trái nghĩa với 'nhanh'?", choices: ["Chậm", "Mau", "Lẹ", "Gấp"], correctIndex: 0, explanation: "'Chậm' trái nghĩa với 'nhanh'" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Phân số cơ bản",
    description: "Làm quen với khái niệm phân số.",
    subject: toan,
    grade: lop4,
    chapterTitle: "Phân số",
    order: 1,
    questions: [
      { text: "Phân số nào biểu diễn 'một nửa'?", choices: ["1/3", "1/2", "2/3", "1/4"], correctIndex: 1, explanation: "1/2 là một nửa" },
      { text: "1/4 + 1/4 = ?", choices: ["1/4", "2/4", "1/2", "cả B và C đúng"], correctIndex: 3, explanation: "1/4 + 1/4 = 2/4 = 1/2" },
      { text: "Phân số nào lớn hơn: 3/4 hay 1/2?", choices: ["3/4", "1/2", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "3/4 > 1/2" },
      { text: "Tử số của phân số 5/8 là số nào?", choices: ["5", "8", "13", "3"], correctIndex: 0, explanation: "Tử số là số ở trên, tức là 5" },
      { text: "Mẫu số của phân số 3/7 là số nào?", choices: ["3", "7", "10", "4"], correctIndex: 1, explanation: "Mẫu số là số ở dưới, tức là 7" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Câu ghép",
    description: "Nhận biết và đặt câu ghép.",
    subject: tiengViet,
    grade: lop4,
    chapterTitle: "Câu trong tiếng Việt",
    order: 1,
    questions: [
      {
        text: "Câu nào dưới đây là câu ghép?",
        choices: ["Em học bài.", "Trời mưa to nên em ở nhà.", "Em rất chăm học.", "Bạn Lan hát hay."],
        correctIndex: 1,
        explanation: "'Trời mưa to nên em ở nhà' có 2 vế câu nối bằng 'nên' nên là câu ghép",
      },
      {
        text: "Từ nào thường dùng để nối các vế trong câu ghép?",
        choices: ["Rất", "Và", "Đẹp", "Nhanh"],
        correctIndex: 1,
        explanation: "'Và' là quan hệ từ thường dùng để nối các vế câu",
      },
      {
        text: "Câu ghép gồm mấy vế câu trở lên?",
        choices: ["1", "2", "3", "4"],
        correctIndex: 1,
        explanation: "Câu ghép gồm từ 2 vế câu trở lên",
      },
      {
        text: "Câu nào là câu ghép chỉ nguyên nhân - kết quả?",
        choices: ["Em thích đọc sách.", "Vì trời lạnh nên em mặc áo ấm.", "Bạn ấy rất giỏi toán.", "Con mèo đang ngủ."],
        correctIndex: 1,
        explanation: "'Vì...nên...' thể hiện quan hệ nguyên nhân - kết quả",
      },
      {
        text: "Trong câu 'Em học giỏi và em còn hát hay', các vế câu nối với nhau bằng từ nào?",
        choices: ["Nhưng", "Và", "Vì", "Nên"],
        correctIndex: 1,
        explanation: "Từ nối là 'và'",
      },
    ],
  });

  await seedLessonWithQuestions({
    title: "Số thập phân",
    description: "Làm quen với số thập phân và cách đọc, viết.",
    subject: toan,
    grade: lop5,
    chapterTitle: "Số thập phân",
    order: 1,
    questions: [
      { text: "Số 3,5 đọc là gì?", choices: ["Ba phẩy năm", "Ba mươi lăm", "Ba chấm năm mươi", "Ba năm"], correctIndex: 0, explanation: "3,5 đọc là 'ba phẩy năm'" },
      { text: "1,5 + 2,3 = ?", choices: ["3,7", "3,8", "3,9", "4,8"], correctIndex: 1, explanation: "1,5 + 2,3 = 3,8" },
      { text: "4,6 - 1,2 = ?", choices: ["3,2", "3,4", "3,6", "2,4"], correctIndex: 1, explanation: "4,6 - 1,2 = 3,4" },
      { text: "Số nào lớn hơn: 2,7 hay 2,49?", choices: ["2,7", "2,49", "Bằng nhau", "Không xác định"], correctIndex: 0, explanation: "2,7 = 2,70 > 2,49" },
      { text: "0,25 bằng phân số nào?", choices: ["1/4", "1/2", "1/5", "2/5"], correctIndex: 0, explanation: "0,25 = 1/4" },
    ],
  });

  await seedLessonWithQuestions({
    title: "Biện pháp tu từ: So sánh và nhân hóa",
    description: "Nhận biết biện pháp so sánh, nhân hóa trong câu văn.",
    subject: tiengViet,
    grade: lop5,
    chapterTitle: "Biện pháp tu từ",
    order: 1,
    questions: [
      {
        text: "Câu 'Mặt trời như quả cầu lửa' sử dụng biện pháp tu từ gì?",
        choices: ["So sánh", "Nhân hóa", "Ẩn dụ", "Điệp từ"],
        correctIndex: 0,
        explanation: "Câu dùng từ 'như' để so sánh mặt trời với quả cầu lửa",
      },
      {
        text: "Câu 'Ông mặt trời đội mũ đi ngủ sớm' sử dụng biện pháp tu từ gì?",
        choices: ["So sánh", "Nhân hóa", "Liệt kê", "Đảo ngữ"],
        correctIndex: 1,
        explanation: "Gán hành động của người ('đội mũ', 'đi ngủ') cho sự vật là nhân hóa",
      },
      {
        text: "Từ nào thường dùng trong câu so sánh?",
        choices: ["Như", "Và", "Thì", "Là"],
        correctIndex: 0,
        explanation: "'Như' là từ so sánh phổ biến",
      },
      {
        text: "Câu nào sử dụng biện pháp nhân hóa?",
        choices: ["Trẻ em như búp trên cành.", "Chị gió thổi mát rượi.", "Nhà em cao hai tầng.", "Bông hoa màu đỏ."],
        correctIndex: 1,
        explanation: "'Chị gió' gán tên gọi người cho sự vật, đó là nhân hóa",
      },
      {
        text: "Câu nào sử dụng biện pháp so sánh?",
        choices: ["Đêm nay trăng sáng như gương.", "Ông trăng cười với em.", "Sông chảy hiền hòa.", "Gió hát ru em ngủ."],
        correctIndex: 0,
        explanation: "'Như gương' là hình ảnh so sánh",
      },
    ],
  });

  console.log("[seed] Hoàn tất seed dữ liệu mẫu");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seed] Lỗi:", err);
  process.exit(1);
});
