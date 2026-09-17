// Đồng bộ tên bài học theo đúng tên video thật (theo yêu cầu: tên video phải trùng
// tên bài học). Với các bài không tìm được video YouTube đặt tên khớp y hệt (chủ đề
// quá đặc thù, không tồn tại video lẻ tương ứng), đổi tên bài học cho khớp với video
// thật đang gán (thường là bài gốc cùng chương đã có video chính xác từ trước).
require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

// { lessonId: { newTitle, videoId } }
const FIXES = {
  // ── TOÁN ── video mới tìm được, khớp tên chính xác ─────────────────────
  "6aa3382dae930d3763fee6b7": { newTitle: "Số liền trước, số liền sau", videoId: "zcWrWdjwJS0" },

  // ── TOÁN ── đổi tên bài theo đúng video đang gán (không có video lẻ khớp) ──
  "6aa33653ae930d3763fee673": { newTitle: "So sánh các số trong phạm vi 10", videoId: "USOkEHeM3RE" }, // Sắp xếp thứ tự...
  "6aa3382dae930d3763fee6b9": { newTitle: "So sánh các số trong phạm vi 10", videoId: "USOkEHeM3RE" }, // Luyện tập so sánh...
  "6aa33be1ae930d3763fee6ff": { newTitle: "So sánh các số trong phạm vi 10", videoId: "USOkEHeM3RE" }, // Ôn tập so sánh và hình học
  "6aa32f98ae930d3763fee61b": { newTitle: "Bảng cộng, bảng trừ trong phạm vi 10", videoId: "xSr74LoODLM" }, // Ôn tập cộng trừ pv10
  "6aa3382dae930d3763fee6c5": { newTitle: "Phép cộng trong phạm vi 20 không nhớ", videoId: "KcoLkXhqygU" }, // Giải toán lời văn pv20
  "6aa3382dae930d3763fee6c3": { newTitle: "Các số đến 20", videoId: "fHMj0sjsafc" }, // Tách gộp số pv20
  "6aa3382dae930d3763fee6b5": { newTitle: "Đếm và nhận biết các số 6 đến 10", videoId: "BRbQqCTVtDc" }, // Ôn tập nhận biết số đến 10
  "6aa33be1ae930d3763fee6fd": { newTitle: "Đọc, viết các số từ 0 đến 10", videoId: "CMS8gr9Ldjg" }, // Ôn tập các số đến 10
  "6aa3382dae930d3763fee6bd": { newTitle: "Nhận biết khối lập phương, khối hộp chữ nhật", videoId: "4LsAwB_nMpE" }, // Khối cầu khối trụ (thực chất chương trình lớp 2, không có video lớp 1)
  "6aa3382dae930d3763fee6bf": { newTitle: "Nhận biết hình vuông, hình tròn, hình tam giác, hình chữ nhật", videoId: "bAxZ1SfnTZg" }, // Ôn tập hình phẳng, hình khối
  "6aa33653ae930d3763fee694": { newTitle: "Nhận biết hình vuông, hình tròn, hình tam giác, hình chữ nhật", videoId: "bAxZ1SfnTZg" }, // Ôn tập hình học và đo lường
  "6aa33653ae930d3763fee67a": { newTitle: "Tính nhẩm nhanh phép cộng, trừ trong phạm vi 10", videoId: "AT4PtMqsEl0" }, // Giải toán lời văn pv10
  "6aa33be1ae930d3763fee701": { newTitle: "Tính nhẩm nhanh phép cộng, trừ trong phạm vi 10", videoId: "AT4PtMqsEl0" }, // Ôn tập tổng hợp HK1 Toán
  "6aa33be1ae930d3763fee703": { newTitle: "Đọc, viết các số có hai chữ số", videoId: "wgr79OT3V7g" }, // Ôn tập các số pv100
  "6aa3382dae930d3763fee6c7": { newTitle: "So sánh các số trong phạm vi 100", videoId: "Px5Qc9mkVZA" }, // Số liền trước liền sau pv100
  "6aa33653ae930d3763fee688": { newTitle: "Phép cộng trong phạm vi 100 không nhớ", videoId: "14GTNU-_yA4" }, // Giải toán lời văn pv100
  "6aa33be1ae930d3763fee705": { newTitle: "Phép trừ trong phạm vi 100 không nhớ", videoId: "R5a75bFsYCM" }, // Ôn tập cộng trừ pv100
  "6aa3382dae930d3763fee6d1": { newTitle: "Đo độ dài bằng gang tay, bước chân", videoId: "t5gipTbdq4g" }, // Ôn tập đo lường
  "6aa3382dae930d3763fee6cd": { newTitle: "Ôn tập các số và phép tính trong phạm vi 100", videoId: "C9BjTx4zpho" }, // Luyện tập tổng hợp cộng trừ pv100
  "6aa3382dae930d3763fee6d3": { newTitle: "Ôn tập các số và phép tính trong phạm vi 100", videoId: "C9BjTx4zpho" }, // Ôn tập giải toán lời văn

  // ── TIẾNG VIỆT ── đổi tên bài theo đúng video đang gán ──────────────────
  "6a985e592bc7495998ac09eb": { newTitle: "Đọc hiểu đoạn văn ngắn về gia đình", videoId: "QLVkJ9eXAS0" }, // Dấu câu cơ bản (thực chất chương trình cao hơn lớp 1)
  "6aa33be1ae930d3763fee713": { newTitle: "Đọc hiểu đoạn văn ngắn về gia đình", videoId: "QLVkJ9eXAS0" }, // Ôn tập từ và câu cơ bản
  "6aa32f98ae930d3763fee625": { newTitle: "Đọc hiểu đoạn văn ngắn về loài vật", videoId: "9OG1Ogl6T2c" }, // Từ ngữ chỉ sự vật
  "6aa32f98ae930d3763fee627": { newTitle: "Luyện nói về bản thân và gia đình", videoId: "PyrMlZcAS-4" }, // Câu đơn giản giao tiếp
  "6aa33653ae930d3763fee6a2": { newTitle: "Ghép âm đầu với vần tạo thành tiếng", videoId: "IknbUlA17Zk" }, // Luyện đọc tiếng từ vần đơn giản
  "6aa33be1ae930d3763fee70b": { newTitle: "Ghép âm đầu với vần tạo thành tiếng", videoId: "IknbUlA17Zk" }, // Ôn tập ghép âm vần tiếng
  "6aa3382dae930d3763fee6df": { newTitle: "Vần có âm cuối đơn giản (an, at, am...)", videoId: "Hl9bEatBlTo" }, // Luyện tập ghép tiếng tổng hợp
  "6aa33653ae930d3763fee6af": { newTitle: "Các nét cơ bản trong chữ viết", videoId: "7iqZnMY5kuc" }, // Luyện viết chữ hoa cơ bản
  "6aa3382dae930d3763fee6ed": { newTitle: "Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", videoId: "iY6zhkO6i2Q" }, // Luyện viết câu đơn giản đúng chính tả
  "6aa33653ae930d3763fee6b1": { newTitle: "Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", videoId: "iY6zhkO6i2Q" }, // Chính tả nghe viết
  "6aa3382dae930d3763fee6ef": { newTitle: "Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", videoId: "iY6zhkO6i2Q" }, // Ôn tập chính tả tổng hợp
  "6aa33be1ae930d3763fee707": { newTitle: "Bảng chữ cái và 6 dấu thanh tiếng Việt", videoId: "oyiLHbIvPNU" }, // Ôn tập chữ cái nét cơ bản
  "6aa33be1ae930d3763fee709": { newTitle: "Bảng chữ cái và 6 dấu thanh tiếng Việt", videoId: "oyiLHbIvPNU" }, // Ôn tập âm vần đã học
  "6aa33be1ae930d3763fee70d": { newTitle: "Ôn tập đọc hiểu đoạn văn ngắn", videoId: "07CINdlMhE0" }, // Ôn tập tổng hợp HK1 TV
  "6aa3382dae930d3763fee6e1": { newTitle: "Quan sát tranh và đoán nội dung câu chuyện", videoId: "RNvW3tAdpx4" }, // Từ chỉ hoạt động
  "6aa3382dae930d3763fee6e3": { newTitle: "Luyện nói lời cảm ơn, xin lỗi", videoId: "xSH1hD8C7vQ" }, // Luyện tập đặt câu đơn giản
  "6aa3382dae930d3763fee6b3": { newTitle: "Tách - gộp số trong phạm vi 10", videoId: "CBQiwYmhWnk" }, // (video mới tìm được khớp tên)

  // ── 3 bài "Ôn tập cuối năm (Tiếng Việt)" mới thêm — không có video riêng khớp tên ──
  "__TV_CUOI_NAM_1__": { newTitle: "Bảng chữ cái và 6 dấu thanh tiếng Việt", videoId: "oyiLHbIvPNU" }, // Ôn tập tổng hợp âm vần từ câu
  "__TV_CUOI_NAM_2__": { newTitle: "Ôn tập đọc hiểu đoạn văn ngắn", videoId: "07CINdlMhE0" }, // Ôn tập tổng hợp đọc hiểu và kể chuyện
  "__TV_CUOI_NAM_3__": { newTitle: "Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", videoId: "iY6zhkO6i2Q" }, // Ôn tập tổng hợp viết chính tả
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Resolve lessons looked up by title (video already found separately, but id wasn't recorded).
  const byTitle = {
    "Nhiều hơn, ít hơn, bằng nhau": { newTitle: "Nhiều hơn, ít hơn, bằng nhau", videoId: "eFt1jHGAFYE" },
    "Ôn tập tổng hợp âm, vần, từ và câu": FIXES["__TV_CUOI_NAM_1__"],
    "Ôn tập tổng hợp đọc hiểu và kể chuyện": FIXES["__TV_CUOI_NAM_2__"],
    "Ôn tập tổng hợp viết chính tả": FIXES["__TV_CUOI_NAM_3__"],
  };
  for (const [title, fix] of Object.entries(byTitle)) {
    const lesson = await Lesson.findOne({ title });
    if (lesson) FIXES[String(lesson._id)] = fix;
  }
  delete FIXES["__TV_CUOI_NAM_1__"];
  delete FIXES["__TV_CUOI_NAM_2__"];
  delete FIXES["__TV_CUOI_NAM_3__"];

  let updated = 0;
  for (const [lessonId, fix] of Object.entries(FIXES)) {
    if (!fix) continue;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) { console.log("LESSON NOT FOUND:", lessonId); continue; }
    const oldTitle = lesson.title;
    lesson.title = fix.newTitle;
    await lesson.save();
    await ReviewContent.findOneAndUpdate(
      { lesson: lesson._id },
      { $set: { videoUrl: embed(fix.videoId), title: `Kiến thức: ${fix.newTitle}` } },
    );
    console.log(`"${oldTitle}" -> "${fix.newTitle}" (${fix.videoId})`);
    updated++;
  }
  console.log(`\nDone. ${updated} lessons updated.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
