// Bổ sung các chương còn thiếu so với khung chương trình GDPT 2018 cho Lớp 1
// (Vị trí định hướng không gian, các mốc ôn tập giữa/cuối kỳ, kể chuyện theo tranh)
// và sắp xếp lại đúng thứ tự lộ trình trong năm học.
// Toàn bộ nội dung do dự án tự biên soạn — không sao chép từ sách giáo khoa
// hay bất kỳ nền tảng học tập nào khác, chỉ theo cấu trúc chủ đề công khai của
// chương trình phổ thông.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

async function setChapterOrder(title, subject, grade, order, semester) {
  return Chapter.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, subject: subject._id, grade: grade._id, order, semester },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

async function addLesson({ title, description, subject, grade, chapterTitle, order, questions, review }) {
  const chapter = await Chapter.findOne({ title: chapterTitle, subject: subject._id, grade: grade._id });
  if (!chapter) throw new Error(`Không tìm thấy chương: ${chapterTitle}`);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true, isTrial: true },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  const existingCount = await Question.countDocuments({ lesson: lesson._id });
  if (existingCount === 0) {
    await Question.insertMany(questions.map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
  }
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { lesson: lesson._id, ...review },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  return lesson;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[addMissingChaptersLop1] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const toan = subjects.find((s) => s.slug === "toan");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  // ===== Sắp xếp lại thứ tự toàn bộ chương Toán Lớp 1 =====
  await setChapterOrder("Làm quen với các số đến 10", toan, lop1, 1, 1);
  await setChapterOrder("Vị trí, định hướng trong không gian", toan, lop1, 2, 1);
  await setChapterOrder("So sánh các số trong phạm vi 10", toan, lop1, 3, 1);
  await setChapterOrder("Ôn tập giữa học kỳ 1 (Toán)", toan, lop1, 4, 1);
  await setChapterOrder("Hình phẳng và hình khối xung quanh em", toan, lop1, 5, 1);
  await setChapterOrder("Phép cộng, phép trừ trong phạm vi 10", toan, lop1, 6, 1);
  await setChapterOrder("Ôn tập cuối học kỳ 1 (Toán)", toan, lop1, 7, 1);
  await setChapterOrder("Các số trong phạm vi 20", toan, lop1, 8, 2);
  await setChapterOrder("Các số trong phạm vi 100", toan, lop1, 9, 2);
  await setChapterOrder("Ôn tập giữa học kỳ 2 (Toán)", toan, lop1, 10, 2);
  await setChapterOrder("Phép cộng, phép trừ trong phạm vi 100 (không nhớ)", toan, lop1, 11, 2);
  await setChapterOrder("Đo lường: độ dài và thời gian", toan, lop1, 12, 2);
  await setChapterOrder("Ôn tập cuối năm", toan, lop1, 13, 2);

  // ===== Sắp xếp lại thứ tự toàn bộ chương Tiếng Việt Lớp 1 =====
  await setChapterOrder("Làm quen chữ cái và nét cơ bản", tv, lop1, 1, 1);
  await setChapterOrder("Âm - vần - chữ viết", tv, lop1, 2, 1);
  await setChapterOrder("Ôn tập giữa học kỳ 1 (Tiếng Việt)", tv, lop1, 3, 1);
  await setChapterOrder("Ghép âm, vần, tiếng", tv, lop1, 4, 1);
  await setChapterOrder("Ôn tập cuối học kỳ 1 (Tiếng Việt)", tv, lop1, 5, 1);
  await setChapterOrder("Từ và câu cơ bản", tv, lop1, 6, 2);
  await setChapterOrder("Kể chuyện theo tranh", tv, lop1, 7, 2);
  await setChapterOrder("Luyện đọc đoạn văn ngắn", tv, lop1, 8, 2);
  await setChapterOrder("Ôn tập giữa học kỳ 2 (Tiếng Việt)", tv, lop1, 9, 2);
  await setChapterOrder("Luyện nói và kể chuyện đơn giản", tv, lop1, 10, 2);
  await setChapterOrder("Luyện viết chữ và chính tả cơ bản", tv, lop1, 11, 2);

  let count = 0;
  async function add(cfg) {
    await addLesson(cfg);
    count++;
  }

  // ===================== TOÁN — CHƯƠNG MỚI =====================

  await add({
    title: "Trên - dưới, trước - sau",
    description: "Nhận biết và sử dụng đúng các từ chỉ vị trí trên-dưới, trước-sau.",
    subject: toan, grade: lop1, chapterTitle: "Vị trí, định hướng trong không gian", order: 1,
    questions: [
      { text: "Con chim đang bay ở phía nào so với mặt đất?", choices: ["Phía trên", "Phía dưới", "Phía trước", "Phía sau"], correctIndex: 0, explanation: "Con chim bay ở phía trên so với mặt đất", difficulty: "easy" },
      { text: "Bạn An đứng trước bạn Bình. Bình đứng ở vị trí nào so với An?", choices: ["Trước An", "Sau An", "Trên An", "Dưới An"], correctIndex: 1, explanation: "Nếu An đứng trước Bình thì Bình đứng sau An", difficulty: "medium" },
      { text: "Quyển sách để trên bàn, cặp sách để dưới gầm bàn. Vật nào ở vị trí thấp hơn?", choices: ["Quyển sách", "Cặp sách", "Cả hai bằng nhau", "Không xác định"], correctIndex: 1, explanation: "Cặp sách ở dưới gầm bàn nên ở vị trí thấp hơn", difficulty: "medium" },
      { text: "Khi xếp hàng vào lớp, bạn đứng đầu hàng ở vị trí nào?", choices: ["Trước tất cả các bạn khác", "Sau tất cả các bạn khác", "Ở giữa hàng", "Không có vị trí cố định"], correctIndex: 0, explanation: "Bạn đứng đầu hàng ở vị trí trước tất cả các bạn khác", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Trên - dưới, trước - sau",
      content: "Các từ 'trên', 'dưới' dùng để chỉ vị trí theo chiều cao (vật này cao hơn hay thấp hơn vật kia). Các từ 'trước', 'sau' dùng để chỉ thứ tự hoặc vị trí theo chiều di chuyển.",
      examples: ["Chim bay ở trên, mặt đất ở dưới", "An đứng trước, Bình đứng sau", "Sách trên bàn, cặp dưới gầm bàn"],
    },
  });

  await add({
    title: "Trái - phải, ở giữa",
    description: "Nhận biết và sử dụng đúng các từ chỉ vị trí trái-phải, ở giữa.",
    subject: toan, grade: lop1, chapterTitle: "Vị trí, định hướng trong không gian", order: 2,
    questions: [
      { text: "Em cầm bút bằng tay nào thường được gọi là 'tay thuận' của đa số người?", choices: ["Tay trái", "Tay phải", "Cả hai tay", "Không có quy định"], correctIndex: 1, explanation: "Đa số mọi người thuận tay phải, nhưng tay thuận có thể khác nhau ở mỗi người", difficulty: "easy" },
      { text: "Ba bạn xếp hàng: Lan - Hoa - Mai. Bạn nào đứng ở giữa?", choices: ["Lan", "Hoa", "Mai", "Không xác định"], correctIndex: 1, explanation: "Hoa đứng ở giữa Lan và Mai", difficulty: "medium" },
      { text: "Nếu em quay mặt vào bảng, phía tay trái của em là hướng nào trong lớp?", choices: ["Phía cửa ra vào (nếu cửa bên trái)", "Luôn là phía cửa sổ", "Không xác định được", "Phía sau lưng"], correctIndex: 0, explanation: "Tuỳ theo cách bố trí lớp học mà phía tay trái sẽ khác nhau, cần quan sát thực tế", difficulty: "hard" },
      { text: "Vật ở giữa hai vật khác thì có đặc điểm gì?", choices: ["Nằm cạnh cả hai vật kia, không lệch hẳn về bên nào", "Nằm xa cả hai vật kia", "Nằm trên cả hai vật kia", "Không có đặc điểm gì đặc biệt"], correctIndex: 0, explanation: "Vật ở giữa nằm giữa hai vật kia, không lệch hẳn về bên trái hay bên phải", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Trái - phải, ở giữa",
      content: "'Trái', 'phải' là các từ chỉ vị trí theo hai bên của một vật hoặc người (tuỳ theo hướng nhìn). 'Ở giữa' chỉ vị trí nằm giữa hai vật khác, không lệch về bên nào.",
      examples: ["Lan - Hoa - Mai: Hoa đứng ở giữa", "Tay trái và tay phải của em", "Nhìn vào bảng: xác định trái/phải theo hướng nhìn"],
    },
  });

  await add({
    title: "Ôn tập các số đến 10",
    description: "Ôn tập tổng hợp giữa học kỳ 1: đếm, đọc, viết, so sánh các số trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 1 (Toán)", order: 1,
    questions: [
      { text: "Đếm: 🍎🍎🍎🍎🍎🍎. Có mấy quả táo?", choices: ["5", "6", "7", "8"], correctIndex: 1, explanation: "Đếm được 6 quả táo", difficulty: "easy" },
      { text: "So sánh: 8 ... 5", choices: ["8 < 5", "8 = 5", "8 > 5", "Không so sánh được"], correctIndex: 2, explanation: "8 > 5", difficulty: "easy" },
      { text: "Số liền sau số 9 là số nào?", choices: ["8", "10", "9", "11"], correctIndex: 1, explanation: "Số liền sau 9 là 10", difficulty: "medium" },
      { text: "Số nào lớn nhất trong các số 4, 9, 2, 7?", choices: ["4", "9", "2", "7"], correctIndex: 1, explanation: "9 là số lớn nhất", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập các số đến 10",
      content: "Ôn lại cách đếm, đọc, viết, so sánh các số từ 0 đến 10 đã học ở đầu học kỳ 1.",
      examples: ["Đếm số lượng đồ vật", "So sánh 8 > 5", "Số liền sau 9 là 10"],
    },
  });

  await add({
    title: "Ôn tập so sánh và hình học",
    description: "Ôn tập tổng hợp giữa học kỳ 1 về so sánh số và nhận biết hình phẳng, hình khối.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 1 (Toán)", order: 2,
    questions: [
      { text: "Sắp xếp từ bé đến lớn: 7, 3, 5. Số đứng đầu là số nào?", choices: ["3", "5", "7", "Không xác định"], correctIndex: 0, explanation: "Thứ tự tăng dần: 3, 5, 7", difficulty: "medium" },
      { text: "Hình nào có 3 cạnh?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 2, explanation: "Hình tam giác có 3 cạnh", difficulty: "easy" },
      { text: "Viên xúc xắc có dạng khối gì?", choices: ["Khối cầu", "Khối lập phương", "Khối trụ", "Khối nón"], correctIndex: 1, explanation: "Viên xúc xắc có dạng khối lập phương", difficulty: "medium" },
      { text: "Con mèo đứng trước con chó. Con chó đứng ở vị trí nào so với con mèo?", choices: ["Trước con mèo", "Sau con mèo", "Trên con mèo", "Dưới con mèo"], correctIndex: 1, explanation: "Con chó đứng sau con mèo", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập so sánh và hình học",
      content: "Ôn lại cách so sánh, sắp xếp thứ tự các số, nhận biết hình phẳng, hình khối, và các từ chỉ vị trí (trên-dưới, trước-sau, trái-phải) đã học.",
      examples: ["3, 5, 7 (thứ tự tăng dần)", "Hình tam giác: 3 cạnh", "Khối lập phương: viên xúc xắc"],
    },
  });

  await add({
    title: "Ôn tập phép cộng, phép trừ trong phạm vi 10",
    description: "Ôn tập cuối học kỳ 1 về phép cộng, phép trừ trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập cuối học kỳ 1 (Toán)", order: 1,
    questions: [
      { text: "4 + 5 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "4 + 5 = 9", difficulty: "easy" },
      { text: "10 - 6 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "10 - 6 = 4", difficulty: "easy" },
      { text: "Bạn Lan có 8 cái kẹo, ăn hết 3 cái. Hỏi Lan còn lại mấy cái kẹo?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "8 - 3 = 5", difficulty: "medium" },
      { text: "Số nào cộng với 3 thì bằng 7?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "3 + 4 = 7", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập phép cộng, phép trừ trong phạm vi 10",
      content: "Ôn lại các phép cộng, trừ trong phạm vi 10 và cách giải bài toán có lời văn đơn giản.",
      examples: ["4 + 5 = 9", "10 - 6 = 4", "8 kẹo - 3 kẹo = 5 kẹo"],
    },
  });

  await add({
    title: "Ôn tập tổng hợp học kỳ 1",
    description: "Ôn tập tổng hợp toàn bộ kiến thức Toán đã học trong học kỳ 1.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập cuối học kỳ 1 (Toán)", order: 2,
    questions: [
      { text: "Số nào bé nhất trong các số 6, 1, 9, 4?", choices: ["6", "1", "9", "4"], correctIndex: 1, explanation: "1 là số bé nhất", difficulty: "easy" },
      { text: "7 - 2 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "7 - 2 = 5", difficulty: "easy" },
      { text: "Hình nào không có góc?", choices: ["Hình vuông", "Hình tam giác", "Hình tròn", "Hình chữ nhật"], correctIndex: 2, explanation: "Hình tròn không có góc", difficulty: "medium" },
      { text: "Em đứng giữa hai bạn Nam và Hà. Vị trí của em so với Nam và Hà là gì?", choices: ["Ở giữa", "Ở trước", "Ở sau", "Ở trên"], correctIndex: 0, explanation: "Em đứng ở giữa hai bạn", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập tổng hợp học kỳ 1",
      content: "Ôn lại toàn bộ kiến thức Toán học kỳ 1: các số đến 10, vị trí không gian, so sánh số, hình phẳng/hình khối, phép cộng trừ trong phạm vi 10.",
      examples: ["1 là số bé nhất trong 6,1,9,4", "7 - 2 = 5", "Hình tròn không có góc"],
    },
  });

  await add({
    title: "Ôn tập các số trong phạm vi 100",
    description: "Ôn tập giữa học kỳ 2 về đọc, viết, so sánh các số trong phạm vi 100.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 2 (Toán)", order: 1,
    questions: [
      { text: "Số 'năm mươi tư' viết là số nào?", choices: ["45", "54", "504", "540"], correctIndex: 1, explanation: "'năm mươi tư' = 54", difficulty: "medium" },
      { text: "So sánh: 38 ... 83", choices: ["38 > 83", "38 = 83", "38 < 83", "Không so sánh được"], correctIndex: 2, explanation: "38 < 83", difficulty: "medium" },
      { text: "Số 76 gồm mấy chục và mấy đơn vị?", choices: ["7 chục 6 đơn vị", "6 chục 7 đơn vị", "76 chục", "7 chục 0 đơn vị"], correctIndex: 0, explanation: "76 = 7 chục 6 đơn vị", difficulty: "medium" },
      { text: "Số tròn chục liền sau 40 là số nào?", choices: ["30", "50", "41", "45"], correctIndex: 1, explanation: "Số tròn chục liền sau 40 là 50", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập các số trong phạm vi 100",
      content: "Ôn lại cách đọc, viết, so sánh và phân tích cấu tạo (hàng chục, hàng đơn vị) của các số trong phạm vi 100.",
      examples: ["'năm mươi tư' = 54", "38 < 83", "76 = 7 chục 6 đơn vị"],
    },
  });

  await add({
    title: "Ôn tập phép cộng, phép trừ trong phạm vi 100",
    description: "Ôn tập giữa học kỳ 2 về phép cộng, phép trừ không nhớ trong phạm vi 100.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 2 (Toán)", order: 2,
    questions: [
      { text: "32 + 26 = ?", choices: ["56", "57", "58", "59"], correctIndex: 2, explanation: "32 + 26 = 58", difficulty: "medium" },
      { text: "79 - 45 = ?", choices: ["32", "33", "34", "35"], correctIndex: 2, explanation: "79 - 45 = 34", difficulty: "medium" },
      { text: "Một cửa hàng có 65 quyển vở, đã bán 23 quyển. Hỏi còn lại bao nhiêu quyển vở?", choices: ["40", "41", "42", "43"], correctIndex: 2, explanation: "65 - 23 = 42", difficulty: "medium" },
      { text: "20 + 30 = ?", choices: ["40", "50", "60", "45"], correctIndex: 1, explanation: "20 + 30 = 50", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập phép cộng, phép trừ trong phạm vi 100",
      content: "Ôn lại cách đặt tính và tính cộng, trừ các số có hai chữ số không nhớ trong phạm vi 100.",
      examples: ["32 + 26 = 58", "79 - 45 = 34", "65 vở - 23 vở = 42 vở"],
    },
  });

  // ===================== TIẾNG VIỆT — CHƯƠNG MỚI =====================

  await add({
    title: "Ôn tập chữ cái và nét cơ bản",
    description: "Ôn tập giữa học kỳ 1: các nét chữ cơ bản và các chữ cái đã học.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 1 (Tiếng Việt)", order: 1,
    questions: [
      { text: "Chữ 'o' được viết bằng nét gì?", choices: ["Nét thẳng", "Nét cong tròn khép kín", "Nét móc", "Nét khuyết"], correctIndex: 1, explanation: "Chữ 'o' được viết bằng nét cong tròn khép kín", difficulty: "easy" },
      { text: "Trong các chữ a, b, c, chữ nào là nguyên âm?", choices: ["a", "b", "c", "Không có chữ nào"], correctIndex: 0, explanation: "'a' là nguyên âm", difficulty: "easy" },
      { text: "Chữ 'đ' khác chữ 'd' ở điểm nào?", choices: ["Không khác gì", "Có thêm nét ngang", "Viết ngược", "Không có chữ 'đ'"], correctIndex: 1, explanation: "'đ' có thêm nét ngang so với 'd'", difficulty: "medium" },
      { text: "Từ 'mẹ' bắt đầu bằng chữ cái nào?", choices: ["m", "e", "ẹ", "n"], correctIndex: 0, explanation: "'mẹ' bắt đầu bằng chữ 'm'", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập chữ cái và nét cơ bản",
      content: "Ôn lại các nét chữ cơ bản và các chữ cái đã học từ đầu học kỳ 1, phân biệt nguyên âm và phụ âm.",
      examples: ["Nguyên âm: a, e, i, o, u", "'đ' khác 'd' ở nét ngang", "'mẹ' bắt đầu bằng 'm'"],
    },
  });

  await add({
    title: "Ôn tập âm và vần đã học",
    description: "Ôn tập giữa học kỳ 1 về các âm, vần và dấu thanh đã học.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 1 (Tiếng Việt)", order: 2,
    questions: [
      { text: "Tiếng 'bà' mang thanh gì?", choices: ["Thanh ngang", "Thanh huyền", "Thanh sắc", "Thanh hỏi"], correctIndex: 1, explanation: "'bà' mang thanh huyền", difficulty: "easy" },
      { text: "Ghép âm 'c' với vần 'a' được tiếng gì?", choices: ["ca", "ac", "ac", "cà"], correctIndex: 0, explanation: "'c' + 'a' = 'ca'", difficulty: "easy" },
      { text: "Tiếng nào có vần 'an'?", choices: ["bàn", "mát", "làm", "bác"], correctIndex: 0, explanation: "'bàn' có vần 'an'", difficulty: "medium" },
      { text: "Tiếng Việt có tất cả bao nhiêu thanh điệu?", choices: ["4", "5", "6", "7"], correctIndex: 2, explanation: "Tiếng Việt có 6 thanh điệu", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập âm và vần đã học",
      content: "Ôn lại cách ghép âm đầu với vần để tạo thành tiếng, và các dấu thanh đã học (ngang, huyền, sắc, hỏi, ngã, nặng).",
      examples: ["c + a = ca", "bàn có vần 'an'", "6 thanh điệu trong tiếng Việt"],
    },
  });

  await add({
    title: "Ôn tập ghép âm, vần, tiếng",
    description: "Ôn tập cuối học kỳ 1 về kỹ năng ghép âm, vần thành tiếng có nghĩa.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập cuối học kỳ 1 (Tiếng Việt)", order: 1,
    questions: [
      { text: "Ghép âm 'h' với vần 'oa' được tiếng gì?", choices: ["hoa", "hao", "hai", "hà"], correctIndex: 0, explanation: "'h' + 'oa' = 'hoa'", difficulty: "easy" },
      { text: "Tiếng 'khoai' gồm âm và vần nào?", choices: ["kh + oai", "k + hoai", "kho + ai", "k + h + oai"], correctIndex: 0, explanation: "'khoai' = âm 'kh' + vần 'oai'", difficulty: "medium" },
      { text: "Tiếng nào có vần 'oe'?", choices: ["hoa", "khoe", "mèo", "bé"], correctIndex: 1, explanation: "'khoe' có vần 'oe'", difficulty: "medium" },
      { text: "Đọc trơn nghĩa là gì?", choices: ["Đọc từng chữ cái rời rạc", "Đọc liền mạch không đánh vần", "Không đọc gì", "Chỉ đọc âm đầu"], correctIndex: 1, explanation: "Đọc trơn là đọc liền mạch cả tiếng không cần đánh vần", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập ghép âm, vần, tiếng",
      content: "Ôn lại kỹ năng ghép âm đầu với các loại vần (vần đơn, vần có âm cuối, vần có âm đệm) để tạo thành tiếng, và luyện đọc trơn.",
      examples: ["h + oa = hoa", "kh + oai = khoai", "khoe có vần 'oe'"],
    },
  });

  await add({
    title: "Ôn tập tổng hợp học kỳ 1",
    description: "Ôn tập tổng hợp toàn bộ kiến thức Tiếng Việt đã học trong học kỳ 1.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập cuối học kỳ 1 (Tiếng Việt)", order: 2,
    questions: [
      { text: "Từ nào viết đúng: 'lo lắng' hay 'no lắng'?", choices: ["lo lắng", "no lắng", "Cả hai đều đúng", "Cả hai đều sai"], correctIndex: 0, explanation: "'lo lắng' viết đúng với âm 'l'", difficulty: "medium" },
      { text: "Đầu câu cần viết như thế nào?", choices: ["Viết thường", "Viết hoa", "Không cần viết gì đặc biệt", "Viết in nghiêng"], correctIndex: 1, explanation: "Đầu câu cần viết hoa chữ cái đầu tiên", difficulty: "easy" },
      { text: "Bảng chữ cái tiếng Việt có bao nhiêu chữ cái?", choices: ["24", "26", "29", "30"], correctIndex: 2, explanation: "Bảng chữ cái tiếng Việt có 29 chữ cái", difficulty: "hard" },
      { text: "Câu 'Em đi học.' kết thúc bằng dấu gì?", choices: ["Dấu phẩy", "Dấu chấm", "Dấu chấm hỏi", "Dấu chấm than"], correctIndex: 1, explanation: "Câu kể kết thúc bằng dấu chấm", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập tổng hợp học kỳ 1",
      content: "Ôn lại toàn bộ kiến thức Tiếng Việt học kỳ 1: chữ cái, âm vần, ghép tiếng, quy tắc viết hoa và dấu câu cơ bản.",
      examples: ["lo lắng (không phải 'no lắng')", "Bảng chữ cái có 29 chữ", "Câu kể kết thúc bằng dấu chấm"],
    },
  });

  await add({
    title: "Quan sát tranh và đoán nội dung câu chuyện",
    description: "Luyện kỹ năng quan sát tranh minh hoạ để đoán nội dung, diễn biến câu chuyện.",
    subject: tv, grade: lop1, chapterTitle: "Kể chuyện theo tranh", order: 1,
    questions: [
      { text: "Khi quan sát tranh để đoán nội dung câu chuyện, em cần chú ý điều gì?", choices: ["Chỉ nhìn màu sắc", "Nhân vật, hành động và bối cảnh trong tranh", "Không cần chú ý gì", "Chỉ đếm số lượng tranh"], correctIndex: 1, explanation: "Cần quan sát nhân vật, hành động và bối cảnh để đoán nội dung", difficulty: "medium" },
      { text: "Một bộ tranh kể chuyện thường được sắp xếp theo trình tự nào?", choices: ["Ngẫu nhiên", "Trình tự diễn biến câu chuyện", "Từ tranh đẹp nhất đến xấu nhất", "Không có trình tự"], correctIndex: 1, explanation: "Tranh kể chuyện thường sắp xếp theo trình tự diễn biến để dễ theo dõi", difficulty: "medium" },
      { text: "Nếu tranh vẽ một bạn nhỏ đang khóc bên cạnh đồ chơi vỡ, em có thể đoán điều gì đã xảy ra?", choices: ["Bạn nhỏ đang vui chơi", "Đồ chơi của bạn nhỏ bị vỡ nên bạn buồn", "Bạn nhỏ đang ăn cơm", "Không đoán được gì"], correctIndex: 1, explanation: "Dựa vào hình ảnh khóc và đồ chơi vỡ, có thể đoán bạn nhỏ buồn vì đồ chơi bị hỏng", difficulty: "medium" },
      { text: "Vì sao cần quan sát kỹ tranh trước khi kể chuyện?", choices: ["Không cần thiết", "Giúp hiểu đúng và kể chuyện logic, đầy đủ hơn", "Chỉ để tốn thời gian", "Không có lý do gì"], correctIndex: 1, explanation: "Quan sát kỹ giúp em hiểu đúng nội dung và kể chuyện mạch lạc hơn", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Quan sát tranh và đoán nội dung câu chuyện",
      content: "Khi quan sát tranh, em cần chú ý đến nhân vật (ai), hành động (đang làm gì), bối cảnh (ở đâu) để hiểu và đoán được nội dung câu chuyện. Một bộ tranh thường được sắp xếp theo trình tự diễn biến của câu chuyện.",
      examples: ["Quan sát nhân vật, hành động, bối cảnh trong tranh", "Tranh 1 → Tranh 2 → Tranh 3 theo trình tự câu chuyện", "Đoán cảm xúc nhân vật qua nét mặt, hành động trong tranh"],
    },
  });

  await add({
    title: "Kể chuyện theo tranh minh hoạ",
    description: "Luyện kỹ năng kể lại câu chuyện dựa theo một bộ tranh minh hoạ cho sẵn.",
    subject: tv, grade: lop1, chapterTitle: "Kể chuyện theo tranh", order: 2,
    questions: [
      { text: "Khi kể chuyện theo tranh, em nên kể theo thứ tự nào?", choices: ["Kể tranh cuối trước", "Kể lần lượt từ tranh đầu đến tranh cuối", "Kể ngẫu nhiên", "Chỉ kể 1 tranh bất kỳ"], correctIndex: 1, explanation: "Cần kể lần lượt theo đúng thứ tự tranh để câu chuyện mạch lạc", difficulty: "medium" },
      { text: "Khi chuyển từ tranh này sang tranh khác, em có thể dùng từ nối nào?", choices: ["Sau đó, tiếp theo, cuối cùng", "Không cần từ nối", "Chỉ dùng dấu chấm", "Lặp lại y nguyên câu trước"], correctIndex: 0, explanation: "Các từ nối như 'sau đó', 'tiếp theo', 'cuối cùng' giúp câu chuyện liền mạch", difficulty: "medium" },
      { text: "Khi kể chuyện, giọng kể nên như thế nào?", choices: ["Đều đều, không cảm xúc", "Có ngữ điệu phù hợp với nội dung", "Nói thật nhanh", "Không cần rõ ràng"], correctIndex: 1, explanation: "Giọng kể nên có ngữ điệu phù hợp để câu chuyện sinh động, hấp dẫn hơn", difficulty: "medium" },
      { text: "Sau khi kể xong câu chuyện, em có thể làm gì?", choices: ["Không cần làm gì thêm", "Nêu cảm nghĩ hoặc bài học rút ra từ câu chuyện", "Kể lại từ đầu ngay lập tức", "Bỏ qua không cần kết thúc"], correctIndex: 1, explanation: "Có thể nêu cảm nghĩ hoặc bài học từ câu chuyện để kết thúc phần kể", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Kể chuyện theo tranh minh hoạ",
      content: "Khi kể chuyện theo tranh, em kể lần lượt theo đúng thứ tự các tranh, dùng từ nối để chuyển ý mạch lạc, giọng kể có ngữ điệu phù hợp, và có thể nêu cảm nghĩ ở cuối.",
      examples: ["Kể theo thứ tự: Tranh 1 → Tranh 2 → Tranh 3", "Từ nối: sau đó, tiếp theo, cuối cùng", "Kết thúc bằng cảm nghĩ về câu chuyện"],
    },
  });

  await add({
    title: "Ôn tập từ và câu cơ bản",
    description: "Ôn tập giữa học kỳ 2 về từ chỉ sự vật, từ chỉ hoạt động và câu đơn giản.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 2 (Tiếng Việt)", order: 1,
    questions: [
      { text: "Từ nào chỉ sự vật?", choices: ["chạy", "bàn", "đẹp", "và"], correctIndex: 1, explanation: "'bàn' là từ chỉ sự vật (đồ vật)", difficulty: "easy" },
      { text: "Từ nào chỉ hoạt động?", choices: ["mèo", "chạy", "hoa", "bàn"], correctIndex: 1, explanation: "'chạy' là từ chỉ hoạt động", difficulty: "easy" },
      { text: "Câu 'Em đi học.' thuộc mẫu câu nào?", choices: ["Ai là gì?", "Ai làm gì?", "Ai thế nào?", "Không thuộc mẫu nào"], correctIndex: 1, explanation: "Câu nêu hoạt động 'đi học' thuộc mẫu Ai làm gì?", difficulty: "medium" },
      { text: "Câu kể kết thúc bằng dấu gì?", choices: ["Dấu chấm hỏi", "Dấu chấm than", "Dấu chấm", "Dấu phẩy"], correctIndex: 2, explanation: "Câu kể kết thúc bằng dấu chấm", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập từ và câu cơ bản",
      content: "Ôn lại các loại từ đã học (từ chỉ sự vật, từ chỉ hoạt động) và cách đặt câu đơn giản theo các mẫu Ai là gì? Ai làm gì? Ai thế nào?",
      examples: ["Từ chỉ sự vật: bàn, ghế, mèo", "Từ chỉ hoạt động: chạy, nhảy, ăn", "Em đi học. (mẫu Ai làm gì?)"],
    },
  });

  await add({
    title: "Ôn tập đọc hiểu đoạn văn ngắn",
    description: "Ôn tập giữa học kỳ 2 về kỹ năng đọc hiểu các đoạn văn ngắn quen thuộc.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập giữa học kỳ 2 (Tiếng Việt)", order: 2,
    questions: [
      { text: "Khi đọc một đoạn văn, em nên đọc như thế nào để hiểu đúng nội dung?", choices: ["Đọc thật nhanh, bỏ qua chi tiết", "Đọc kỹ từng câu, chú ý từ ngữ quan trọng", "Chỉ đọc câu đầu tiên", "Không cần đọc kỹ"], correctIndex: 1, explanation: "Cần đọc kỹ từng câu và chú ý các từ ngữ quan trọng để hiểu đúng nội dung", difficulty: "medium" },
      { text: "Muốn trả lời đúng câu hỏi về nội dung đoạn văn, em cần làm gì?", choices: ["Đoán bừa đáp án", "Đọc lại đoạn văn để tìm thông tin liên quan", "Không cần đọc lại", "Chỉ dựa vào tiêu đề"], correctIndex: 1, explanation: "Nên đọc lại đoạn văn để tìm thông tin chính xác trả lời câu hỏi", difficulty: "medium" },
      { text: "Đoạn văn thường kể về điều gì trong sách Tiếng Việt lớp 1?", choices: ["Chỉ số liệu toán học", "Gia đình, trường lớp, loài vật, thiên nhiên quen thuộc", "Chỉ công thức khoa học", "Không có chủ đề cụ thể"], correctIndex: 1, explanation: "Đoạn văn lớp 1 thường kể về các chủ đề gần gũi như gia đình, trường lớp, loài vật, thiên nhiên", difficulty: "medium" },
      { text: "Sau khi đọc đoạn văn, việc trả lời câu hỏi giúp em điều gì?", choices: ["Không có tác dụng gì", "Kiểm tra và củng cố khả năng đọc hiểu", "Chỉ để mất thời gian", "Không liên quan đến đọc hiểu"], correctIndex: 1, explanation: "Trả lời câu hỏi giúp kiểm tra và củng cố khả năng đọc hiểu của em", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập đọc hiểu đoạn văn ngắn",
      content: "Ôn lại kỹ năng đọc hiểu: đọc kỹ đoạn văn, chú ý từ ngữ quan trọng, đọc lại khi cần để trả lời đúng câu hỏi về nội dung.",
      examples: ["Đọc kỹ từng câu trong đoạn văn", "Đọc lại để tìm thông tin trả lời câu hỏi", "Chủ đề quen thuộc: gia đình, trường lớp, loài vật"],
    },
  });

  console.log(`[addMissingChaptersLop1] Hoàn tất: đã thêm ${count} chủ điểm mới, bổ sung 8 chương còn thiếu và sắp xếp lại lộ trình Lớp 1.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
