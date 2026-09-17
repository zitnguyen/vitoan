// Additional lessons grounded in the real GDPT 2018 elementary curriculum (Toán & Tiếng Việt, lớp 1-5).
// Content is original (written for this project), not copied from any textbook or exam bank —
// only the topic list follows the public national curriculum structure.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

const chapterCache = new Map();
async function getChapter(chapterTitle, subject, grade, order) {
  const key = `${subject._id}:${grade._id}:${chapterTitle}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const chapter = await Chapter.findOneAndUpdate(
    { title: chapterTitle, subject: subject._id, grade: grade._id },
    { title: chapterTitle, subject: subject._id, grade: grade._id, order },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  chapterCache.set(key, chapter);
  return chapter;
}

async function seedLessonWithQuestions({ title, description, subject, grade, chapterTitle, chapterOrder, order, questions }) {
  const chapter = await getChapter(chapterTitle, subject, grade, chapterOrder);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true },
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
  console.log("[seedRealCurriculum] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const lop2 = grades.find((g) => g.slug === "lop-2");
  const lop3 = grades.find((g) => g.slug === "lop-3");
  const lop4 = grades.find((g) => g.slug === "lop-4");
  const lop5 = grades.find((g) => g.slug === "lop-5");
  const toan = subjects.find((s) => s.slug === "toan");
  const tiengViet = subjects.find((s) => s.slug === "tieng-viet");

  // ===== TOÁN =====

  const l1 = await seedLessonWithQuestions({
    title: "Các số đến 20",
    description: "Đếm, đọc, viết và so sánh các số trong phạm vi 20.",
    subject: toan,
    grade: lop1,
    chapterTitle: "Các số trong phạm vi 20",
    chapterOrder: 3,
    order: 1,
    questions: [
      { text: "Số liền sau số 14 là số nào?", choices: ["13", "15", "16", "12"], correctIndex: 1, explanation: "Số liền sau 14 là 15", difficulty: "easy" },
      { text: "Số liền trước số 20 là số nào?", choices: ["18", "19", "21", "17"], correctIndex: 1, explanation: "Số liền trước 20 là 19", difficulty: "easy" },
      { text: "So sánh: 17 ... 13", choices: ["17 < 13", "17 = 13", "17 > 13", "Không so sánh được"], correctIndex: 2, explanation: "17 > 13", difficulty: "easy" },
      { text: "Số 16 gồm mấy chục và mấy đơn vị?", choices: ["1 chục 6 đơn vị", "6 chục 1 đơn vị", "1 chục 5 đơn vị", "0 chục 16 đơn vị"], correctIndex: 0, explanation: "16 = 1 chục + 6 đơn vị", difficulty: "medium" },
      { text: "Số lớn nhất trong các số 12, 18, 9, 15 là số nào?", choices: ["12", "18", "9", "15"], correctIndex: 1, explanation: "18 là số lớn nhất", difficulty: "medium" },
      { text: "Số bé nhất trong các số 20, 11, 19, 8 là số nào?", choices: ["20", "11", "19", "8"], correctIndex: 3, explanation: "8 là số bé nhất", difficulty: "medium" },
      { text: "Sắp xếp theo thứ tự từ bé đến lớn: 13, 9, 17. Số đứng giữa là?", choices: ["9", "13", "17", "Không xác định"], correctIndex: 1, explanation: "Thứ tự: 9, 13, 17 — số đứng giữa là 13", difficulty: "hard" },
      { text: "20 gồm mấy chục?", choices: ["1 chục", "2 chục", "0 chục", "20 chục"], correctIndex: 1, explanation: "20 = 2 chục", difficulty: "easy" },
    ],
  });
  await seedReview(l1, {
    title: "Kiến thức: Các số đến 20",
    content:
      "Các số từ 11 đến 20 được đọc theo quy tắc: 'mười' + số đơn vị (11 = mười một, 12 = mười hai...), riêng 20 đọc là 'hai mươi'.\nMỗi số có hai chữ số gồm chữ số hàng chục và chữ số hàng đơn vị.\nĐể so sánh hai số có hai chữ số, ta so sánh chữ số hàng chục trước, nếu bằng nhau thì so sánh chữ số hàng đơn vị.",
    examples: ["15 gồm 1 chục và 5 đơn vị", "18 > 13 vì 1 = 1 nhưng 8 > 3", "Số liền sau 19 là 20"],
  });

  const l2 = await seedLessonWithQuestions({
    title: "Bảng chia 2",
    description: "Làm quen với phép chia và bảng chia 2.",
    subject: toan,
    grade: lop2,
    chapterTitle: "Phép chia cơ bản",
    chapterOrder: 3,
    order: 1,
    questions: [
      { text: "8 : 2 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "8 : 2 = 4", difficulty: "easy" },
      { text: "10 : 2 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "10 : 2 = 5", difficulty: "easy" },
      { text: "16 : 2 = ?", choices: ["6", "7", "8", "9"], correctIndex: 2, explanation: "16 : 2 = 8", difficulty: "easy" },
      { text: "18 : 2 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "18 : 2 = 9", difficulty: "medium" },
      { text: "Phép chia nào đúng: 12 : 2 = ?", choices: ["5", "6", "7", "4"], correctIndex: 1, explanation: "12 : 2 = 6", difficulty: "medium" },
      { text: "Muốn tìm số bị chia, ta lấy thương nhân với số chia. 14 : 2 = 7, vậy 7 x 2 = ?", choices: ["12", "14", "16", "10"], correctIndex: 1, explanation: "7 x 2 = 14, đúng bằng số bị chia ban đầu", difficulty: "hard" },
      { text: "Có 20 quả táo chia đều cho 2 bạn, mỗi bạn được mấy quả?", choices: ["8", "10", "12", "9"], correctIndex: 1, explanation: "20 : 2 = 10", difficulty: "medium" },
      { text: "6 : 2 = ?", choices: ["2", "3", "4", "1"], correctIndex: 1, explanation: "6 : 2 = 3", difficulty: "easy" },
    ],
  });
  await seedReview(l2, {
    title: "Kiến thức: Bảng chia 2",
    content:
      "Phép chia là phép tính ngược lại của phép nhân, dùng để chia đều một số thành các phần bằng nhau.\nBảng chia 2 được suy ra từ bảng nhân 2: nếu 2 x 3 = 6 thì 6 : 2 = 3.\nKý hiệu phép chia là dấu \":\". Kết quả của phép chia gọi là thương.",
    examples: ["8 : 2 = 4 (vì 2 x 4 = 8)", "16 : 2 = 8 (vì 2 x 8 = 16)", "20 quả chia cho 2 bạn, mỗi bạn 10 quả"],
  });

  const l3 = await seedLessonWithQuestions({
    title: "Chu vi hình chữ nhật, hình vuông",
    description: "Tính chu vi hình chữ nhật và hình vuông.",
    subject: toan,
    grade: lop3,
    chapterTitle: "Hình học và đo lường",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Chu vi hình chữ nhật có chiều dài 8cm, chiều rộng 5cm là bao nhiêu?", choices: ["13cm", "26cm", "40cm", "20cm"], correctIndex: 1, explanation: "Chu vi = (dài + rộng) x 2 = (8+5) x 2 = 26cm", difficulty: "medium" },
      { text: "Chu vi hình vuông có cạnh 6cm là bao nhiêu?", choices: ["12cm", "18cm", "24cm", "36cm"], correctIndex: 2, explanation: "Chu vi hình vuông = cạnh x 4 = 6 x 4 = 24cm", difficulty: "medium" },
      { text: "Công thức tính chu vi hình vuông là gì?", choices: ["cạnh x 2", "cạnh x 3", "cạnh x 4", "cạnh + 4"], correctIndex: 2, explanation: "Chu vi hình vuông = cạnh x 4", difficulty: "easy" },
      { text: "Công thức tính chu vi hình chữ nhật là gì?", choices: ["(dài + rộng) x 2", "dài x rộng", "dài + rộng", "dài x rộng x 2"], correctIndex: 0, explanation: "Chu vi hình chữ nhật = (dài + rộng) x 2", difficulty: "easy" },
      { text: "Hình chữ nhật có chu vi 30cm, chiều dài 10cm. Chiều rộng là bao nhiêu?", choices: ["5cm", "10cm", "15cm", "20cm"], correctIndex: 0, explanation: "Nửa chu vi = 15cm, chiều rộng = 15 - 10 = 5cm", difficulty: "hard" },
      { text: "Hình vuông có chu vi 20cm. Độ dài cạnh là bao nhiêu?", choices: ["4cm", "5cm", "8cm", "10cm"], correctIndex: 1, explanation: "Cạnh = chu vi : 4 = 20 : 4 = 5cm", difficulty: "hard" },
      { text: "Hình chữ nhật có chiều dài 12cm, chiều rộng 7cm. Chu vi là?", choices: ["19cm", "38cm", "84cm", "36cm"], correctIndex: 1, explanation: "(12+7) x 2 = 38cm", difficulty: "medium" },
    ],
  });
  await seedReview(l3, {
    title: "Kiến thức: Chu vi hình chữ nhật, hình vuông",
    content:
      "Chu vi của một hình là tổng độ dài các cạnh bao quanh hình đó.\n- Chu vi hình chữ nhật = (chiều dài + chiều rộng) x 2.\n- Chu vi hình vuông = độ dài cạnh x 4 (vì hình vuông có 4 cạnh bằng nhau).",
    examples: ["Hình chữ nhật dài 8cm, rộng 5cm: chu vi = (8+5) x 2 = 26cm", "Hình vuông cạnh 6cm: chu vi = 6 x 4 = 24cm"],
  });

  const l4 = await seedLessonWithQuestions({
    title: "Diện tích hình bình hành, hình thoi",
    description: "Tính diện tích hình bình hành và hình thoi.",
    subject: toan,
    grade: lop4,
    chapterTitle: "Hình học nâng cao",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Công thức tính diện tích hình bình hành là gì?", choices: ["đáy x chiều cao", "đáy x chiều cao : 2", "đáy + chiều cao", "đáy x 2"], correctIndex: 0, explanation: "Diện tích hình bình hành = đáy x chiều cao", difficulty: "easy" },
      { text: "Hình bình hành có đáy 10cm, chiều cao 6cm. Diện tích là?", choices: ["16cm²", "32cm²", "60cm²", "50cm²"], correctIndex: 2, explanation: "10 x 6 = 60cm²", difficulty: "medium" },
      { text: "Công thức tính diện tích hình thoi là gì?", choices: ["cạnh x 4", "đường chéo x đường chéo", "(đường chéo 1 x đường chéo 2) : 2", "đường chéo x 2"], correctIndex: 2, explanation: "Diện tích hình thoi = (d1 x d2) : 2", difficulty: "medium" },
      { text: "Hình thoi có hai đường chéo dài 8cm và 5cm. Diện tích là?", choices: ["13cm²", "20cm²", "40cm²", "26cm²"], correctIndex: 1, explanation: "(8 x 5) : 2 = 20cm²", difficulty: "hard" },
      { text: "Hình bình hành có diện tích 45cm², đáy 9cm. Chiều cao là?", choices: ["4cm", "5cm", "6cm", "9cm"], correctIndex: 1, explanation: "Chiều cao = 45 : 9 = 5cm", difficulty: "hard" },
      { text: "Hình thoi có diện tích 24cm², một đường chéo 6cm. Đường chéo còn lại là?", choices: ["4cm", "6cm", "8cm", "12cm"], correctIndex: 2, explanation: "24 x 2 : 6 = 8cm", difficulty: "hard" },
    ],
  });
  await seedReview(l4, {
    title: "Kiến thức: Diện tích hình bình hành, hình thoi",
    content:
      "- Diện tích hình bình hành = độ dài đáy x chiều cao.\n- Diện tích hình thoi = (độ dài đường chéo 1 x độ dài đường chéo 2) : 2.\nChiều cao của hình bình hành là đoạn thẳng vuông góc nối từ đáy này sang đáy kia (đối diện).",
    examples: ["Hình bình hành đáy 10cm, cao 6cm: diện tích = 10 x 6 = 60cm²", "Hình thoi 2 đường chéo 8cm và 5cm: diện tích = (8x5):2 = 20cm²"],
  });

  const l5 = await seedLessonWithQuestions({
    title: "Tỉ số phần trăm",
    description: "Tìm tỉ số phần trăm của hai số và ứng dụng thực tế.",
    subject: toan,
    grade: lop5,
    chapterTitle: "Tỉ số phần trăm",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Tỉ số phần trăm của 25 và 100 là bao nhiêu?", choices: ["2,5%", "25%", "250%", "0,25%"], correctIndex: 1, explanation: "25/100 = 25%", difficulty: "easy" },
      { text: "Tỉ số phần trăm của 3 và 4 là bao nhiêu?", choices: ["34%", "43%", "75%", "0,75%"], correctIndex: 2, explanation: "3 : 4 = 0,75 = 75%", difficulty: "medium" },
      { text: "20% của 150 là bao nhiêu?", choices: ["20", "30", "40", "50"], correctIndex: 1, explanation: "150 x 20 : 100 = 30", difficulty: "medium" },
      { text: "Một lớp có 40 học sinh, trong đó 25% là học sinh giỏi. Có bao nhiêu học sinh giỏi?", choices: ["8", "10", "12", "15"], correctIndex: 1, explanation: "40 x 25 : 100 = 10", difficulty: "hard" },
      { text: "Số 60 chiếm bao nhiêu phần trăm của 200?", choices: ["20%", "30%", "40%", "60%"], correctIndex: 1, explanation: "60 : 200 = 0,3 = 30%", difficulty: "hard" },
      { text: "Giá một món hàng là 200.000đ, giảm giá 10%. Giá sau khi giảm là?", choices: ["180.000đ", "190.000đ", "20.000đ", "170.000đ"], correctIndex: 0, explanation: "Giảm 10% của 200.000 = 20.000đ, giá còn lại = 180.000đ", difficulty: "hard" },
      { text: "50% của một số là 45. Số đó là bao nhiêu?", choices: ["80", "90", "95", "100"], correctIndex: 1, explanation: "45 x 100 : 50 = 90", difficulty: "hard" },
    ],
  });
  await seedReview(l5, {
    title: "Kiến thức: Tỉ số phần trăm",
    content:
      "Tỉ số phần trăm của hai số là thương của phép chia số này cho số kia, nhân với 100 và viết thêm ký hiệu %.\nMuốn tìm giá trị phần trăm của một số, ta lấy số đó nhân với tỉ số phần trăm rồi chia cho 100.",
    examples: ["25 và 100: tỉ số phần trăm = 25 : 100 = 25%", "20% của 150 = 150 x 20 : 100 = 30", "Lớp 40 học sinh, 25% giỏi = 40 x 25 : 100 = 10 học sinh"],
  });

  // ===== TIẾNG VIỆT =====

  const t1 = await seedLessonWithQuestions({
    title: "Âm và vần cơ bản",
    description: "Nhận biết âm, vần và cách ghép vần trong tiếng Việt.",
    subject: tiengViet,
    grade: lop1,
    chapterTitle: "Âm - vần - chữ viết",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Tiếng 'ba' gồm những âm nào?", choices: ["âm b và âm a", "âm b thôi", "âm a thôi", "không có âm nào"], correctIndex: 0, explanation: "'ba' gồm âm đầu 'b' và vần 'a'", difficulty: "easy" },
      { text: "Vần 'oa' xuất hiện trong tiếng nào?", choices: ["hoa", "ba", "mẹ", "cây"], correctIndex: 0, explanation: "'hoa' có vần 'oa'", difficulty: "easy" },
      { text: "Trong tiếng 'mèo', âm đầu là gì?", choices: ["m", "e", "eo", "è"], correctIndex: 0, explanation: "Âm đầu của 'mèo' là 'm'", difficulty: "easy" },
      { text: "Dấu thanh nào được dùng trong tiếng 'lá'?", choices: ["Dấu sắc", "Dấu huyền", "Dấu hỏi", "Dấu ngã"], correctIndex: 0, explanation: "'lá' mang dấu sắc", difficulty: "easy" },
      { text: "Tiếng nào có vần giống với 'cá'?", choices: ["cà", "cây", "con", "chó"], correctIndex: 0, explanation: "'cà' cũng có vần 'a'", difficulty: "medium" },
      { text: "Chữ cái nào là nguyên âm?", choices: ["b", "a", "m", "t"], correctIndex: 1, explanation: "'a' là nguyên âm", difficulty: "medium" },
    ],
  });
  await seedReview(t1, {
    title: "Kiến thức: Âm và vần cơ bản",
    content:
      "Mỗi tiếng trong tiếng Việt thường gồm âm đầu, vần và thanh điệu.\nVần gồm âm chính (và có thể có âm cuối). Ví dụ tiếng 'ba' có âm đầu 'b' và vần 'a'.\nCó 5 dấu thanh chính: sắc, huyền, hỏi, ngã, nặng (và thanh ngang không dấu).",
    examples: ["'ba' = âm đầu 'b' + vần 'a'", "'hoa' có vần 'oa'", "'lá' mang dấu sắc, 'là' mang dấu huyền"],
  });

  const t2 = await seedLessonWithQuestions({
    title: "Câu kể, câu hỏi, câu cảm",
    description: "Phân biệt các kiểu câu theo mục đích nói.",
    subject: tiengViet,
    grade: lop2,
    chapterTitle: "Các kiểu câu",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Câu 'Hôm nay là thứ hai.' là kiểu câu gì?", choices: ["Câu kể", "Câu hỏi", "Câu cảm", "Câu cầu khiến"], correctIndex: 0, explanation: "Đây là câu kể, dùng để trình bày sự việc", difficulty: "easy" },
      { text: "Câu 'Bạn có khỏe không?' là kiểu câu gì?", choices: ["Câu kể", "Câu hỏi", "Câu cảm", "Câu cầu khiến"], correctIndex: 1, explanation: "Đây là câu hỏi, dùng để hỏi", difficulty: "easy" },
      { text: "Câu 'Ôi, đẹp quá!' là kiểu câu gì?", choices: ["Câu kể", "Câu hỏi", "Câu cảm", "Câu cầu khiến"], correctIndex: 2, explanation: "Đây là câu cảm, bộc lộ cảm xúc", difficulty: "easy" },
      { text: "Câu cầu khiến dùng để làm gì?", choices: ["Kể chuyện", "Hỏi thông tin", "Nêu yêu cầu, đề nghị", "Bộc lộ cảm xúc"], correctIndex: 2, explanation: "Câu cầu khiến dùng để yêu cầu, đề nghị, ra lệnh", difficulty: "medium" },
      { text: "Câu nào dưới đây là câu cầu khiến?", choices: ["Em đi học.", "Em có đi học không?", "Em hãy đi học đi!", "Ôi, em đi học rồi!"], correctIndex: 2, explanation: "'Em hãy đi học đi!' là câu cầu khiến", difficulty: "medium" },
      { text: "Dấu câu nào thường dùng cuối câu hỏi?", choices: ["Dấu chấm", "Dấu hỏi", "Dấu chấm than", "Dấu phẩy"], correctIndex: 1, explanation: "Câu hỏi kết thúc bằng dấu hỏi (?)", difficulty: "easy" },
    ],
  });
  await seedReview(t2, {
    title: "Kiến thức: Câu kể, câu hỏi, câu cảm",
    content:
      "Theo mục đích nói, câu chia thành 4 kiểu chính:\n- Câu kể: trình bày sự việc, kết thúc bằng dấu chấm.\n- Câu hỏi: dùng để hỏi, kết thúc bằng dấu hỏi.\n- Câu cảm: bộc lộ cảm xúc, kết thúc bằng dấu chấm than.\n- Câu cầu khiến: nêu yêu cầu, đề nghị, kết thúc bằng dấu chấm than.",
    examples: ["Hôm nay trời đẹp. (câu kể)", "Bạn tên là gì? (câu hỏi)", "Ôi, đẹp quá! (câu cảm)", "Hãy giữ trật tự! (câu cầu khiến)"],
  });

  const t3 = await seedLessonWithQuestions({
    title: "Mở rộng vốn từ theo chủ điểm",
    description: "Mở rộng vốn từ theo các chủ điểm gia đình, nhà trường, quê hương.",
    subject: tiengViet,
    grade: lop3,
    chapterTitle: "Mở rộng vốn từ",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Từ nào thuộc chủ điểm 'gia đình'?", choices: ["Ông bà", "Sách vở", "Cây cối", "Xe cộ"], correctIndex: 0, explanation: "'Ông bà' thuộc chủ điểm gia đình", difficulty: "easy" },
      { text: "Từ nào thuộc chủ điểm 'nhà trường'?", choices: ["Cha mẹ", "Giáo viên", "Hàng xóm", "Bác sĩ"], correctIndex: 1, explanation: "'Giáo viên' thuộc chủ điểm nhà trường", difficulty: "easy" },
      { text: "Từ nào thuộc chủ điểm 'quê hương'?", choices: ["Cánh đồng", "Máy tính", "Điện thoại", "Ô tô"], correctIndex: 0, explanation: "'Cánh đồng' gợi hình ảnh quê hương", difficulty: "easy" },
      { text: "Từ nào gần nghĩa với 'quê hương'?", choices: ["Xứ sở", "Thành phố", "Trường học", "Công viên"], correctIndex: 0, explanation: "'Xứ sở' gần nghĩa với 'quê hương'", difficulty: "medium" },
      { text: "Trong các từ sau, từ nào chỉ tình cảm gia đình?", choices: ["Yêu thương", "Học tập", "Xây dựng", "Đi lại"], correctIndex: 0, explanation: "'Yêu thương' chỉ tình cảm gia đình", difficulty: "medium" },
      { text: "Câu 'Em rất yêu quý mái trường của mình' thể hiện tình cảm gì?", choices: ["Yêu gia đình", "Yêu trường lớp", "Yêu thiên nhiên", "Yêu bạn bè"], correctIndex: 1, explanation: "Câu thể hiện tình cảm với trường lớp", difficulty: "medium" },
    ],
  });
  await seedReview(t3, {
    title: "Kiến thức: Mở rộng vốn từ theo chủ điểm",
    content:
      "Mở rộng vốn từ theo chủ điểm giúp học sinh sử dụng từ ngữ phong phú, chính xác khi nói và viết về một chủ đề cụ thể.\nCác chủ điểm thường gặp ở lớp 3: gia đình, nhà trường, quê hương, thiên nhiên, cộng đồng.",
    examples: ["Chủ điểm gia đình: ông bà, cha mẹ, yêu thương, sum vầy", "Chủ điểm nhà trường: giáo viên, bạn bè, học tập, mái trường", "Chủ điểm quê hương: cánh đồng, dòng sông, xứ sở"],
  });

  const t4 = await seedLessonWithQuestions({
    title: "Danh từ, động từ, tính từ nâng cao",
    description: "Nhận biết và phân loại danh từ, động từ, tính từ trong câu văn phức tạp.",
    subject: tiengViet,
    grade: lop4,
    chapterTitle: "Từ loại nâng cao",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Trong câu 'Chú chim nhỏ hót líu lo trên cành cây', từ nào là danh từ?", choices: ["Chim", "Hót", "Líu lo", "Nhỏ"], correctIndex: 0, explanation: "'Chim' là danh từ chỉ sự vật", difficulty: "medium" },
      { text: "Trong câu trên, từ nào là động từ?", choices: ["Chim", "Cành cây", "Hót", "Nhỏ"], correctIndex: 2, explanation: "'Hót' là động từ chỉ hoạt động", difficulty: "medium" },
      { text: "Trong câu trên, từ nào là tính từ?", choices: ["Chim", "Hót", "Cây", "Nhỏ"], correctIndex: 3, explanation: "'Nhỏ' là tính từ miêu tả đặc điểm", difficulty: "medium" },
      { text: "Danh từ riêng khác danh từ chung ở điểm nào?", choices: ["Được viết hoa chữ cái đầu", "Luôn đứng đầu câu", "Không có nghĩa", "Không dùng được trong câu"], correctIndex: 0, explanation: "Danh từ riêng viết hoa chữ cái đầu, ví dụ: Hà Nội, Nam", difficulty: "hard" },
      { text: "Từ nào là danh từ riêng?", choices: ["học sinh", "Việt Nam", "cây bàng", "quyển sách"], correctIndex: 1, explanation: "'Việt Nam' là danh từ riêng", difficulty: "medium" },
      { text: "Động từ nào chỉ trạng thái (không phải hành động)?", choices: ["chạy", "yêu", "nhảy", "viết"], correctIndex: 1, explanation: "'yêu' là động từ chỉ trạng thái tình cảm", difficulty: "hard" },
    ],
  });
  await seedReview(t4, {
    title: "Kiến thức: Danh từ, động từ, tính từ nâng cao",
    content:
      "- Danh từ: gọi tên sự vật, hiện tượng, khái niệm; gồm danh từ chung (cây, sách) và danh từ riêng (Hà Nội, Nam - viết hoa).\n- Động từ: chỉ hoạt động (chạy, viết) hoặc trạng thái (yêu, thích, biết).\n- Tính từ: miêu tả đặc điểm, tính chất, màu sắc, hình dáng của sự vật.",
    examples: ["'Chim' - danh từ, 'hót' - động từ, 'nhỏ' - tính từ", "'Việt Nam' là danh từ riêng, viết hoa", "'yêu', 'thích' là động từ chỉ trạng thái"],
  });

  const t5 = await seedLessonWithQuestions({
    title: "Đại từ và quan hệ từ",
    description: "Nhận biết đại từ xưng hô và quan hệ từ nối câu.",
    subject: tiengViet,
    grade: lop5,
    chapterTitle: "Từ loại nâng cao lớp 5",
    chapterOrder: 2,
    order: 1,
    questions: [
      { text: "Đại từ là gì?", choices: ["Từ chỉ tên riêng", "Từ dùng để xưng hô hoặc thay thế danh từ", "Từ chỉ hành động", "Từ chỉ màu sắc"], correctIndex: 1, explanation: "Đại từ dùng để xưng hô hoặc thay thế cho danh từ đã nhắc đến", difficulty: "medium" },
      { text: "Từ nào là đại từ xưng hô?", choices: ["Chúng tôi", "Học sinh", "Cây bàng", "Đẹp"], correctIndex: 0, explanation: "'Chúng tôi' là đại từ xưng hô", difficulty: "easy" },
      { text: "Trong câu 'Nam học giỏi nên nó được thầy khen', từ 'nó' thay thế cho từ nào?", choices: ["Thầy", "Nam", "Khen", "Giỏi"], correctIndex: 1, explanation: "'nó' thay thế cho 'Nam'", difficulty: "medium" },
      { text: "Quan hệ từ nào thể hiện nguyên nhân - kết quả?", choices: ["và", "vì...nên...", "hoặc", "nhưng"], correctIndex: 1, explanation: "'vì...nên...' thể hiện quan hệ nguyên nhân - kết quả", difficulty: "medium" },
      { text: "Câu 'Tuy trời mưa nhưng em vẫn đi học' dùng quan hệ từ thể hiện điều gì?", choices: ["Nguyên nhân - kết quả", "Tương phản", "Điều kiện - kết quả", "Liệt kê"], correctIndex: 1, explanation: "'Tuy...nhưng...' thể hiện quan hệ tương phản", difficulty: "hard" },
      { text: "Quan hệ từ nào thể hiện điều kiện - kết quả?", choices: ["Vì...nên", "Nếu...thì", "Tuy...nhưng", "Không những...mà còn"], correctIndex: 1, explanation: "'Nếu...thì...' thể hiện quan hệ điều kiện - kết quả", difficulty: "hard" },
    ],
  });
  await seedReview(t5, {
    title: "Kiến thức: Đại từ và quan hệ từ",
    content:
      "- Đại từ: dùng để xưng hô (tôi, chúng ta, bạn...) hoặc thay thế cho danh từ, cụm từ đã nói trước đó, tránh lặp từ.\n- Quan hệ từ: nối các từ ngữ, các vế câu, thể hiện quan hệ ý nghĩa như nguyên nhân - kết quả (vì...nên), điều kiện - kết quả (nếu...thì), tương phản (tuy...nhưng).",
    examples: ["'Nam học giỏi nên nó được khen' - 'nó' thay cho 'Nam'", "'Vì trời mưa nên em ở nhà' - quan hệ nguyên nhân - kết quả", "'Tuy khó nhưng em vẫn cố gắng' - quan hệ tương phản"],
  });

  console.log("[seedRealCurriculum] Hoàn tất seed 10 bài học mới theo chương trình GDPT 2018");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seedRealCurriculum] Lỗi:", err);
  process.exit(1);
});
