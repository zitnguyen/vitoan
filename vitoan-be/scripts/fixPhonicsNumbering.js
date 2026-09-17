// Sửa lại đúng số thứ tự bài ngữ âm Tiếng Việt lớp 1 từ Bài 51 trở đi (bị lệch 2 số
// so với SGK thật, phát hiện khi đối chiếu video thật). Thêm 2 bài còn thiếu
// (Bài 51: et,êt,it / Bài 52: ut,ưt), dựng lại đúng 83 bài Tập 1 (không phải 81).
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

function embed(id) { return id ? `https://www.youtube.com/embed/${id}` : ""; }

// Bài 51-83 ĐÚNG theo SGK thật (đã đối chiếu qua video thật của nhiều nguồn độc lập).
const CORRECTED_TAIL = [
  [51, "et; êt; it", "nNWmq2mzhAo"],
  [52, "ut; ưt", "i_Q8Q1azBMY"],
  [53, "ap; ăp; âp", "8OlP21ad0GI"],
  [54, "op; ôp; ơp", "T9kHeRB48Og"],
  [55, "Ôn tập và kể chuyện", "5yUc1w-X83Y"],
  [56, "ep; êp; ip; up", "d0OwtFhC03I"],
  [57, "anh; ênh; inh", "mRLQWTCmolo"],
  [58, "ach; êch; ich", "mgZ9HOCMN6s"],
  [59, "ang; ăng; âng", "G0a8ZBtnnJg"],
  [60, "Ôn tập và kể chuyện", "W7FlgqTYlFA"],
  [61, "ong; ông; ung; ưng", "rpIqD3EyLSc"],
  [62, "iêc; iên; iêp", "nJVzLzBPPZU"],
  [63, "iêng; iêm; yên", "b7m2CjTndGw"],
  [64, "iêt; yêu; iêu", "vLumrgaTWsw"],
  [65, "Ôn tập và kể chuyện", "gMEHwrwMB1k"],
  [66, "uôi; uôm", "rUa82qUrbsg"],
  [67, "uôc; uôt", "6jxtL-dJx1I"],
  [68, "uôn; uông", "p8er13WTCEM"],
  [69, "ươi; ươu", "1HASQbmBeSE"],
  [70, "Ôn tập và kể chuyện", "bOm2XS7hUro"],
  [71, "ươc; ươt", "Ttkvg7URxqI"],
  [72, "ươm; ươp", "RFMA9CJWf2g"],
  [73, "ươn; ương", "VaLbGs_ZoAA"],
  [74, "oa; oe", "xlSZ0AjuqI4"],
  [75, "Ôn tập và kể chuyện", "wWotRaXb7MM"],
  [76, "oan; oăn; oat; oăt", "tH5QmiwIU9k"],
  [77, "oai; uê; uy", "nNnxQ0zahoc"],
  [78, "uân; uât", "whbh8dr3mEs"],
  [79, "uyên; uyêt", "047C5X3EB_E"],
  [80, "Ôn tập và kể chuyện", "bOm2XS7hUro"],
  [81, "Ôn tập", "wWotRaXb7MM"],
  [82, "Ôn tập", "b0yp6JhMObY"],
  [83, "Ôn tập", "hhXchr2pxwo"],
];

function isReview(title) { return title.startsWith("Ôn tập") || title.startsWith("Luyện tập"); }

function genQuestions(bai, title) {
  if (isReview(title)) {
    return [
      { text: `Bài ${bai} là bài ôn tập. Mục đích chính của bài ôn tập là gì?`, choices: ["Học âm/chữ hoàn toàn mới", "Củng cố lại các âm, chữ đã học trước đó", "Không có mục đích gì", "Chỉ để giải trí"], correctIndex: 1, explanation: "Bài ôn tập giúp củng cố lại kiến thức các bài trước", difficulty: "easy" },
      { text: "Khi ôn tập, em nên làm gì để nhớ bài lâu hơn?", choices: ["Đọc lại và luyện viết nhiều lần", "Chỉ đọc 1 lần", "Không cần ôn lại", "Bỏ qua phần khó"], correctIndex: 0, explanation: "Đọc lại và luyện viết nhiều lần giúp ghi nhớ lâu hơn", difficulty: "easy" },
      { text: "Trong giờ kể chuyện, em cần chú ý điều gì?", choices: ["Không cần nghe", "Lắng nghe và theo dõi tranh minh hoạ", "Chỉ nhìn tranh, không nghe", "Nói chuyện riêng"], correctIndex: 1, explanation: "Cần lắng nghe và theo dõi tranh để hiểu câu chuyện", difficulty: "easy" },
      { text: "Ôn tập thường xuyên giúp ích gì cho việc học?", choices: ["Không có tác dụng", "Giúp nắm chắc kiến thức nền tảng", "Làm mất thời gian", "Chỉ cần thiết cho học sinh giỏi"], correctIndex: 1, explanation: "Ôn tập thường xuyên giúp nắm chắc kiến thức nền tảng", difficulty: "medium" },
    ];
  }
  const items = title.split(/;|,/).map((s) => s.trim()).filter(Boolean);
  const first = items[0] || title;
  return [
    { text: `Bài ${bai} dạy em nhận biết âm/vần nào sau đây?`, choices: [first, "Không có trong bài", "Một âm hoàn toàn khác", "Không xác định"], correctIndex: 0, explanation: `Bài ${bai} dạy: ${title}`, difficulty: "easy" },
    { text: `Khi học "${first}", em cần tập đọc đúng và viết đúng nét chữ. Điều này giúp ích gì?`, choices: ["Không có tác dụng gì", "Đọc, viết đúng chính tả tiếng Việt", "Chỉ để trang trí vở", "Không liên quan đến học tập"], correctIndex: 1, explanation: "Học đúng âm/chữ giúp đọc và viết đúng chính tả", difficulty: "easy" },
    { text: `Muốn ghép "${first}" với các âm khác thành tiếng có nghĩa, em cần làm gì?`, choices: ["Ghép âm đầu với vần rồi thêm dấu thanh nếu có", "Không cần ghép gì", "Chỉ đọc rời từng chữ cái", "Ghép ngẫu nhiên không theo quy tắc"], correctIndex: 0, explanation: "Cần ghép âm đầu với vần, thêm dấu thanh để tạo thành tiếng có nghĩa", difficulty: "medium" },
    { text: `Sau khi học bài ${bai}, em nên luyện tập bằng cách nào?`, choices: ["Không cần luyện tập", "Đọc và viết lại nhiều lần các chữ/âm đã học", "Chỉ học thuộc lòng không cần viết", "Bỏ qua phần luyện viết"], correctIndex: 1, explanation: "Luyện đọc và viết lại giúp ghi nhớ chữ/âm đã học", difficulty: "medium" },
  ];
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  // Xoá các bài cũ từ "Bài 51:" trở đi trong 2 chương cuối (chứa toàn bộ đoạn lệch số).
  const chap3 = await Chapter.findOne({ title: "Học vần nâng cao (Bài 41-60)", subject: tv._id, grade: lop1._id });
  const chap4 = await Chapter.findOne({ title: "Học vần phức tạp và ôn tập cuối kỳ (Bài 61-81)", subject: tv._id, grade: lop1._id });
  const oldLessons = await Lesson.find({
    subject: tv._id, grade: lop1._id,
    chapter: { $in: [chap3?._id, chap4?._id].filter(Boolean) },
    title: { $regex: "^Bài (5[1-9]|[67][0-9]|8[01]):" },
  });
  await Question.deleteMany({ lesson: { $in: oldLessons.map((l) => l._id) } });
  await ReviewContent.deleteMany({ lesson: { $in: oldLessons.map((l) => l._id) } });
  await Lesson.deleteMany({ _id: { $in: oldLessons.map((l) => l._id) } });
  console.log(`Đã xoá ${oldLessons.length} bài cũ (Bài 51-81, số lệch).`);

  // Đổi tên 2 chương lại đúng phạm vi mới.
  await Chapter.updateOne({ _id: chap3._id }, { $set: { title: "Học vần nâng cao (Bài 41-62)" } });
  await Chapter.updateOne({ _id: chap4._id }, { $set: { title: "Học vần phức tạp và ôn tập cuối kỳ (Bài 63-83)" } });
  const chap3New = await Chapter.findById(chap3._id);
  const chap4New = await Chapter.findById(chap4._id);

  let n = 0;
  for (const [bai, content, videoId] of CORRECTED_TAIL) {
    const chapter = bai <= 62 ? chap3New : chap4New;
    const lessonTitle = `Bài ${bai}: ${content}`;
    const lesson = await Lesson.findOneAndUpdate(
      { title: lessonTitle, subject: tv._id, grade: lop1._id, chapter: chapter._id },
      { title: lessonTitle, description: isReview(content) ? "Ôn tập và kể chuyện." : `Học nhận biết, đọc và viết: ${content}.`, subject: tv._id, grade: lop1._id, chapter: chapter._id, order: bai, isPublished: true, isTrial: false },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    const existingCount = await Question.countDocuments({ lesson: lesson._id });
    if (existingCount === 0) {
      await Question.insertMany(genQuestions(bai, content).map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
    }
    await ReviewContent.findOneAndUpdate(
      { lesson: lesson._id },
      { $set: { title: `Kiến thức: ${lessonTitle}`, videoUrl: embed(videoId) } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    n++;
  }

  console.log(`\nĐã tạo lại ${n} bài (Bài 51-83) với đúng số thứ tự SGK.`);
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
