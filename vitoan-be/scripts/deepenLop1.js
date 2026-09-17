// Bổ sung thêm chủ điểm cho từng chương Lớp 1 (Toán & Tiếng Việt) để mỗi chương có
// tối thiểu 4-5 chủ điểm, theo đúng lộ trình đã dựng trước đó.
// Toàn bộ nội dung do dự án tự biên soạn, không sao chép từ nguồn nào khác.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

const chapterCache = new Map();
async function getChapter(chapterTitle, subject, grade) {
  const key = `${subject._id}:${grade._id}:${chapterTitle}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const chapter = await Chapter.findOne({ title: chapterTitle, subject: subject._id, grade: grade._id });
  if (!chapter) throw new Error(`Không tìm thấy chương: ${chapterTitle}`);
  chapterCache.set(key, chapter);
  return chapter;
}

async function addLesson({ title, description, subject, grade, chapterTitle, order, isTrial, questions, review }) {
  const chapter = await getChapter(chapterTitle, subject, grade);
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
  console.log("[deepenLop1] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const toan = subjects.find((s) => s.slug === "toan");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  let count = 0;
  async function add(cfg) {
    await addLesson(cfg);
    count++;
  }

  // ===================== TOÁN =====================

  await add({
    title: "Tách số và gộp số trong phạm vi 10",
    description: "Học cách tách một số thành hai phần và gộp hai số thành một số trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "Làm quen với các số đến 10", order: 4,
    questions: [
      { text: "Số 5 có thể tách thành 2 và mấy?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "5 = 2 + 3", difficulty: "easy" },
      { text: "Gộp 3 và 4 được số nào?", choices: ["6", "7", "8", "5"], correctIndex: 1, explanation: "3 + 4 = 7", difficulty: "easy" },
      { text: "Số 8 có thể tách thành 5 và mấy?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "8 = 5 + 3", difficulty: "medium" },
      { text: "Việc tách số, gộp số giúp em điều gì?", choices: ["Không có ích gì", "Hiểu rõ cấu tạo số, học tốt phép cộng trừ", "Chỉ để trang trí", "Không liên quan tới toán"], correctIndex: 1, explanation: "Tách/gộp số giúp em hiểu cấu tạo số, làm nền tảng học phép cộng, trừ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Tách số và gộp số trong phạm vi 10",
      content: "Một số có thể tách thành hai số nhỏ hơn (ví dụ 5 = 2+3 = 1+4), và ngược lại hai số có thể gộp lại thành một số lớn hơn.\nKỹ năng này là nền tảng quan trọng để học phép cộng, phép trừ.",
      examples: ["5 = 2 + 3", "8 = 5 + 3", "3 + 4 = 7"],
    },
  });

  await add({
    title: "Ôn tập nhận biết các số đến 10",
    description: "Ôn tập tổng hợp về đếm, đọc, viết các số từ 0 đến 10.",
    subject: toan, grade: lop1, chapterTitle: "Làm quen với các số đến 10", order: 5,
    questions: [
      { text: "Đếm: 🍌🍌🍌🍌. Có mấy quả chuối?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "Đếm được 4 quả chuối", difficulty: "easy" },
      { text: "Số nào đứng giữa số 6 và số 8?", choices: ["5", "7", "9", "6"], correctIndex: 1, explanation: "Số đứng giữa 6 và 8 là 7", difficulty: "medium" },
      { text: "Số 'chín' viết là chữ số nào?", choices: ["8", "9", "7", "10"], correctIndex: 1, explanation: "'chín' = 9", difficulty: "easy" },
      { text: "Trong các số 0 đến 10, số nào là số bé nhất?", choices: ["0", "1", "10", "5"], correctIndex: 0, explanation: "0 là số bé nhất trong phạm vi này", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập nhận biết các số đến 10",
      content: "Ôn lại cách đếm, đọc, viết và thứ tự các số từ 0 đến 10. Số 0 là số bé nhất, số 10 là số lớn nhất trong phạm vi này.",
      examples: ["0, 1, 2, ..., 10 là dãy số từ bé đến lớn", "Số liền giữa 6 và 8 là 7", "'chín' = 9"],
    },
  });

  await add({
    title: "Số liền trước, số liền sau",
    description: "Xác định số liền trước và số liền sau của một số trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "So sánh các số trong phạm vi 10", order: 4,
    questions: [
      { text: "Số liền trước số 5 là số nào?", choices: ["4", "6", "5", "3"], correctIndex: 0, explanation: "Số liền trước 5 là 4", difficulty: "easy" },
      { text: "Số liền sau số 7 là số nào?", choices: ["6", "8", "7", "9"], correctIndex: 1, explanation: "Số liền sau 7 là 8", difficulty: "easy" },
      { text: "Số liền trước và liền sau của số 5 lần lượt là?", choices: ["4 và 6", "6 và 4", "3 và 7", "5 và 5"], correctIndex: 0, explanation: "Liền trước là 4, liền sau là 6", difficulty: "medium" },
      { text: "Số nào không có số liền trước trong phạm vi các số tự nhiên từ 0?", choices: ["0", "1", "10", "5"], correctIndex: 0, explanation: "Số 0 là số bé nhất nên không có số liền trước trong phạm vi này", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Số liền trước, số liền sau",
      content: "Số liền sau của một số là số lớn hơn số đó 1 đơn vị. Số liền trước là số nhỏ hơn số đó 1 đơn vị.",
      examples: ["Liền trước 5 là 4", "Liền sau 7 là 8", "0 không có số liền trước (trong phạm vi số tự nhiên bắt đầu từ 0)"],
    },
  });

  await add({
    title: "Luyện tập so sánh và sắp xếp số",
    description: "Luyện tập tổng hợp các dạng bài so sánh và sắp xếp số trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "So sánh các số trong phạm vi 10", order: 5,
    questions: [
      { text: "Sắp xếp từ bé đến lớn: 6, 1, 9, 4. Dãy đúng là?", choices: ["1, 4, 6, 9", "9, 6, 4, 1", "1, 6, 4, 9", "4, 1, 9, 6"], correctIndex: 0, explanation: "Thứ tự tăng dần: 1, 4, 6, 9", difficulty: "medium" },
      { text: "So sánh: 8 ... 8", choices: ["8 > 8", "8 < 8", "8 = 8", "Không xác định"], correctIndex: 2, explanation: "8 = 8", difficulty: "easy" },
      { text: "Số nào lớn hơn 5 nhưng bé hơn 8?", choices: ["4", "6", "9", "5"], correctIndex: 1, explanation: "6 lớn hơn 5 và bé hơn 8", difficulty: "medium" },
      { text: "Trong các số 3, 7, 2, 9, số lớn nhất và bé nhất lần lượt là?", choices: ["9 và 2", "2 và 9", "7 và 3", "9 và 3"], correctIndex: 0, explanation: "Lớn nhất là 9, bé nhất là 2", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện tập so sánh và sắp xếp số",
      content: "Ôn lại các dấu so sánh >, <, = và cách sắp xếp một dãy số theo thứ tự tăng dần hoặc giảm dần.",
      examples: ["1, 4, 6, 9 (tăng dần)", "8 = 8", "6 nằm giữa 5 và 8"],
    },
  });

  await add({
    title: "Ghép hình đơn giản từ các hình đã học",
    description: "Luyện tập ghép các hình vuông, tròn, tam giác, chữ nhật thành hình mới.",
    subject: toan, grade: lop1, chapterTitle: "Hình phẳng và hình khối xung quanh em", order: 3,
    questions: [
      { text: "Ghép 2 hình tam giác bằng nhau có thể tạo thành hình gì?", choices: ["Hình tròn", "Hình vuông hoặc hình chữ nhật", "Không tạo được hình gì", "Hình tam giác lớn hơn"], correctIndex: 1, explanation: "Hai hình tam giác vuông cân ghép lại có thể tạo thành hình vuông hoặc chữ nhật", difficulty: "medium" },
      { text: "Ngôi nhà đơn giản thường được vẽ từ những hình nào?", choices: ["Hình vuông/chữ nhật và hình tam giác", "Chỉ hình tròn", "Chỉ hình tam giác", "Không có hình nào cụ thể"], correctIndex: 0, explanation: "Ngôi nhà thường vẽ từ hình vuông/chữ nhật (thân nhà) và hình tam giác (mái nhà)", difficulty: "easy" },
      { text: "Muốn ghép hình đẹp, các hình cần đặt như thế nào?", choices: ["Đặt chồng lộn xộn", "Đặt các cạnh khớp với nhau", "Đặt cách xa nhau", "Không cần quy tắc gì"], correctIndex: 1, explanation: "Cần đặt các cạnh của hình khớp với nhau để tạo hình mới đẹp mắt", difficulty: "medium" },
      { text: "Bông hoa đơn giản có thể ghép từ nhiều hình gì?", choices: ["Nhiều hình tròn nhỏ xung quanh 1 hình tròn lớn", "Chỉ hình vuông", "Chỉ hình tam giác", "Không ghép được từ hình cơ bản"], correctIndex: 0, explanation: "Bông hoa đơn giản thường ghép từ các hình tròn nhỏ (cánh hoa) quanh hình tròn lớn (nhụy hoa)", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ghép hình đơn giản từ các hình đã học",
      content: "Các hình phẳng cơ bản (vuông, tròn, tam giác, chữ nhật) có thể ghép lại với nhau để tạo thành các hình ảnh quen thuộc như ngôi nhà, bông hoa, ô tô đồ chơi.",
      examples: ["Ngôi nhà: hình vuông + hình tam giác", "Bông hoa: các hình tròn nhỏ quanh hình tròn lớn", "2 tam giác ghép thành hình vuông"],
    },
  });

  await add({
    title: "Nhận biết khối cầu, khối trụ",
    description: "Nhận biết và phân biệt khối cầu, khối trụ với các khối đã học.",
    subject: toan, grade: lop1, chapterTitle: "Hình phẳng và hình khối xung quanh em", order: 4,
    questions: [
      { text: "Quả bóng đá có dạng khối gì?", choices: ["Khối lập phương", "Khối cầu", "Khối trụ", "Khối hộp chữ nhật"], correctIndex: 1, explanation: "Quả bóng đá có dạng khối cầu", difficulty: "easy" },
      { text: "Lon nước ngọt thường có dạng khối gì?", choices: ["Khối cầu", "Khối trụ", "Khối lập phương", "Khối hộp chữ nhật"], correctIndex: 1, explanation: "Lon nước ngọt thường có dạng khối trụ", difficulty: "easy" },
      { text: "Khối cầu có đặc điểm gì?", choices: ["Có các mặt phẳng vuông", "Có bề mặt cong đều, giống quả bóng", "Có 6 mặt", "Có 4 cạnh"], correctIndex: 1, explanation: "Khối cầu có bề mặt cong đều, không có góc cạnh", difficulty: "medium" },
      { text: "Vật nào có dạng khối trụ?", choices: ["Quả bóng", "Viên xúc xắc", "Lon sữa", "Hộp bút hình chữ nhật"], correctIndex: 2, explanation: "Lon sữa có dạng khối trụ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhận biết khối cầu, khối trụ",
      content: "Khối cầu có bề mặt cong đều, giống quả bóng (VD: quả bóng, viên bi).\nKhối trụ có hai mặt đáy là hình tròn và mặt bên cong (VD: lon nước, ống hút).",
      examples: ["Quả bóng: khối cầu", "Lon nước ngọt: khối trụ", "Viên bi: khối cầu"],
    },
  });

  await add({
    title: "Ôn tập hình phẳng và hình khối",
    description: "Ôn tập tổng hợp về các hình phẳng và hình khối đã học.",
    subject: toan, grade: lop1, chapterTitle: "Hình phẳng và hình khối xung quanh em", order: 5,
    questions: [
      { text: "Hình nào không có góc, không có cạnh?", choices: ["Hình vuông", "Hình tam giác", "Hình tròn", "Hình chữ nhật"], correctIndex: 2, explanation: "Hình tròn không có góc, không có cạnh", difficulty: "easy" },
      { text: "Khối nào có 6 mặt đều là hình vuông bằng nhau?", choices: ["Khối cầu", "Khối trụ", "Khối lập phương", "Khối nón"], correctIndex: 2, explanation: "Khối lập phương có 6 mặt vuông bằng nhau", difficulty: "medium" },
      { text: "Vật nào trong lớp học có dạng hình chữ nhật?", choices: ["Quả bóng", "Mặt bảng đen", "Viên phấn tròn", "Quả địa cầu"], correctIndex: 1, explanation: "Mặt bảng đen thường có dạng hình chữ nhật", difficulty: "medium" },
      { text: "Khối cầu và khối trụ giống nhau ở điểm nào?", choices: ["Đều có mặt cong", "Đều có 6 mặt vuông", "Đều có 4 cạnh", "Không giống nhau điểm nào"], correctIndex: 0, explanation: "Cả khối cầu và khối trụ đều có mặt cong (khối trụ có thêm 2 mặt đáy tròn)", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Ôn tập hình phẳng và hình khối",
      content: "Ôn lại các hình phẳng (vuông, tròn, tam giác, chữ nhật) và các khối hình (lập phương, hộp chữ nhật, cầu, trụ) cùng đặc điểm nhận biết của từng loại.",
      examples: ["Hình tròn: không góc, không cạnh", "Khối lập phương: 6 mặt vuông", "Khối cầu, khối trụ: có mặt cong"],
    },
  });

  await add({
    title: "Tính nhẩm nhanh phép cộng, trừ trong phạm vi 10",
    description: "Luyện kỹ năng tính nhẩm nhanh các phép cộng, trừ trong phạm vi 10.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 10", order: 5,
    questions: [
      { text: "Tính nhẩm: 6 + 3 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "6 + 3 = 9", difficulty: "easy" },
      { text: "Tính nhẩm: 10 - 4 = ?", choices: ["5", "6", "7", "4"], correctIndex: 1, explanation: "10 - 4 = 6", difficulty: "easy" },
      { text: "Tính nhẩm: 5 + 5 = ?", choices: ["9", "10", "11", "8"], correctIndex: 1, explanation: "5 + 5 = 10", difficulty: "easy" },
      { text: "Cách nào giúp tính nhẩm nhanh 8 + 3?", choices: ["Đếm tiếp từ 8: 9, 10, 11", "Không có cách nào", "Chỉ đoán kết quả", "Luôn phải dùng que tính"], correctIndex: 0, explanation: "Có thể đếm tiếp từ 8 thêm 3 lần: 9, 10, 11", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Tính nhẩm nhanh phép cộng, trừ trong phạm vi 10",
      content: "Để tính nhẩm nhanh, em có thể đếm tiếp (với phép cộng) hoặc đếm lùi (với phép trừ) từ một số cho trước, hoặc ghi nhớ các phép tính cơ bản.",
      examples: ["6 + 3 = 9 (đếm tiếp: 7, 8, 9)", "10 - 4 = 6 (đếm lùi: 9, 8, 7, 6)", "5 + 5 = 10"],
    },
  });

  await add({
    title: "Tách số, gộp số trong phạm vi 20",
    description: "Học cách tách và gộp số trong phạm vi 20, làm nền tảng cho phép cộng trừ.",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 20", order: 4,
    questions: [
      { text: "Số 15 có thể tách thành 10 và mấy?", choices: ["3", "4", "5", "6"], correctIndex: 2, explanation: "15 = 10 + 5", difficulty: "medium" },
      { text: "Gộp 12 và 5 được số nào?", choices: ["16", "17", "18", "15"], correctIndex: 1, explanation: "12 + 5 = 17", difficulty: "medium" },
      { text: "Số 18 gồm mấy chục và mấy đơn vị?", choices: ["1 chục 8 đơn vị", "8 chục 1 đơn vị", "1 chục 7 đơn vị", "18 chục"], correctIndex: 0, explanation: "18 = 1 chục 8 đơn vị", difficulty: "medium" },
      { text: "Số 20 có thể tách thành 10 và mấy?", choices: ["8", "9", "10", "11"], correctIndex: 2, explanation: "20 = 10 + 10", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Tách số, gộp số trong phạm vi 20",
      content: "Các số trong phạm vi 20 đều có thể tách thành 1 chục và một số đơn vị. Việc tách/gộp số giúp em tính cộng trừ trong phạm vi 20 dễ dàng hơn.",
      examples: ["15 = 10 + 5", "18 = 1 chục 8 đơn vị", "12 + 5 = 17"],
    },
  });

  await add({
    title: "Giải bài toán có lời văn trong phạm vi 20",
    description: "Luyện giải các bài toán đố có lời văn với số liệu trong phạm vi 20.",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 20", order: 5,
    questions: [
      { text: "Em có 12 cái kẹo, mẹ cho thêm 6 cái. Hỏi em có tất cả bao nhiêu cái kẹo?", choices: ["16", "17", "18", "19"], correctIndex: 2, explanation: "12 + 6 = 18", difficulty: "medium" },
      { text: "Có 17 quả bóng bay, đã bay mất 5 quả. Hỏi còn lại bao nhiêu quả?", choices: ["10", "11", "12", "13"], correctIndex: 2, explanation: "17 - 5 = 12", difficulty: "medium" },
      { text: "Lớp có 14 bạn nam và 5 bạn nữ. Lớp có tất cả bao nhiêu bạn?", choices: ["18", "19", "20", "17"], correctIndex: 1, explanation: "14 + 5 = 19", difficulty: "medium" },
      { text: "Khi giải bài toán, câu trả lời cuối cùng cần có gì?", choices: ["Chỉ cần số", "Số và đơn vị phù hợp (VD: cái kẹo, quả bóng)", "Không cần trả lời", "Chỉ cần phép tính"], correctIndex: 1, explanation: "Câu trả lời cần có số và đơn vị phù hợp với đề bài", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Giải bài toán có lời văn trong phạm vi 20",
      content: "Các bước giải bài toán có lời văn: đọc kỹ đề, xác định phép tính (cộng hoặc trừ), tính toán, viết câu trả lời đầy đủ có đơn vị.",
      examples: ["12 kẹo + 6 kẹo = 18 kẹo", "17 bóng - 5 bóng = 12 bóng", "14 nam + 5 nữ = 19 bạn"],
    },
  });

  await add({
    title: "Số liền trước, số liền sau trong phạm vi 100",
    description: "Xác định số liền trước, số liền sau của một số có hai chữ số.",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 100", order: 4,
    questions: [
      { text: "Số liền sau số 49 là số nào?", choices: ["48", "50", "49", "51"], correctIndex: 1, explanation: "Số liền sau 49 là 50", difficulty: "medium" },
      { text: "Số liền trước số 70 là số nào?", choices: ["69", "71", "68", "70"], correctIndex: 0, explanation: "Số liền trước 70 là 69", difficulty: "medium" },
      { text: "Số liền sau số 99 là số nào?", choices: ["98", "100", "9", "199"], correctIndex: 1, explanation: "Số liền sau 99 là 100", difficulty: "hard" },
      { text: "Số liền trước và liền sau của 60 lần lượt là?", choices: ["59 và 61", "61 và 59", "58 và 62", "60 và 60"], correctIndex: 0, explanation: "Liền trước là 59, liền sau là 61", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Số liền trước, số liền sau trong phạm vi 100",
      content: "Tương tự phạm vi 10, số liền sau lớn hơn 1 đơn vị, số liền trước bé hơn 1 đơn vị so với số đã cho, áp dụng cả với số có hai chữ số.",
      examples: ["Liền sau 49 là 50", "Liền trước 70 là 69", "Liền sau 99 là 100"],
    },
  });

  await add({
    title: "Luyện tập tổng hợp số trong phạm vi 100",
    description: "Luyện tập tổng hợp đọc, viết, so sánh, phân tích cấu tạo số trong phạm vi 100.",
    subject: toan, grade: lop1, chapterTitle: "Các số trong phạm vi 100", order: 5,
    questions: [
      { text: "Số 'sáu mươi ba' viết là số nào?", choices: ["36", "63", "603", "630"], correctIndex: 1, explanation: "'sáu mươi ba' = 63", difficulty: "medium" },
      { text: "So sánh: 56 ... 65", choices: ["56 > 65", "56 = 65", "56 < 65", "Không so sánh được"], correctIndex: 2, explanation: "56 < 65 (5 chục < 6 chục)", difficulty: "medium" },
      { text: "Số 74 gồm mấy chục và mấy đơn vị?", choices: ["7 chục 4 đơn vị", "4 chục 7 đơn vị", "74 chục", "7 chục 0 đơn vị"], correctIndex: 0, explanation: "74 = 7 chục 4 đơn vị", difficulty: "medium" },
      { text: "Số lớn nhất có hai chữ số là số nào?", choices: ["90", "98", "99", "100"], correctIndex: 2, explanation: "99 là số lớn nhất có hai chữ số", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Luyện tập tổng hợp số trong phạm vi 100",
      content: "Ôn lại cách đọc, viết, so sánh và phân tích cấu tạo (hàng chục, hàng đơn vị) của các số có hai chữ số trong phạm vi 100.",
      examples: ["'sáu mươi ba' = 63", "56 < 65", "99 là số lớn nhất có hai chữ số"],
    },
  });

  await add({
    title: "Tính nhẩm cộng trừ các số tròn chục",
    description: "Luyện tính nhẩm nhanh phép cộng, trừ các số tròn chục trong phạm vi 100.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 100 (không nhớ)", order: 4,
    questions: [
      { text: "30 + 20 = ?", choices: ["40", "50", "60", "45"], correctIndex: 1, explanation: "30 + 20 = 50", difficulty: "easy" },
      { text: "70 - 30 = ?", choices: ["30", "40", "50", "35"], correctIndex: 1, explanation: "70 - 30 = 40", difficulty: "easy" },
      { text: "50 + 40 = ?", choices: ["80", "85", "90", "95"], correctIndex: 2, explanation: "50 + 40 = 90", difficulty: "medium" },
      { text: "Muốn tính nhẩm 60 + 20, em có thể nghĩ đến phép tính nào đơn giản hơn?", choices: ["6 + 2 = 8, rồi thêm số 0", "6 x 2", "60 x 20", "Không có cách nào"], correctIndex: 0, explanation: "Tính 6+2=8 rồi thêm số 0 vào sau được 80", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Tính nhẩm cộng trừ các số tròn chục",
      content: "Khi cộng trừ các số tròn chục, em có thể bỏ số 0 ở cuối, tính phép cộng/trừ với các chữ số hàng chục, sau đó thêm số 0 vào kết quả.",
      examples: ["30 + 20 = 50 (3+2=5, thêm 0)", "70 - 30 = 40 (7-3=4, thêm 0)", "60 + 20 = 80 (6+2=8, thêm 0)"],
    },
  });

  await add({
    title: "Luyện tập tổng hợp cộng trừ phạm vi 100",
    description: "Luyện tập tổng hợp các dạng bài cộng, trừ số có hai chữ số không nhớ.",
    subject: toan, grade: lop1, chapterTitle: "Phép cộng, phép trừ trong phạm vi 100 (không nhớ)", order: 5,
    questions: [
      { text: "36 + 22 = ?", choices: ["56", "57", "58", "59"], correctIndex: 2, explanation: "36 + 22 = 58", difficulty: "medium" },
      { text: "69 - 34 = ?", choices: ["33", "34", "35", "36"], correctIndex: 2, explanation: "69 - 34 = 35", difficulty: "medium" },
      { text: "Tìm số còn thiếu: 25 + ... = 49", choices: ["22", "23", "24", "25"], correctIndex: 2, explanation: "49 - 25 = 24", difficulty: "hard" },
      { text: "82 - 51 = ?", choices: ["30", "31", "32", "33"], correctIndex: 1, explanation: "82 - 51 = 31", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện tập tổng hợp cộng trừ phạm vi 100",
      content: "Ôn tập lại cách đặt tính cộng, trừ số có hai chữ số không nhớ, và cách tìm số còn thiếu trong phép tính bằng phép tính ngược lại.",
      examples: ["36 + 22 = 58", "69 - 34 = 35", "25 + 24 = 49, vậy số cần tìm là 24"],
    },
  });

  await add({
    title: "So sánh độ dài các đoạn thẳng",
    description: "Luyện tập so sánh độ dài các đoạn thẳng, vật dụng bằng đơn vị xăng-ti-mét.",
    subject: toan, grade: lop1, chapterTitle: "Đo lường: độ dài và thời gian", order: 4,
    questions: [
      { text: "Đoạn thẳng dài 8cm so với đoạn thẳng dài 5cm thì như thế nào?", choices: ["Ngắn hơn", "Dài hơn", "Bằng nhau", "Không so sánh được"], correctIndex: 1, explanation: "8cm > 5cm nên đoạn thẳng 8cm dài hơn", difficulty: "easy" },
      { text: "Hai đoạn thẳng cùng dài 10cm thì như thế nào so với nhau?", choices: ["Dài hơn nhau", "Ngắn hơn nhau", "Bằng nhau", "Không so sánh được"], correctIndex: 2, explanation: "Cùng độ dài 10cm nên bằng nhau", difficulty: "easy" },
      { text: "Bút chì dài 12cm, thước kẻ dài 15cm. Vật nào dài hơn?", choices: ["Bút chì", "Thước kẻ", "Bằng nhau", "Không xác định"], correctIndex: 1, explanation: "15cm > 12cm nên thước kẻ dài hơn", difficulty: "medium" },
      { text: "Muốn so sánh độ dài hai vật, em cần biết điều gì?", choices: ["Màu sắc của vật", "Số đo độ dài của mỗi vật (cùng đơn vị)", "Giá tiền của vật", "Không cần biết gì"], correctIndex: 1, explanation: "Cần biết số đo độ dài của mỗi vật theo cùng một đơn vị để so sánh", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: So sánh độ dài các đoạn thẳng",
      content: "Để so sánh độ dài hai đoạn thẳng hoặc vật dụng, em so sánh số đo của chúng theo cùng đơn vị (VD: cm). Số đo lớn hơn thì vật đó dài hơn.",
      examples: ["8cm > 5cm: đoạn 8cm dài hơn", "10cm = 10cm: bằng nhau", "15cm > 12cm: thước kẻ dài hơn bút chì"],
    },
  });

  await add({
    title: "Ôn tập đo lường",
    description: "Ôn tập tổng hợp về đo độ dài, xem giờ đúng và các ngày trong tuần.",
    subject: toan, grade: lop1, chapterTitle: "Đo lường: độ dài và thời gian", order: 5,
    questions: [
      { text: "Đơn vị đo độ dài thường dùng trong toán học lớp 1 là gì?", choices: ["Kilôgam", "Xăng-ti-mét", "Lít", "Giây"], correctIndex: 1, explanation: "Xăng-ti-mét (cm) là đơn vị đo độ dài thường dùng", difficulty: "easy" },
      { text: "Kim ngắn trên đồng hồ dùng để chỉ gì?", choices: ["Phút", "Giờ", "Giây", "Ngày"], correctIndex: 1, explanation: "Kim ngắn chỉ giờ", difficulty: "easy" },
      { text: "Một tuần có bao nhiêu ngày?", choices: ["5", "6", "7", "8"], correctIndex: 2, explanation: "Một tuần có 7 ngày", difficulty: "easy" },
      { text: "Ngày nghỉ cuối tuần thường là những ngày nào?", choices: ["Thứ Hai, Thứ Ba", "Thứ Bảy, Chủ nhật", "Thứ Tư, Thứ Năm", "Thứ Sáu, Thứ Bảy"], correctIndex: 1, explanation: "Thứ Bảy và Chủ nhật là hai ngày cuối tuần", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập đo lường",
      content: "Ôn lại cách đo độ dài bằng cm, cách xem giờ đúng trên đồng hồ kim (kim ngắn chỉ giờ, kim dài chỉ phút), và các ngày trong tuần.",
      examples: ["Đơn vị đo độ dài: cm", "Kim ngắn chỉ giờ", "1 tuần = 7 ngày, nghỉ Thứ Bảy và Chủ nhật"],
    },
  });

  await add({
    title: "Ôn tập giải toán có lời văn",
    description: "Ôn tập tổng hợp kỹ năng giải các bài toán có lời văn đã học trong năm.",
    subject: toan, grade: lop1, chapterTitle: "Ôn tập cuối năm", order: 3,
    questions: [
      { text: "Một rổ có 45 quả trứng, đã dùng 23 quả. Hỏi còn lại bao nhiêu quả trứng?", choices: ["21", "22", "23", "24"], correctIndex: 1, explanation: "45 - 23 = 22", difficulty: "medium" },
      { text: "Bạn Hà có 34 nhãn vở, mẹ mua thêm 15 nhãn vở nữa. Hỏi Hà có tất cả bao nhiêu nhãn vở?", choices: ["48", "49", "50", "47"], correctIndex: 1, explanation: "34 + 15 = 49", difficulty: "medium" },
      { text: "Khi đề bài có từ 'tất cả', em thường dùng phép tính gì?", choices: ["Phép cộng", "Phép trừ", "Không cần tính", "Tùy trường hợp"], correctIndex: 0, explanation: "'tất cả' thường tương ứng với phép cộng để gộp số liệu lại", difficulty: "medium" },
      { text: "Khi đề bài có từ 'còn lại', em thường dùng phép tính gì?", choices: ["Phép cộng", "Phép trừ", "Không cần tính", "Tùy trường hợp"], correctIndex: 1, explanation: "'còn lại' thường tương ứng với phép trừ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập giải toán có lời văn",
      content: "Ôn lại các bước giải toán có lời văn: đọc kỹ đề, xác định phép tính phù hợp dựa vào từ khóa trong đề ('thêm', 'tất cả' → cộng; 'bớt', 'còn lại' → trừ), tính toán và viết câu trả lời.",
      examples: ["'còn lại' → phép trừ: 45-23=22", "'thêm' → phép cộng: 34+15=49"],
    },
  });

  // ===================== TIẾNG VIỆT =====================

  await add({
    title: "Làm quen nhóm chữ cái k, l, m, n, o",
    description: "Nhận biết mặt chữ và cách đọc các chữ cái k, l, m, n, o.",
    subject: tv, grade: lop1, chapterTitle: "Làm quen chữ cái và nét cơ bản", order: 4,
    questions: [
      { text: "Chữ 'l' thường có nét gì đặc trưng?", choices: ["Nét cong tròn", "Nét thẳng đứng cao", "Nét ngang", "Không có nét nào"], correctIndex: 1, explanation: "Chữ 'l' có nét thẳng đứng cao đặc trưng", difficulty: "medium" },
      { text: "Từ 'mẹ' bắt đầu bằng chữ cái nào?", choices: ["m", "e", "n", "o"], correctIndex: 0, explanation: "'mẹ' bắt đầu bằng chữ 'm'", difficulty: "easy" },
      { text: "Chữ 'o' có hình dáng giống hình gì?", choices: ["Hình vuông", "Hình tròn", "Hình tam giác", "Hình chữ nhật"], correctIndex: 1, explanation: "Chữ 'o' có hình dáng tròn", difficulty: "easy" },
      { text: "Chữ nào trong nhóm k, l, m, n, o là nguyên âm?", choices: ["k", "l", "o", "n"], correctIndex: 2, explanation: "'o' là nguyên âm, các chữ còn lại là phụ âm", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhóm chữ cái k, l, m, n, o",
      content: "Nhóm chữ cái này gồm 4 phụ âm (k, l, m, n) và 1 nguyên âm (o). Mỗi chữ cái có hình dáng và cách viết riêng cần luyện tập.",
      examples: ["k, l, m, n là phụ âm", "o là nguyên âm", "'mẹ' bắt đầu bằng chữ 'm'"],
    },
  });

  await add({
    title: "Ôn tập nhận biết mặt chữ cái đã học",
    description: "Ôn tập tổng hợp nhận biết mặt chữ và cách đọc các chữ cái đã học.",
    subject: tv, grade: lop1, chapterTitle: "Làm quen chữ cái và nét cơ bản", order: 5,
    questions: [
      { text: "Trong các chữ a, b, c, d, chữ nào là nguyên âm?", choices: ["a", "b", "c", "d"], correctIndex: 0, explanation: "'a' là nguyên âm, các chữ còn lại là phụ âm", difficulty: "easy" },
      { text: "Chữ 'đ' khác chữ 'd' ở điểm nào?", choices: ["Không khác gì", "Có thêm nét ngang giữa thân chữ", "Viết ngược lại", "Không có chữ 'đ'"], correctIndex: 1, explanation: "'đ' có thêm nét ngang so với 'd'", difficulty: "medium" },
      { text: "Từ 'gà' bắt đầu bằng chữ cái nào?", choices: ["g", "à", "a", "h"], correctIndex: 0, explanation: "'gà' bắt đầu bằng chữ 'g'", difficulty: "easy" },
      { text: "Bảng chữ cái tiếng Việt có tổng cộng bao nhiêu chữ cái?", choices: ["24", "26", "29", "30"], correctIndex: 2, explanation: "Bảng chữ cái tiếng Việt có 29 chữ cái", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Ôn tập nhận biết mặt chữ cái đã học",
      content: "Ôn lại các chữ cái đã học, phân biệt nguyên âm và phụ âm, nhận biết đúng mặt chữ để chuẩn bị ghép âm, vần.",
      examples: ["Nguyên âm: a, e, i, o, u", "Bảng chữ cái tiếng Việt có 29 chữ cái", "'đ' khác 'd' ở nét ngang"],
    },
  });

  await add({
    title: "Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)",
    description: "Luyện phân biệt các cặp âm đầu dễ nhầm lẫn trong tiếng Việt.",
    subject: tv, grade: lop1, chapterTitle: "Âm - vần - chữ viết", order: 4,
    questions: [
      { text: "Từ nào viết đúng: 'lo lắng' hay 'no lắng'?", choices: ["lo lắng", "no lắng", "Cả hai đều đúng", "Cả hai đều sai"], correctIndex: 0, explanation: "'lo lắng' viết đúng với âm 'l'", difficulty: "medium" },
      { text: "Từ 'trẻ em' có âm đầu là gì ở tiếng 'trẻ'?", choices: ["ch", "tr", "t", "r"], correctIndex: 1, explanation: "'trẻ' có âm đầu 'tr'", difficulty: "medium" },
      { text: "Từ nào viết đúng chính tả: 'con trâu' hay 'con châu'?", choices: ["con trâu", "con châu", "Cả hai đều đúng", "Không từ nào đúng"], correctIndex: 0, explanation: "'con trâu' viết đúng với âm 'tr'", difficulty: "medium" },
      { text: "Muốn viết đúng các âm dễ nhầm lẫn, em cần làm gì?", choices: ["Không cần luyện tập", "Luyện nghe, đọc, viết nhiều lần và ghi nhớ", "Viết theo cảm tính", "Không quan trọng"], correctIndex: 1, explanation: "Cần luyện nghe, đọc, viết thường xuyên để ghi nhớ chính xác", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Phân biệt âm đầu dễ nhầm lẫn",
      content: "Một số cặp âm đầu dễ nhầm lẫn trong tiếng Việt: l/n (lo lắng - no lắng), ch/tr (che nắng - tre nắng). Cần luyện nghe và viết nhiều để phân biệt chính xác.",
      examples: ["lo lắng (không phải 'no lắng')", "con trâu (không phải 'con châu')", "Luyện nghe - đọc - viết để nhớ chính xác"],
    },
  });

  await add({
    title: "Luyện tập âm, vần, dấu thanh tổng hợp",
    description: "Luyện tập tổng hợp về âm, vần và dấu thanh đã học.",
    subject: tv, grade: lop1, chapterTitle: "Âm - vần - chữ viết", order: 5,
    questions: [
      { text: "Tiếng 'mèo' gồm âm đầu, vần và dấu thanh nào?", choices: ["m + eo + dấu huyền", "m + eo + dấu sắc", "m + eo + không dấu", "m + eo + dấu nặng"], correctIndex: 0, explanation: "'mèo' = m + eo + dấu huyền", difficulty: "medium" },
      { text: "Tiếng 'bé' mang thanh gì?", choices: ["Thanh ngang", "Thanh sắc", "Thanh huyền", "Thanh nặng"], correctIndex: 1, explanation: "'bé' mang thanh sắc", difficulty: "easy" },
      { text: "Từ nào có vần giống với từ 'hoa'?", choices: ["hòa", "học", "hát", "hôm"], correctIndex: 0, explanation: "'hòa' có cùng vần 'oa' với 'hoa'", difficulty: "medium" },
      { text: "Muốn đọc đúng một tiếng, em cần chú ý đến điều gì?", choices: ["Chỉ âm đầu", "Chỉ vần", "Âm đầu, vần và dấu thanh", "Không cần chú ý gì"], correctIndex: 2, explanation: "Cần chú ý đầy đủ âm đầu, vần và dấu thanh để đọc đúng tiếng", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện tập âm, vần, dấu thanh tổng hợp",
      content: "Một tiếng hoàn chỉnh gồm âm đầu (có thể có hoặc không), vần và dấu thanh. Cần nắm chắc cả 3 yếu tố để đọc, viết đúng.",
      examples: ["mèo = m + eo + dấu huyền", "bé = b + e + dấu sắc", "hoa và hòa cùng vần 'oa' khác thanh"],
    },
  });

  await add({
    title: "Vần có âm đệm đơn giản (oa, oe)",
    description: "Làm quen với các vần có âm đệm đơn giản như oa, oe.",
    subject: tv, grade: lop1, chapterTitle: "Ghép âm, vần, tiếng", order: 4,
    questions: [
      { text: "Tiếng 'hoa' có vần gì?", choices: ["oa", "oe", "a", "o"], correctIndex: 0, explanation: "'hoa' có vần 'oa'", difficulty: "easy" },
      { text: "Tiếng 'khoe' có vần gì?", choices: ["oa", "oe", "e", "o"], correctIndex: 1, explanation: "'khoe' có vần 'oe'", difficulty: "medium" },
      { text: "Từ nào có vần 'oa'?", choices: ["hoa", "khoe", "mèo", "bé"], correctIndex: 0, explanation: "'hoa' có vần 'oa'", difficulty: "medium" },
      { text: "Vần 'oa' và vần 'a' khác nhau ở điểm nào?", choices: ["Không khác gì", "Vần 'oa' có thêm âm đệm 'o' trước âm chính 'a'", "Vần 'a' dài hơn", "Không có sự khác biệt về cách đọc"], correctIndex: 1, explanation: "Vần 'oa' có thêm âm đệm 'o' trước âm chính 'a', tạo cách đọc khác với vần 'a'", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Vần có âm đệm đơn giản",
      content: "Vần có âm đệm là vần có thêm âm 'o' hoặc 'u' đứng trước âm chính, ví dụ: oa (o+a), oe (o+e). Các vần này tạo ra cách phát âm đặc trưng.",
      examples: ["hoa: vần 'oa'", "khoe: vần 'oe'", "'oa' = âm đệm 'o' + âm chính 'a'"],
    },
  });

  await add({
    title: "Luyện tập ghép tiếng tổng hợp",
    description: "Luyện tập tổng hợp kỹ năng ghép âm, vần thành tiếng có nghĩa.",
    subject: tv, grade: lop1, chapterTitle: "Ghép âm, vần, tiếng", order: 5,
    questions: [
      { text: "Ghép âm 'h' với vần 'oa' được tiếng gì?", choices: ["hoa", "hao", "hoà", "hai"], correctIndex: 0, explanation: "'h' + 'oa' = 'hoa'", difficulty: "easy" },
      { text: "Ghép âm 'ng' với vần 'an' được tiếng gì?", choices: ["ngan", "nang", "ngăn", "nan"], correctIndex: 0, explanation: "'ng' + 'an' = 'ngan'", difficulty: "medium" },
      { text: "Tiếng 'khoai' được ghép từ âm và vần nào?", choices: ["kh + oai", "k + hoai", "kho + ai", "k + h + oai"], correctIndex: 0, explanation: "'khoai' = âm 'kh' ghép với vần 'oai'", difficulty: "medium" },
      { text: "Khi ghép tiếng, thứ tự đúng là gì?", choices: ["Vần trước, âm đầu sau", "Âm đầu trước, vần sau, rồi thêm dấu thanh", "Chỉ cần âm đầu", "Không có thứ tự cụ thể"], correctIndex: 1, explanation: "Ghép âm đầu với vần trước, sau đó thêm dấu thanh (nếu có) để tạo tiếng hoàn chỉnh", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện tập ghép tiếng tổng hợp",
      content: "Ôn lại quy trình ghép tiếng: âm đầu + vần + dấu thanh (nếu có) = tiếng hoàn chỉnh. Luyện tập với nhiều âm, vần đã học để đọc thành thạo.",
      examples: ["h + oa = hoa", "ng + an = ngan", "kh + oai = khoai"],
    },
  });

  await add({
    title: "Từ chỉ hoạt động của con người, con vật",
    description: "Nhận biết và sử dụng các từ chỉ hoạt động thường gặp.",
    subject: tv, grade: lop1, chapterTitle: "Từ và câu cơ bản", order: 4,
    questions: [
      { text: "Từ nào chỉ hoạt động?", choices: ["chạy", "bàn", "mèo", "hoa"], correctIndex: 0, explanation: "'chạy' là từ chỉ hoạt động", difficulty: "easy" },
      { text: "Con chim thường có hoạt động gì đặc trưng?", choices: ["bơi", "bay", "bò", "leo"], correctIndex: 1, explanation: "Con chim có hoạt động đặc trưng là bay", difficulty: "easy" },
      { text: "Trong câu 'Bé đang chơi đùa.', từ nào chỉ hoạt động?", choices: ["Bé", "đang", "chơi đùa", "Cả câu"], correctIndex: 2, explanation: "'chơi đùa' là từ chỉ hoạt động trong câu", difficulty: "medium" },
      { text: "Từ nào KHÔNG chỉ hoạt động trong nhóm: ăn, ngủ, đẹp, chạy?", choices: ["ăn", "ngủ", "đẹp", "chạy"], correctIndex: 2, explanation: "'đẹp' là từ chỉ đặc điểm, không phải hoạt động", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Từ chỉ hoạt động của con người, con vật",
      content: "Từ chỉ hoạt động là những từ diễn tả các hành động, việc làm của người hoặc con vật, ví dụ: ăn, ngủ, chạy, nhảy, bay, bơi.",
      examples: ["Người: ăn, ngủ, học, chơi", "Con vật: bay (chim), bơi (cá), chạy (chó)"],
    },
  });

  await add({
    title: "Luyện tập đặt câu đơn giản",
    description: "Luyện tập đặt câu đơn giản đúng ngữ pháp, đúng chính tả.",
    subject: tv, grade: lop1, chapterTitle: "Từ và câu cơ bản", order: 5,
    questions: [
      { text: "Câu nào đặt đúng ngữ pháp?", choices: ["Em đi học.", "Đi học em.", "Học em đi.", "Đi em học."], correctIndex: 0, explanation: "'Em đi học.' là câu đúng ngữ pháp (chủ ngữ trước, vị ngữ sau)", difficulty: "medium" },
      { text: "Một câu đơn giản thường bắt đầu bằng chữ gì?", choices: ["Chữ thường", "Chữ hoa", "Không cần viết hoa", "Số"], correctIndex: 1, explanation: "Câu bắt đầu bằng chữ hoa", difficulty: "easy" },
      { text: "Câu 'Con mèo đang ngủ.' có đủ các thành phần chưa?", choices: ["Chưa đủ, thiếu chủ ngữ", "Chưa đủ, thiếu vị ngữ", "Đã đủ chủ ngữ và vị ngữ", "Không xác định được"], correctIndex: 2, explanation: "Câu đã có đủ chủ ngữ ('Con mèo') và vị ngữ ('đang ngủ')", difficulty: "medium" },
      { text: "Câu kết thúc bằng dấu gì khi là câu kể bình thường?", choices: ["Dấu chấm hỏi", "Dấu chấm than", "Dấu chấm", "Dấu phẩy"], correctIndex: 2, explanation: "Câu kể bình thường kết thúc bằng dấu chấm", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Luyện tập đặt câu đơn giản",
      content: "Một câu đơn giản cần có đủ 2 phần: phần nêu sự vật (chủ ngữ) và phần nêu hoạt động/đặc điểm (vị ngữ). Câu bắt đầu bằng chữ hoa và kết thúc bằng dấu câu phù hợp.",
      examples: ["Em đi học. (đúng ngữ pháp)", "Con mèo đang ngủ. (đủ chủ ngữ, vị ngữ)", "Câu kể kết thúc bằng dấu chấm"],
    },
  });

  await add({
    title: "Đọc hiểu đoạn văn ngắn về loài vật",
    description: "Luyện đọc và trả lời câu hỏi đơn giản về một đoạn văn ngắn kể về loài vật.",
    subject: tv, grade: lop1, chapterTitle: "Luyện đọc đoạn văn ngắn", order: 3,
    questions: [
      { text: "Đọc đoạn văn: 'Chú mèo nhà em có bộ lông trắng muốt. Chú rất thích chơi đùa với quả bóng len.' Chú mèo có bộ lông màu gì?", choices: ["Đen", "Trắng", "Vàng", "Nâu"], correctIndex: 1, explanation: "Đoạn văn nói bộ lông trắng muốt", difficulty: "easy" },
      { text: "Chú mèo thích chơi với vật gì?", choices: ["Quả bóng len", "Quả táo", "Cuốn sách", "Đôi giày"], correctIndex: 0, explanation: "Đoạn văn nói chú mèo thích chơi với quả bóng len", difficulty: "easy" },
      { text: "Từ 'trắng muốt' miêu tả điều gì?", choices: ["Hình dáng", "Màu sắc rất trắng, đẹp", "Kích thước", "Tính cách"], correctIndex: 1, explanation: "'trắng muốt' miêu tả màu trắng rất đẹp, mịn màng", difficulty: "medium" },
      { text: "Đoạn văn trên miêu tả con vật gì?", choices: ["Chó", "Mèo", "Chim", "Cá"], correctIndex: 1, explanation: "Đoạn văn miêu tả con mèo", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Đọc hiểu đoạn văn ngắn về loài vật",
      content: "Khi đọc đoạn văn miêu tả loài vật, em chú ý các từ ngữ miêu tả hình dáng, màu sắc, hoạt động, sở thích của con vật để trả lời đúng câu hỏi.",
      examples: ["Chú ý từ chỉ màu sắc (trắng muốt)", "Chú ý hoạt động, sở thích của con vật", "Đọc kỹ để xác định loài vật được nhắc tới"],
    },
  });

  await add({
    title: "Đọc hiểu đoạn văn ngắn về thiên nhiên",
    description: "Luyện đọc và trả lời câu hỏi đơn giản về một đoạn văn ngắn miêu tả thiên nhiên.",
    subject: tv, grade: lop1, chapterTitle: "Luyện đọc đoạn văn ngắn", order: 4,
    questions: [
      { text: "Đọc đoạn văn: 'Buổi sáng, mặt trời lên cao, chiếu những tia nắng ấm áp. Chim hót líu lo trên cành cây.' Buổi sáng có hiện tượng gì?", choices: ["Mưa to", "Mặt trời lên, chim hót", "Trời tối", "Có tuyết rơi"], correctIndex: 1, explanation: "Đoạn văn nói mặt trời lên cao và chim hót líu lo", difficulty: "easy" },
      { text: "Từ 'líu lo' miêu tả âm thanh như thế nào?", choices: ["Ồn ào, khó chịu", "Vui tươi, trong trẻo", "Buồn bã", "Im lặng"], correctIndex: 1, explanation: "'líu lo' miêu tả âm thanh vui tươi, trong trẻo của tiếng chim hót", difficulty: "medium" },
      { text: "Đoạn văn trên miêu tả thời điểm nào trong ngày?", choices: ["Buổi sáng", "Buổi trưa", "Buổi tối", "Nửa đêm"], correctIndex: 0, explanation: "Đoạn văn miêu tả buổi sáng", difficulty: "easy" },
      { text: "Chim hót ở đâu theo đoạn văn?", choices: ["Trên mặt đất", "Trên cành cây", "Dưới nước", "Trong nhà"], correctIndex: 1, explanation: "Đoạn văn nói chim hót trên cành cây", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đọc hiểu đoạn văn ngắn về thiên nhiên",
      content: "Khi đọc đoạn văn miêu tả thiên nhiên, em chú ý các từ ngữ miêu tả cảnh vật, âm thanh, thời điểm trong ngày để hiểu và trả lời đúng câu hỏi.",
      examples: ["Chú ý từ miêu tả âm thanh (líu lo)", "Chú ý thời điểm trong ngày (buổi sáng)", "Chú ý địa điểm sự việc diễn ra"],
    },
  });

  await add({
    title: "Luyện nói về sở thích của em",
    description: "Luyện kỹ năng nói giới thiệu về sở thích cá nhân một cách rõ ràng, tự tin.",
    subject: tv, grade: lop1, chapterTitle: "Luyện nói và kể chuyện đơn giản", order: 3,
    questions: [
      { text: "Câu nào phù hợp để nói về sở thích?", choices: ["Em thích vẽ tranh.", "Hôm nay trời mưa.", "Con mèo màu đen.", "Đây là cái bàn."], correctIndex: 0, explanation: "'Em thích vẽ tranh.' là câu nói về sở thích cá nhân", difficulty: "easy" },
      { text: "Khi nói về sở thích, em nên nói kèm theo lý do như thế nào?", choices: ["Không cần lý do", "Có thể nói thêm vì sao em thích điều đó", "Chỉ nói một từ", "Không cần nói câu hoàn chỉnh"], correctIndex: 1, explanation: "Nên nói thêm lý do để phần chia sẻ đầy đủ và thú vị hơn", difficulty: "medium" },
      { text: "Câu 'Em thích đọc sách vì sách giúp em biết nhiều điều thú vị.' có đủ ý chưa?", choices: ["Chưa đủ", "Đã đủ ý thích và lý do", "Không rõ ý gì", "Sai ngữ pháp"], correctIndex: 1, explanation: "Câu đã nêu đủ sở thích và lý do thích", difficulty: "medium" },
      { text: "Khi nói trước lớp về sở thích, em nên có thái độ như thế nào?", choices: ["Rụt rè, không dám nói", "Tự tin, rõ ràng, mỉm cười", "Nói thật nhanh cho xong", "Không cần nhìn ai"], correctIndex: 1, explanation: "Nên tự tin, nói rõ ràng và thân thiện khi chia sẻ trước lớp", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện nói về sở thích của em",
      content: "Khi giới thiệu sở thích, em nói rõ điều mình thích và có thể thêm lý do vì sao thích điều đó. Nói với thái độ tự tin, rõ ràng.",
      examples: ["'Em thích vẽ tranh vì em được sáng tạo.'", "'Em thích đọc sách vì sách giúp em biết nhiều điều thú vị.'"],
    },
  });

  await add({
    title: "Luyện nói lời cảm ơn, xin lỗi",
    description: "Luyện kỹ năng nói lời cảm ơn, xin lỗi phù hợp trong các tình huống giao tiếp hằng ngày.",
    subject: tv, grade: lop1, chapterTitle: "Luyện nói và kể chuyện đơn giản", order: 4,
    questions: [
      { text: "Khi được bạn giúp đỡ, em nên nói gì?", choices: ["Không nói gì", "Cảm ơn bạn", "Im lặng bỏ đi", "Trách bạn"], correctIndex: 1, explanation: "Khi được giúp đỡ, em nên nói lời cảm ơn", difficulty: "easy" },
      { text: "Khi làm sai điều gì đó, em nên nói gì?", choices: ["Không nói gì", "Xin lỗi", "Đổ lỗi cho người khác", "Bỏ chạy"], correctIndex: 1, explanation: "Khi làm sai, em nên nói lời xin lỗi", difficulty: "easy" },
      { text: "Câu nào là lời xin lỗi phù hợp?", choices: ["Con xin lỗi vì đã làm rơi cốc nước.", "Con không biết gì cả.", "Đó không phải lỗi của con.", "Con không quan tâm."], correctIndex: 0, explanation: "'Con xin lỗi vì đã làm rơi cốc nước.' là lời xin lỗi phù hợp, có nêu rõ lý do", difficulty: "medium" },
      { text: "Vì sao cần nói lời cảm ơn, xin lỗi đúng lúc?", choices: ["Không cần thiết", "Thể hiện sự lễ phép, tôn trọng người khác", "Chỉ để cho có lệ", "Không có ý nghĩa gì"], correctIndex: 1, explanation: "Lời cảm ơn, xin lỗi thể hiện sự lễ phép và tôn trọng người khác", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện nói lời cảm ơn, xin lỗi",
      content: "Nói lời cảm ơn khi được giúp đỡ, nói lời xin lỗi khi làm sai. Đây là cách thể hiện sự lễ phép, tôn trọng người khác trong giao tiếp hằng ngày.",
      examples: ["'Con cảm ơn cô ạ!'", "'Con xin lỗi vì đã làm rơi cốc nước.'", "Nói lời cảm ơn, xin lỗi đúng lúc thể hiện sự lễ phép"],
    },
  });

  await add({
    title: "Luyện viết câu đơn giản đúng chính tả",
    description: "Luyện viết các câu đơn giản đúng chính tả, đúng dấu câu.",
    subject: tv, grade: lop1, chapterTitle: "Luyện viết chữ và chính tả cơ bản", order: 3,
    questions: [
      { text: "Câu nào viết đúng chính tả và dấu câu?", choices: ["em đi học", "Em đi học.", "Em Đi Học", "em đi học."], correctIndex: 1, explanation: "'Em đi học.' viết hoa đầu câu và có dấu chấm cuối câu — đúng chuẩn", difficulty: "medium" },
      { text: "Khi viết tên riêng 'Hà Nội', cần lưu ý điều gì?", choices: ["Viết thường cả hai chữ", "Viết hoa cả hai chữ cái đầu", "Không cần viết hoa", "Chỉ viết hoa chữ 'Nội'"], correctIndex: 1, explanation: "Tên riêng 'Hà Nội' cần viết hoa cả hai chữ cái đầu (H và N)", difficulty: "medium" },
      { text: "Câu hỏi cần kết thúc bằng dấu gì?", choices: ["Dấu chấm", "Dấu chấm hỏi", "Dấu chấm than", "Dấu phẩy"], correctIndex: 1, explanation: "Câu hỏi kết thúc bằng dấu chấm hỏi (?)", difficulty: "easy" },
      { text: "Câu 'Bạn tên là gì' còn thiếu gì để đúng chính tả?", choices: ["Không thiếu gì", "Thiếu dấu chấm hỏi ở cuối", "Thiếu chữ hoa đầu câu", "Thiếu từ 'bạn'"], correctIndex: 1, explanation: "Câu hỏi cần có dấu chấm hỏi ở cuối: 'Bạn tên là gì?'", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện viết câu đơn giản đúng chính tả",
      content: "Khi viết câu, cần viết hoa chữ cái đầu câu và tên riêng, kết thúc câu bằng dấu câu phù hợp (dấu chấm cho câu kể, dấu chấm hỏi cho câu hỏi, dấu chấm than cho câu cảm).",
      examples: ["Em đi học. (câu kể)", "Bạn tên là gì? (câu hỏi)", "Hà Nội (tên riêng viết hoa cả hai chữ)"],
    },
  });

  await add({
    title: "Ôn tập chính tả tổng hợp",
    description: "Ôn tập tổng hợp các quy tắc chính tả đã học trong năm học.",
    subject: tv, grade: lop1, chapterTitle: "Luyện viết chữ và chính tả cơ bản", order: 4,
    questions: [
      { text: "Đầu câu cần viết như thế nào?", choices: ["Viết thường", "Viết hoa", "Không cần viết gì đặc biệt", "Viết in nghiêng"], correctIndex: 1, explanation: "Đầu câu luôn viết hoa chữ cái đầu tiên", difficulty: "easy" },
      { text: "Tên riêng của người và địa danh cần viết như thế nào?", choices: ["Viết thường", "Viết hoa chữ cái đầu mỗi tiếng", "Không cần quy tắc", "Chỉ viết hoa chữ đầu tiên của cả cụm"], correctIndex: 1, explanation: "Tên riêng viết hoa chữ cái đầu của mỗi tiếng, ví dụ 'Hà Nội', 'Nguyễn Văn An'", difficulty: "medium" },
      { text: "Câu cảm thán thường kết thúc bằng dấu gì?", choices: ["Dấu chấm", "Dấu chấm hỏi", "Dấu chấm than", "Dấu phẩy"], correctIndex: 2, explanation: "Câu cảm thán kết thúc bằng dấu chấm than (!)", difficulty: "medium" },
      { text: "Khi viết sai một từ, cách sửa đúng nhất là gì?", choices: ["Để nguyên", "Gạch bỏ và viết lại đúng, không tẩy xóa lem nhem", "Xé bỏ trang vở", "Không cần sửa"], correctIndex: 1, explanation: "Nên gạch nhẹ và viết lại đúng, giữ vở sạch đẹp", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Ôn tập chính tả tổng hợp",
      content: "Ôn lại các quy tắc chính tả cơ bản: viết hoa đầu câu và tên riêng, sử dụng đúng dấu câu (chấm, hỏi, than) phù hợp với từng loại câu.",
      examples: ["Đầu câu: viết hoa", "Tên riêng: Hà Nội, Nguyễn Văn An", "Câu cảm: kết thúc bằng dấu chấm than"],
    },
  });

  console.log(`[deepenLop1] Hoàn tất: đã thêm ${count} chủ điểm mới cho Lớp 1.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
