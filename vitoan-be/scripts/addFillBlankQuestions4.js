// Hoàn thiện 4 bài ngữ âm cuối cùng còn thiếu câu "nghe rồi điền" (Bài 29 quy tắc
// chính tả, Bài 81-83 ôn tập cuối kỳ tổng hợp), và mở rộng sang phần đọc hiểu
// (Tiếng Việt Tập 2, 54 bài truyện) bằng câu "nghe rồi điền" từ khoá chính của
// mỗi bài — không dùng nguyên văn nội dung truyện (chỉ dùng tên bài công khai),
// đúng với quy ước không sao chép SGK đã áp dụng xuyên suốt dự án.
require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");

async function addQuestion({ lesson, type, text, audioText, correctText, explanation }) {
  const existing = await Question.findOne({ lesson: lesson._id, type, text, correctText });
  if (existing) return false;
  const maxOrderDoc = await Question.findOne({ lesson: lesson._id }).sort({ order: -1 });
  await Question.create({
    lesson: lesson._id, type, text, audioText: audioText || "", correctText,
    explanation: explanation || "", difficulty: "easy",
    order: (maxOrderDoc?.order ?? -1) + 1,
  });
  return true;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const tv = await Subject.findOne({ slug: "tieng-viet" });
  const lop1 = await Grade.findOne({ slug: "lop-1" });

  let n = 0;

  // ===== 4 bài ngữ âm cuối cùng =====
  const PHONICS_FINAL = [
    {
      id: "6aaae5c8b2aac220f66a2870", // Bài 29: Luyện tập quy tắc chính tả
      text: "Nghe cô đọc rồi điền đúng chữ cái vào ô trống.\nTrước các nguyên âm i, e, ê, âm \"cờ\" được viết bằng chữ ___.",
      audioText: "Nghe cô đọc rồi điền vào ô trống. Trước các nguyên âm i, e, ê, âm cờ được viết bằng chữ k.",
      correctText: "k",
      explanation: "Quy tắc chính tả: âm \"cờ\" viết là \"k\" khi đứng trước i, e, ê (ví dụ: kì, kẻ, kê).",
    },
    { id: "6aaaea44b2aac220f66a2918", vần: "an" }, // Bài 81
    { id: "6aaaea44b2aac220f66a291a", vần: "iu" }, // Bài 82
    { id: "6aaaea44b2aac220f66a291c", vần: "uôn" }, // Bài 83
  ];
  for (const item of PHONICS_FINAL) {
    const lesson = await Lesson.findById(item.id);
    if (!lesson) { console.log(`  [bỏ qua] Không tìm thấy lesson ${item.id}`); continue; }
    const added = item.text
      ? await addQuestion({ lesson, type: "listen_fill", text: item.text, audioText: item.audioText, correctText: item.correctText, explanation: item.explanation })
      : await addQuestion({
          lesson, type: "listen_fill",
          text: "Nghe cô đọc rồi điền đúng vần em đã học vào ô trống.\n___",
          audioText: `Nghe cô đọc rồi điền đúng vần em đã học vào ô trống. Vần ${item.vần}.`,
          correctText: item.vần,
          explanation: `Vần "${item.vần}" đã học trong chương trình học kì 1.`,
        });
    if (added) n++;
  }

  // ===== Tiếng Việt Tập 2 — phần đọc hiểu (54 bài truyện), listen_fill từ khoá =====
  // Chỉ dùng từ khoá lấy từ TÊN bài (công khai), không đụng đến nội dung truyện.
  const READING_KEYWORDS = [
    ["Tôi là học sinh lớp 1", "học sinh"],
    ["Đôi tai xấu xí", "đôi tai"],
    ["Bạn của gió", "gió"],
    ["Giải thưởng tình bạn", "tình bạn"],
    ["Sinh nhật của voi con", "voi con"],
    ["Nụ hôn trên bàn tay", "bàn tay"],
    ["Làm anh", "làm anh"],
    ["Cả nhà đi chơi núi", "núi"],
    ["Quạt cho bà ngủ", "quạt"],
    ["Bữa cơm gia đình", "bữa cơm"],
    ["Ngôi nhà", "ngôi nhà"],
    ["Tôi đi học", "đi học"],
    ["Đi học", "đi học"],
    ["Hoa yêu thương", "hoa"],
    ["Cây bàng và lớp học", "cây bàng"],
    ["Bác trống trường", "trống trường"],
    ["Giờ ra chơi", "ra chơi"],
    ["Rửa tay trước khi ăn", "rửa tay"],
    ["Lời chào", "lời chào"],
    ["Khi mẹ vắng nhà", "mẹ"],
    ["Nếu không may bị lạc", "bị lạc"],
    ["Đèn giao thông", "đèn giao thông"],
    ["Kiến và chim bồ câu", "kiến"],
    ["Câu chuyện của rễ", "rễ"],
    ["Câu hỏi của sói", "sói"],
    ["Chú bé chăn cừu", "chăn cừu"],
    ["Tiếng vọng của núi", "tiếng vọng"],
    ["Loài chim của biển cả", "biển cả"],
    ["Bảy sắc cầu vồng", "cầu vồng"],
    ["Chúa tể rừng xanh", "rừng xanh"],
    ["Cuộc thi tài năng rừng xanh", "tài năng"],
    ["Cây liễu dẻo dai", "cây liễu"],
    ["Tia nắng đi đâu?", "tia nắng"],
    ["Trong giấc mơ buổi sáng", "giấc mơ"],
    ["Ngày mới bắt đầu", "ngày mới"],
    ["Hỏi mẹ", "hỏi mẹ"],
    ["Những cánh cò", "cánh cò"],
    ["Buổi trưa hè", "trưa hè"],
    ["Hoa phượng", "hoa phượng"],
    ["Cậu bé thông minh", "thông minh"],
    ["Lính cứu hỏa", "cứu hỏa"],
    ["Lớn lên bạn làm gì?", "lớn lên"],
    ["Ruộng bậc thang ở Sa Pa", "ruộng bậc thang"],
    ["Nhớ ơn", "nhớ ơn"],
    ["Du lịch biển Việt Nam", "du lịch"],
  ];

  let readingAdded = 0;
  for (const [title, keyword] of READING_KEYWORDS) {
    const lesson = await Lesson.findOne({ title, subject: tv._id, grade: lop1._id });
    if (!lesson) { console.log(`  [bỏ qua] Không tìm thấy bài đọc: "${title}"`); continue; }
    const added = await addQuestion({
      lesson, type: "listen_fill",
      text: "Nghe cô đọc rồi điền đúng từ khoá em vừa nghe vào ô trống.\n___",
      audioText: `Nghe cô đọc rồi điền đúng từ khoá em vừa nghe vào ô trống. Từ khoá: ${keyword}.`,
      correctText: keyword,
      explanation: `Từ khoá của bài đọc "${title}" là "${keyword}".`,
    });
    if (added) readingAdded++;
  }

  console.log(`\nĐã thêm ${n} câu cho 4 bài ngữ âm cuối cùng.`);
  console.log(`Đã thêm ${readingAdded} câu "nghe rồi điền" cho phần đọc hiểu Tiếng Việt Tập 2.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
