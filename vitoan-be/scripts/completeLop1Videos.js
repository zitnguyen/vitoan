// Hoàn thiện video cho TẤT CẢ bài học lớp 1 (Toán + Tiếng Việt) còn thiếu.
// Cùng pattern với addLessonVideos.js: video YouTube VTV7, lưu dạng embed URL
// vào ReviewContent.videoUrl. Với các bài không có video VTV7 chuyên biệt
// (chủ yếu bài "Ôn tập" và các kỹ năng phái sinh), tái dùng video của bài
// gần chủ đề nhất trong cùng chương — đúng cách addLessonVideos.js đã làm
// (vd. video "So sánh phạm vi 10" USOkEHeM3RE dùng lại cho 2 bài khác nhau).
require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

const VIDEO_MAP = {
  // ── TOÁN ──────────────────────────────────────────────────────────────
  "6aa33653ae930d3763fee67a": "AT4PtMqsEl0", // Giải bài toán có lời văn trong phạm vi 10
  "6aa3382dae930d3763fee6c3": "fHMj0sjsafc", // Tách số, gộp số trong phạm vi 20
  "6aa3382dae930d3763fee6c5": "KcoLkXhqygU", // Giải bài toán có lời văn trong phạm vi 20
  "6aa3382dae930d3763fee6b3": "xSr74LoODLM", // Tách số và gộp số trong phạm vi 10
  "6aa3382dae930d3763fee6b5": "BRbQqCTVtDc", // Ôn tập nhận biết các số đến 10
  "6aa33653ae930d3763fee673": "USOkEHeM3RE", // Sắp xếp thứ tự các số trong phạm vi 10
  "6aa3382dae930d3763fee6b7": "USOkEHeM3RE", // Số liền trước, số liền sau
  "6aa3382dae930d3763fee6b9": "USOkEHeM3RE", // Luyện tập so sánh và sắp xếp số
  "6aa3382dae930d3763fee6bd": "4LsAwB_nMpE", // Nhận biết khối cầu, khối trụ
  "6aa3382dae930d3763fee6bf": "bAxZ1SfnTZg", // Ôn tập hình phẳng và hình khối
  "6aa3382dae930d3763fee6c7": "Px5Qc9mkVZA", // Số liền trước, số liền sau trong phạm vi 100
  "6aa33653ae930d3763fee688": "14GTNU-_yA4", // Giải bài toán có lời văn trong phạm vi 100
  "6aa3382dae930d3763fee6cd": "C9BjTx4zpho", // Luyện tập tổng hợp cộng trừ phạm vi 100
  "6aa3382dae930d3763fee6d1": "t5gipTbdq4g", // Ôn tập đo lường
  "6aa33653ae930d3763fee694": "FW7NKwkFYMs", // Ôn tập hình học và đo lường
  "6aa3382dae930d3763fee6d3": "C9BjTx4zpho", // Ôn tập giải toán có lời văn
  "6aa33be1ae930d3763fee6fd": "CMS8gr9Ldjg", // Ôn tập các số đến 10
  "6aa33be1ae930d3763fee6ff": "USOkEHeM3RE", // Ôn tập so sánh và hình học
  "6aa32f98ae930d3763fee61b": "xSr74LoODLM", // Ôn tập phép cộng, phép trừ trong phạm vi 10
  "6aa33be1ae930d3763fee701": "AT4PtMqsEl0", // Ôn tập tổng hợp học kỳ 1 (Toán)
  "6aa33be1ae930d3763fee703": "wgr79OT3V7g", // Ôn tập các số trong phạm vi 100
  "6aa33be1ae930d3763fee705": "R5a75bFsYCM", // Ôn tập phép cộng, phép trừ trong phạm vi 100

  // ── TIẾNG VIỆT ────────────────────────────────────────────────────────
  "6a985e592bc7495998ac09eb": "QLVkJ9eXAS0", // Dấu câu cơ bản
  "6aa32f98ae930d3763fee625": "9OG1Ogl6T2c", // Từ ngữ chỉ sự vật xung quanh em
  "6aa32f98ae930d3763fee627": "PyrMlZcAS-4", // Câu đơn giản trong giao tiếp
  "6aa3382dae930d3763fee6e1": "RNvW3tAdpx4", // Từ chỉ hoạt động của con người, con vật
  "6aa3382dae930d3763fee6e3": "xSH1hD8C7vQ", // Luyện tập đặt câu đơn giản
  "6aa33653ae930d3763fee6a2": "IknbUlA17Zk", // Luyện đọc tiếng, từ có vần đơn giản
  "6aa3382dae930d3763fee6df": "Hl9bEatBlTo", // Luyện tập ghép tiếng tổng hợp
  "6aa33653ae930d3763fee6af": "7iqZnMY5kuc", // Luyện viết chữ hoa cơ bản
  "6aa33653ae930d3763fee6b1": "vpWYf3jJ6xY", // Chính tả: nghe viết từ, câu ngắn
  "6aa3382dae930d3763fee6ed": "iY6zhkO6i2Q", // Luyện viết câu đơn giản đúng chính tả
  "6aa3382dae930d3763fee6ef": "07CINdlMhE0", // Ôn tập chính tả tổng hợp
  "6aa33be1ae930d3763fee707": "1hP3H8bwC8Q", // Ôn tập chữ cái và nét cơ bản
  "6aa33be1ae930d3763fee709": "oyiLHbIvPNU", // Ôn tập âm và vần đã học
  "6aa33be1ae930d3763fee70b": "IknbUlA17Zk", // Ôn tập ghép âm, vần, tiếng
  "6aa33be1ae930d3763fee70d": "07CINdlMhE0", // Ôn tập tổng hợp học kỳ 1 (Tiếng Việt)
  "6aa33be1ae930d3763fee713": "QLVkJ9eXAS0", // Ôn tập từ và câu cơ bản
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  let updated = 0;
  let missingLesson = 0;
  for (const [lessonId, videoId] of Object.entries(VIDEO_MAP)) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      console.log("LESSON NOT FOUND:", lessonId);
      missingLesson++;
      continue;
    }
    await ReviewContent.findOneAndUpdate(
      { lesson: lesson._id },
      { $set: { videoUrl: embed(videoId) }, $setOnInsert: { title: lesson.title } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    updated++;
  }
  console.log(`Done. Updated ${updated} lessons, ${missingLesson} lesson ids not found.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
