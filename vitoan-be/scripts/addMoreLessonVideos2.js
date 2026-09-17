require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

// Real, verified VTV7 video ids found this pass.
const VIDEO_MAP = {
  // Toán — previously-unused VTV7 "TOÁN 1" episodes that match existing gaps
  "6aa3382dae930d3763fee6bb": "zALVoyVYfdM", // Ghép hình đơn giản từ các hình đã học <- Bài 19: Hoạt động thực hành và trải nghiệm
  "6aa346b5ae930d3763fee717": "xSr74LoODLM", // Bảng cộng, bảng trừ trong phạm vi 10 <- Bài 11: Bảng cộng trong phạm vi 10

  // Tiếng Việt — restore the "nét cơ bản" video that existed before the phonics restructure
  "6aa346b9ceb57bfc471f3545": "7iqZnMY5kuc", // Các nét cơ bản trong chữ viết <- Bài 1: Các âm và nét cơ bản trong tiếng Việt

  // Tiếng Việt hoc ky 2 — VTV7 "TIẾNG VIỆT 1" Bài 57-70 (đọc đoạn văn / kể chuyện) verified via playlist sidebar
  "6aa33653ae930d3763fee6a5": "QLVkJ9eXAS0", // Đọc hiểu đoạn văn ngắn về gia đình <- Bài 64: Đọc "Cháu ngoan của bà"
  "6aa33653ae930d3763fee6a7": "YT7giqt7xD4", // Đọc hiểu đoạn văn ngắn về trường lớp <- Bài 61: Đọc "Chuyện ở lớp"
  "6aa3382dae930d3763fee6e5": "9OG1Ogl6T2c", // Đọc hiểu đoạn văn ngắn về loài vật <- Bài 60: Đọc "Năm người bạn"
  "6aa3382dae930d3763fee6e7": "Ie8kxiWtTr4", // Đọc hiểu đoạn văn ngắn về thiên nhiên <- Bài 62: Đọc "Mặt trời thức giấc"
  "6aa33be1ae930d3763fee70f": "RNvW3tAdpx4", // Quan sát tranh và đoán nội dung câu chuyện <- Bài 65: Đọc "Kể chuyện bé nghe"
  "6aa33be1ae930d3763fee711": "ipTzUD-nptU", // Kể chuyện theo tranh minh hoạ <- Bài 66: Đọc "Nữ hoàng của đảo"
  "6aa33653ae930d3763fee6aa": "PyrMlZcAS-4", // Luyện nói về bản thân và gia đình <- Bài 63: Đọc "Làm anh"
  "6aa33653ae930d3763fee6ac": "Y4JiW-lC6Bs", // Kể lại một câu chuyện ngắn đã nghe <- Bài 67: Đọc "Trong giấc mơ buổi sáng"
  "6aa3382dae930d3763fee6e9": "jO2McQ8JHJw", // Luyện nói về sở thích của em <- Bài 68: Đọc "Hoa yêu thương"
  "6aa3382dae930d3763fee6eb": "xSH1hD8C7vQ", // Luyện nói lời cảm ơn, xin lỗi <- Bài 57: Đọc "Lời chào đi trước"
  "6aa33be1ae930d3763fee715": "07CINdlMhE0", // Ôn tập đọc hiểu đoạn văn ngắn <- Bài 58: Đọc "Giải thưởng tình bạn"
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let updated = 0;
  for (const [lessonId, videoId] of Object.entries(VIDEO_MAP)) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      console.log("  (skip, lesson not found)", lessonId);
      continue;
    }
    await ReviewContent.findOneAndUpdate(
      { lesson: lesson._id },
      { $set: { videoUrl: embed(videoId) }, $setOnInsert: { title: lesson.title } },
      { upsert: true, setDefaultsOnInsert: true }
    );
    updated += 1;
    console.log("  updated:", lesson.title);
  }

  console.log(`\nDone. ${updated} more lessons updated with real VTV7 video links.`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
