// Mở rộng nội dung Lớp 2-5 (Toán & Tiếng Việt) theo cấu trúc chương trình GDPT 2018.
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
  console.log("[expandLop2to5] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop2 = grades.find((g) => g.slug === "lop-2");
  const lop3 = grades.find((g) => g.slug === "lop-3");
  const lop4 = grades.find((g) => g.slug === "lop-4");
  const lop5 = grades.find((g) => g.slug === "lop-5");
  const toan = subjects.find((s) => s.slug === "toan");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  let count = 0;
  async function add(cfg) {
    const lesson = await seedLessonWithQuestions(cfg);
    await seedReview(lesson, cfg.review);
    count++;
  }

  // ===================== LỚP 2 =====================

  await add({
    title: "Bảng nhân 3",
    description: "Học thuộc và vận dụng bảng nhân 3.",
    subject: toan, grade: lop2, chapterTitle: "Phép nhân và phép cộng nâng cao", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "3 x 4 = ?", choices: ["9", "12", "15", "10"], correctIndex: 1, explanation: "3 x 4 = 12", difficulty: "easy" },
      { text: "3 x 6 = ?", choices: ["15", "18", "21", "16"], correctIndex: 1, explanation: "3 x 6 = 18", difficulty: "easy" },
      { text: "3 x 8 = ?", choices: ["21", "24", "27", "22"], correctIndex: 1, explanation: "3 x 8 = 24", difficulty: "medium" },
      { text: "Mỗi hộp có 3 quả cam, có 5 hộp. Hỏi có tất cả bao nhiêu quả cam?", choices: ["12", "15", "18", "10"], correctIndex: 1, explanation: "3 x 5 = 15", difficulty: "medium" },
      { text: "3 x 9 = ?", choices: ["24", "27", "30", "25"], correctIndex: 1, explanation: "3 x 9 = 27", difficulty: "medium" },
      { text: "Số nào nhân với 3 thì bằng 21?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "3 x 7 = 21", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Bảng nhân 3",
      content: "Bảng nhân 3 là kết quả của phép cộng liên tiếp số 3: 3, 6, 9, 12, 15...\nMuốn tính 3 x n, em có thể lấy n rồi cộng dồn n lần số 3, hoặc học thuộc bảng nhân.",
      examples: ["3 x 4 = 3 + 3 + 3 + 3 = 12", "3 x 7 = 21", "3 x 9 = 27"],
    },
  });

  await add({
    title: "Bảng chia 3",
    description: "Làm quen với bảng chia 3, suy ra từ bảng nhân 3.",
    subject: toan, grade: lop2, chapterTitle: "Phép chia cơ bản", chapterOrder: 3, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "9 : 3 = ?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "9 : 3 = 3", difficulty: "easy" },
      { text: "15 : 3 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "15 : 3 = 5", difficulty: "easy" },
      { text: "21 : 3 = ?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "21 : 3 = 7", difficulty: "medium" },
      { text: "Có 18 cái kẹo chia đều cho 3 bạn. Mỗi bạn được mấy cái?", choices: ["5", "6", "7", "4"], correctIndex: 1, explanation: "18 : 3 = 6", difficulty: "medium" },
      { text: "27 : 3 = ?", choices: ["8", "9", "10", "7"], correctIndex: 1, explanation: "27 : 3 = 9", difficulty: "medium" },
      { text: "24 : 3 = ?", choices: ["7", "8", "9", "6"], correctIndex: 1, explanation: "24 : 3 = 8", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Bảng chia 3",
      content: "Bảng chia 3 được suy ra từ bảng nhân 3: nếu 3 x 5 = 15 thì 15 : 3 = 5.\nĐể chia đều một số cho 3 phần bằng nhau, em tìm số mà nhân với 3 ra đúng số đó.",
      examples: ["9 : 3 = 3 (vì 3 x 3 = 9)", "21 : 3 = 7 (vì 3 x 7 = 21)", "18 kẹo chia 3 bạn, mỗi bạn 6 cái"],
    },
  });

  await add({
    title: "Ôn tập phép nhân, phép chia",
    description: "Ôn tập tổng hợp các bảng nhân, bảng chia 2 và 3 đã học.",
    subject: toan, grade: lop2, chapterTitle: "Phép chia cơ bản", chapterOrder: 3, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "2 x 5 = ?", choices: ["8", "10", "12", "9"], correctIndex: 1, explanation: "2 x 5 = 10", difficulty: "easy" },
      { text: "16 : 2 = ?", choices: ["6", "7", "8", "9"], correctIndex: 2, explanation: "16 : 2 = 8", difficulty: "easy" },
      { text: "3 x 5 = ?", choices: ["10", "15", "20", "12"], correctIndex: 1, explanation: "3 x 5 = 15", difficulty: "medium" },
      { text: "12 : 3 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "12 : 3 = 4", difficulty: "medium" },
      { text: "Có 4 túi kẹo, mỗi túi 3 cái. Có tất cả bao nhiêu cái kẹo?", choices: ["10", "12", "14", "9"], correctIndex: 1, explanation: "3 x 4 = 12", difficulty: "medium" },
      { text: "Phép tính nào có kết quả bằng 18: 3x6, 2x9, cả hai đều đúng, hay không có phép nào?", choices: ["Chỉ 3x6", "Chỉ 2x9", "Cả hai đều đúng", "Không có phép nào"], correctIndex: 2, explanation: "3x6=18 và 2x9=18, cả hai đều đúng", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Ôn tập phép nhân, phép chia",
      content: "Phép nhân và phép chia là hai phép tính ngược nhau. Nắm chắc bảng nhân 2, 3 giúp em tính nhanh các phép chia tương ứng.\nKhi giải toán có lời văn, em cần xác định bài toán yêu cầu gộp nhóm (dùng phép nhân) hay chia đều (dùng phép chia).",
      examples: ["2 x 5 = 10, vậy 10 : 2 = 5", "3 x 6 = 18, vậy 18 : 3 = 6", "4 túi x 3 kẹo = 12 kẹo"],
    },
  });

  await add({
    title: "Câu cầu khiến, câu cảm thán",
    description: "Nhận biết và sử dụng câu cầu khiến, câu cảm thán trong giao tiếp.",
    subject: tv, grade: lop2, chapterTitle: "Các kiểu câu", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Câu 'Hãy giữ trật tự!' là loại câu gì?", choices: ["Câu kể", "Câu cầu khiến", "Câu hỏi", "Câu cảm"], correctIndex: 1, explanation: "Câu cầu khiến dùng để yêu cầu, đề nghị người khác làm gì đó", difficulty: "easy" },
      { text: "Câu 'Ôi, đẹp quá!' là loại câu gì?", choices: ["Câu kể", "Câu cầu khiến", "Câu hỏi", "Câu cảm"], correctIndex: 3, explanation: "Câu cảm bộc lộ cảm xúc ngạc nhiên, thích thú", difficulty: "easy" },
      { text: "Dấu câu nào thường dùng để kết thúc câu cảm?", choices: ["Dấu chấm", "Dấu chấm hỏi", "Dấu chấm than", "Dấu phẩy"], correctIndex: 2, explanation: "Câu cảm thường kết thúc bằng dấu chấm than (!)", difficulty: "medium" },
      { text: "Câu nào là câu cầu khiến?", choices: ["Em rất vui.", "Bạn có khỏe không?", "Đừng nói chuyện trong lớp.", "Trời đẹp quá!"], correctIndex: 2, explanation: "'Đừng nói chuyện trong lớp.' là lời yêu cầu — câu cầu khiến", difficulty: "medium" },
      { text: "Từ nào thường xuất hiện trong câu cầu khiến?", choices: ["Ôi", "Hãy", "Có phải", "Chao ôi"], correctIndex: 1, explanation: "'Hãy' là từ thường mở đầu câu cầu khiến", difficulty: "medium" },
      { text: "Câu 'Chao ôi, cảnh đẹp quá!' thể hiện cảm xúc gì?", choices: ["Yêu cầu", "Ngạc nhiên, thích thú", "Nghi vấn", "Kể chuyện"], correctIndex: 1, explanation: "Đây là câu cảm thể hiện sự ngạc nhiên, thích thú trước cảnh đẹp", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Câu cầu khiến, câu cảm thán",
      content: "Câu cầu khiến dùng để nêu yêu cầu, đề nghị, mệnh lệnh, thường có từ 'hãy', 'đừng', 'chớ' và kết thúc bằng dấu chấm hoặc dấu chấm than.\nCâu cảm thán dùng để bộc lộ cảm xúc (vui, buồn, ngạc nhiên...), thường có từ 'ôi', 'chao ôi', 'quá' và kết thúc bằng dấu chấm than.",
      examples: ["Câu cầu khiến: Hãy giữ trật tự!", "Câu cảm: Ôi, đẹp quá!", "Câu cầu khiến: Đừng chạy trong lớp."],
    },
  });

  await add({
    title: "Luyện đặt câu theo mẫu",
    description: "Luyện tập đặt câu theo các mẫu câu Ai là gì? Ai làm gì? Ai thế nào?",
    subject: tv, grade: lop2, chapterTitle: "Các kiểu câu", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Câu 'Em là học sinh lớp 2.' thuộc mẫu câu nào?", choices: ["Ai là gì?", "Ai làm gì?", "Ai thế nào?", "Không thuộc mẫu nào"], correctIndex: 0, explanation: "Câu giới thiệu, nêu đặc điểm bằng từ 'là' thuộc mẫu Ai là gì?", difficulty: "easy" },
      { text: "Câu 'Bạn Lan đang đọc sách.' thuộc mẫu câu nào?", choices: ["Ai là gì?", "Ai làm gì?", "Ai thế nào?", "Không thuộc mẫu nào"], correctIndex: 1, explanation: "Câu nêu hoạt động thuộc mẫu Ai làm gì?", difficulty: "easy" },
      { text: "Câu 'Bầu trời rất trong xanh.' thuộc mẫu câu nào?", choices: ["Ai là gì?", "Ai làm gì?", "Ai thế nào?", "Không thuộc mẫu nào"], correctIndex: 2, explanation: "Câu nêu đặc điểm, tính chất thuộc mẫu Ai thế nào?", difficulty: "medium" },
      { text: "Trong câu 'Mẹ em là bác sĩ.', phần nào trả lời cho 'là gì'?", choices: ["Mẹ em", "là", "bác sĩ", "Cả câu"], correctIndex: 2, explanation: "'bác sĩ' là phần trả lời cho câu hỏi 'là gì'", difficulty: "medium" },
      { text: "Câu nào thuộc mẫu Ai làm gì?", choices: ["Bà em rất hiền.", "Em đang quét nhà.", "Bố em là công nhân.", "Hoa rất thơm."], correctIndex: 1, explanation: "'Em đang quét nhà.' nêu hành động — thuộc mẫu Ai làm gì?", difficulty: "medium" },
      { text: "Câu nào thuộc mẫu Ai thế nào?", choices: ["Chú mèo đang ngủ.", "Chú mèo là con vật nuôi.", "Chú mèo rất đáng yêu.", "Chú mèo bắt chuột."], correctIndex: 2, explanation: "'Chú mèo rất đáng yêu.' nêu đặc điểm — thuộc mẫu Ai thế nào?", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện đặt câu theo mẫu",
      content: "Có 3 mẫu câu cơ bản thường gặp:\n- Ai là gì? dùng để giới thiệu, nhận định (VD: Em là học sinh.)\n- Ai làm gì? dùng để kể về hoạt động (VD: Em đang học bài.)\n- Ai thế nào? dùng để nêu đặc điểm, trạng thái (VD: Bầu trời trong xanh.)",
      examples: ["Ai là gì?: Bố em là bác sĩ.", "Ai làm gì?: Em đang đọc sách.", "Ai thế nào?: Hoa hồng rất đẹp."],
    },
  });

  await add({
    title: "Từ chỉ thời gian, địa điểm",
    description: "Nhận biết các từ ngữ chỉ thời gian (sáng, trưa, hôm nay...) và địa điểm (trường học, công viên...).",
    subject: tv, grade: lop2, chapterTitle: "Từ loại tiếng Việt", chapterOrder: 4, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "Từ nào chỉ thời gian?", choices: ["buổi sáng", "trường học", "quyển sách", "con mèo"], correctIndex: 0, explanation: "'buổi sáng' là từ chỉ thời gian", difficulty: "easy" },
      { text: "Từ nào chỉ địa điểm?", choices: ["hôm qua", "công viên", "ngày mai", "bây giờ"], correctIndex: 1, explanation: "'công viên' là từ chỉ địa điểm", difficulty: "easy" },
      { text: "Trong câu 'Sáng nay, em đi học ở trường.', từ nào chỉ thời gian?", choices: ["Sáng nay", "em", "đi học", "trường"], correctIndex: 0, explanation: "'Sáng nay' là từ ngữ chỉ thời gian trong câu", difficulty: "medium" },
      { text: "Trong câu trên, từ nào chỉ địa điểm?", choices: ["Sáng nay", "em", "đi học", "trường"], correctIndex: 3, explanation: "'trường' là từ ngữ chỉ địa điểm trong câu", difficulty: "medium" },
      { text: "Từ nào KHÔNG chỉ thời gian: hôm nay, ngày mai, sân trường, tối nay?", choices: ["hôm nay", "ngày mai", "sân trường", "tối nay"], correctIndex: 2, explanation: "'sân trường' là từ chỉ địa điểm, không phải thời gian", difficulty: "medium" },
      { text: "Từ nào chỉ địa điểm trong nhóm: lớp học, buổi chiều, năm ngoái, mùa xuân?", choices: ["lớp học", "buổi chiều", "năm ngoái", "mùa xuân"], correctIndex: 0, explanation: "'lớp học' là từ chỉ địa điểm", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Từ chỉ thời gian, địa điểm",
      content: "Từ chỉ thời gian là những từ trả lời cho câu hỏi Khi nào? (sáng, trưa, tối, hôm nay, năm ngoái...).\nTừ chỉ địa điểm là những từ trả lời cho câu hỏi Ở đâu? (trường học, công viên, sân nhà...).\nHai loại từ này thường được dùng để bổ sung thông tin cho câu, giúp câu văn rõ ràng hơn.",
      examples: ["Thời gian: buổi sáng, hôm qua, mùa hè", "Địa điểm: trường học, công viên, sân nhà", "'Sáng nay, em đi học ở trường' có cả hai loại từ"],
    },
  });

  await add({
    title: "Mở rộng vốn từ theo chủ đề gia đình",
    description: "Mở rộng vốn từ về các thành viên trong gia đình và hoạt động thường ngày.",
    subject: tv, grade: lop2, chapterTitle: "Từ loại tiếng Việt", chapterOrder: 4, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "Từ nào chỉ thành viên trong gia đình?", choices: ["ông", "bàn", "sách", "hoa"], correctIndex: 0, explanation: "'ông' là từ chỉ người thân trong gia đình", difficulty: "easy" },
      { text: "Từ nào chỉ hoạt động thường làm trong gia đình?", choices: ["nấu cơm", "con mèo", "cái bàn", "bông hoa"], correctIndex: 0, explanation: "'nấu cơm' là từ chỉ hoạt động", difficulty: "easy" },
      { text: "Ai là người sinh ra bố hoặc mẹ của em?", choices: ["anh chị", "ông bà", "cô chú", "bạn bè"], correctIndex: 1, explanation: "Ông bà là người sinh ra bố hoặc mẹ", difficulty: "medium" },
      { text: "Từ nào KHÔNG chỉ người thân trong gia đình: bố, mẹ, cô giáo, em trai?", choices: ["bố", "mẹ", "cô giáo", "em trai"], correctIndex: 2, explanation: "'cô giáo' không phải người thân trong gia đình", difficulty: "medium" },
      { text: "Anh/chị của bố hoặc mẹ được gọi là gì?", choices: ["cô, chú, bác", "con, cháu", "ông, bà", "anh, chị"], correctIndex: 0, explanation: "Cô, chú, bác là anh chị em của bố hoặc mẹ", difficulty: "medium" },
      { text: "Từ nào chỉ hoạt động chăm sóc gia đình?", choices: ["dọn dẹp nhà cửa", "cái ghế", "quyển vở", "con chó"], correctIndex: 0, explanation: "'dọn dẹp nhà cửa' là hoạt động chăm sóc gia đình", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Mở rộng vốn từ theo chủ đề gia đình",
      content: "Gia đình gồm nhiều thành viên: ông, bà, bố, mẹ, anh, chị, em... Mỗi người có vai trò và công việc riêng.\nCác hoạt động thường ngày trong gia đình: nấu cơm, dọn dẹp nhà cửa, chăm sóc em nhỏ, học bài cùng nhau.",
      examples: ["Thành viên: ông, bà, bố, mẹ, anh, chị, em", "Hoạt động: nấu cơm, quét nhà, giặt quần áo", "Cô, chú, bác là anh chị em của bố mẹ"],
    },
  });

  // ===================== LỚP 3 =====================

  await add({
    title: "Diện tích hình chữ nhật, hình vuông",
    description: "Tính diện tích hình chữ nhật và hình vuông dựa vào số đo các cạnh.",
    subject: toan, grade: lop3, chapterTitle: "Hình học và đo lường", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Diện tích hình chữ nhật có chiều dài 5cm, chiều rộng 3cm là bao nhiêu?", choices: ["8cm²", "15cm²", "16cm²", "10cm²"], correctIndex: 1, explanation: "Diện tích = dài x rộng = 5 x 3 = 15cm²", difficulty: "easy" },
      { text: "Diện tích hình vuông cạnh 4cm là bao nhiêu?", choices: ["8cm²", "12cm²", "16cm²", "20cm²"], correctIndex: 2, explanation: "Diện tích hình vuông = cạnh x cạnh = 4 x 4 = 16cm²", difficulty: "easy" },
      { text: "Muốn tính diện tích hình chữ nhật, ta làm thế nào?", choices: ["Cộng chiều dài và chiều rộng", "Nhân chiều dài với chiều rộng", "Nhân 2 với chiều dài", "Trừ chiều dài cho chiều rộng"], correctIndex: 1, explanation: "Diện tích hình chữ nhật = chiều dài x chiều rộng", difficulty: "medium" },
      { text: "Một mảnh vườn hình chữ nhật dài 8m, rộng 5m. Diện tích mảnh vườn là bao nhiêu?", choices: ["13m²", "26m²", "40m²", "35m²"], correctIndex: 2, explanation: "Diện tích = 8 x 5 = 40m²", difficulty: "medium" },
      { text: "Hình vuông có diện tích 25cm² thì cạnh dài bao nhiêu?", choices: ["4cm", "5cm", "6cm", "25cm"], correctIndex: 1, explanation: "5 x 5 = 25, vậy cạnh dài 5cm", difficulty: "hard" },
      { text: "Diện tích và chu vi khác nhau ở điểm nào?", choices: ["Không khác nhau", "Diện tích đo bằng đơn vị vuông, chu vi đo bằng đơn vị dài", "Chu vi luôn lớn hơn diện tích", "Diện tích chỉ dùng cho hình vuông"], correctIndex: 1, explanation: "Diện tích tính bằng đơn vị vuông (cm², m²...), chu vi tính bằng đơn vị dài (cm, m...)", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Diện tích hình chữ nhật, hình vuông",
      content: "Diện tích hình chữ nhật = chiều dài x chiều rộng.\nDiện tích hình vuông = cạnh x cạnh.\nĐơn vị đo diện tích thường dùng: cm² (xăng-ti-mét vuông), m² (mét vuông).",
      examples: ["Hình chữ nhật dài 5cm, rộng 3cm: diện tích = 5 x 3 = 15cm²", "Hình vuông cạnh 4cm: diện tích = 4 x 4 = 16cm²", "Mảnh vườn 8m x 5m: diện tích = 40m²"],
    },
  });

  await add({
    title: "Đơn vị đo độ dài",
    description: "Làm quen với các đơn vị đo độ dài: milimét, xăng-ti-mét, đề-xi-mét, mét, ki-lô-mét.",
    subject: toan, grade: lop3, chapterTitle: "Hình học và đo lường", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "1 mét bằng bao nhiêu xăng-ti-mét?", choices: ["10cm", "100cm", "1000cm", "1cm"], correctIndex: 1, explanation: "1m = 100cm", difficulty: "easy" },
      { text: "1 ki-lô-mét bằng bao nhiêu mét?", choices: ["10m", "100m", "1000m", "10000m"], correctIndex: 2, explanation: "1km = 1000m", difficulty: "easy" },
      { text: "1 đề-xi-mét bằng bao nhiêu xăng-ti-mét?", choices: ["1cm", "10cm", "100cm", "1000cm"], correctIndex: 1, explanation: "1dm = 10cm", difficulty: "medium" },
      { text: "3m bằng bao nhiêu cm?", choices: ["30cm", "300cm", "3000cm", "3cm"], correctIndex: 1, explanation: "3m = 3 x 100cm = 300cm", difficulty: "medium" },
      { text: "500cm bằng bao nhiêu mét?", choices: ["5m", "50m", "500m", "0.5m"], correctIndex: 0, explanation: "500cm = 500 : 100 = 5m", difficulty: "medium" },
      { text: "Đơn vị nào lớn nhất trong các đơn vị: cm, m, km, dm?", choices: ["cm", "m", "km", "dm"], correctIndex: 2, explanation: "km (ki-lô-mét) là đơn vị lớn nhất trong nhóm này", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Đơn vị đo độ dài",
      content: "Các đơn vị đo độ dài thường dùng, từ nhỏ đến lớn: milimét (mm), xăng-ti-mét (cm), đề-xi-mét (dm), mét (m), ki-lô-mét (km).\nQuy đổi: 1cm = 10mm, 1dm = 10cm, 1m = 10dm = 100cm, 1km = 1000m.",
      examples: ["1m = 100cm", "1km = 1000m", "3m = 300cm"],
    },
  });

  await add({
    title: "Bảng chia 3, 4, 5",
    description: "Ôn tập và vận dụng bảng chia 3, 4, 5.",
    subject: toan, grade: lop3, chapterTitle: "Bảng nhân", chapterOrder: 3, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "12 : 4 = ?", choices: ["2", "3", "4", "5"], correctIndex: 1, explanation: "12 : 4 = 3", difficulty: "easy" },
      { text: "20 : 5 = ?", choices: ["3", "4", "5", "6"], correctIndex: 1, explanation: "20 : 5 = 4", difficulty: "easy" },
      { text: "15 : 3 = ?", choices: ["4", "5", "6", "3"], correctIndex: 1, explanation: "15 : 3 = 5", difficulty: "medium" },
      { text: "24 : 4 = ?", choices: ["5", "6", "7", "8"], correctIndex: 1, explanation: "24 : 4 = 6", difficulty: "medium" },
      { text: "Có 30 quyển vở chia đều cho 5 bạn. Mỗi bạn được mấy quyển?", choices: ["5", "6", "7", "8"], correctIndex: 1, explanation: "30 : 5 = 6", difficulty: "medium" },
      { text: "28 : 4 = ?", choices: ["6", "7", "8", "9"], correctIndex: 1, explanation: "28 : 4 = 7", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Bảng chia 3, 4, 5",
      content: "Bảng chia 3, 4, 5 được suy ra từ bảng nhân tương ứng. Nắm chắc các bảng nhân sẽ giúp em tính nhanh các phép chia.\nVí dụ: 4 x 6 = 24, vậy 24 : 4 = 6 và 24 : 6 = 4.",
      examples: ["12 : 4 = 3 (vì 4 x 3 = 12)", "20 : 5 = 4 (vì 5 x 4 = 20)", "30 vở chia 5 bạn, mỗi bạn 6 quyển"],
    },
  });

  await add({
    title: "Nhân số có hai chữ số với số có một chữ số",
    description: "Học cách đặt tính và tính nhân số có hai chữ số với số có một chữ số.",
    subject: toan, grade: lop3, chapterTitle: "Bảng nhân", chapterOrder: 3, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "12 x 3 = ?", choices: ["24", "36", "35", "38"], correctIndex: 1, explanation: "12 x 3 = 36", difficulty: "easy" },
      { text: "23 x 2 = ?", choices: ["43", "45", "46", "44"], correctIndex: 2, explanation: "23 x 2 = 46", difficulty: "easy" },
      { text: "14 x 4 = ?", choices: ["54", "56", "58", "52"], correctIndex: 1, explanation: "14 x 4 = 56", difficulty: "medium" },
      { text: "Mỗi lớp có 25 học sinh, có 3 lớp. Hỏi có tất cả bao nhiêu học sinh?", choices: ["65", "70", "75", "80"], correctIndex: 2, explanation: "25 x 3 = 75", difficulty: "medium" },
      { text: "21 x 4 = ?", choices: ["82", "84", "86", "80"], correctIndex: 1, explanation: "21 x 4 = 84", difficulty: "medium" },
      { text: "32 x 3 = ?", choices: ["93", "94", "96", "92"], correctIndex: 2, explanation: "32 x 3 = 96", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Nhân số có hai chữ số với số có một chữ số",
      content: "Muốn nhân số có hai chữ số với số có một chữ số, em nhân lần lượt từ hàng đơn vị đến hàng chục, nhớ cộng phần nhớ (nếu có) sang hàng chục.\nVí dụ: 14 x 4: 4 x 4 = 16, viết 6 nhớ 1; 1 x 4 = 4, cộng thêm 1 nhớ = 5. Kết quả: 56.",
      examples: ["12 x 3 = 36", "14 x 4 = 56 (4x4=16 viết 6 nhớ 1; 1x4=4+1=5)", "25 x 3 = 75"],
    },
  });

  await add({
    title: "Từ chỉ đặc điểm, tính chất",
    description: "Nhận biết và sử dụng từ ngữ chỉ đặc điểm, tính chất của sự vật.",
    subject: tv, grade: lop3, chapterTitle: "Mở rộng vốn từ", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Từ nào chỉ đặc điểm?", choices: ["chạy", "đẹp", "bàn", "hôm nay"], correctIndex: 1, explanation: "'đẹp' là từ chỉ đặc điểm", difficulty: "easy" },
      { text: "Từ nào chỉ tính chất của sự vật?", choices: ["nhảy", "mềm mại", "cái ghế", "hôm qua"], correctIndex: 1, explanation: "'mềm mại' là từ chỉ tính chất", difficulty: "easy" },
      { text: "Trong câu 'Quả táo đỏ và ngọt.', từ nào chỉ đặc điểm?", choices: ["Quả táo", "đỏ và ngọt", "và", "Cả câu"], correctIndex: 1, explanation: "'đỏ và ngọt' là các từ chỉ đặc điểm của quả táo", difficulty: "medium" },
      { text: "Từ nào KHÔNG chỉ đặc điểm: cao, thấp, chạy, to?", choices: ["cao", "thấp", "chạy", "to"], correctIndex: 2, explanation: "'chạy' là từ chỉ hoạt động, không phải đặc điểm", difficulty: "medium" },
      { text: "Từ nào tả đặc điểm về màu sắc?", choices: ["xanh", "chạy nhanh", "ăn cơm", "đi học"], correctIndex: 0, explanation: "'xanh' là từ chỉ đặc điểm về màu sắc", difficulty: "medium" },
      { text: "Từ nào tả đặc điểm về hình dáng?", choices: ["ngọt", "tròn", "vui vẻ", "nhanh nhẹn"], correctIndex: 1, explanation: "'tròn' là từ chỉ đặc điểm về hình dáng", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Từ chỉ đặc điểm, tính chất",
      content: "Từ chỉ đặc điểm, tính chất dùng để miêu tả hình dáng, màu sắc, mùi vị, tính cách của sự vật, con người.\nVí dụ: cao, thấp, tròn, vuông (hình dáng); xanh, đỏ, vàng (màu sắc); ngọt, chua, mặn (mùi vị); hiền, ngoan, chăm chỉ (tính cách).",
      examples: ["Hình dáng: cao, tròn, vuông", "Màu sắc: xanh, đỏ, vàng", "Tính cách: hiền, ngoan, chăm chỉ"],
    },
  });

  await add({
    title: "So sánh trong câu văn",
    description: "Nhận biết biện pháp so sánh và tác dụng của nó trong câu văn.",
    subject: tv, grade: lop3, chapterTitle: "Mở rộng vốn từ", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Câu nào có sử dụng biện pháp so sánh?", choices: ["Trăng tròn như cái đĩa.", "Em đi học.", "Trời mưa to.", "Bố em là công nhân."], correctIndex: 0, explanation: "'Trăng tròn như cái đĩa' dùng từ 'như' để so sánh", difficulty: "easy" },
      { text: "Từ nào thường dùng để so sánh?", choices: ["và", "như", "nhưng", "thì"], correctIndex: 1, explanation: "'như' là từ so sánh phổ biến", difficulty: "easy" },
      { text: "Trong câu 'Cô giáo hiền như mẹ.', sự vật nào được so sánh với 'mẹ'?", choices: ["Cô giáo", "hiền", "như", "Cả câu"], correctIndex: 0, explanation: "'Cô giáo' được so sánh với 'mẹ' về đức tính hiền", difficulty: "medium" },
      { text: "Biện pháp so sánh giúp câu văn như thế nào?", choices: ["Khó hiểu hơn", "Sinh động, dễ hình dung hơn", "Ngắn gọn hơn", "Không có tác dụng gì"], correctIndex: 1, explanation: "So sánh giúp câu văn sinh động và dễ hình dung hơn", difficulty: "medium" },
      { text: "Câu nào KHÔNG có biện pháp so sánh?", choices: ["Lá vàng như tơ.", "Bé ngủ như thiên thần.", "Em rất chăm học.", "Sóng biển như những dải lụa."], correctIndex: 2, explanation: "'Em rất chăm học.' không sử dụng biện pháp so sánh", difficulty: "medium" },
      { text: "Từ nào cũng có thể dùng để so sánh ngoài 'như'?", choices: ["là", "và", "nhưng", "vì"], correctIndex: 0, explanation: "'là' cũng có thể dùng trong câu so sánh: VD 'Quê hương là chùm khế ngọt'", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: So sánh trong câu văn",
      content: "So sánh là biện pháp đối chiếu hai sự vật, sự việc có nét giống nhau nhằm làm câu văn sinh động, gợi hình hơn.\nCấu trúc thường gặp: A như B (VD: Trăng tròn như cái đĩa) hoặc A là B (VD: Quê hương là chùm khế ngọt).",
      examples: ["Trăng tròn như cái đĩa.", "Cô giáo hiền như mẹ.", "Lá vàng như tơ."],
    },
  });

  await add({
    title: "Từ nhiều nghĩa",
    description: "Nhận biết từ nhiều nghĩa và phân biệt nghĩa gốc, nghĩa chuyển.",
    subject: tv, grade: lop3, chapterTitle: "Từ vựng nâng cao", chapterOrder: 4, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "Từ 'chân' trong 'chân bàn' và 'chân người' có phải từ nhiều nghĩa không?", choices: ["Có", "Không", "Không xác định được", "Là hai từ khác nhau hoàn toàn"], correctIndex: 0, explanation: "'chân' là từ nhiều nghĩa, có nghĩa gốc (chân người) và nghĩa chuyển (chân bàn)", difficulty: "medium" },
      { text: "Nghĩa gốc của từ 'chân' là gì?", choices: ["Bộ phận dưới cùng của bàn ghế", "Bộ phận cơ thể người dùng để đi lại", "Một loại cây", "Một loại đồ vật"], correctIndex: 1, explanation: "Nghĩa gốc của 'chân' là bộ phận cơ thể người dùng để đi, đứng", difficulty: "medium" },
      { text: "Trong câu 'Mũi thuyền hướng ra khơi.', từ 'mũi' được dùng với nghĩa nào?", choices: ["Nghĩa gốc", "Nghĩa chuyển", "Không có nghĩa", "Là từ đồng âm"], correctIndex: 1, explanation: "'mũi thuyền' là nghĩa chuyển của từ 'mũi' (nghĩa gốc là bộ phận trên mặt người)", difficulty: "hard" },
      { text: "Từ nào là từ nhiều nghĩa?", choices: ["chân", "bàn", "sách", "hoa"], correctIndex: 0, explanation: "'chân' có nhiều nghĩa: chân người, chân bàn, chân núi...", difficulty: "medium" },
      { text: "'Chân núi' được hiểu là gì?", choices: ["Bộ phận cơ thể của núi", "Phần thấp nhất, sát mặt đất của núi", "Đỉnh núi", "Một loại cây trên núi"], correctIndex: 1, explanation: "'Chân núi' là phần thấp nhất của núi, nghĩa chuyển từ 'chân' người", difficulty: "medium" },
      { text: "Từ nhiều nghĩa khác với từ đồng âm ở điểm nào?", choices: ["Không khác nhau", "Từ nhiều nghĩa có các nghĩa liên quan nhau, từ đồng âm thì nghĩa hoàn toàn khác nhau", "Từ đồng âm luôn viết khác nhau", "Từ nhiều nghĩa chỉ có một nghĩa"], correctIndex: 1, explanation: "Từ nhiều nghĩa có mối liên hệ giữa các nghĩa, còn từ đồng âm thì các nghĩa không liên quan", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Từ nhiều nghĩa",
      content: "Từ nhiều nghĩa là từ có một nghĩa gốc (nghĩa ban đầu, cơ bản) và một hoặc nhiều nghĩa chuyển (nghĩa được suy ra từ nghĩa gốc, có liên quan đến nghĩa gốc).\nVí dụ: từ 'chân' có nghĩa gốc là bộ phận cơ thể người, nghĩa chuyển là chân bàn, chân núi, chân trời...",
      examples: ["chân người (nghĩa gốc) - chân bàn (nghĩa chuyển)", "mũi người (nghĩa gốc) - mũi thuyền (nghĩa chuyển)", "chân núi = phần thấp nhất của núi"],
    },
  });

  await add({
    title: "Luyện viết đoạn văn ngắn",
    description: "Luyện kỹ năng viết đoạn văn ngắn kể về người thân, sự việc quen thuộc.",
    subject: tv, grade: lop3, chapterTitle: "Từ vựng nâng cao", chapterOrder: 4, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "Một đoạn văn thường có mấy phần chính?", choices: ["1 phần", "2 phần", "3 phần: mở đoạn, thân đoạn, kết đoạn", "Không có quy định"], correctIndex: 2, explanation: "Đoạn văn thường có 3 phần: mở đoạn, thân đoạn, kết đoạn", difficulty: "medium" },
      { text: "Câu mở đoạn thường có nhiệm vụ gì?", choices: ["Kết thúc đoạn văn", "Giới thiệu nội dung chính sẽ nói tới", "Không quan trọng", "Chỉ dùng dấu chấm hỏi"], correctIndex: 1, explanation: "Câu mở đoạn giới thiệu khái quát nội dung của đoạn văn", difficulty: "medium" },
      { text: "Khi viết đoạn văn kể về mẹ, em nên tập trung miêu tả điều gì?", choices: ["Ngoại hình, tính cách, việc làm của mẹ", "Chỉ tên của mẹ", "Món ăn yêu thích của em", "Không cần miêu tả gì"], correctIndex: 0, explanation: "Khi kể về người thân, cần miêu tả ngoại hình, tính cách và việc làm của người đó", difficulty: "medium" },
      { text: "Câu kết đoạn thường thể hiện điều gì?", choices: ["Giới thiệu nội dung mới", "Cảm nghĩ, tình cảm của người viết", "Không có tác dụng", "Luôn là một câu hỏi"], correctIndex: 1, explanation: "Câu kết đoạn thường bộc lộ cảm nghĩ của người viết về nội dung vừa kể", difficulty: "medium" },
      { text: "Khi viết đoạn văn, các câu trong đoạn cần như thế nào?", choices: ["Không liên quan đến nhau", "Liên kết chặt chẽ, cùng nói về một chủ đề", "Càng dài càng tốt", "Không cần dấu câu"], correctIndex: 1, explanation: "Các câu trong đoạn văn cần liên kết với nhau và cùng phục vụ một chủ đề chung", difficulty: "medium" },
      { text: "Đoạn văn kể về một sự việc nên sắp xếp theo trình tự nào?", choices: ["Trình tự thời gian diễn ra sự việc", "Ngẫu nhiên", "Từ kết quả về nguyên nhân luôn luôn", "Không cần trình tự"], correctIndex: 0, explanation: "Đoạn văn kể sự việc thường sắp xếp theo trình tự thời gian để dễ theo dõi", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện viết đoạn văn ngắn",
      content: "Một đoạn văn hoàn chỉnh gồm 3 phần: mở đoạn (giới thiệu nội dung), thân đoạn (triển khai chi tiết), kết đoạn (nêu cảm nghĩ).\nKhi viết, các câu cần liên kết chặt chẽ, cùng phục vụ một chủ đề, sắp xếp hợp lý theo trình tự thời gian hoặc logic.",
      examples: ["Mở đoạn: Giới thiệu về mẹ em.", "Thân đoạn: Miêu tả ngoại hình, tính cách, việc làm của mẹ.", "Kết đoạn: Nêu tình cảm của em dành cho mẹ."],
    },
  });

  // ===================== LỚP 4 =====================

  await add({
    title: "Góc và đường thẳng",
    description: "Nhận biết các loại góc (nhọn, vuông, tù, bẹt) và quan hệ giữa hai đường thẳng.",
    subject: toan, grade: lop4, chapterTitle: "Hình học nâng cao", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Góc vuông có số đo bằng bao nhiêu độ?", choices: ["45 độ", "90 độ", "180 độ", "60 độ"], correctIndex: 1, explanation: "Góc vuông có số đo bằng 90 độ", difficulty: "easy" },
      { text: "Góc nhọn có số đo như thế nào?", choices: ["Bằng 90 độ", "Lớn hơn 90 độ", "Nhỏ hơn 90 độ", "Bằng 180 độ"], correctIndex: 2, explanation: "Góc nhọn có số đo nhỏ hơn 90 độ", difficulty: "medium" },
      { text: "Góc tù có số đo như thế nào?", choices: ["Nhỏ hơn 90 độ", "Bằng 90 độ", "Lớn hơn 90 độ và nhỏ hơn 180 độ", "Bằng 180 độ"], correctIndex: 2, explanation: "Góc tù lớn hơn 90 độ và nhỏ hơn 180 độ", difficulty: "medium" },
      { text: "Hai đường thẳng vuông góc tạo với nhau góc bao nhiêu độ?", choices: ["45 độ", "60 độ", "90 độ", "180 độ"], correctIndex: 2, explanation: "Hai đường thẳng vuông góc tạo với nhau góc 90 độ", difficulty: "medium" },
      { text: "Hai đường thẳng song song có đặc điểm gì?", choices: ["Luôn cắt nhau", "Không bao giờ cắt nhau dù kéo dài", "Vuông góc với nhau", "Trùng nhau"], correctIndex: 1, explanation: "Hai đường thẳng song song không bao giờ cắt nhau dù kéo dài mãi", difficulty: "medium" },
      { text: "Góc bẹt có số đo bằng bao nhiêu độ?", choices: ["90 độ", "120 độ", "180 độ", "360 độ"], correctIndex: 2, explanation: "Góc bẹt có số đo bằng 180 độ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Góc và đường thẳng",
      content: "Các loại góc: góc nhọn (< 90°), góc vuông (= 90°), góc tù (90° đến 180°), góc bẹt (= 180°).\nHai đường thẳng vuông góc tạo thành 4 góc vuông tại giao điểm. Hai đường thẳng song song không bao giờ cắt nhau.",
      examples: ["Góc vuông = 90 độ", "Góc nhọn < 90 độ, góc tù > 90 độ", "Hai đường thẳng song song không cắt nhau"],
    },
  });

  await add({
    title: "Chu vi, diện tích hình chữ nhật nâng cao",
    description: "Vận dụng công thức tính chu vi, diện tích hình chữ nhật để giải bài toán thực tế.",
    subject: toan, grade: lop4, chapterTitle: "Hình học nâng cao", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Chu vi hình chữ nhật có chiều dài 8cm, chiều rộng 5cm là bao nhiêu?", choices: ["13cm", "26cm", "40cm", "20cm"], correctIndex: 1, explanation: "Chu vi = (dài + rộng) x 2 = (8+5) x 2 = 26cm", difficulty: "medium" },
      { text: "Diện tích hình chữ nhật trên (dài 8cm, rộng 5cm) là bao nhiêu?", choices: ["13cm²", "26cm²", "40cm²", "35cm²"], correctIndex: 2, explanation: "Diện tích = dài x rộng = 8 x 5 = 40cm²", difficulty: "medium" },
      { text: "Một sân hình chữ nhật có chu vi 60m, chiều dài 20m. Chiều rộng là bao nhiêu?", choices: ["8m", "10m", "12m", "15m"], correctIndex: 1, explanation: "Nửa chu vi = 30m, chiều rộng = 30 - 20 = 10m", difficulty: "hard" },
      { text: "Một mảnh đất hình vuông có chu vi 32m. Diện tích mảnh đất là bao nhiêu?", choices: ["48m²", "56m²", "64m²", "72m²"], correctIndex: 2, explanation: "Cạnh = 32 : 4 = 8m, diện tích = 8 x 8 = 64m²", difficulty: "hard" },
      { text: "Muốn tính chu vi hình chữ nhật, ta làm thế nào?", choices: ["(dài + rộng) x 2", "dài x rộng", "dài x rộng x 2", "dài + rộng"], correctIndex: 0, explanation: "Chu vi hình chữ nhật = (chiều dài + chiều rộng) x 2", difficulty: "medium" },
      { text: "Một khu vườn hình chữ nhật dài 15m, rộng 9m. Diện tích khu vườn là bao nhiêu?", choices: ["120m²", "125m²", "135m²", "140m²"], correctIndex: 2, explanation: "Diện tích = 15 x 9 = 135m²", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Chu vi, diện tích hình chữ nhật nâng cao",
      content: "Chu vi hình chữ nhật = (chiều dài + chiều rộng) x 2.\nDiện tích hình chữ nhật = chiều dài x chiều rộng.\nKhi biết chu vi và một cạnh, em có thể tìm cạnh còn lại bằng cách lấy nửa chu vi trừ đi cạnh đã biết.",
      examples: ["Chu vi = (8+5) x 2 = 26cm", "Diện tích = 8 x 5 = 40cm²", "Chu vi 60m, dài 20m → rộng = 30 - 20 = 10m"],
    },
  });

  await add({
    title: "So sánh phân số",
    description: "Học cách so sánh hai phân số cùng mẫu số và khác mẫu số.",
    subject: toan, grade: lop4, chapterTitle: "Phân số", chapterOrder: 4, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "So sánh 2/5 và 3/5, phân số nào lớn hơn?", choices: ["2/5", "3/5", "Bằng nhau", "Không so sánh được"], correctIndex: 1, explanation: "Hai phân số cùng mẫu, phân số nào có tử lớn hơn thì lớn hơn: 3/5 > 2/5", difficulty: "easy" },
      { text: "So sánh 1/2 và 1/3, phân số nào lớn hơn?", choices: ["1/2", "1/3", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "Cùng tử số, mẫu số nhỏ hơn thì phân số lớn hơn: 1/2 > 1/3", difficulty: "medium" },
      { text: "Phân số 3/4 so với 1 thì như thế nào?", choices: ["Lớn hơn 1", "Bằng 1", "Nhỏ hơn 1", "Không xác định"], correctIndex: 2, explanation: "Tử số nhỏ hơn mẫu số nên phân số nhỏ hơn 1", difficulty: "medium" },
      { text: "So sánh 2/3 và 3/4 (quy đồng mẫu số 12): phân số nào lớn hơn?", choices: ["2/3", "3/4", "Bằng nhau", "Không so sánh được"], correctIndex: 1, explanation: "2/3 = 8/12, 3/4 = 9/12, vậy 3/4 > 2/3", difficulty: "hard" },
      { text: "Phân số 5/5 bằng với số nào?", choices: ["0", "1", "5", "1/5"], correctIndex: 1, explanation: "Tử số bằng mẫu số thì phân số bằng 1: 5/5 = 1", difficulty: "medium" },
      { text: "Trong hai phân số cùng mẫu, phân số nào có tử số bé hơn thì như thế nào?", choices: ["Lớn hơn", "Bé hơn", "Bằng nhau", "Không xác định"], correctIndex: 1, explanation: "Cùng mẫu số, tử số bé hơn thì phân số bé hơn", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: So sánh phân số",
      content: "So sánh hai phân số cùng mẫu số: phân số nào có tử số lớn hơn thì lớn hơn.\nSo sánh hai phân số khác mẫu số: quy đồng mẫu số rồi so sánh tử số, hoặc so sánh với 1 nếu có thể.",
      examples: ["2/5 < 3/5 (cùng mẫu, so tử số)", "1/2 > 1/3 (cùng tử, mẫu nhỏ hơn thì phân số lớn hơn)", "2/3 = 8/12 và 3/4 = 9/12, nên 3/4 > 2/3"],
    },
  });

  await add({
    title: "Phép cộng, trừ phân số",
    description: "Học cách cộng, trừ hai phân số cùng mẫu số và khác mẫu số.",
    subject: toan, grade: lop4, chapterTitle: "Phân số", chapterOrder: 4, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "1/5 + 2/5 = ?", choices: ["2/5", "3/5", "3/10", "1/5"], correctIndex: 1, explanation: "Cộng hai phân số cùng mẫu: cộng tử số, giữ nguyên mẫu số: 1/5 + 2/5 = 3/5", difficulty: "easy" },
      { text: "4/7 - 1/7 = ?", choices: ["3/7", "5/7", "3/14", "4/7"], correctIndex: 0, explanation: "Trừ hai phân số cùng mẫu: 4/7 - 1/7 = 3/7", difficulty: "easy" },
      { text: "1/2 + 1/4 = ?", choices: ["2/6", "3/4", "1/6", "2/4"], correctIndex: 1, explanation: "Quy đồng: 1/2 = 2/4, vậy 2/4 + 1/4 = 3/4", difficulty: "medium" },
      { text: "2/3 - 1/6 = ?", choices: ["1/3", "1/2", "3/6", "1/6"], correctIndex: 1, explanation: "Quy đồng: 2/3 = 4/6, vậy 4/6 - 1/6 = 3/6 = 1/2", difficulty: "hard" },
      { text: "3/8 + 3/8 = ?", choices: ["6/8", "6/16", "3/8", "9/8"], correctIndex: 0, explanation: "3/8 + 3/8 = 6/8", difficulty: "easy" },
      { text: "5/6 - 1/3 = ?", choices: ["1/2", "4/6", "1/3", "2/3"], correctIndex: 0, explanation: "Quy đồng: 1/3 = 2/6, vậy 5/6 - 2/6 = 3/6 = 1/2", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Phép cộng, trừ phân số",
      content: "Cộng, trừ hai phân số cùng mẫu số: em cộng (hoặc trừ) tử số, giữ nguyên mẫu số.\nCộng, trừ hai phân số khác mẫu số: em quy đồng mẫu số trước, sau đó cộng (hoặc trừ) như phân số cùng mẫu.",
      examples: ["1/5 + 2/5 = 3/5 (cùng mẫu)", "1/2 + 1/4 = 2/4 + 1/4 = 3/4 (quy đồng trước)", "2/3 - 1/6 = 4/6 - 1/6 = 3/6 = 1/2"],
    },
  });

  await add({
    title: "Câu ghép cơ bản",
    description: "Nhận biết câu ghép và cách nối các vế câu ghép.",
    subject: tv, grade: lop4, chapterTitle: "Từ loại nâng cao", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Câu ghép là câu như thế nào?", choices: ["Chỉ có một vế câu", "Có từ hai vế câu trở lên, mỗi vế có đủ chủ ngữ, vị ngữ", "Không có chủ ngữ", "Chỉ có vị ngữ"], correctIndex: 1, explanation: "Câu ghép gồm hai vế câu trở lên, mỗi vế có cấu trúc chủ ngữ - vị ngữ riêng", difficulty: "medium" },
      { text: "Câu nào là câu ghép?", choices: ["Em học bài.", "Trời mưa nên đường trơn.", "Con mèo đẹp.", "Bố em là bác sĩ."], correctIndex: 1, explanation: "'Trời mưa nên đường trơn' có hai vế: 'Trời mưa' và 'đường trơn', nối bằng từ 'nên'", difficulty: "medium" },
      { text: "Từ nào thường dùng để nối các vế trong câu ghép?", choices: ["và, nhưng, vì, nên", "rất, quá", "đã, đang, sẽ", "ở, trong, trên"], correctIndex: 0, explanation: "Các từ nối câu ghép thường gặp: và, nhưng, vì, nên, hoặc, hay", difficulty: "medium" },
      { text: "Câu 'Vì trời mưa to nên em nghỉ học.' có mấy vế câu?", choices: ["1 vế", "2 vế", "3 vế", "4 vế"], correctIndex: 1, explanation: "Câu có 2 vế: 'trời mưa to' và 'em nghỉ học', nối bằng cặp từ 'vì...nên'", difficulty: "medium" },
      { text: "Cặp quan hệ từ nào thể hiện quan hệ nguyên nhân - kết quả?", choices: ["tuy...nhưng", "vì...nên", "nếu...thì", "không những...mà còn"], correctIndex: 1, explanation: "'vì...nên' thể hiện quan hệ nguyên nhân - kết quả", difficulty: "hard" },
      { text: "Câu 'Tuy nhà xa nhưng em vẫn đi học đúng giờ.' thể hiện quan hệ gì giữa hai vế?", choices: ["Nguyên nhân - kết quả", "Tương phản", "Điều kiện - kết quả", "Đồng thời"], correctIndex: 1, explanation: "Cặp từ 'tuy...nhưng' thể hiện quan hệ tương phản giữa hai vế câu", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Câu ghép cơ bản",
      content: "Câu ghép là câu do hai hoặc nhiều vế câu ghép lại, mỗi vế có đủ chủ ngữ và vị ngữ riêng.\nCác vế câu ghép thường nối với nhau bằng quan hệ từ (và, nhưng, vì, nên) hoặc cặp quan hệ từ (vì...nên, tuy...nhưng, nếu...thì).",
      examples: ["Trời mưa nên đường trơn.", "Vì em chăm học nên em đạt điểm cao.", "Tuy khó nhưng em vẫn cố gắng."],
    },
  });

  await add({
    title: "Trạng ngữ trong câu",
    description: "Nhận biết trạng ngữ chỉ thời gian, nơi chốn, nguyên nhân trong câu.",
    subject: tv, grade: lop4, chapterTitle: "Từ loại nâng cao", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Trạng ngữ là thành phần dùng để làm gì?", choices: ["Là chủ ngữ chính của câu", "Bổ sung thông tin về thời gian, nơi chốn, nguyên nhân... cho câu", "Là vị ngữ của câu", "Không có tác dụng gì"], correctIndex: 1, explanation: "Trạng ngữ bổ sung ý nghĩa về thời gian, nơi chốn, nguyên nhân, mục đích... cho câu", difficulty: "medium" },
      { text: "Trong câu 'Sáng nay, em đi học sớm.', đâu là trạng ngữ?", choices: ["Sáng nay", "em", "đi học", "sớm"], correctIndex: 0, explanation: "'Sáng nay' là trạng ngữ chỉ thời gian", difficulty: "easy" },
      { text: "Trong câu 'Ở sân trường, các bạn đang chơi đá cầu.', đâu là trạng ngữ?", choices: ["Ở sân trường", "các bạn", "đang chơi", "đá cầu"], correctIndex: 0, explanation: "'Ở sân trường' là trạng ngữ chỉ nơi chốn", difficulty: "medium" },
      { text: "Trong câu 'Vì trời lạnh, em mặc thêm áo ấm.', đâu là trạng ngữ?", choices: ["Vì trời lạnh", "em", "mặc thêm", "áo ấm"], correctIndex: 0, explanation: "'Vì trời lạnh' là trạng ngữ chỉ nguyên nhân", difficulty: "medium" },
      { text: "Trạng ngữ thường đứng ở vị trí nào trong câu?", choices: ["Chỉ đứng đầu câu", "Đầu câu, giữa câu hoặc cuối câu", "Chỉ đứng cuối câu", "Không có vị trí cố định, luôn ở giữa"], correctIndex: 1, explanation: "Trạng ngữ có thể đứng ở đầu, giữa hoặc cuối câu tùy cách diễn đạt", difficulty: "hard" },
      { text: "Dấu câu nào thường dùng để ngăn cách trạng ngữ đứng đầu câu với phần còn lại?", choices: ["Dấu chấm", "Dấu phẩy", "Dấu hai chấm", "Dấu chấm than"], correctIndex: 1, explanation: "Dấu phẩy thường dùng để ngăn cách trạng ngữ đầu câu với phần còn lại của câu", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Trạng ngữ trong câu",
      content: "Trạng ngữ là thành phần phụ của câu, bổ sung ý nghĩa về thời gian, nơi chốn, nguyên nhân, mục đích, phương tiện cho câu.\nTrạng ngữ thường đứng đầu câu và được ngăn cách với phần còn lại bằng dấu phẩy.",
      examples: ["Sáng nay, em đi học sớm. (trạng ngữ chỉ thời gian)", "Ở sân trường, các bạn chơi đùa. (trạng ngữ chỉ nơi chốn)", "Vì trời lạnh, em mặc áo ấm. (trạng ngữ chỉ nguyên nhân)"],
    },
  });

  await add({
    title: "Chủ ngữ, vị ngữ trong câu",
    description: "Xác định chủ ngữ và vị ngữ trong các kiểu câu đơn và câu ghép.",
    subject: tv, grade: lop4, chapterTitle: "Câu trong tiếng Việt", chapterOrder: 3, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "Chủ ngữ là thành phần trả lời cho câu hỏi nào?", choices: ["Làm gì?", "Ai? Cái gì? Con gì?", "Như thế nào?", "Ở đâu?"], correctIndex: 1, explanation: "Chủ ngữ trả lời cho câu hỏi Ai? Cái gì? Con gì?", difficulty: "medium" },
      { text: "Vị ngữ là thành phần trả lời cho câu hỏi nào?", choices: ["Ai?", "Làm gì? Thế nào? Là gì?", "Ở đâu?", "Khi nào?"], correctIndex: 1, explanation: "Vị ngữ trả lời cho câu hỏi Làm gì? Thế nào? Là gì?", difficulty: "medium" },
      { text: "Trong câu 'Bạn Lan học rất giỏi.', đâu là chủ ngữ?", choices: ["Bạn Lan", "học", "rất giỏi", "giỏi"], correctIndex: 0, explanation: "'Bạn Lan' là chủ ngữ, trả lời cho câu hỏi Ai?", difficulty: "easy" },
      { text: "Trong câu trên, đâu là vị ngữ?", choices: ["Bạn Lan", "học rất giỏi", "rất", "giỏi"], correctIndex: 1, explanation: "'học rất giỏi' là vị ngữ, trả lời cho câu hỏi Thế nào?", difficulty: "medium" },
      { text: "Câu 'Đàn chim bay về tổ.' có chủ ngữ là gì?", choices: ["Đàn chim", "bay", "về tổ", "tổ"], correctIndex: 0, explanation: "'Đàn chim' là chủ ngữ của câu", difficulty: "easy" },
      { text: "Một câu đơn cần có tối thiểu mấy thành phần chính?", choices: ["1 (chỉ chủ ngữ)", "1 (chỉ vị ngữ)", "2 (chủ ngữ và vị ngữ)", "3"], correctIndex: 2, explanation: "Một câu đơn hoàn chỉnh cần có đủ chủ ngữ và vị ngữ", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Chủ ngữ, vị ngữ trong câu",
      content: "Chủ ngữ là thành phần nêu người, sự vật được nói đến trong câu, trả lời câu hỏi Ai? Cái gì? Con gì?\nVị ngữ là thành phần nêu hoạt động, trạng thái, đặc điểm của chủ ngữ, trả lời câu hỏi Làm gì? Thế nào? Là gì?",
      examples: ["Bạn Lan (chủ ngữ) / học rất giỏi (vị ngữ)", "Đàn chim (chủ ngữ) / bay về tổ (vị ngữ)", "Em (chủ ngữ) / là học sinh lớp 4 (vị ngữ)"],
    },
  });

  await add({
    title: "Dấu câu trong đoạn văn",
    description: "Ôn tập cách sử dụng các dấu câu: dấu chấm, dấu phẩy, dấu hai chấm, dấu ngoặc kép.",
    subject: tv, grade: lop4, chapterTitle: "Câu trong tiếng Việt", chapterOrder: 3, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "Dấu chấm dùng để làm gì?", choices: ["Kết thúc câu kể", "Ngăn cách các bộ phận trong câu", "Đánh dấu lời nói trực tiếp", "Liệt kê các ý"], correctIndex: 0, explanation: "Dấu chấm dùng để kết thúc câu kể", difficulty: "easy" },
      { text: "Dấu phẩy dùng để làm gì?", choices: ["Kết thúc câu", "Ngăn cách các bộ phận cùng chức năng trong câu", "Chỉ dùng trong câu hỏi", "Không có tác dụng"], correctIndex: 1, explanation: "Dấu phẩy ngăn cách các từ ngữ, bộ phận có cùng chức năng trong câu (liệt kê, trạng ngữ...)", difficulty: "medium" },
      { text: "Dấu hai chấm thường dùng khi nào?", choices: ["Trước lời giải thích, liệt kê hoặc lời nói trực tiếp", "Kết thúc câu cảm", "Chỉ dùng trong câu hỏi", "Không có quy tắc"], correctIndex: 0, explanation: "Dấu hai chấm dùng để báo hiệu phần giải thích, liệt kê, hoặc lời nói trực tiếp", difficulty: "medium" },
      { text: "Dấu ngoặc kép dùng để làm gì?", choices: ["Đánh dấu lời nói trực tiếp hoặc từ ngữ được nhấn mạnh", "Kết thúc đoạn văn", "Ngăn cách các câu", "Chỉ dùng cho số liệu"], correctIndex: 0, explanation: "Dấu ngoặc kép dùng để đánh dấu lời nói trực tiếp hoặc từ ngữ cần nhấn mạnh, trích dẫn", difficulty: "medium" },
      { text: "Câu 'Mẹ dặn: \"Con nhớ học bài nhé!\"' sử dụng những dấu câu nào?", choices: ["Dấu chấm, dấu phẩy", "Dấu hai chấm, dấu ngoặc kép, dấu chấm than", "Chỉ dấu chấm", "Dấu hỏi chấm"], correctIndex: 1, explanation: "Câu này dùng dấu hai chấm để báo hiệu lời nói, dấu ngoặc kép để đánh dấu lời nói trực tiếp, và dấu chấm than để kết thúc", difficulty: "hard" },
      { text: "Khi liệt kê nhiều sự vật trong câu, ta thường dùng dấu gì để ngăn cách?", choices: ["Dấu chấm", "Dấu phẩy", "Dấu chấm than", "Dấu ngoặc đơn"], correctIndex: 1, explanation: "Dấu phẩy dùng để ngăn cách các sự vật khi liệt kê trong câu", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Dấu câu trong đoạn văn",
      content: "Dấu chấm (.) kết thúc câu kể. Dấu phẩy (,) ngăn cách các bộ phận cùng chức năng. Dấu hai chấm (:) báo hiệu phần giải thích, liệt kê hoặc lời nói trực tiếp. Dấu ngoặc kép (\" \") đánh dấu lời nói trực tiếp hoặc từ ngữ nhấn mạnh.",
      examples: ["Em thích đọc sách, vẽ tranh và chơi đàn. (dấu phẩy liệt kê)", "Mẹ dặn: \"Con nhớ học bài nhé!\" (dấu hai chấm + ngoặc kép)", "Hôm nay trời đẹp. (dấu chấm kết thúc câu)"],
    },
  });

  // ===================== LỚP 5 =====================

  await add({
    title: "Tìm tỉ số phần trăm của hai số",
    description: "Học cách tính tỉ số phần trăm giữa hai số cho trước.",
    subject: toan, grade: lop5, chapterTitle: "Tỉ số phần trăm", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Tỉ số phần trăm của 25 và 100 là bao nhiêu?", choices: ["2.5%", "25%", "250%", "0.25%"], correctIndex: 1, explanation: "25 : 100 = 0.25 = 25%", difficulty: "easy" },
      { text: "Tỉ số phần trăm của 3 và 4 là bao nhiêu?", choices: ["25%", "50%", "75%", "34%"], correctIndex: 2, explanation: "3 : 4 = 0.75 = 75%", difficulty: "medium" },
      { text: "Một lớp có 40 học sinh, trong đó có 20 học sinh nam. Tỉ số phần trăm học sinh nam là bao nhiêu?", choices: ["20%", "40%", "50%", "60%"], correctIndex: 2, explanation: "20 : 40 = 0.5 = 50%", difficulty: "medium" },
      { text: "Muốn tìm tỉ số phần trăm của số A so với số B, ta làm thế nào?", choices: ["A : B rồi nhân 100 và viết ký hiệu %", "A x B", "A + B", "B : A"], correctIndex: 0, explanation: "Tỉ số phần trăm = (A : B) x 100%", difficulty: "medium" },
      { text: "Tỉ số phần trăm của 1 và 2 là bao nhiêu?", choices: ["20%", "50%", "12%", "100%"], correctIndex: 1, explanation: "1 : 2 = 0.5 = 50%", difficulty: "easy" },
      { text: "Trong vườn có 50 cây, trong đó 15 cây bị sâu bệnh. Tỉ số phần trăm cây bị sâu bệnh là bao nhiêu?", choices: ["15%", "20%", "30%", "35%"], correctIndex: 2, explanation: "15 : 50 = 0.3 = 30%", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Tìm tỉ số phần trăm của hai số",
      content: "Muốn tìm tỉ số phần trăm của số A so với số B, em lấy A chia cho B rồi nhân với 100, sau đó viết thêm ký hiệu %.\nCông thức: Tỉ số phần trăm = (A : B) x 100%.",
      examples: ["25 và 100: 25:100 x 100% = 25%", "20 nam trong 40 học sinh: 20:40 x 100% = 50%", "15 trong 50 cây: 15:50 x 100% = 30%"],
    },
  });

  await add({
    title: "Bài toán về tỉ số phần trăm",
    description: "Vận dụng tỉ số phần trăm để giải các bài toán thực tế.",
    subject: toan, grade: lop5, chapterTitle: "Tỉ số phần trăm", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Một cửa hàng giảm giá 20% cho món hàng 100.000đ. Giá sau giảm là bao nhiêu?", choices: ["70.000đ", "80.000đ", "90.000đ", "60.000đ"], correctIndex: 1, explanation: "Số tiền giảm = 100.000 x 20% = 20.000đ. Giá sau giảm = 100.000 - 20.000 = 80.000đ", difficulty: "medium" },
      { text: "Lớp có 30 học sinh, 60% là học sinh giỏi. Hỏi có bao nhiêu học sinh giỏi?", choices: ["12", "15", "18", "20"], correctIndex: 2, explanation: "30 x 60% = 30 x 0.6 = 18 học sinh", difficulty: "medium" },
      { text: "Một kho có 200kg gạo, đã bán 25% số gạo. Hỏi đã bán bao nhiêu kg?", choices: ["40kg", "50kg", "60kg", "75kg"], correctIndex: 1, explanation: "200 x 25% = 200 x 0.25 = 50kg", difficulty: "medium" },
      { text: "Số học sinh nam chiếm 45% của lớp 40 học sinh. Số học sinh nam là bao nhiêu?", choices: ["16", "18", "20", "22"], correctIndex: 1, explanation: "40 x 45% = 40 x 0.45 = 18 học sinh", difficulty: "hard" },
      { text: "Giá một chiếc áo là 200.000đ, sau khi tăng giá 10% thì giá mới là bao nhiêu?", choices: ["210.000đ", "220.000đ", "215.000đ", "225.000đ"], correctIndex: 1, explanation: "Số tiền tăng = 200.000 x 10% = 20.000đ. Giá mới = 200.000 + 20.000 = 220.000đ", difficulty: "hard" },
      { text: "75% của 80 là bao nhiêu?", choices: ["50", "55", "60", "65"], correctIndex: 2, explanation: "80 x 75% = 80 x 0.75 = 60", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Bài toán về tỉ số phần trăm",
      content: "Muốn tìm giá trị phần trăm của một số, em lấy số đó nhân với tỉ số phần trăm (đổi % thành số thập phân bằng cách chia cho 100).\nKhi tính giá sau khi tăng/giảm giá, em tính số tiền tăng/giảm trước, sau đó cộng hoặc trừ vào giá ban đầu.",
      examples: ["30 học sinh, 60% giỏi: 30 x 0.6 = 18 học sinh giỏi", "Giảm giá 20% từ 100.000đ: giảm 20.000đ, còn 80.000đ", "75% của 80 = 80 x 0.75 = 60"],
    },
  });

  await add({
    title: "So sánh số thập phân",
    description: "Học cách so sánh hai số thập phân dựa vào phần nguyên và phần thập phân.",
    subject: toan, grade: lop5, chapterTitle: "Số thập phân", chapterOrder: 3, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "So sánh 3.5 và 3.8, số nào lớn hơn?", choices: ["3.5", "3.8", "Bằng nhau", "Không so sánh được"], correctIndex: 1, explanation: "Phần nguyên bằng nhau (3), so phần thập phân: 8 > 5, vậy 3.8 > 3.5", difficulty: "easy" },
      { text: "So sánh 4.2 và 3.9, số nào lớn hơn?", choices: ["4.2", "3.9", "Bằng nhau", "Không so sánh được"], correctIndex: 0, explanation: "Phần nguyên 4 > 3, vậy 4.2 > 3.9", difficulty: "easy" },
      { text: "So sánh 5.60 và 5.6, kết quả là gì?", choices: ["5.60 lớn hơn", "5.6 lớn hơn", "Bằng nhau", "Không so sánh được"], correctIndex: 2, explanation: "5.60 = 5.6 vì thêm số 0 vào cuối phần thập phân không làm thay đổi giá trị", difficulty: "medium" },
      { text: "So sánh 2.35 và 2.53, số nào lớn hơn?", choices: ["2.35", "2.53", "Bằng nhau", "Không so sánh được"], correctIndex: 1, explanation: "Phần nguyên bằng nhau, hàng phần mười: 5 > 3, vậy 2.53 > 2.35", difficulty: "medium" },
      { text: "Số nào lớn nhất trong các số: 1.9, 1.09, 1.99, 1.19?", choices: ["1.9", "1.09", "1.99", "1.19"], correctIndex: 2, explanation: "1.99 có hàng phần mười là 9, lớn nhất trong nhóm", difficulty: "hard" },
      { text: "Sắp xếp theo thứ tự tăng dần: 0.8, 0.08, 0.88. Số đứng đầu là số nào?", choices: ["0.8", "0.08", "0.88", "Không xác định"], correctIndex: 1, explanation: "0.08 < 0.8 < 0.88, vậy số bé nhất đứng đầu là 0.08", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: So sánh số thập phân",
      content: "Muốn so sánh hai số thập phân, trước tiên so sánh phần nguyên. Nếu phần nguyên bằng nhau thì so sánh lần lượt từng hàng của phần thập phân (hàng phần mười, phần trăm...).\nLưu ý: thêm hoặc bớt số 0 ở cuối phần thập phân không làm thay đổi giá trị của số.",
      examples: ["3.8 > 3.5 (phần nguyên bằng, so hàng phần mười)", "5.60 = 5.6", "1.99 > 1.9 > 1.19 > 1.09"],
    },
  });

  await add({
    title: "Phép cộng, trừ số thập phân",
    description: "Học cách đặt tính và tính cộng, trừ hai số thập phân.",
    subject: toan, grade: lop5, chapterTitle: "Số thập phân", chapterOrder: 3, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "1.5 + 2.3 = ?", choices: ["3.7", "3.8", "3.9", "4.8"], correctIndex: 1, explanation: "1.5 + 2.3 = 3.8", difficulty: "easy" },
      { text: "5.6 - 2.1 = ?", choices: ["3.4", "3.5", "3.6", "3.7"], correctIndex: 1, explanation: "5.6 - 2.1 = 3.5", difficulty: "easy" },
      { text: "3.25 + 1.75 = ?", choices: ["4.5", "5", "4.9", "5.1"], correctIndex: 1, explanation: "3.25 + 1.75 = 5.00 = 5", difficulty: "medium" },
      { text: "7.4 - 3.65 = ?", choices: ["3.65", "3.75", "3.85", "4.05"], correctIndex: 1, explanation: "7.4 - 3.65 = 7.40 - 3.65 = 3.75", difficulty: "hard" },
      { text: "Một bao gạo nặng 25.5kg, sau khi lấy ra 8.2kg thì còn lại bao nhiêu kg?", choices: ["17.1kg", "17.3kg", "17.5kg", "16.3kg"], correctIndex: 1, explanation: "25.5 - 8.2 = 17.3kg", difficulty: "medium" },
      { text: "0.75 + 0.25 = ?", choices: ["0.9", "1", "1.1", "0.1"], correctIndex: 1, explanation: "0.75 + 0.25 = 1.00 = 1", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Phép cộng, trừ số thập phân",
      content: "Muốn cộng (trừ) hai số thập phân, em đặt tính sao cho các dấu phẩy thẳng cột với nhau, rồi cộng (trừ) như số tự nhiên, cuối cùng đặt dấu phẩy vào kết quả thẳng với các dấu phẩy đã cho.",
      examples: ["1.5 + 2.3 = 3.8", "5.6 - 2.1 = 3.5", "25.5 - 8.2 = 17.3"],
    },
  });

  await add({
    title: "Liên kết câu trong đoạn văn",
    description: "Nhận biết các phép liên kết câu: lặp từ ngữ, thay thế từ ngữ, dùng từ nối.",
    subject: tv, grade: lop5, chapterTitle: "Từ loại nâng cao lớp 5", chapterOrder: 2, semester: 1, order: 2, isTrial: true,
    questions: [
      { text: "Liên kết câu trong đoạn văn có tác dụng gì?", choices: ["Làm đoạn văn rời rạc", "Giúp các câu trong đoạn gắn kết, mạch lạc với nhau", "Không có tác dụng gì", "Chỉ để đoạn văn dài hơn"], correctIndex: 1, explanation: "Liên kết câu giúp các câu trong đoạn văn gắn kết chặt chẽ, mạch lạc", difficulty: "medium" },
      { text: "Phép lặp từ ngữ là gì?", choices: ["Lặp lại một từ ngữ ở câu sau để liên kết với câu trước", "Không dùng từ nào lặp lại", "Chỉ dùng trong thơ", "Thay đổi hoàn toàn từ ngữ"], correctIndex: 0, explanation: "Phép lặp từ ngữ là lặp lại từ ngữ đã xuất hiện ở câu trước để tạo liên kết", difficulty: "medium" },
      { text: "Trong đoạn 'Lan là học sinh giỏi. Bạn ấy luôn giúp đỡ mọi người.', từ 'Bạn ấy' thay thế cho từ nào?", choices: ["giỏi", "học sinh", "Lan", "mọi người"], correctIndex: 2, explanation: "'Bạn ấy' thay thế cho 'Lan' — đây là phép thế", difficulty: "medium" },
      { text: "Từ nào thường dùng để nối ý giữa các câu?", choices: ["vì vậy, tuy nhiên, ngoài ra", "rất, quá", "đã, đang", "ở, trong"], correctIndex: 0, explanation: "'vì vậy, tuy nhiên, ngoài ra' là các từ nối thường dùng để liên kết ý giữa các câu", difficulty: "medium" },
      { text: "Phép thế trong liên kết câu là gì?", choices: ["Lặp lại nguyên từ ngữ cũ", "Dùng từ ngữ khác thay thế cho từ ngữ đã dùng ở câu trước để tránh lặp", "Xóa bỏ từ ngữ trước đó", "Không có quy tắc"], correctIndex: 1, explanation: "Phép thế dùng đại từ hoặc từ ngữ khác thay thế để tránh lặp từ, đồng thời tạo liên kết", difficulty: "hard" },
      { text: "Câu 'Trời mưa to. Vì vậy, các bạn phải nghỉ học.' sử dụng phép liên kết nào?", choices: ["Phép lặp", "Phép thế", "Dùng từ nối", "Không có liên kết"], correctIndex: 2, explanation: "'Vì vậy' là từ nối thể hiện quan hệ kết quả với câu trước", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Liên kết câu trong đoạn văn",
      content: "Có 3 phép liên kết câu thường dùng: phép lặp (lặp lại từ ngữ), phép thế (dùng từ khác thay thế để tránh lặp), và dùng từ nối (vì vậy, tuy nhiên, ngoài ra...) để thể hiện quan hệ giữa các câu.",
      examples: ["Phép lặp: Lan học giỏi. Lan luôn chăm chỉ.", "Phép thế: Lan học giỏi. Bạn ấy luôn chăm chỉ.", "Từ nối: Trời mưa to. Vì vậy, lớp nghỉ học."],
    },
  });

  await add({
    title: "Từ Hán Việt thông dụng",
    description: "Làm quen với một số từ Hán Việt thông dụng và cách sử dụng phù hợp.",
    subject: tv, grade: lop5, chapterTitle: "Từ loại nâng cao lớp 5", chapterOrder: 2, semester: 1, order: 3, isTrial: false,
    questions: [
      { text: "Từ Hán Việt là gì?", choices: ["Từ thuần Việt", "Từ mượn từ tiếng Hán, đã được Việt hóa", "Từ mượn từ tiếng Anh", "Từ địa phương"], correctIndex: 1, explanation: "Từ Hán Việt là từ mượn từ tiếng Hán, đã được đọc và sử dụng theo cách của người Việt", difficulty: "medium" },
      { text: "Từ nào là từ Hán Việt?", choices: ["ăn", "quốc gia", "đi", "nhà"], correctIndex: 1, explanation: "'quốc gia' là từ Hán Việt (quốc = nước, gia = nhà)", difficulty: "medium" },
      { text: "Từ 'phụ huynh' có nghĩa là gì?", choices: ["Học sinh", "Cha mẹ, người giám hộ của học sinh", "Thầy cô giáo", "Bạn học"], correctIndex: 1, explanation: "'phụ huynh' nghĩa là cha mẹ, người giám hộ của học sinh", difficulty: "medium" },
      { text: "Từ nào KHÔNG phải từ Hán Việt: học sinh, giáo viên, đi học, quốc gia?", choices: ["học sinh", "giáo viên", "đi học", "quốc gia"], correctIndex: 2, explanation: "'đi học' là từ thuần Việt, các từ còn lại đều là từ Hán Việt", difficulty: "hard" },
      { text: "Từ Hán Việt thường mang sắc thái như thế nào so với từ thuần Việt tương đương?", choices: ["Thân mật, suồng sã hơn", "Trang trọng, lịch sự hơn", "Không khác gì", "Khó hiểu hơn và không nên dùng"], correctIndex: 1, explanation: "Từ Hán Việt thường mang sắc thái trang trọng hơn so với từ thuần Việt cùng nghĩa", difficulty: "hard" },
      { text: "Từ 'phụ nữ' trong tiếng Việt tương đương với từ thuần Việt nào?", choices: ["đàn ông", "trẻ em", "đàn bà", "người già"], correctIndex: 2, explanation: "'phụ nữ' (Hán Việt) tương đương với 'đàn bà' (thuần Việt)", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Từ Hán Việt thông dụng",
      content: "Từ Hán Việt là những từ tiếng Việt có nguồn gốc từ tiếng Hán, được người Việt sử dụng theo cách đọc riêng (âm Hán Việt). Từ Hán Việt thường mang sắc thái trang trọng, lịch sự.\nVí dụ: quốc gia (nước), phụ huynh (cha mẹ), giáo viên (thầy cô), học sinh (người đi học).",
      examples: ["quốc gia = nước", "phụ huynh = cha mẹ", "giáo viên = thầy cô"],
    },
  });

  await add({
    title: "Biện pháp tu từ: Điệp ngữ",
    description: "Nhận biết biện pháp điệp ngữ và tác dụng nhấn mạnh trong câu văn, câu thơ.",
    subject: tv, grade: lop5, chapterTitle: "Biện pháp tu từ", chapterOrder: 4, semester: 2, order: 2, isTrial: true,
    questions: [
      { text: "Điệp ngữ là gì?", choices: ["Lặp lại một từ ngữ nhiều lần để nhấn mạnh", "So sánh hai sự vật", "Nhân hóa sự vật", "Nói giảm nói tránh"], correctIndex: 0, explanation: "Điệp ngữ là biện pháp lặp lại từ ngữ nhằm nhấn mạnh ý, tạo nhịp điệu cho câu văn/thơ", difficulty: "medium" },
      { text: "Câu 'Học, học nữa, học mãi.' sử dụng biện pháp gì?", choices: ["So sánh", "Nhân hóa", "Điệp ngữ", "Ẩn dụ"], correctIndex: 2, explanation: "Từ 'học' được lặp lại 3 lần — đây là biện pháp điệp ngữ nhấn mạnh tinh thần học tập", difficulty: "easy" },
      { text: "Tác dụng chính của điệp ngữ là gì?", choices: ["Làm câu văn ngắn gọn hơn", "Nhấn mạnh ý, tạo nhịp điệu, cảm xúc", "Làm câu khó hiểu hơn", "Không có tác dụng gì"], correctIndex: 1, explanation: "Điệp ngữ giúp nhấn mạnh ý muốn diễn đạt và tạo nhịp điệu, cảm xúc cho câu văn", difficulty: "medium" },
      { text: "Câu nào sử dụng điệp ngữ?", choices: ["Trăng tròn như đĩa.", "Cây tre Việt Nam, cây tre xanh, nhũn nhặn, ngay thẳng.", "Mẹ em rất hiền.", "Con mèo đang ngủ."], correctIndex: 1, explanation: "Từ 'cây tre' được lặp lại để nhấn mạnh hình ảnh cây tre", difficulty: "medium" },
      { text: "Điệp ngữ khác với việc lặp từ do vô ý ở điểm nào?", choices: ["Không khác nhau", "Điệp ngữ là lặp lại có chủ đích nghệ thuật, còn lặp từ vô ý là lỗi diễn đạt", "Điệp ngữ luôn sai ngữ pháp", "Lặp từ vô ý mới đúng"], correctIndex: 1, explanation: "Điệp ngữ là biện pháp nghệ thuật có chủ đích, khác với lỗi lặp từ không mong muốn khi viết văn", difficulty: "hard" },
      { text: "Trong câu thơ 'Đoàn kết, đoàn kết, đại đoàn kết', từ nào được điệp lại?", choices: ["đại", "đoàn kết", "Không có từ nào lặp", "kết"], correctIndex: 1, explanation: "Từ 'đoàn kết' được lặp lại nhiều lần để nhấn mạnh tinh thần đoàn kết", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Biện pháp tu từ Điệp ngữ",
      content: "Điệp ngữ là biện pháp lặp đi lặp lại một từ ngữ (hoặc cả câu) nhằm nhấn mạnh ý, tạo nhịp điệu và cảm xúc cho câu văn, câu thơ.\nĐiệp ngữ khác với lỗi lặp từ vô ý — đây là biện pháp nghệ thuật được sử dụng có chủ đích.",
      examples: ["Học, học nữa, học mãi.", "Đoàn kết, đoàn kết, đại đoàn kết.", "Cây tre Việt Nam, cây tre xanh."],
    },
  });

  await add({
    title: "Luyện viết bài văn miêu tả ngắn",
    description: "Luyện kỹ năng viết bài văn miêu tả ngắn về cảnh vật hoặc con người quen thuộc.",
    subject: tv, grade: lop5, chapterTitle: "Biện pháp tu từ", chapterOrder: 4, semester: 2, order: 3, isTrial: false,
    questions: [
      { text: "Một bài văn miêu tả thường có bố cục mấy phần?", choices: ["1 phần", "2 phần", "3 phần: mở bài, thân bài, kết bài", "Không có bố cục cố định"], correctIndex: 2, explanation: "Bài văn miêu tả thường có 3 phần: mở bài, thân bài, kết bài", difficulty: "medium" },
      { text: "Phần mở bài của bài văn miêu tả thường làm gì?", choices: ["Kết luận vấn đề", "Giới thiệu đối tượng được miêu tả", "Liệt kê chi tiết nhỏ nhất", "Không cần thiết"], correctIndex: 1, explanation: "Mở bài giới thiệu khái quát về đối tượng sẽ được miêu tả", difficulty: "medium" },
      { text: "Khi miêu tả một cảnh đẹp, em nên miêu tả theo trình tự nào?", choices: ["Ngẫu nhiên, không theo thứ tự", "Từ bao quát đến chi tiết, hoặc theo trình tự không gian/thời gian", "Chỉ miêu tả một chi tiết duy nhất", "Không cần trình tự"], correctIndex: 1, explanation: "Miêu tả cảnh vật nên đi từ bao quát đến chi tiết hoặc theo trình tự không gian, thời gian hợp lý", difficulty: "medium" },
      { text: "Để bài văn miêu tả sinh động, em nên sử dụng biện pháp nào?", choices: ["Không cần biện pháp gì", "So sánh, nhân hóa để tăng sức gợi hình, gợi cảm", "Chỉ liệt kê số liệu khô khan", "Viết càng ngắn càng tốt"], correctIndex: 1, explanation: "Sử dụng so sánh, nhân hóa giúp bài văn miêu tả sinh động, giàu hình ảnh hơn", difficulty: "medium" },
      { text: "Phần kết bài của bài văn miêu tả thường nêu điều gì?", choices: ["Giới thiệu đối tượng mới", "Cảm nghĩ của người viết về đối tượng được miêu tả", "Không cần viết kết bài", "Một câu hỏi bất kỳ"], correctIndex: 1, explanation: "Kết bài thường nêu cảm nghĩ, tình cảm của người viết đối với đối tượng đã miêu tả", difficulty: "medium" },
      { text: "Khi miêu tả một người thân, em nên chú ý miêu tả những đặc điểm nào?", choices: ["Chỉ tên tuổi", "Ngoại hình, tính cách, hoạt động thường ngày", "Chỉ nơi ở", "Không cần miêu tả gì cụ thể"], correctIndex: 1, explanation: "Miêu tả người cần chú ý đến ngoại hình, tính cách và những hoạt động thường ngày đặc trưng", difficulty: "medium" },
    ],
    review: {
      title: "Kiến thức: Luyện viết bài văn miêu tả ngắn",
      content: "Bài văn miêu tả gồm 3 phần: mở bài (giới thiệu đối tượng), thân bài (miêu tả chi tiết theo trình tự hợp lý, có sử dụng so sánh, nhân hóa), kết bài (nêu cảm nghĩ).\nMiêu tả cảnh vật nên đi từ bao quát đến chi tiết; miêu tả người nên chú ý ngoại hình, tính cách, hoạt động.",
      examples: ["Mở bài: Giới thiệu cảnh biển quê em.", "Thân bài: Miêu tả bãi cát, sóng biển, bầu trời (dùng so sánh, nhân hóa).", "Kết bài: Nêu tình cảm yêu mến quê hương."],
    },
  });

  console.log(`[expandLop2to5] Hoàn tất: đã thêm ${count} chủ điểm mới cho Lớp 2-5.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
