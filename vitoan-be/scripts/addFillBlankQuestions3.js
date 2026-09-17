// Phủ kín toàn bộ 41 bài Toán lớp 1 bằng câu "điền vào chỗ trống" (thêm 15 bài còn
// thiếu), tăng thêm 1 câu nữa cho 16 bài mới có đúng 1 câu (để mỗi bài đều có ít
// nhất 2 câu dạng này), và thêm "nghe rồi điền" cho 16 bài Ôn tập ngữ âm Tiếng Việt
// (trước đây chỉ có ở các bài học âm/vần mới, chưa có ở bài ôn tập).
require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");

async function addQuestion({ lesson, type, text, audioText, correctText, explanation }) {
  const existing = await Question.findOne({ lesson: lesson._id, type, text, correctText });
  if (existing) return false;
  const maxOrderDoc = await Question.findOne({ lesson: lesson._id }).sort({ order: -1 });
  await Question.create({
    lesson: lesson._id,
    type,
    text,
    audioText: audioText || "",
    correctText,
    explanation: explanation || "",
    difficulty: "easy",
    order: (maxOrderDoc?.order ?? -1) + 1,
  });
  return true;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const toan = await Subject.findOne({ slug: "toan" });
  const tv = await Subject.findOne({ slug: "tieng-viet" });
  const lop1 = await Grade.findOne({ slug: "lop-1" });

  let toanAdded = 0;

  // ===== 15 bài Toán lớp 1 còn thiếu hẳn câu fill_blank =====
  const TOAN_NEW = [
    { title: "Dài hơn, ngắn hơn", text: "Nếu bút chì A dài hơn bút chì B thì bút chì B ___ hơn bút chì A.", correctText: "ngắn" },
    { title: "Thực hành lắp ghép, xếp hình", text: "Muốn xếp một hình vuông từ các que tính bằng nhau, em cần dùng ___ que.", correctText: "4" },
    { title: "Vị trí, định hướng trong không gian", text: "Đối diện với bên trái là bên ___.", correctText: "phải" },
    { title: "Nhiều hơn, ít hơn, bằng nhau", text: "5 quả táo và 5 quả cam có số lượng ___ nhau.", correctText: "bằng" },
    { title: "Thực hành ước lượng và đo độ dài", text: "Đơn vị đo độ dài chuẩn thường dùng là xăng-ti-___.", correctText: "mét" },
    { title: "Thực hành xem lịch và giờ", text: "Một năm có ___ tháng.", correctText: "12" },
  ];
  for (const item of TOAN_NEW) {
    const lesson = await Lesson.findOne({ title: item.title, subject: toan._id, grade: lop1._id });
    if (!lesson) { console.log(`  [bỏ qua] Không tìm thấy bài Toán: "${item.title}"`); continue; }
    const added = await addQuestion({
      lesson, type: "fill_blank",
      text: `Bạn hãy điền số/từ thích hợp vào ô trống.\n${item.text}`,
      correctText: item.correctText,
    });
    if (added) toanAdded++;
  }

  // "Luyện tập chung" ở các chủ đề khác — cần lọc theo chương vì tên bài trùng nhau.
  const TOAN_LTC = [
    { chapterTitle: "Chủ đề 5: Ôn tập học kì 1", text: "9 - 4 = ___", correctText: "5" },
    { chapterTitle: "Chủ đề 2: Làm quen với một số hình phẳng", text: "Hình có 3 cạnh gọi là hình ___.", correctText: "tam giác" },
    { chapterTitle: "Chủ đề 4: Làm quen với một số hình khối", text: "Khối có 6 mặt đều là hình vuông gọi là khối ___.", correctText: "lập phương" },
    { chapterTitle: "Chủ đề 6: Các số đến 100", text: "Số liền sau của 79 là ___.", correctText: "80" },
    { chapterTitle: "Chủ đề 7: Độ dài và đo độ dài", text: "1 mét bằng ___ xăng-ti-mét.", correctText: "100" },
    { chapterTitle: "Chủ đề 9: Thời gian, giờ và lịch", text: "Một ngày có ___ giờ.", correctText: "24" },
    { chapterTitle: "Chủ đề 10: Ôn tập cuối năm", text: "58 + 21 = ___", correctText: "79" },
    { chapterTitle: "Chủ đề 1: Các số từ 0 đến 10", text: "8 - 5 = ___", correctText: "3" },
  ];
  for (const item of TOAN_LTC) {
    const chapter = await Chapter.findOne({ title: item.chapterTitle, subject: toan._id, grade: lop1._id });
    const lesson = chapter && (await Lesson.findOne({ title: "Luyện tập chung", chapter: chapter._id }));
    if (!lesson) { console.log(`  [bỏ qua] Không tìm thấy "Luyện tập chung" trong "${item.chapterTitle}"`); continue; }
    const added = await addQuestion({
      lesson, type: "fill_blank",
      text: `Bạn hãy điền số/từ thích hợp vào ô trống.\n${item.text}`,
      correctText: item.correctText,
    });
    if (added) toanAdded++;
  }

  // ===== Thêm câu thứ 2 cho 16 bài Toán mới chỉ có đúng 1 câu fill_blank =====
  const TOAN_SECOND = [
    ["6aaae3b2b2aac220f66a2783", "Khối hộp chữ nhật có ___ mặt.", "6"],
    ["6aaae3b2b2aac220f66a278a", "Số nhỏ nhất trong các số từ 0 đến 10 là ___.", "0"],
    ["6aaae3b2b2aac220f66a2793", "Số 47 gồm 4 chục và ___ đơn vị.", "7"],
    ["6aaae3b2b2aac220f66a27b0", "Kim ngắn chỉ số 3, kim dài chỉ số 12, đồng hồ chỉ ___ giờ.", "3"],
    ["6aaae3b2b2aac220f66a27b9", "10 - 7 = ___", "3"],
    ["6aaae3b2b2aac220f66a2795", "So sánh 68 và 39, điền dấu <, > hoặc =: 68 ___ 39", ">"],
    ["6aaae3b2b2aac220f66a279e", "20 cm dài hơn 15 cm là ___ cm.", "5"],
    ["6aaae3b2b2aac220f66a27b2", "Sau ngày thứ Hai là ngày ___.", "thứ Ba"],
    ["6aaae3b2b2aac220f66a27bb", "100 - 45 = ___", "55"],
    ["6aaae3b2b2aac220f66a278e", "Hình tròn có ___ cạnh.", "0"],
    ["6aaae3b2b2aac220f66a2797", "Số liền trước của 50 là ___.", "49"],
    ["6aaae3b2b2aac220f66a27bd", "Hình vuông có ___ cạnh bằng nhau.", "4"],
    ["6aaae3b2b2aac220f66a276c", "So sánh 3 và 8, điền dấu <, > hoặc =: 3 ___ 8", "<"],
    ["6aaae3b2b2aac220f66a2780", "10 - 5 = ___", "5"],
    ["6aaae3b2b2aac220f66a276e", "7 gồm 4 và ___.", "3"],
    ["6aaae3b2b2aac220f66a27ad", "50 - 30 = ___", "20"],
  ];
  for (const [id, text, correctText] of TOAN_SECOND) {
    const lesson = await Lesson.findById(id);
    if (!lesson) { console.log(`  [bỏ qua] Không tìm thấy lesson id ${id}`); continue; }
    const added = await addQuestion({
      lesson, type: "fill_blank",
      text: `Bạn hãy điền số/từ/dấu thích hợp vào ô trống.\n${text}`,
      correctText,
    });
    if (added) toanAdded++;
  }

  // ===== Tiếng Việt: thêm listen_fill cho 16 bài "Ôn tập và kể chuyện" ngữ âm =====
  // Mỗi bài ôn tập ôn lại 4 bài liền trước — hỏi lại 2 trong số các vần đó.
  const TV_REVIEW = [
    ["Bài 5: Ôn tập và kể chuyện", ["a", "b"]],
    ["Bài 10: Ôn tập và kể chuyện", ["o", "ô"]],
    ["Bài 15: Ôn tập và kể chuyện", ["i", "u"]],
    ["Bài 20: Ôn tập và kể chuyện", ["m", "g"]],
    ["Bài 25: Ôn tập và kể chuyện", ["r", "t"]],
    ["Bài 30: Ôn tập và kể chuyện", ["ph", "v"]],
    ["Bài 35: Ôn tập và kể chuyện", ["an", "on"]],
    ["Bài 40: Ôn tập và kể chuyện", ["om", "ai"]],
    ["Bài 45: Ôn tập và kể chuyện", ["ui", "ao"]],
    ["Bài 50: Ôn tập và kể chuyện", ["ac", "oc"]],
    ["Bài 55: Ôn tập và kể chuyện", ["et", "ut"]],
    ["Bài 60: Ôn tập và kể chuyện", ["ep", "anh"]],
    ["Bài 65: Ôn tập và kể chuyện", ["ong", "iêc"]],
    ["Bài 70: Ôn tập và kể chuyện", ["uôi", "uôc"]],
    ["Bài 75: Ôn tập và kể chuyện", ["ươc", "ươm"]],
    ["Bài 80: Ôn tập và kể chuyện", ["oan", "oai"]],
  ];
  let tvAdded = 0;
  for (const [title, vans] of TV_REVIEW) {
    const lesson = await Lesson.findOne({ title, subject: tv._id, grade: lop1._id });
    if (!lesson) { console.log(`  [bỏ qua] Không tìm thấy bài Tiếng Việt: "${title}"`); continue; }
    for (const van of vans) {
      const added = await addQuestion({
        lesson, type: "listen_fill",
        text: "Nghe cô đọc rồi điền đúng vần/chữ em vừa nghe vào ô trống.\n___",
        audioText: `Nghe cô đọc rồi điền đúng vần em vừa nghe vào ô trống. Vần ${van}.`,
        correctText: van,
        explanation: `Vần em vừa nghe là "${van}", đã học trong các bài trước bài ôn tập này.`,
      });
      if (added) tvAdded++;
    }
  }

  console.log(`\nĐã thêm ${toanAdded} câu "điền vào chỗ trống" cho Toán lớp 1.`);
  console.log(`Đã thêm ${tvAdded} câu "nghe rồi điền" cho các bài Ôn tập Tiếng Việt lớp 1.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
