// Mở rộng diện phủ câu hỏi "điền vào chỗ trống" / "nghe rồi điền" ra nhiều bài học
// hơn (tiếp nối scripts/addFillBlankQuestions.js), bám sát đúng chủ đề từng bài:
// - Toán lớp 1: thêm cho ~20 bài (số liền trước/sau, hình học, đo lường, thời gian,
//   so sánh, ôn tập...) mà trước đó chưa có.
// - Tiếng Việt lớp 1: mở rộng "nghe rồi điền" ra hết các bài vần Bài 21-79 (bỏ các
//   bài Ôn tập và bài không có vần cụ thể).
require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Grade = require("../models/Grade");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");

async function addQuestion({ lesson, type, text, audioText, correctText, explanation, difficulty }) {
  const existing = await Question.findOne({ lesson: lesson._id, type, text });
  if (existing) return false;
  const maxOrderDoc = await Question.findOne({ lesson: lesson._id }).sort({ order: -1 });
  await Question.create({
    lesson: lesson._id,
    type,
    text,
    audioText: audioText || "",
    correctText,
    explanation: explanation || "",
    difficulty: difficulty || "easy",
    order: (maxOrderDoc?.order ?? -1) + 1,
  });
  return true;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const toan = await Subject.findOne({ slug: "toan" });
  const tv = await Subject.findOne({ slug: "tieng-viet" });
  const lop1 = await Grade.findOne({ slug: "lop-1" });

  // ===== Toán lớp 1 — thêm fill_blank cho các bài chưa có =====
  const TOAN_FILL = [
    { title: "Các số 0, 1, 2, 3, 4, 5", items: [["Số liền sau của 3 là ___.", "4"], ["Số liền trước của 5 là ___.", "4"]] },
    { title: "Các số 6, 7, 8, 9, 10", items: [["Số liền sau của 8 là ___.", "9"], ["Số liền trước của 10 là ___.", "9"]] },
    {
      title: "Hình vuông, hình tròn, hình tam giác, hình chữ nhật",
      items: [["Hình vuông có ___ cạnh bằng nhau.", "4"], ["Hình tam giác có ___ cạnh.", "3"]],
    },
    { title: "Ôn tập các số trong phạm vi 10", items: [["Số lớn nhất trong các số từ 0 đến 10 là ___.", "10"]] },
    { title: "Số có hai chữ số", items: [["Số 23 gồm 2 chục và ___ đơn vị.", "3"]] },
    { title: "So sánh số có hai chữ số", items: [["So sánh 45 và 54, điền dấu <, > hoặc =: 45 ___ 54", "<"]] },
    { title: "Các ngày trong tuần", items: [["Một tuần có ___ ngày.", "7"]] },
    { title: "Xem giờ đúng trên đồng hồ", items: [["Một giờ có ___ phút.", "60"]] },
    { title: "Ôn tập các số và phép tính trong phạm vi 10", items: [["6 + 3 = ___", "9"]] },
    { title: "Ôn tập các số và phép tính trong phạm vi 100", items: [["45 + 20 = ___", "65"]] },
    { title: "Bảng các số từ 1 đến 100", items: [["Số liền sau của 99 là ___.", "100"]] },
    { title: "So sánh số", items: [["So sánh 7 và 4, điền dấu <, > hoặc =: 7 ___ 4", ">"]] },
    { title: "Mấy và mấy", items: [["5 gồm 2 và ___.", "3"]] },
    { title: "Ôn tập hình học", items: [["Hình chữ nhật có ___ cạnh.", "4"]] },
    { title: "Ôn tập hình học và đo lường", items: [["Hình tam giác có ___ cạnh.", "3"]] },
    { title: "Khối lập phương, khối hộp chữ nhật", items: [["Khối lập phương có ___ mặt.", "6"]] },
    { title: "Đơn vị đo độ dài", items: [["1 mét bằng ___ xăng-ti-mét.", "100"]] },
  ];

  let toanAdded = 0;
  for (const item of TOAN_FILL) {
    const lesson = await Lesson.findOne({ title: item.title, subject: toan._id, grade: lop1._id });
    if (!lesson) {
      console.log(`  [bỏ qua] Không tìm thấy bài Toán: "${item.title}"`);
      continue;
    }
    for (const [text, correctText] of item.items) {
      const added = await addQuestion({
        lesson,
        type: "fill_blank",
        text: `Bạn hãy điền số/dấu thích hợp vào ô trống.\n${text}`,
        correctText,
      });
      if (added) toanAdded++;
    }
  }

  // 2 bài "Luyện tập chung" liên quan phép tính — cần lọc theo đúng chương vì tên
  // bài này lặp lại ở nhiều chủ đề khác nhau (hình học, thời gian...).
  const LUYEN_TAP_CHUNG = [
    { chapterTitle: "Chủ đề 3: Phép cộng, phép trừ trong phạm vi 10", text: "7 - 2 = ___", correctText: "5" },
    { chapterTitle: "Chủ đề 8: Phép cộng, phép trừ (không nhớ) trong phạm vi 100", text: "36 + 12 = ___", correctText: "48" },
  ];
  for (const item of LUYEN_TAP_CHUNG) {
    const chapter = await Chapter.findOne({ title: item.chapterTitle, subject: toan._id, grade: lop1._id });
    const lesson = chapter && (await Lesson.findOne({ title: "Luyện tập chung", chapter: chapter._id }));
    if (!lesson) {
      console.log(`  [bỏ qua] Không tìm thấy "Luyện tập chung" trong "${item.chapterTitle}"`);
      continue;
    }
    const added = await addQuestion({
      lesson,
      type: "fill_blank",
      text: `Bạn hãy điền số thích hợp vào ô trống.\n${item.text}`,
      correctText: item.correctText,
    });
    if (added) toanAdded++;
  }

  // ===== Tiếng Việt lớp 1 — mở rộng listen_fill ra Bài 21-79 =====
  const TV_LISTEN_2 = [
    ["Bài 21: R, r; S, s", "r"],
    ["Bài 22: T, t; Tr, tr", "t"],
    ["Bài 23: Th, th; ia", "th"],
    ["Bài 24: ua; ưa", "ua"],
    ["Bài 26: Ph, ph; Qu, qu", "ph"],
    ["Bài 27: V, v; X, x", "v"],
    ["Bài 28: Y, y", "y"],
    ["Bài 31: an; ăn; ân", "an"],
    ["Bài 32: on; ôn; ơn", "on"],
    ["Bài 33: en; ên; in; un", "en"],
    ["Bài 34: am; ăm; âm", "am"],
    ["Bài 36: om; ôm; ơm", "om"],
    ["Bài 37: em; êm; im; um", "em"],
    ["Bài 38: ai; ay; ây", "ai"],
    ["Bài 39: oi; ôi; ơi", "oi"],
    ["Bài 41: ui; ưi", "ui"],
    ["Bài 42: ao; eo", "ao"],
    ["Bài 43: au; âu; êu", "au"],
    ["Bài 44: iu; ưu", "iu"],
    ["Bài 46: ac; ăc; âc", "ac"],
    ["Bài 47: oc; ôc; uc; ưc", "oc"],
    ["Bài 48: at; ăt; ât", "at"],
    ["Bài 49: ot; ôt; ơt", "ot"],
    ["Bài 51: et; êt; it", "et"],
    ["Bài 52: ut; ưt", "ut"],
    ["Bài 53: ap; ăp; âp", "ap"],
    ["Bài 54: op; ôp; ơp", "op"],
    ["Bài 56: ep; êp; ip; up", "ep"],
    ["Bài 57: anh; ênh; inh", "anh"],
    ["Bài 58: ach; êch; ich", "ach"],
    ["Bài 59: ang; ăng; âng", "ang"],
    ["Bài 61: ong; ông; ung; ưng", "ong"],
    ["Bài 62: iêc; iên; iêp", "iêc"],
    ["Bài 63: iêng; iêm; yên", "iêng"],
    ["Bài 64: iêt; yêu; iêu", "iêt"],
    ["Bài 66: uôi; uôm", "uôi"],
    ["Bài 67: uôc; uôt", "uôc"],
    ["Bài 68: uôn; uông", "uôn"],
    ["Bài 69: ươi; ươu", "ươi"],
    ["Bài 71: ươc; ươt", "ươc"],
    ["Bài 72: ươm; ươp", "ươm"],
    ["Bài 73: ươn; ương", "ươn"],
    ["Bài 74: oa; oe", "oa"],
    ["Bài 76: oan; oăn; oat; oăt", "oan"],
    ["Bài 77: oai; uê; uy", "oai"],
    ["Bài 78: uân; uât", "uân"],
    ["Bài 79: uyên; uyêt", "uyên"],
  ];

  let tvAdded = 0;
  for (const [title, van] of TV_LISTEN_2) {
    const lesson = await Lesson.findOne({ title, subject: tv._id, grade: lop1._id });
    if (!lesson) {
      console.log(`  [bỏ qua] Không tìm thấy bài Tiếng Việt: "${title}"`);
      continue;
    }
    const added = await addQuestion({
      lesson,
      type: "listen_fill",
      text: "Nghe cô đọc rồi điền đúng vần/chữ em vừa nghe vào ô trống.\n___",
      audioText: `Nghe cô đọc rồi điền đúng vần em vừa nghe vào ô trống. Vần ${van}.`,
      correctText: van,
      explanation: `Vần em vừa nghe là "${van}".`,
    });
    if (added) tvAdded++;
  }

  console.log(`\nĐã thêm ${toanAdded} câu "điền vào chỗ trống" mới cho Toán lớp 1.`);
  console.log(`Đã thêm ${tvAdded} câu "nghe rồi điền" mới cho Tiếng Việt lớp 1 (Bài 21-79).`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
