// Dựng lại TOÀN BỘ chương trình Toán lớp 1 theo đúng mục lục SGK "Kết nối tri thức
// với cuộc sống" (41 bài, 10 chủ đề, Tập 1 + Tập 2). Nguồn đối chiếu:
// https://loigiaihay.com/sgk-toan-1-ket-noi-tri-thuc-c1139.html (Tập 1, Bài 1-20)
// https://vietjack.com/toan-1-ket-noi/index.jsp (Tập 2, Bài 21-41)
// Nội dung câu hỏi/lý thuyết do dự án tự biên soạn, chỉ theo đúng TÊN và THỨ TỰ bài
// học công khai của SGK — không sao chép nội dung/câu hỏi từ SGK hay tài liệu nào.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

const chapterCache = new Map();
async function getChapter(title, subject, grade, order, semester) {
  const key = `${subject._id}:${grade._id}:${title}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const chapter = await Chapter.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, subject: subject._id, grade: grade._id, order, semester },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  chapterCache.set(key, chapter);
  return chapter;
}

async function upsertLesson({ title, description, subject, grade, chapterTitle, chapterOrder, semester, order, videoId, questions }) {
  const chapter = await getChapter(chapterTitle, subject, grade, chapterOrder, semester);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id, chapter: chapter._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true, isTrial: order <= 2 },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const existingCount = await Question.countDocuments({ lesson: lesson._id });
  if (existingCount === 0 && questions?.length) {
    await Question.insertMany(questions.map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
  }
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { $set: { title: `Kiến thức: ${title}`, videoUrl: embed(videoId) } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return lesson;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const toan = subjects.find((s) => s.slug === "toan");

  // Xoá sạch chương/bài Toán lớp 1 hiện tại để dựng lại đúng theo mục lục SGK.
  const oldChapters = await Chapter.find({ subject: toan._id, grade: lop1._id });
  const oldLessons = await Lesson.find({ subject: toan._id, grade: lop1._id });
  await Question.deleteMany({ lesson: { $in: oldLessons.map((l) => l._id) } });
  await ReviewContent.deleteMany({ lesson: { $in: oldLessons.map((l) => l._id) } });
  await Lesson.deleteMany({ subject: toan._id, grade: lop1._id });
  await Chapter.deleteMany({ subject: toan._id, grade: lop1._id });
  console.log(`Đã xoá ${oldLessons.length} bài / ${oldChapters.length} chương Toán cũ.`);

  let n = 0;
  async function add(cfg) {
    await upsertLesson(cfg);
    n++;
  }

  const C1 = { chapterTitle: "Chủ đề 1: Các số từ 0 đến 10", chapterOrder: 1, semester: 1 };
  const C2 = { chapterTitle: "Chủ đề 2: Làm quen với một số hình phẳng", chapterOrder: 2, semester: 1 };
  const C3 = { chapterTitle: "Chủ đề 3: Phép cộng, phép trừ trong phạm vi 10", chapterOrder: 3, semester: 1 };
  const C4 = { chapterTitle: "Chủ đề 4: Làm quen với một số hình khối", chapterOrder: 4, semester: 1 };
  const C5 = { chapterTitle: "Chủ đề 5: Ôn tập học kì 1", chapterOrder: 5, semester: 1 };
  const C6 = { chapterTitle: "Chủ đề 6: Các số đến 100", chapterOrder: 6, semester: 2 };
  const C7 = { chapterTitle: "Chủ đề 7: Độ dài và đo độ dài", chapterOrder: 7, semester: 2 };
  const C8 = { chapterTitle: "Chủ đề 8: Phép cộng, phép trừ (không nhớ) trong phạm vi 100", chapterOrder: 8, semester: 2 };
  const C9 = { chapterTitle: "Chủ đề 9: Thời gian, giờ và lịch", chapterOrder: 9, semester: 2 };
  const C10 = { chapterTitle: "Chủ đề 10: Ôn tập cuối năm", chapterOrder: 10, semester: 2 };

  // ===================== CHỦ ĐỀ 1 =====================
  await add({
    title: "Các số 0, 1, 2, 3, 4, 5", subject: toan, grade: lop1, ...C1, order: 1, videoId: "Au9ZIpVYBZQ",
    description: "Làm quen với việc đếm và nhận biết các số từ 0 đến 5.",
    questions: [
      { text: "Đếm số quả táo: 🍎🍎🍎. Có mấy quả táo?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "Đếm được 3 quả táo", difficulty: "easy" },
      { text: "Số nào đứng liền sau số 2?", choices: ["1", "2", "3", "4"], correctIndex: 2, explanation: "Số liền sau 2 là 3", difficulty: "easy" },
      { text: "Số 0 biểu thị điều gì?", choices: ["Có 1 vật", "Không có vật nào", "Có nhiều vật", "Không xác định"], correctIndex: 1, explanation: "Số 0 biểu thị không có vật nào", difficulty: "medium" },
      { text: "Số nào lớn hơn: 4 hay 2?", choices: ["4", "2", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "4 lớn hơn 2", difficulty: "easy" },
    ],
  });
  await add({
    title: "Các số 6, 7, 8, 9, 10", subject: toan, grade: lop1, ...C1, order: 2, videoId: "BRbQqCTVtDc",
    description: "Làm quen với việc đếm và nhận biết các số từ 6 đến 10.",
    questions: [
      { text: "Đếm số ngôi sao: ⭐⭐⭐⭐⭐⭐⭐. Có mấy ngôi sao?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "Đếm được 7 ngôi sao", difficulty: "easy" },
      { text: "Số liền sau số 9 là số nào?", choices: ["8", "9", "10", "11"], correctIndex: 2, explanation: "Số liền sau 9 là 10", difficulty: "easy" },
      { text: "Số nào bé nhất trong các số: 9, 6, 8, 10?", choices: ["9", "6", "8", "10"], correctIndex: 1, explanation: "6 là số bé nhất", difficulty: "medium" },
      { text: "Số 10 gồm mấy chữ số?", choices: ["1", "2", "3", "0"], correctIndex: 1, explanation: "Số 10 gồm 2 chữ số: 1 và 0", difficulty: "medium" },
    ],
  });
  await add({
    title: "Nhiều hơn, ít hơn, bằng nhau", subject: toan, grade: lop1, ...C1, order: 3, videoId: "eFt1jHGAFYE",
    description: "So sánh số lượng nhóm đồ vật: nhiều hơn, ít hơn hoặc bằng nhau.",
    questions: [
      { text: "Có 5 quả cam và 3 quả chuối. Số cam so với số chuối thế nào?", choices: ["Nhiều hơn", "Ít hơn", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "5 > 3 nên cam nhiều hơn chuối", difficulty: "easy" },
      { text: "Có 4 cái bút và 4 cái thước. Số bút so với số thước thế nào?", choices: ["Nhiều hơn", "Ít hơn", "Bằng nhau", "Không xác định"], correctIndex: 2, explanation: "4 = 4 nên bằng nhau", difficulty: "easy" },
      { text: "Nhóm có 2 con mèo, nhóm có 6 con chó. Nhóm nào ít hơn?", choices: ["Nhóm mèo", "Nhóm chó", "Bằng nhau", "Không xác định"], correctIndex: 0, explanation: "2 < 6 nên nhóm mèo ít hơn", difficulty: "easy" },
      { text: "Muốn biết 2 nhóm đồ vật nhiều hơn hay ít hơn, em làm gì?", choices: ["Đoán bừa", "Đếm và so sánh số lượng", "Nhìn màu sắc", "Không cần làm gì"], correctIndex: 1, explanation: "Cần đếm số lượng từng nhóm rồi so sánh", difficulty: "medium" },
    ],
  });
  await add({
    title: "So sánh số", subject: toan, grade: lop1, ...C1, order: 4, videoId: "USOkEHeM3RE",
    description: "So sánh các số trong phạm vi 10 bằng dấu >, <, =.",
    questions: [
      { text: "Điền dấu thích hợp: 7 ... 5", choices: [">", "<", "=", "Không xác định"], correctIndex: 0, explanation: "7 > 5", difficulty: "easy" },
      { text: "Điền dấu thích hợp: 3 ... 3", choices: [">", "<", "=", "Không xác định"], correctIndex: 2, explanation: "3 = 3", difficulty: "easy" },
      { text: "Số nào lớn hơn 6 nhưng bé hơn 9?", choices: ["5", "7", "9", "10"], correctIndex: 1, explanation: "7 nằm giữa 6 và 9", difficulty: "medium" },
      { text: "Điền dấu thích hợp: 4 ... 8", choices: [">", "<", "=", "Không xác định"], correctIndex: 1, explanation: "4 < 8", difficulty: "easy" },
    ],
  });
  await add({
    title: "Mấy và mấy", subject: toan, grade: lop1, ...C1, order: 5,
    description: "Tách một số thành 2 số (tách số) và gộp 2 số thành 1 số (gộp số) trong phạm vi 10.",
    questions: [
      { text: "5 gồm mấy và mấy?", choices: ["1 và 3", "2 và 3", "4 và 2", "5 và 1"], correctIndex: 1, explanation: "5 = 2 + 3", difficulty: "easy" },
      { text: "4 và 3 gộp lại được mấy?", choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "4 + 3 = 7", difficulty: "easy" },
      { text: "8 tách thành 5 và mấy?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "8 = 5 + 3", difficulty: "medium" },
      { text: "Số nào KHÔNG thể tách thành 2 số tự nhiên khác 0?", choices: ["0", "2", "5", "9"], correctIndex: 0, explanation: "Số 0 không tách được thành 2 số tự nhiên khác 0", difficulty: "hard" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C1, order: 6, videoId: "zcWrWdjwJS0",
    description: "Luyện tập tổng hợp: đếm số, so sánh số, số liền trước - số liền sau trong phạm vi 10.",
    questions: [
      { text: "Số liền trước số 6 là số nào?", choices: ["5", "6", "7", "4"], correctIndex: 0, explanation: "Số liền trước 6 là 5", difficulty: "easy" },
      { text: "Số liền sau số 8 là số nào?", choices: ["7", "8", "9", "10"], correctIndex: 2, explanation: "Số liền sau 8 là 9", difficulty: "easy" },
      { text: "Sắp xếp các số 3, 8, 1, 5 theo thứ tự từ bé đến lớn?", choices: ["1,3,5,8", "8,5,3,1", "3,1,5,8", "1,5,3,8"], correctIndex: 0, explanation: "Thứ tự tăng dần: 1,3,5,8", difficulty: "medium" },
      { text: "Số nào lớn nhất trong các số: 4, 9, 6, 2?", choices: ["4", "9", "6", "2"], correctIndex: 1, explanation: "9 là số lớn nhất", difficulty: "easy" },
    ],
  });

  // ===================== CHỦ ĐỀ 2 =====================
  await add({
    title: "Hình vuông, hình tròn, hình tam giác, hình chữ nhật", subject: toan, grade: lop1, ...C2, order: 1, videoId: "bAxZ1SfnTZg",
    description: "Nhận biết và gọi tên hình vuông, hình tròn, hình tam giác, hình chữ nhật.",
    questions: [
      { text: "Viên bi thường có dạng hình gì?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 1, explanation: "Viên bi có dạng hình tròn", difficulty: "easy" },
      { text: "Khăn quàng đỏ thường có dạng hình gì?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 2, explanation: "Khăn quàng đỏ có dạng hình tam giác", difficulty: "easy" },
      { text: "Hình vuông có mấy cạnh bằng nhau?", choices: ["2", "3", "4", "5"], correctIndex: 2, explanation: "Hình vuông có 4 cạnh bằng nhau", difficulty: "medium" },
      { text: "Mặt bàn học thường có dạng hình gì?", choices: ["Hình tròn", "Hình tam giác", "Hình chữ nhật", "Không có hình dạng"], correctIndex: 2, explanation: "Mặt bàn học thường có dạng hình chữ nhật", difficulty: "easy" },
    ],
  });
  await add({
    title: "Thực hành lắp ghép, xếp hình", subject: toan, grade: lop1, ...C2, order: 2,
    description: "Thực hành lắp ghép và xếp các hình phẳng đã học thành hình mới.",
    questions: [
      { text: "Ghép 2 hình tam giác bằng nhau có thể tạo thành hình gì?", choices: ["Hình tròn", "Hình vuông hoặc hình chữ nhật", "Không tạo được hình gì", "Hình tam giác lớn hơn"], correctIndex: 1, explanation: "2 hình tam giác vuông ghép lại có thể tạo hình vuông hoặc chữ nhật", difficulty: "hard" },
      { text: "Khi xếp hình, em cần chú ý điều gì?", choices: ["Xếp bừa không cần suy nghĩ", "Quan sát và chọn đúng hình cần ghép", "Ghép càng nhiều hình càng tốt", "Không cần quan tâm hình dạng"], correctIndex: 1, explanation: "Cần quan sát kỹ để chọn đúng hình phù hợp", difficulty: "medium" },
      { text: "Ngôi nhà đơn giản thường được vẽ từ những hình nào?", choices: ["Chỉ hình tròn", "Hình vuông/chữ nhật và hình tam giác", "Chỉ hình tam giác", "Không có hình nào"], correctIndex: 1, explanation: "Ngôi nhà thường vẽ từ hình vuông/chữ nhật (thân nhà) và tam giác (mái nhà)", difficulty: "easy" },
      { text: "Bộ đồ chơi xếp hình giúp em rèn luyện điều gì?", choices: ["Khả năng quan sát và tư duy hình học", "Không có tác dụng gì", "Chỉ để giải trí", "Kỹ năng tính toán số học"], correctIndex: 0, explanation: "Xếp hình giúp rèn khả năng quan sát và tư duy hình học", difficulty: "medium" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C2, order: 3, videoId: "4LsAwB_nMpE",
    description: "Luyện tập tổng hợp về nhận biết hình phẳng đã học.",
    questions: [
      { text: "Trong các đồ vật sau, vật nào có dạng hình tròn?", choices: ["Quyển sách", "Cái đĩa", "Viên gạch", "Cửa sổ"], correctIndex: 1, explanation: "Cái đĩa thường có dạng hình tròn", difficulty: "easy" },
      { text: "Hình chữ nhật khác hình vuông ở điểm nào?", choices: ["Hình chữ nhật có 4 cạnh không đều nhau từng đôi một", "Hình chữ nhật có 3 cạnh", "Không có gì khác nhau", "Hình chữ nhật là hình tròn"], correctIndex: 0, explanation: "Hình chữ nhật có 2 cặp cạnh bằng nhau nhưng không phải cả 4 cạnh đều bằng nhau như hình vuông", difficulty: "hard" },
      { text: "Hình nào có 3 cạnh?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 2, explanation: "Hình tam giác có 3 cạnh", difficulty: "easy" },
      { text: "Bánh xe đạp có dạng hình gì?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 1, explanation: "Bánh xe có dạng hình tròn", difficulty: "easy" },
    ],
  });

  // ===================== CHỦ ĐỀ 3 =====================
  await add({
    title: "Phép cộng trong phạm vi 10", subject: toan, grade: lop1, ...C3, order: 1, videoId: "GRL3dY0vsWo",
    description: "Thực hiện phép cộng hai số có tổng không quá 10.",
    questions: [
      { text: "3 + 4 = ?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "3 + 4 = 7", difficulty: "easy" },
      { text: "5 + 5 = ?", choices: ["9", "10", "11", "8"], correctIndex: 1, explanation: "5 + 5 = 10", difficulty: "easy" },
      { text: "2 + 6 = ?", choices: ["7", "8", "9", "6"], correctIndex: 1, explanation: "2 + 6 = 8", difficulty: "easy" },
      { text: "Phép cộng nào có kết quả bằng 9?", choices: ["4 + 4", "3 + 6", "2 + 5", "5 + 5"], correctIndex: 1, explanation: "3 + 6 = 9", difficulty: "medium" },
    ],
  });
  await add({
    title: "Phép trừ trong phạm vi 10", subject: toan, grade: lop1, ...C3, order: 2, videoId: "kNnw4_Q_TOc",
    description: "Thực hiện phép trừ hai số trong phạm vi 10.",
    questions: [
      { text: "9 - 4 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "9 - 4 = 5", difficulty: "easy" },
      { text: "10 - 7 = ?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "10 - 7 = 3", difficulty: "easy" },
      { text: "8 - 8 = ?", choices: ["1", "0", "8", "16"], correctIndex: 1, explanation: "8 - 8 = 0", difficulty: "easy" },
      { text: "Phép trừ nào có kết quả bằng 5?", choices: ["9 - 3", "8 - 3", "10 - 4", "7 - 3"], correctIndex: 1, explanation: "8 - 3 = 5", difficulty: "medium" },
    ],
  });
  await add({
    title: "Bảng cộng, bảng trừ trong phạm vi 10", subject: toan, grade: lop1, ...C3, order: 3, videoId: "xSr74LoODLM",
    description: "Ghi nhớ bảng cộng và bảng trừ trong phạm vi 10 để tính nhanh.",
    questions: [
      { text: "Theo bảng cộng, 6 + 3 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "6 + 3 = 9", difficulty: "easy" },
      { text: "Theo bảng trừ, 10 - 6 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "10 - 6 = 4", difficulty: "easy" },
      { text: "Thuộc bảng cộng trừ giúp em điều gì?", choices: ["Không có tác dụng", "Tính nhẩm nhanh hơn", "Chỉ để thi", "Làm bài chậm hơn"], correctIndex: 1, explanation: "Thuộc bảng cộng trừ giúp tính nhẩm nhanh và chính xác", difficulty: "medium" },
      { text: "7 + 2 = ? (tính nhẩm nhanh theo bảng cộng)", choices: ["8", "9", "10", "11"], correctIndex: 1, explanation: "7 + 2 = 9", difficulty: "easy" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C3, order: 4, videoId: "AT4PtMqsEl0",
    description: "Luyện tập tổng hợp phép cộng, phép trừ trong phạm vi 10.",
    questions: [
      { text: "4 + 3 - 2 = ?", choices: ["4", "5", "6", "7"], correctIndex: 1, explanation: "4 + 3 = 7, 7 - 2 = 5", difficulty: "medium" },
      { text: "Số nào cộng với 5 để được 9?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "5 + 4 = 9", difficulty: "medium" },
      { text: "10 - 3 + 1 = ?", choices: ["6", "7", "8", "9"], correctIndex: 2, explanation: "10 - 3 = 7, 7 + 1 = 8", difficulty: "medium" },
      { text: "Số nào trừ đi 2 để được 5?", choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "7 - 2 = 5", difficulty: "medium" },
    ],
  });

  // ===================== CHỦ ĐỀ 4 =====================
  await add({
    title: "Khối lập phương, khối hộp chữ nhật", subject: toan, grade: lop1, ...C4, order: 1, videoId: "4LsAwB_nMpE",
    description: "Nhận biết khối lập phương và khối hộp chữ nhật qua các đồ vật quen thuộc.",
    questions: [
      { text: "Viên xúc xắc thường có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Khối trụ"], correctIndex: 0, explanation: "Viên xúc xắc có dạng khối lập phương (6 mặt vuông bằng nhau)", difficulty: "easy" },
      { text: "Hộp bút thường có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Không có dạng khối"], correctIndex: 1, explanation: "Hộp bút thường có dạng khối hộp chữ nhật", difficulty: "easy" },
      { text: "Khối lập phương có tất cả các mặt là hình gì?", choices: ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"], correctIndex: 1, explanation: "Khối lập phương có 6 mặt đều là hình vuông bằng nhau", difficulty: "medium" },
      { text: "Khối hộp chữ nhật khác khối lập phương ở điểm nào?", choices: ["Các mặt không nhất thiết bằng nhau", "Không có mặt nào", "Chỉ có 1 mặt", "Không khác gì"], correctIndex: 0, explanation: "Khối hộp chữ nhật có các mặt là hình chữ nhật, không nhất thiết bằng nhau như khối lập phương", difficulty: "hard" },
    ],
  });
  await add({
    title: "Vị trí, định hướng trong không gian", subject: toan, grade: lop1, ...C4, order: 2, videoId: "qyime_e1ZBA",
    description: "Nhận biết và sử dụng đúng các từ chỉ vị trí: trên - dưới, trái - phải, trước - sau.",
    questions: [
      { text: "Con chim đang bay ở phía nào so với mặt đất?", choices: ["Phía trên", "Phía dưới", "Phía trước", "Phía sau"], correctIndex: 0, explanation: "Con chim bay ở phía trên so với mặt đất", difficulty: "easy" },
      { text: "Bạn An đứng trước bạn Bình. Bình đứng ở vị trí nào so với An?", choices: ["Trước An", "Sau An", "Trên An", "Dưới An"], correctIndex: 1, explanation: "Nếu An đứng trước Bình thì Bình đứng sau An", difficulty: "medium" },
      { text: "Em cầm bút bằng tay nào thường được gọi là tay thuận của đa số người?", choices: ["Tay trái", "Tay phải", "Cả hai tay", "Không có quy định"], correctIndex: 1, explanation: "Đa số mọi người thuận tay phải", difficulty: "easy" },
      { text: "Ba bạn xếp hàng: Lan - Hoa - Mai. Bạn nào đứng ở giữa?", choices: ["Lan", "Hoa", "Mai", "Không xác định"], correctIndex: 1, explanation: "Hoa đứng ở giữa Lan và Mai", difficulty: "medium" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C4, order: 3,
    description: "Luyện tập tổng hợp về hình khối và vị trí không gian.",
    questions: [
      { text: "Quả bóng đá có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Khối trụ"], correctIndex: 2, explanation: "Quả bóng đá có dạng khối cầu", difficulty: "medium" },
      { text: "Lon nước ngọt thường có dạng khối gì?", choices: ["Khối lập phương", "Khối hộp chữ nhật", "Khối cầu", "Khối trụ"], correctIndex: 3, explanation: "Lon nước ngọt có dạng khối trụ", difficulty: "medium" },
      { text: "Quyển sách để trên bàn, cặp sách để dưới gầm bàn. Vật nào ở vị trí thấp hơn?", choices: ["Quyển sách", "Cặp sách", "Cả hai bằng nhau", "Không xác định"], correctIndex: 1, explanation: "Cặp sách ở dưới gầm bàn nên ở vị trí thấp hơn", difficulty: "medium" },
      { text: "Khi xếp hàng vào lớp, bạn đứng đầu hàng ở vị trí nào?", choices: ["Trước tất cả các bạn khác", "Sau tất cả các bạn khác", "Ở giữa hàng", "Không có vị trí cố định"], correctIndex: 0, explanation: "Bạn đứng đầu hàng ở vị trí trước tất cả các bạn khác", difficulty: "medium" },
    ],
  });

  // ===================== CHỦ ĐỀ 5 =====================
  await add({
    title: "Ôn tập các số trong phạm vi 10", subject: toan, grade: lop1, ...C5, order: 1, videoId: "CMS8gr9Ldjg",
    description: "Ôn tập đếm, đọc, viết, so sánh các số trong phạm vi 10.",
    questions: [
      { text: "Số nào đứng giữa số 5 và số 7?", choices: ["4", "6", "8", "5"], correctIndex: 1, explanation: "Số 6 đứng giữa 5 và 7", difficulty: "easy" },
      { text: "Viết số 'tám' bằng chữ số là?", choices: ["6", "7", "8", "9"], correctIndex: 2, explanation: "Tám viết bằng chữ số là 8", difficulty: "easy" },
      { text: "Sắp xếp 6, 2, 9, 4 theo thứ tự giảm dần?", choices: ["2,4,6,9", "9,6,4,2", "9,4,6,2", "2,6,4,9"], correctIndex: 1, explanation: "Thứ tự giảm dần: 9,6,4,2", difficulty: "medium" },
      { text: "Số liền sau số 0 là số nào?", choices: ["0", "1", "2", "Không có"], correctIndex: 1, explanation: "Số liền sau 0 là 1", difficulty: "easy" },
    ],
  });
  await add({
    title: "Ôn tập phép cộng, phép trừ trong phạm vi 10", subject: toan, grade: lop1, ...C5, order: 2, videoId: "GRL3dY0vsWo",
    description: "Ôn tập kỹ năng cộng, trừ các số trong phạm vi 10.",
    questions: [
      { text: "5 + 4 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "5 + 4 = 9", difficulty: "easy" },
      { text: "9 - 5 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "9 - 5 = 4", difficulty: "easy" },
      { text: "Số nào cộng 3 để được 8?", choices: ["4", "5", "6", "7"], correctIndex: 1, explanation: "5 + 3 = 8", difficulty: "medium" },
      { text: "6 + 0 = ?", choices: ["0", "6", "7", "60"], correctIndex: 1, explanation: "Cộng với 0 giữ nguyên giá trị, 6 + 0 = 6", difficulty: "easy" },
    ],
  });
  await add({
    title: "Ôn tập hình học", subject: toan, grade: lop1, ...C5, order: 3, videoId: "bAxZ1SfnTZg",
    description: "Ôn tập nhận biết hình phẳng và hình khối đã học.",
    questions: [
      { text: "Hình nào có 4 cạnh bằng nhau?", choices: ["Hình chữ nhật", "Hình vuông", "Hình tam giác", "Hình tròn"], correctIndex: 1, explanation: "Hình vuông có 4 cạnh bằng nhau", difficulty: "easy" },
      { text: "Viên xúc xắc có dạng khối gì?", choices: ["Khối cầu", "Khối trụ", "Khối lập phương", "Khối hộp chữ nhật"], correctIndex: 2, explanation: "Viên xúc xắc có dạng khối lập phương", difficulty: "medium" },
      { text: "Đồng hồ treo tường thường có dạng hình gì?", choices: ["Hình tròn", "Hình tam giác", "Hình vuông", "Không có hình dạng"], correctIndex: 0, explanation: "Đồng hồ treo tường thường có dạng hình tròn", difficulty: "easy" },
      { text: "Hộp quà hình vuông có dạng khối gì?", choices: ["Khối cầu", "Khối trụ", "Khối lập phương", "Khối tam giác"], correctIndex: 2, explanation: "Hộp quà với các mặt vuông có dạng khối lập phương", difficulty: "medium" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C5, order: 4, videoId: "C9BjTx4zpho",
    description: "Ôn tập tổng hợp học kỳ 1: số, phép tính và hình học.",
    questions: [
      { text: "7 + 2 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "7 + 2 = 9", difficulty: "easy" },
      { text: "10 - 4 = ?", choices: ["5", "6", "7", "4"], correctIndex: 1, explanation: "10 - 4 = 6", difficulty: "easy" },
      { text: "Hình tam giác có mấy cạnh?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "Hình tam giác có 3 cạnh", difficulty: "easy" },
      { text: "Số lớn nhất có 1 chữ số là số nào?", choices: ["8", "9", "10", "0"], correctIndex: 1, explanation: "9 là số lớn nhất có 1 chữ số", difficulty: "medium" },
    ],
  });

  // ===================== CHỦ ĐỀ 6 =====================
  await add({
    title: "Số có hai chữ số", subject: toan, grade: lop1, ...C6, order: 1, videoId: "wgr79OT3V7g",
    description: "Đọc, viết các số có hai chữ số trong phạm vi 100.",
    questions: [
      { text: "Số 45 gồm mấy chục và mấy đơn vị?", choices: ["4 chục 5 đơn vị", "5 chục 4 đơn vị", "45 chục", "4 chục 4 đơn vị"], correctIndex: 0, explanation: "45 = 4 chục và 5 đơn vị", difficulty: "medium" },
      { text: "Viết 'ba mươi hai' bằng số?", choices: ["23", "32", "30", "302"], correctIndex: 1, explanation: "Ba mươi hai viết là 32", difficulty: "easy" },
      { text: "Số 70 có chữ số hàng đơn vị là mấy?", choices: ["7", "0", "70", "17"], correctIndex: 1, explanation: "Số 70 có chữ số hàng đơn vị là 0", difficulty: "medium" },
      { text: "Số nào là số có hai chữ số nhỏ nhất?", choices: ["1", "9", "10", "11"], correctIndex: 2, explanation: "10 là số có hai chữ số nhỏ nhất", difficulty: "medium" },
    ],
  });
  await add({
    title: "So sánh số có hai chữ số", subject: toan, grade: lop1, ...C6, order: 2, videoId: "Px5Qc9mkVZA",
    description: "So sánh các số có hai chữ số trong phạm vi 100.",
    questions: [
      { text: "Điền dấu thích hợp: 45 ... 54", choices: [">", "<", "=", "Không xác định"], correctIndex: 1, explanation: "45 < 54 vì hàng chục 4 < 5", difficulty: "medium" },
      { text: "Số nào lớn hơn: 68 hay 78?", choices: ["68", "78", "Bằng nhau", "Không xác định"], correctIndex: 1, explanation: "78 > 68 vì hàng chục 7 > 6", difficulty: "easy" },
      { text: "Điền dấu thích hợp: 33 ... 33", choices: [">", "<", "=", "Không xác định"], correctIndex: 2, explanation: "33 = 33", difficulty: "easy" },
      { text: "Số nào bé nhất: 52, 25, 55?", choices: ["52", "25", "55", "Không xác định"], correctIndex: 1, explanation: "25 là số bé nhất", difficulty: "medium" },
    ],
  });
  await add({
    title: "Bảng các số từ 1 đến 100", subject: toan, grade: lop1, ...C6, order: 3, videoId: "MDhVMnplaNI",
    description: "Làm quen với bảng các số tự nhiên từ 1 đến 100.",
    questions: [
      { text: "Trong bảng số từ 1-100, số ở hàng thứ 3, cột đầu tiên là số nào (mỗi hàng 10 số)?", choices: ["20", "21", "30", "31"], correctIndex: 1, explanation: "Hàng 3 bắt đầu từ số 21", difficulty: "hard" },
      { text: "Các số tròn chục là những số nào?", choices: ["Có chữ số hàng đơn vị là 0", "Có chữ số hàng chục là 0", "Là số lẻ", "Không có quy luật"], correctIndex: 0, explanation: "Số tròn chục có chữ số hàng đơn vị là 0, ví dụ 10, 20, 30...", difficulty: "medium" },
      { text: "Số liền sau số 99 là số nào?", choices: ["98", "100", "89", "199"], correctIndex: 1, explanation: "Số liền sau 99 là 100", difficulty: "medium" },
      { text: "Có bao nhiêu số tròn chục từ 1 đến 100?", choices: ["9", "10", "11", "8"], correctIndex: 1, explanation: "Có 10 số tròn chục: 10,20,...,100", difficulty: "hard" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C6, order: 4, videoId: "kBQ3Z4MWVTM",
    description: "Luyện tập tổng hợp đọc, viết, so sánh các số đến 100.",
    questions: [
      { text: "Số 56 đọc là gì?", choices: ["Năm sáu", "Năm mươi sáu", "Sáu mươi lăm", "Năm trăm sáu"], correctIndex: 1, explanation: "56 đọc là năm mươi sáu", difficulty: "easy" },
      { text: "Điền dấu thích hợp: 90 ... 89", choices: [">", "<", "=", "Không xác định"], correctIndex: 0, explanation: "90 > 89", difficulty: "easy" },
      { text: "Số 8 chục 0 đơn vị là số nào?", choices: ["8", "80", "18", "800"], correctIndex: 1, explanation: "8 chục 0 đơn vị là số 80", difficulty: "medium" },
      { text: "Sắp xếp 34, 43, 24 theo thứ tự tăng dần?", choices: ["24,34,43", "43,34,24", "34,24,43", "24,43,34"], correctIndex: 0, explanation: "Thứ tự tăng dần: 24,34,43", difficulty: "medium" },
    ],
  });

  // ===================== CHỦ ĐỀ 7 =====================
  await add({
    title: "Dài hơn, ngắn hơn", subject: toan, grade: lop1, ...C7, order: 1,
    description: "So sánh trực tiếp độ dài của hai vật: dài hơn, ngắn hơn, bằng nhau.",
    questions: [
      { text: "Cây bút chì dài 15cm và cây thước dài 20cm. Vật nào dài hơn?", choices: ["Bút chì", "Thước", "Bằng nhau", "Không xác định"], correctIndex: 1, explanation: "20cm > 15cm nên thước dài hơn", difficulty: "easy" },
      { text: "Muốn biết vật nào dài hơn mà không cần đo, em có thể làm gì?", choices: ["Đặt hai vật cạnh nhau, so đầu bằng nhau", "Đoán bừa", "Không thể biết được", "Cân 2 vật"], correctIndex: 0, explanation: "Đặt 2 vật song song, canh 1 đầu bằng nhau để so sánh đầu còn lại", difficulty: "medium" },
      { text: "Con đường A ngắn hơn con đường B. Vậy con đường B thế nào so với A?", choices: ["Ngắn hơn A", "Dài hơn A", "Bằng A", "Không xác định"], correctIndex: 1, explanation: "Nếu A ngắn hơn B thì B dài hơn A", difficulty: "medium" },
      { text: "Hai sợi dây bằng nhau khi nào?", choices: ["Khi chúng có cùng độ dài", "Khi chúng cùng màu", "Khi chúng cùng độ dày", "Không bao giờ bằng nhau"], correctIndex: 0, explanation: "Hai vật bằng nhau về độ dài khi có cùng chiều dài", difficulty: "easy" },
    ],
  });
  await add({
    title: "Đơn vị đo độ dài", subject: toan, grade: lop1, ...C7, order: 2, videoId: "t5gipTbdq4g",
    description: "Làm quen với đo độ dài bằng đơn vị chưa chuẩn: gang tay, bước chân, sải tay.",
    questions: [
      { text: "Em có thể đo chiều dài lớp học bằng cách nào sau đây?", choices: ["Đếm số bước chân", "Đoán bừa", "Không đo được", "Chỉ nhìn bằng mắt"], correctIndex: 0, explanation: "Có thể đo bằng cách đếm số bước chân, gang tay...", difficulty: "medium" },
      { text: "Gang tay là gì?", choices: ["Khoảng cách từ đầu ngón cái đến đầu ngón giữa khi xòe tay", "Chiều dài cánh tay", "Chiều cao cơ thể", "Không có ý nghĩa gì"], correctIndex: 0, explanation: "Gang tay là khoảng cách từ đầu ngón cái đến đầu ngón giữa khi xòe bàn tay", difficulty: "medium" },
      { text: "Vì sao đo bằng gang tay của 2 người có thể cho kết quả khác nhau?", choices: ["Vì gang tay mỗi người dài ngắn khác nhau", "Vì đo sai", "Không thể xảy ra", "Vì vật đo thay đổi"], correctIndex: 0, explanation: "Gang tay là đơn vị đo chưa chuẩn, phụ thuộc vào tay từng người", difficulty: "hard" },
      { text: "Đơn vị đo nào sau đây là đơn vị đo CHƯA chuẩn?", choices: ["Bước chân", "Xăng-ti-mét", "Mét", "Ki-lô-mét"], correctIndex: 0, explanation: "Bước chân là đơn vị đo chưa chuẩn vì khác nhau ở mỗi người", difficulty: "medium" },
    ],
  });
  await add({
    title: "Thực hành ước lượng và đo độ dài", subject: toan, grade: lop1, ...C7, order: 3, videoId: "FW7NKwkFYMs",
    description: "Thực hành ước lượng và đo độ dài bằng thước có vạch chia xăng-ti-mét.",
    questions: [
      { text: "Đơn vị xăng-ti-mét được viết tắt là gì?", choices: ["cm", "m", "km", "g"], correctIndex: 0, explanation: "Xăng-ti-mét viết tắt là cm", difficulty: "easy" },
      { text: "Muốn đo chính xác chiều dài quyển vở, em nên dùng gì?", choices: ["Thước có vạch chia cm", "Đoán bằng mắt", "Gang tay", "Bước chân"], correctIndex: 0, explanation: "Dùng thước có vạch chia cm để đo chính xác", difficulty: "medium" },
      { text: "Ước lượng là gì?", choices: ["Đoán gần đúng độ dài trước khi đo chính xác", "Đo chính xác tuyệt đối", "Không cần quan tâm độ dài", "Chỉ dùng cho số lớn"], correctIndex: 0, explanation: "Ước lượng là đoán gần đúng độ dài trước khi đo bằng thước", difficulty: "medium" },
      { text: "Một cây bút chì dài khoảng bao nhiêu cm?", choices: ["Khoảng 15-18cm", "Khoảng 1m", "Khoảng 1km", "Khoảng 1mm"], correctIndex: 0, explanation: "Bút chì thường dài khoảng 15-18cm", difficulty: "medium" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C7, order: 4,
    description: "Luyện tập tổng hợp về so sánh và đo độ dài.",
    questions: [
      { text: "Cây gậy dài 1m, sợi dây dài 80cm. Vật nào dài hơn?", choices: ["Cây gậy", "Sợi dây", "Bằng nhau", "Không xác định"], correctIndex: 0, explanation: "1m = 100cm > 80cm nên cây gậy dài hơn", difficulty: "hard" },
      { text: "Muốn đo độ dài bàn học chính xác, em dùng dụng cụ gì?", choices: ["Thước có vạch chia cm", "Cân", "Đồng hồ", "Ca đong"], correctIndex: 0, explanation: "Dùng thước có vạch chia cm để đo độ dài", difficulty: "easy" },
      { text: "Hai bạn đo cùng 1 cây bút bằng gang tay được kết quả khác nhau. Vì sao?", choices: ["Vì gang tay không phải đơn vị đo chuẩn", "Vì bút thay đổi độ dài", "Vì đếm sai hoàn toàn", "Không có lý do"], correctIndex: 0, explanation: "Gang tay là đơn vị đo chưa chuẩn nên kết quả có thể khác nhau", difficulty: "hard" },
      { text: "1 mét bằng bao nhiêu xăng-ti-mét?", choices: ["10cm", "100cm", "1000cm", "1cm"], correctIndex: 1, explanation: "1m = 100cm", difficulty: "medium" },
    ],
  });

  // ===================== CHỦ ĐỀ 8 =====================
  await add({
    title: "Phép cộng số có hai chữ số với số có một chữ số", subject: toan, grade: lop1, ...C8, order: 1, videoId: "14GTNU-_yA4",
    description: "Cộng số có hai chữ số với số có một chữ số (không nhớ).",
    questions: [
      { text: "23 + 5 = ?", choices: ["26", "27", "28", "29"], correctIndex: 2, explanation: "23 + 5 = 28", difficulty: "easy" },
      { text: "41 + 6 = ?", choices: ["45", "46", "47", "48"], correctIndex: 2, explanation: "41 + 6 = 47", difficulty: "easy" },
      { text: "50 + 9 = ?", choices: ["58", "59", "60", "49"], correctIndex: 1, explanation: "50 + 9 = 59", difficulty: "easy" },
      { text: "Khi cộng số có 2 chữ số với số có 1 chữ số, em cộng vào hàng nào?", choices: ["Hàng chục", "Hàng đơn vị", "Cả hai hàng", "Không hàng nào"], correctIndex: 1, explanation: "Cộng vào hàng đơn vị vì số có 1 chữ số nằm ở hàng đơn vị", difficulty: "medium" },
    ],
  });
  await add({
    title: "Phép cộng số có hai chữ số với số có hai chữ số", subject: toan, grade: lop1, ...C8, order: 2, videoId: "14GTNU-_yA4",
    description: "Cộng hai số đều có hai chữ số (không nhớ).",
    questions: [
      { text: "23 + 15 = ?", choices: ["36", "37", "38", "39"], correctIndex: 2, explanation: "23 + 15 = 38", difficulty: "medium" },
      { text: "42 + 31 = ?", choices: ["71", "72", "73", "74"], correctIndex: 2, explanation: "42 + 31 = 73", difficulty: "medium" },
      { text: "50 + 20 = ?", choices: ["60", "70", "80", "90"], correctIndex: 1, explanation: "50 + 20 = 70", difficulty: "easy" },
      { text: "Khi cộng 2 số có 2 chữ số, em cộng theo thứ tự nào?", choices: ["Hàng chục trước, hàng đơn vị sau", "Hàng đơn vị trước, hàng chục sau", "Tuỳ ý", "Không cần theo thứ tự"], correctIndex: 1, explanation: "Cộng hàng đơn vị trước, rồi đến hàng chục", difficulty: "medium" },
    ],
  });
  await add({
    title: "Phép trừ số có hai chữ số cho số có một chữ số", subject: toan, grade: lop1, ...C8, order: 3, videoId: "R5a75bFsYCM",
    description: "Trừ số có hai chữ số cho số có một chữ số (không nhớ).",
    questions: [
      { text: "28 - 5 = ?", choices: ["21", "22", "23", "24"], correctIndex: 2, explanation: "28 - 5 = 23", difficulty: "easy" },
      { text: "39 - 7 = ?", choices: ["30", "31", "32", "33"], correctIndex: 2, explanation: "39 - 7 = 32", difficulty: "easy" },
      { text: "46 - 6 = ?", choices: ["38", "39", "40", "41"], correctIndex: 2, explanation: "46 - 6 = 40", difficulty: "medium" },
      { text: "Muốn trừ số có 2 chữ số cho số có 1 chữ số, em trừ ở hàng nào?", choices: ["Hàng chục", "Hàng đơn vị", "Cả hai hàng", "Không hàng nào"], correctIndex: 1, explanation: "Trừ ở hàng đơn vị vì số trừ chỉ có 1 chữ số", difficulty: "medium" },
    ],
  });
  await add({
    title: "Phép trừ số có hai chữ số cho số có hai chữ số", subject: toan, grade: lop1, ...C8, order: 4, videoId: "R5a75bFsYCM",
    description: "Trừ hai số đều có hai chữ số (không nhớ).",
    questions: [
      { text: "58 - 23 = ?", choices: ["34", "35", "36", "37"], correctIndex: 1, explanation: "58 - 23 = 35", difficulty: "medium" },
      { text: "79 - 41 = ?", choices: ["37", "38", "39", "36"], correctIndex: 1, explanation: "79 - 41 = 38", difficulty: "medium" },
      { text: "90 - 30 = ?", choices: ["50", "60", "70", "80"], correctIndex: 1, explanation: "90 - 30 = 60", difficulty: "easy" },
      { text: "65 - 65 = ?", choices: ["0", "1", "65", "130"], correctIndex: 0, explanation: "65 - 65 = 0", difficulty: "easy" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C8, order: 5, videoId: "jjfRtB3_GrM",
    description: "Luyện tập tổng hợp cộng trừ các số trong phạm vi 100.",
    questions: [
      { text: "34 + 25 - 10 = ?", choices: ["47", "48", "49", "50"], correctIndex: 2, explanation: "34+25=59, 59-10=49", difficulty: "hard" },
      { text: "60 - 20 + 15 = ?", choices: ["53", "54", "55", "56"], correctIndex: 2, explanation: "60-20=40, 40+15=55", difficulty: "hard" },
      { text: "Số nào cộng với 30 để được 80?", choices: ["40", "50", "60", "70"], correctIndex: 1, explanation: "30 + 50 = 80", difficulty: "medium" },
      { text: "72 - 40 = ?", choices: ["22", "32", "42", "52"], correctIndex: 1, explanation: "72 - 40 = 32", difficulty: "medium" },
    ],
  });

  // ===================== CHỦ ĐỀ 9 =====================
  await add({
    title: "Xem giờ đúng trên đồng hồ", subject: toan, grade: lop1, ...C9, order: 1, videoId: "VEdMa17tQs4",
    description: "Xem giờ đúng (giờ tròn) trên mặt đồng hồ có kim.",
    questions: [
      { text: "Khi kim phút chỉ số 12 và kim giờ chỉ số 3, đồng hồ chỉ mấy giờ?", choices: ["2 giờ", "3 giờ", "4 giờ", "12 giờ"], correctIndex: 1, explanation: "Kim giờ chỉ số 3, kim phút chỉ 12 nghĩa là 3 giờ đúng", difficulty: "medium" },
      { text: "Kim ngắn trên đồng hồ là kim gì?", choices: ["Kim giờ", "Kim phút", "Kim giây", "Không có ý nghĩa"], correctIndex: 0, explanation: "Kim ngắn hơn là kim chỉ giờ", difficulty: "easy" },
      { text: "Em thường đi ngủ vào khoảng mấy giờ tối?", choices: ["9 giờ tối", "9 giờ sáng", "12 giờ trưa", "3 giờ chiều"], correctIndex: 0, explanation: "Câu trả lời tham khảo: nhiều bạn đi ngủ khoảng 9 giờ tối", difficulty: "easy" },
      { text: "Đồng hồ chỉ giờ đúng khi kim phút chỉ vào số nào?", choices: ["Số 3", "Số 6", "Số 12", "Số 9"], correctIndex: 2, explanation: "Giờ đúng là khi kim phút chỉ đúng vào số 12", difficulty: "medium" },
    ],
  });
  await add({
    title: "Các ngày trong tuần", subject: toan, grade: lop1, ...C9, order: 2, videoId: "v6NSUSM3RMk",
    description: "Nhận biết tên và thứ tự các ngày trong tuần.",
    questions: [
      { text: "Một tuần có mấy ngày?", choices: ["5", "6", "7", "8"], correctIndex: 2, explanation: "Một tuần có 7 ngày", difficulty: "easy" },
      { text: "Ngày nào là ngày đầu tuần theo lịch học sinh Việt Nam?", choices: ["Chủ nhật", "Thứ hai", "Thứ bảy", "Thứ ba"], correctIndex: 1, explanation: "Thứ hai thường là ngày đầu tuần đi học", difficulty: "medium" },
      { text: "Sau thứ Sáu là ngày nào?", choices: ["Thứ Năm", "Thứ Bảy", "Chủ Nhật", "Thứ Hai"], correctIndex: 1, explanation: "Sau thứ Sáu là thứ Bảy", difficulty: "easy" },
      { text: "Ngày nghỉ cuối tuần thường là những ngày nào?", choices: ["Thứ Hai, Thứ Ba", "Thứ Bảy, Chủ Nhật", "Thứ Tư, Thứ Năm", "Không có ngày nghỉ"], correctIndex: 1, explanation: "Thứ Bảy và Chủ Nhật thường là ngày nghỉ cuối tuần", difficulty: "easy" },
    ],
  });
  await add({
    title: "Thực hành xem lịch và giờ", subject: toan, grade: lop1, ...C9, order: 3,
    description: "Thực hành xem lịch (ngày, tháng) và xem giờ đúng trong tình huống thực tế.",
    questions: [
      { text: "Tờ lịch cho em biết những thông tin gì?", choices: ["Ngày, tháng, thứ trong tuần", "Chỉ có giờ", "Chỉ có nhiệt độ", "Không có thông tin gì"], correctIndex: 0, explanation: "Lịch cho biết ngày, tháng và thứ trong tuần", difficulty: "easy" },
      { text: "Em có buổi học vào 8 giờ sáng. Kim giờ trên đồng hồ sẽ chỉ vào số nào (kim phút chỉ 12)?", choices: ["Số 6", "Số 7", "Số 8", "Số 9"], correctIndex: 2, explanation: "8 giờ đúng thì kim giờ chỉ vào số 8", difficulty: "medium" },
      { text: "Một năm có mấy tháng?", choices: ["10", "11", "12", "13"], correctIndex: 2, explanation: "Một năm có 12 tháng", difficulty: "medium" },
      { text: "Xem lịch giúp em biết điều gì trong cuộc sống hằng ngày?", choices: ["Không có tác dụng gì", "Biết hôm nay là ngày gì để sắp xếp việc học, việc chơi", "Chỉ để trang trí", "Chỉ người lớn mới cần"], correctIndex: 1, explanation: "Xem lịch giúp biết ngày để sắp xếp các hoạt động hằng ngày", difficulty: "easy" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C9, order: 4,
    description: "Luyện tập tổng hợp về xem giờ, ngày trong tuần và xem lịch.",
    questions: [
      { text: "Kim giờ chỉ số 5, kim phút chỉ số 12. Đồng hồ chỉ mấy giờ?", choices: ["4 giờ", "5 giờ", "6 giờ", "12 giờ"], correctIndex: 1, explanation: "Đó là 5 giờ đúng", difficulty: "medium" },
      { text: "Hôm nay là Thứ Tư, 2 ngày sau là thứ mấy?", choices: ["Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Thứ Ba"], correctIndex: 1, explanation: "Thứ Tư + 2 ngày = Thứ Sáu", difficulty: "medium" },
      { text: "Trong 1 ngày có mấy giờ?", choices: ["12", "20", "24", "60"], correctIndex: 2, explanation: "Một ngày có 24 giờ", difficulty: "medium" },
      { text: "Ngày em đi học trong tuần thường là những ngày nào?", choices: ["Chỉ Chủ Nhật", "Thứ Hai đến Thứ Sáu", "Cả 7 ngày", "Không cố định"], correctIndex: 1, explanation: "Học sinh thường đi học từ Thứ Hai đến Thứ Sáu", difficulty: "easy" },
    ],
  });

  // ===================== CHỦ ĐỀ 10 =====================
  await add({
    title: "Ôn tập các số và phép tính trong phạm vi 10", subject: toan, grade: lop1, ...C10, order: 1, videoId: "xSr74LoODLM",
    description: "Ôn tập cuối năm: các số và phép cộng, trừ trong phạm vi 10.",
    questions: [
      { text: "6 + 3 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "6 + 3 = 9", difficulty: "easy" },
      { text: "10 - 6 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "10 - 6 = 4", difficulty: "easy" },
      { text: "Số liền trước số 10 là số nào?", choices: ["9", "10", "11", "8"], correctIndex: 0, explanation: "Số liền trước 10 là 9", difficulty: "easy" },
      { text: "Số nào lớn nhất trong phạm vi 10?", choices: ["8", "9", "10", "7"], correctIndex: 2, explanation: "10 là số lớn nhất trong phạm vi 10", difficulty: "easy" },
    ],
  });
  await add({
    title: "Ôn tập các số và phép tính trong phạm vi 100", subject: toan, grade: lop1, ...C10, order: 2, videoId: "C9BjTx4zpho",
    description: "Ôn tập cuối năm: các số và phép cộng, trừ trong phạm vi 100.",
    questions: [
      { text: "45 + 23 = ?", choices: ["66", "67", "68", "69"], correctIndex: 2, explanation: "45 + 23 = 68", difficulty: "medium" },
      { text: "78 - 34 = ?", choices: ["42", "43", "44", "45"], correctIndex: 2, explanation: "78 - 34 = 44", difficulty: "medium" },
      { text: "Số 99 gồm mấy chục và mấy đơn vị?", choices: ["9 chục 9 đơn vị", "9 chục 0 đơn vị", "8 chục 9 đơn vị", "10 chục"], correctIndex: 0, explanation: "99 = 9 chục 9 đơn vị", difficulty: "medium" },
      { text: "Số lớn nhất có 2 chữ số là số nào?", choices: ["90", "98", "99", "100"], correctIndex: 2, explanation: "99 là số lớn nhất có 2 chữ số", difficulty: "medium" },
    ],
  });
  await add({
    title: "Ôn tập hình học và đo lường", subject: toan, grade: lop1, ...C10, order: 3, videoId: "bAxZ1SfnTZg",
    description: "Ôn tập cuối năm: hình phẳng, hình khối và đo độ dài, thời gian.",
    questions: [
      { text: "Hình nào có 4 cạnh?", choices: ["Hình tam giác", "Hình tròn", "Hình vuông", "Không có hình nào"], correctIndex: 2, explanation: "Hình vuông có 4 cạnh", difficulty: "easy" },
      { text: "1m bằng bao nhiêu cm?", choices: ["10cm", "100cm", "1000cm", "1cm"], correctIndex: 1, explanation: "1m = 100cm", difficulty: "medium" },
      { text: "Quả bóng có dạng khối gì?", choices: ["Khối lập phương", "Khối cầu", "Khối hộp chữ nhật", "Khối trụ"], correctIndex: 1, explanation: "Quả bóng có dạng khối cầu", difficulty: "easy" },
      { text: "Một tuần có mấy ngày?", choices: ["5", "6", "7", "8"], correctIndex: 2, explanation: "Một tuần có 7 ngày", difficulty: "easy" },
    ],
  });
  await add({
    title: "Luyện tập chung", subject: toan, grade: lop1, ...C10, order: 4, videoId: "zALVoyVYfdM",
    description: "Ôn tập tổng hợp toàn bộ chương trình Toán lớp 1.",
    questions: [
      { text: "56 + 13 = ?", choices: ["68", "69", "70", "71"], correctIndex: 1, explanation: "56 + 13 = 69", difficulty: "medium" },
      { text: "82 - 25 = ?", choices: ["55", "56", "57", "58"], correctIndex: 2, explanation: "82 - 25 = 57", difficulty: "hard" },
      { text: "Số liền sau số 45 là số nào?", choices: ["44", "45", "46", "47"], correctIndex: 2, explanation: "Số liền sau 45 là 46", difficulty: "easy" },
      { text: "Khối hộp chữ nhật có các mặt là hình gì?", choices: ["Hình tròn", "Hình tam giác", "Hình chữ nhật", "Hình lục giác"], correctIndex: 2, explanation: "Khối hộp chữ nhật có các mặt là hình chữ nhật", difficulty: "medium" },
    ],
  });

  console.log(`\nĐã tạo ${n} bài học Toán lớp 1 theo đúng 10 chủ đề SGK Kết nối tri thức.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
