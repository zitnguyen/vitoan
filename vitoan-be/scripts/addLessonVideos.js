require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

// lessonId -> real, verified VTV7 (Đài Truyền hình Giáo dục Quốc gia) YouTube video id.
// Sourced from the official "TOÁN 1" and "TIẾNG VIỆT 1" playlists on VTV7's channel.
const VIDEO_MAP = {
  // ===== Toán =====
  "6aa33653ae930d3763fee668": "Au9ZIpVYBZQ", // Đếm và nhận biết các số 0 đến 5
  "6aa33653ae930d3763fee66a": "BRbQqCTVtDc", // Đếm và nhận biết các số 6 đến 10
  "6aa33653ae930d3763fee66c": "CMS8gr9Ldjg", // Đọc, viết các số từ 0 đến 10 (Số 0 và số 10)
  "6aa33be1ae930d3763fee6f9": "qyime_e1ZBA", // Trên - dưới, trước - sau
  "6aa33be1ae930d3763fee6fb": "qyime_e1ZBA", // Trái - phải, ở giữa
  "6aa33653ae930d3763fee66f": "USOkEHeM3RE", // Nhiều hơn, ít hơn, bằng nhau
  "6aa33653ae930d3763fee671": "USOkEHeM3RE", // So sánh các số trong phạm vi 10
  "6aa33653ae930d3763fee676": "bAxZ1SfnTZg", // Nhận biết hình vuông, hình tròn, hình tam giác, hình chữ nhật
  "6aa33653ae930d3763fee678": "4LsAwB_nMpE", // Nhận biết khối lập phương, khối hộp chữ nhật
  "6a985e592bc7495998ac09e8": "GRL3dY0vsWo", // Phép cộng trong phạm vi 10
  "6a985e592bc7495998ac09e9": "kNnw4_Q_TOc", // Phép trừ trong phạm vi 10
  "6aa3382dae930d3763fee6c1": "AT4PtMqsEl0", // Tính nhẩm nhanh phép cộng, trừ trong phạm vi 10
  "6a9a2f382bc7495998ac0a0b": "fHMj0sjsafc", // Các số đến 20
  "6aa32f98ae930d3763fee61d": "KcoLkXhqygU", // Phép cộng trong phạm vi 20 không nhớ
  "6aa32f98ae930d3763fee61f": "CMz-lRgmEBo", // Phép trừ trong phạm vi 20 không nhớ
  "6aa33653ae930d3763fee67d": "MDhVMnplaNI", // Các số tròn chục
  "6aa33653ae930d3763fee67f": "wgr79OT3V7g", // Đọc, viết các số có hai chữ số
  "6aa33653ae930d3763fee681": "Px5Qc9mkVZA", // So sánh các số trong phạm vi 100
  "6aa3382dae930d3763fee6c9": "kBQ3Z4MWVTM", // Luyện tập tổng hợp số trong phạm vi 100
  "6aa33653ae930d3763fee684": "14GTNU-_yA4", // Phép cộng trong phạm vi 100 không nhớ
  "6aa33653ae930d3763fee686": "R5a75bFsYCM", // Phép trừ trong phạm vi 100 không nhớ
  "6aa3382dae930d3763fee6cb": "jjfRtB3_GrM", // Tính nhẩm cộng trừ các số tròn chục
  "6aa33653ae930d3763fee68b": "t5gipTbdq4g", // Đo độ dài bằng gang tay, bước chân
  "6aa33653ae930d3763fee68d": "VEdMa17tQs4", // Xem giờ đúng trên đồng hồ
  "6aa33653ae930d3763fee68f": "v6NSUSM3RMk", // Các ngày trong tuần
  "6aa3382dae930d3763fee6cf": "FW7NKwkFYMs", // So sánh độ dài các đoạn thẳng
  "6aa33653ae930d3763fee692": "C9BjTx4zpho", // Ôn tập các số và phép tính trong phạm vi 100

  // ===== Tiếng Việt =====
  "6aa33653ae930d3763fee697": "7iqZnMY5kuc", // Các nét cơ bản trong chữ viết
  "6aa33653ae930d3763fee699": "1hP3H8bwC8Q", // Làm quen nhóm chữ cái a, b, c, d, đ
  "6aa33653ae930d3763fee69b": "t1IUfKVg-Zo", // Làm quen nhóm chữ cái e, ê, g, h, i
  "6aa3382dae930d3763fee6d5": "-O4dFQ3Xkcw", // Làm quen nhóm chữ cái k, l, m, n, o
  "6a9a2f392bc7495998ac0a1a": "oyiLHbIvPNU", // Âm và vần cơ bản
  "6aa32f98ae930d3763fee621": "oyiLHbIvPNU", // Bảng chữ cái tiếng Việt
  "6aa32f98ae930d3763fee623": "vpWYf3jJ6xY", // Dấu thanh trong tiếng Việt
  "6aa3382dae930d3763fee6d9": "iY6zhkO6i2Q", // Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)
  "6aa33653ae930d3763fee69e": "IknbUlA17Zk", // Ghép âm đầu với vần tạo thành tiếng
  "6aa33653ae930d3763fee6a0": "Hl9bEatBlTo", // Vần có âm cuối đơn giản (an, at, am...)
  "6aa3382dae930d3763fee6dd": "lEsjMQQD5_s", // Vần có âm đệm đơn giản (oa, oe)
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let updated = 0;
  let skippedNoLesson = 0;
  for (const [lessonId, videoId] of Object.entries(VIDEO_MAP)) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      console.log("  (skip, lesson not found)", lessonId);
      skippedNoLesson += 1;
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

  console.log(`\nDone. ${updated} lessons updated with real VTV7 video links. ${skippedNoLesson} lesson ids not found.`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
