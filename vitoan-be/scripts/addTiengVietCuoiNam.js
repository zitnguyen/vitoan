// Bổ sung chương "Ôn tập cuối năm (Tiếng Việt)" — Tiếng Việt trước đó chỉ có mốc
// ôn tập giữa học kỳ 2, thiếu mốc tổng kết cuối năm (không đối xứng với Toán,
// vốn đã có "Ôn tập cuối năm"). Nội dung tự biên soạn theo cấu trúc chủ đề
// công khai của chương trình GDPT 2018, không sao chép từ SGK.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

async function setChapterOrder(title, subject, grade, order, semester) {
  return Chapter.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, subject: subject._id, grade: grade._id, order, semester },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

async function addLesson({ title, description, subject, grade, chapterTitle, order, questions, review }) {
  const chapter = await Chapter.findOne({ title: chapterTitle, subject: subject._id, grade: grade._id });
  if (!chapter) throw new Error(`Không tìm thấy chương: ${chapterTitle}`);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true, isTrial: false },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const existingCount = await Question.countDocuments({ lesson: lesson._id });
  if (existingCount === 0) {
    await Question.insertMany(questions.map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
  }
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { lesson: lesson._id, ...review },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  return lesson;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[addTiengVietCuoiNam] Đã kết nối MongoDB");

  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  await setChapterOrder("Ôn tập cuối năm (Tiếng Việt)", tv, lop1, 12, 2);

  await addLesson({
    title: "Ôn tập tổng hợp âm, vần, từ và câu",
    description: "Ôn tập tổng kết cuối năm về âm, vần, từ ngữ và cách đặt câu đã học trong năm học.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập cuối năm (Tiếng Việt)", order: 1,
    questions: [
      { text: "Tiếng gồm những phần nào?", choices: ["Chỉ có âm đầu", "Âm đầu, vần và thanh điệu", "Chỉ có vần", "Chỉ có thanh điệu"], correctIndex: 1, explanation: "Một tiếng gồm âm đầu (có thể vắng), vần và thanh điệu", difficulty: "medium" },
      { text: "Từ nào là từ chỉ hoạt động?", choices: ["nhảy", "hoa", "bàn", "và"], correctIndex: 0, explanation: "'nhảy' là từ chỉ hoạt động", difficulty: "easy" },
      { text: "Câu 'Bông hoa rất đẹp.' thuộc mẫu câu nào?", choices: ["Ai làm gì?", "Ai là gì?", "Ai thế nào?", "Không thuộc mẫu nào"], correctIndex: 2, explanation: "Câu miêu tả đặc điểm thuộc mẫu Ai thế nào?", difficulty: "medium" },
      { text: "Vần nào có âm đệm?", choices: ["an", "oa", "et", "ich"], correctIndex: 1, explanation: "'oa' có âm đệm 'o' đứng trước âm chính 'a'", difficulty: "hard" },
    ],
    review: {
      title: "Kiến thức: Ôn tập tổng hợp âm, vần, từ và câu",
      content: "Ôn lại toàn bộ kiến thức về cấu tạo tiếng (âm đầu - vần - thanh điệu), các nhóm vần đã học, các loại từ (chỉ sự vật, chỉ hoạt động) và 3 mẫu câu cơ bản: Ai là gì? Ai làm gì? Ai thế nào?",
      examples: ["Tiếng 'hoa' = âm đầu 'h' + vần 'oa'", "Từ chỉ hoạt động: chạy, nhảy, học", "Bông hoa rất đẹp. (mẫu Ai thế nào?)"],
      videoUrl: embed("oyiLHbIvPNU"),
    },
  });

  await addLesson({
    title: "Ôn tập tổng hợp đọc hiểu và kể chuyện",
    description: "Ôn tập tổng kết cuối năm về kỹ năng đọc hiểu đoạn văn ngắn và kể chuyện theo tranh.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập cuối năm (Tiếng Việt)", order: 2,
    questions: [
      { text: "Khi kể chuyện theo tranh, em cần làm gì trước tiên?", choices: ["Kể ngay không cần xem tranh", "Quan sát kỹ nội dung từng tranh theo thứ tự", "Chỉ xem tranh cuối cùng", "Đoán bừa nội dung"], correctIndex: 1, explanation: "Cần quan sát kỹ từng tranh theo đúng thứ tự để kể lại chính xác", difficulty: "medium" },
      { text: "Đọc hiểu đoạn văn giúp em điều gì?", choices: ["Không có tác dụng gì", "Nắm được nội dung và trả lời đúng câu hỏi", "Chỉ để đọc cho vui", "Không liên quan đến bài học"], correctIndex: 1, explanation: "Đọc hiểu giúp nắm nội dung và trả lời đúng các câu hỏi liên quan", difficulty: "easy" },
      { text: "Khi kể lại một câu chuyện đã nghe, em nên kể theo thứ tự nào?", choices: ["Tuỳ ý, không cần thứ tự", "Đúng theo diễn biến câu chuyện", "Kể đoạn cuối trước", "Chỉ kể tên nhân vật"], correctIndex: 1, explanation: "Cần kể đúng theo diễn biến câu chuyện để người nghe hiểu rõ", difficulty: "medium" },
      { text: "Đoạn văn lớp 1 thường có chủ đề gì?", choices: ["Công thức toán học", "Gia đình, trường lớp, loài vật, thiên nhiên", "Chỉ số liệu thống kê", "Không có chủ đề nào"], correctIndex: 1, explanation: "Đoạn văn lớp 1 thường xoay quanh các chủ đề gần gũi, quen thuộc", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập tổng hợp đọc hiểu và kể chuyện",
      content: "Ôn lại kỹ năng đọc kỹ đoạn văn để trả lời câu hỏi, và kỹ năng quan sát tranh theo đúng thứ tự để kể lại câu chuyện mạch lạc, đúng diễn biến.",
      examples: ["Đọc kỹ đoạn văn trước khi trả lời câu hỏi", "Quan sát tranh 1 → 2 → 3 theo đúng thứ tự", "Kể chuyện đúng diễn biến: mở đầu - diễn biến - kết thúc"],
      videoUrl: embed("07CINdlMhE0"),
    },
  });

  await addLesson({
    title: "Ôn tập tổng hợp viết chính tả",
    description: "Ôn tập tổng kết cuối năm về kỹ năng viết chữ và viết đúng chính tả.",
    subject: tv, grade: lop1, chapterTitle: "Ôn tập cuối năm (Tiếng Việt)", order: 3,
    questions: [
      { text: "Khi viết chính tả, em cần chú ý điều gì nhất?", choices: ["Viết thật nhanh", "Nghe rõ và viết đúng từng tiếng", "Viết chữ thật to", "Không cần chú ý gì"], correctIndex: 1, explanation: "Cần nghe rõ và viết đúng từng tiếng để không sai chính tả", difficulty: "medium" },
      { text: "Cặp âm nào dễ viết sai chính tả nhất?", choices: ["a - b", "l - n", "o - p", "u - v"], correctIndex: 1, explanation: "'l' và 'n' là cặp âm đầu dễ nhầm lẫn khi viết chính tả", difficulty: "medium" },
      { text: "Câu viết đúng chính tả cần kết thúc bằng gì?", choices: ["Không cần dấu gì", "Dấu câu phù hợp (dấu chấm, dấu hỏi...)", "Luôn là dấu phẩy", "Luôn viết hoa toàn bộ"], correctIndex: 1, explanation: "Câu cần kết thúc bằng dấu câu phù hợp với nội dung", difficulty: "easy" },
      { text: "Chữ cái đầu câu cần viết như thế nào?", choices: ["Viết thường", "Viết hoa", "Không cần viết", "Tuỳ ý"], correctIndex: 1, explanation: "Chữ cái đầu câu luôn phải viết hoa", difficulty: "easy" },
    ],
    review: {
      title: "Kiến thức: Ôn tập tổng hợp viết chính tả",
      content: "Ôn lại quy tắc viết chính tả cơ bản: nghe rõ và viết đúng từng tiếng, phân biệt các âm dễ nhầm lẫn (l/n, ch/tr...), viết hoa chữ cái đầu câu và kết thúc câu bằng dấu câu phù hợp.",
      examples: ["Viết hoa chữ đầu câu: 'Em đi học.'", "Phân biệt: 'lo lắng' viết 'l', không viết 'n'", "Câu hỏi kết thúc bằng dấu chấm hỏi: 'Em tên gì?'"],
      videoUrl: embed("iY6zhkO6i2Q"),
    },
  });

  console.log("[addTiengVietCuoiNam] Hoàn tất: đã thêm chương Ôn tập cuối năm (Tiếng Việt) với 3 bài.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
