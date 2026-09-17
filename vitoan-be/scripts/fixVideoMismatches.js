// Sửa các cặp video-bài học bị lệch chủ đề phát hiện khi rà soát:
// - "Chính tả: nghe viết từ, câu ngắn" đang trỏ video về dấu thanh (sai chủ đề)
// - "Ôn tập chính tả tổng hợp" đang trỏ video ôn tập đọc hiểu (sai domain)
// - "Ôn tập hình học và đo lường" đang chỉ có video đo lường, thiếu hình học
require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

const FIX_MAP = {
  "6aa33653ae930d3763fee6b1": "iY6zhkO6i2Q", // Chính tả: nghe viết từ, câu ngắn <- phân biệt âm đầu l/n, ch/tr (đúng domain chính tả)
  "6aa3382dae930d3763fee6ef": "iY6zhkO6i2Q", // Ôn tập chính tả tổng hợp <- cùng lý do
  "6aa33653ae930d3763fee694": "bAxZ1SfnTZg", // Ôn tập hình học và đo lường <- đổi sang video hình học (đo lường đã có bài riêng)
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const [lessonId, videoId] of Object.entries(FIX_MAP)) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) { console.log("NOT FOUND:", lessonId); continue; }
    await ReviewContent.findOneAndUpdate(
      { lesson: lesson._id },
      { $set: { videoUrl: embed(videoId) } },
    );
    console.log("Fixed:", lesson.title, "->", videoId);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
