// Đa dạng hoá loại câu hỏi thực hành: hiện tại toàn bộ chỉ là trắc nghiệm 4 đáp án.
// 1) Với các bài ngữ âm Tiếng Việt (chương có "Bài" trong tên), đổi câu hỏi đầu tiên
//    của mỗi bài sang type "listen_choice" — giao diện sẽ tự đọc to câu hỏi, phù hợp
//    cho bé chưa đọc được chữ (chỉ đổi type, giữ nguyên nội dung/đáp án đã đúng).
// 2) Thêm 1 câu hỏi "Đúng/Sai" tự biên soạn cho MỌI bài học (không sao chép SGK, chỉ
//    dùng tên bài/chương công khai), xen kẽ đáp án đúng là "Đúng" hoặc "Sai" để đa dạng.
require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const Chapter = require("../models/Chapter");
const Question = require("../models/Question");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const lessons = await Lesson.find().populate("chapter");
  let flipped = 0;
  let added = 0;
  let idx = 0;

  for (const lesson of lessons) {
    const isPhonics = /Bài/i.test(lesson.chapter?.title || "");
    const questions = await Question.find({ lesson: lesson._id }).sort({ order: 1, createdAt: 1 });
    if (questions.length === 0) continue;

    if (isPhonics && questions[0].type !== "listen_choice") {
      questions[0].type = "listen_choice";
      await questions[0].save();
      flipped++;
    }

    const hasTrueFalse = questions.some((q) => q.type === "true_false");
    if (!hasTrueFalse) {
      const isTrueCorrect = idx % 2 === 0;
      const maxOrder = Math.max(...questions.map((q) => q.order ?? 0));
      await Question.create({
        lesson: lesson._id,
        type: "true_false",
        text: isTrueCorrect
          ? `Bài học này có tên là "${lesson.title}". Đúng hay sai?`
          : `Bài học này có tên là "${lesson.title} (phiên bản khác)". Đúng hay sai?`,
        choices: ["Đúng", "Sai"],
        correctIndex: isTrueCorrect ? 0 : 1,
        explanation: isTrueCorrect
          ? `Đúng vậy, tên bài học là "${lesson.title}".`
          : `Sai, tên bài học chính xác là "${lesson.title}".`,
        difficulty: "easy",
        order: maxOrder + 1,
      });
      added++;
    }
    idx++;
  }

  console.log(`Đã chuyển ${flipped} câu sang "Nghe và chọn đáp án".`);
  console.log(`Đã thêm ${added} câu hỏi "Đúng/Sai" mới.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
