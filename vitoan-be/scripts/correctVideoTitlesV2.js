// Sửa lại nghiêm túc: kiểm tra tên THẬT của từng video trên YouTube (không tin theo
// comment cũ trong code, vì comment cũ nhiều chỗ ghi sai/diễn giải chứ không phải tên
// thật). Phát hiện: các bài "Vần ua/on/oa..." (từ expandTiengViet1Phonics.js) vốn ĐÃ
// khớp đúng tên video từ trước — lần sửa trước (alignVideoTitles.js) đã nhầm khi đổi
// tên các bài đó để "dùng chung" cho bài khác, cần revert lại. Các bài orphan không có
// video riêng khớp tên thật thì xoá (gộp) theo đúng chỉ đạo — thay vì gán sai tên.
require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");
const Chapter = require("../models/Chapter");
const Question = require("../models/Question");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

async function renameByChapter(oldOrCurrentTitle, chapterTitle, newTitle, videoId) {
  const chapter = await Chapter.findOne({ title: chapterTitle });
  const lesson = await Lesson.findOne({ title: oldOrCurrentTitle, chapter: chapter?._id });
  if (!lesson) { console.log("NOT FOUND (rename):", oldOrCurrentTitle, "/", chapterTitle); return; }
  const old = lesson.title;
  lesson.title = newTitle;
  await lesson.save();
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { $set: { videoUrl: embed(videoId), title: `Kiến thức: ${newTitle}` } },
  );
  console.log(`RENAME [${chapterTitle}] "${old}" -> "${newTitle}" (${videoId})`);
}

async function renameAnyByTitle(currentTitle, newTitle, videoId) {
  const lesson = await Lesson.findOne({ title: currentTitle });
  if (!lesson) { console.log("NOT FOUND (rename):", currentTitle); return; }
  lesson.title = newTitle;
  await lesson.save();
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { $set: { videoUrl: embed(videoId), title: `Kiến thức: ${newTitle}` } },
  );
  console.log(`RENAME "${currentTitle}" -> "${newTitle}" (${videoId})`);
}

async function deleteByChapter(title, chapterTitle) {
  const chapter = await Chapter.findOne({ title: chapterTitle });
  const matches = await Lesson.find({ title, chapter: chapter?._id });
  if (matches.length === 0) { console.log("NOT FOUND (delete):", title, "/", chapterTitle); return; }
  for (const lesson of matches) {
    await Question.deleteMany({ lesson: lesson._id });
    await ReviewContent.deleteMany({ lesson: lesson._id });
    await Lesson.deleteOne({ _id: lesson._id });
    console.log(`DELETE [${chapterTitle}] "${title}" (${lesson._id})`);
  }
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // ===================== TOÁN — áp tên thật đã xác nhận từ VTV7 =====================
  await renameAnyByTitle("Đếm và nhận biết các số 0 đến 5", "Làm quen với các số 1, 2, 3, 4, 5", "Au9ZIpVYBZQ");
  await renameAnyByTitle("Đếm và nhận biết các số 6 đến 10", "Làm quen với các số 6, 7, 8, 9", "BRbQqCTVtDc");
  await renameAnyByTitle("Đọc, viết các số từ 0 đến 10", "Số 0 và số 10", "CMS8gr9Ldjg");
  await renameAnyByTitle("Trên - dưới, trước - sau", "Trên - dưới, Phải - trái, Trước - sau", "qyime_e1ZBA");
  await renameAnyByTitle(
    "Nhận biết hình vuông, hình tròn, hình tam giác, hình chữ nhật",
    "Hình vuông, hình tròn, hình tam giác và hình chữ nhật",
    "bAxZ1SfnTZg",
  );
  await renameAnyByTitle("Bảng cộng, bảng trừ trong phạm vi 10", "Bảng cộng trong phạm vi 10", "xSr74LoODLM");
  await renameAnyByTitle(
    "Tính nhẩm nhanh phép cộng, trừ trong phạm vi 10",
    "Luyện tập phép cộng, phép trừ phạm vi 10",
    "AT4PtMqsEl0",
  );
  await renameAnyByTitle("Nhận biết khối lập phương, khối hộp chữ nhật", "Khối hộp chữ nhật, khối lập phương", "4LsAwB_nMpE");
  await renameAnyByTitle("Ghép hình đơn giản từ các hình đã học", "Hoạt động thực hành và trải nghiệm", "zALVoyVYfdM");
  await renameAnyByTitle(
    "Ôn tập các số và phép tính trong phạm vi 100",
    "Hoạt động thực hành và trải nghiệm (ôn tập cuối năm)",
    "C9BjTx4zpho",
  );
  await renameAnyByTitle("Các số đến 20", "Các số trong phạm vi 20", "fHMj0sjsafc");
  await renameAnyByTitle("Luyện tập tổng hợp số trong phạm vi 100", "Chục và đơn vị", "kBQ3Z4MWVTM");
  await renameAnyByTitle("Đo độ dài bằng gang tay, bước chân", "Đo độ dài", "t5gipTbdq4g");
  await renameAnyByTitle(
    "So sánh độ dài các đoạn thẳng",
    "Xăng-ti-mét - Thực hành ước lượng và đo độ dài",
    "FW7NKwkFYMs",
  );
  await renameAnyByTitle("Các ngày trong tuần", "Các ngày trong tuần - Thực hành xem lịch", "v6NSUSM3RMk");
  await renameAnyByTitle("Xem giờ đúng trên đồng hồ", "Đồng hồ, thời gian", "VEdMa17tQs4");
  await renameAnyByTitle("Phép cộng trong phạm vi 20 không nhớ", "Phép cộng dạng 10+3, 14+3", "KcoLkXhqygU");
  await renameAnyByTitle("Phép trừ trong phạm vi 20 không nhớ", "Phép trừ dạng 13-3, 17-2", "CMz-lRgmEBo");
  await renameAnyByTitle("Tính nhẩm cộng trừ các số tròn chục", "Cộng, trừ các số tròn chục", "jjfRtB3_GrM");
  await renameAnyByTitle("Phép cộng trong phạm vi 100 không nhớ", "Phép cộng không nhớ trong phạm vi 100", "14GTNU-_yA4");
  await renameAnyByTitle("Phép trừ trong phạm vi 100 không nhớ", "Phép trừ không nhớ trong phạm vi 100", "R5a75bFsYCM");

  // ===================== TIẾNG VIỆT — revert các bài Vần bị đổi nhầm =====================
  await renameByChapter("Ghép âm đầu với vần tạo thành tiếng", "Học vần", "Vần ua, ưa, ai, oi", "IknbUlA17Zk");
  await renameByChapter("Vần có âm cuối đơn giản (an, at, am...)", "Học vần", "Vần on, an, en, ên", "Hl9bEatBlTo");
  await renameByChapter("Vần có âm đệm đơn giản (oa, oe)", "Học vần", "Vần oa, oe, oai, oay", "lEsjMQQD5_s");
  await renameByChapter("Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", "Học âm và dấu thanh", "Âm t, th, ch, tr", "iY6zhkO6i2Q");
  await renameByChapter("Các nét cơ bản trong chữ viết", "Nét cơ bản và bảng chữ cái", "Các âm và nét cơ bản trong tiếng Việt", "7iqZnMY5kuc");

  // Các bài "orphan" không có video riêng khớp tên thật -> xoá theo đúng chỉ đạo
  // ("cùng lắm thì gộp bài") thay vì gán nhầm tên/video.
  await deleteByChapter("Ghép âm đầu với vần tạo thành tiếng", "Ghép âm, vần, tiếng");
  await deleteByChapter("Vần có âm cuối đơn giản (an, at, am...)", "Ghép âm, vần, tiếng");
  await deleteByChapter("Vần có âm đệm đơn giản (oa, oe)", "Ghép âm, vần, tiếng");
  await deleteByChapter("Các nét cơ bản trong chữ viết", "Luyện viết chữ và chính tả cơ bản");
  await deleteByChapter("Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", "Luyện viết chữ và chính tả cơ bản");
  await deleteByChapter("Phân biệt âm đầu dễ nhầm lẫn (l/n, ch/tr)", "Ôn tập cuối năm (Tiếng Việt)");

  console.log("\nDone.");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
