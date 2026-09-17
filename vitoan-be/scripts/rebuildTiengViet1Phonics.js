// Dựng lại phần NGỮ ÂM (chữ cái, âm, vần) của Tiếng Việt lớp 1 — Tập 1 — theo ĐÚNG
// 81 bài thật của SGK "Kết nối tri thức với cuộc sống". Nguồn đối chiếu (trang bán
// sách điện tử chính hãng của NXB, đã đối chiếu khớp cả mục lục Tập 2 với dữ liệu đã
// dựng trước đó): https://giaokhoaonline.com/tieng-viet-lop-1-tap-1-ket-noi-tri-thuc/
// Nội dung câu hỏi do dự án tự biên soạn theo đúng danh sách chữ/âm/vần công khai của
// từng bài — không sao chép nội dung, hình ảnh hay bài tập từ SGK.
require("dotenv").config();
const mongoose = require("mongoose");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");

function embed(id) {
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

// [số bài, tên bài] — đúng 81 bài Tập 1 theo mục lục NXB.
const BAI_LIST = [
  [1, "A, a"], [2, "B, b, dấu huyền"], [3, "C, c, dấu sắc"], [4, "E, e; Ê, ê"], [5, "Ôn tập và kể chuyện"],
  [6, "O, o"], [7, "Ô, ô"], [8, "D, d; Đ, đ"], [9, "Ơ, ơ, dấu ngã"], [10, "Ôn tập và kể chuyện"],
  [11, "I, i; K, k"], [12, "H, h; L, l"], [13, "U, u; Ư, ư"], [14, "Ch, ch; Kh, kh"], [15, "Ôn tập và kể chuyện"],
  [16, "M, m; N, n"], [17, "G, g; Gi, gi"], [18, "Gh, gh; Nh, nh"], [19, "Ng, ng; Ngh, ngh"], [20, "Ôn tập và kể chuyện"],
  [21, "R, r; S, s"], [22, "T, t; Tr, tr"], [23, "Th, th; ia"], [24, "ua; ưa"], [25, "Ôn tập và kể chuyện"],
  [26, "Ph, ph; Qu, qu"], [27, "V, v; X, x"], [28, "Y, y"], [29, "Luyện tập quy tắc chính tả"], [30, "Ôn tập và kể chuyện"],
  [31, "an; ăn; ân"], [32, "on; ôn; ơn"], [33, "en; ên; in; un"], [34, "am; ăm; âm"], [35, "Ôn tập và kể chuyện"],
  [36, "om; ôm; ơm"], [37, "em; êm; im; um"], [38, "ai; ay; ây"], [39, "oi; ôi; ơi"], [40, "Ôn tập và kể chuyện"],
  [41, "ui; ưi"], [42, "ao; eo"], [43, "au; âu; êu"], [44, "iu; ưu"], [45, "Ôn tập và kể chuyện"],
  [46, "ac; ăc; âc"], [47, "oc; ôc; uc; ưc"], [48, "at; ăt; ât"], [49, "ot; ôt; ơt"], [50, "Ôn tập và kể chuyện"],
  [51, "ap; ăp; âp"], [52, "op; ôp; ơp"], [53, "Ôn tập và kể chuyện"], [54, "ep; êp; ip; up"], [55, "anh; ênh; inh"],
  [56, "ach; êch; ich"], [57, "ang; ăng; âng"], [58, "Ôn tập và kể chuyện"], [59, "ong; ông; ung; ưng"], [60, "iêc; iên; iêp"],
  [61, "iêng; iêm; yên"], [62, "iêt; yêu; iêu"], [63, "Ôn tập và kể chuyện"], [64, "uôi; uôm"], [65, "uôc; uôt"],
  [66, "uôn; uông"], [67, "ươi; ươu"], [68, "Ôn tập và kể chuyện"], [69, "ươc; ươt"], [70, "ươm; ươp"],
  [71, "ươn; ương"], [72, "oa; oe"], [73, "Ôn tập và kể chuyện"], [74, "oan; oăn; oat; oăt"], [75, "oai; uê; uy"],
  [76, "uân; uât"], [77, "uyên; uyêt"], [78, "Ôn tập và kể chuyện"], [79, "Ôn tập"], [80, "Ôn tập"], [81, "Ôn tập"],
];

// Video đã xác minh trước đó, tái dùng cho những bài trùng đúng chủ đề (chữ cái đầu).
const VIDEO_MAP = {
  "A, a": "Au9ZIpVYBZQ",
  "B, b, dấu huyền": "1hP3H8bwC8Q",
  "Ơ, ơ, dấu ngã": "lzJM5WkDzxQ",
  "I, i; K, k": "t1IUfKVg-Zo",
  "H, h; L, l": "-O4dFQ3Xkcw",
  "R, r; S, s": "ppZhel4eL80",
  "Th, th; ia": "iY6zhkO6i2Q",
  "ua; ưa": "IknbUlA17Zk",
  "on; ôn; ơn": "Hl9bEatBlTo",
  "oi; ôi; ơi": "6_oVgekTE4U",
  "ao; eo": "9su99pQjkp8",
  "au; âu; êu": "WhvQg7l_bi8",
  "iêng; iêm; yên": "jUOhq8GOP9k",
  "iêt; yêu; iêu": "jXy6gESJiKA",
  "oa; oe": "lEsjMQQD5_s",
};

function isReview(title) {
  return title.startsWith("Ôn tập") || title.startsWith("Luyện tập");
}

// Sinh câu hỏi theo nội dung chữ/âm/vần của từng bài — tự biên soạn, không sao chép SGK.
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
    { text: `Bài ${bai} dạy em nhận biết âm/chữ nào sau đây?`, choices: [first, "Không có trong bài", "Một âm hoàn toàn khác", "Không xác định"], correctIndex: 0, explanation: `Bài ${bai} dạy: ${title}`, difficulty: "easy" },
    { text: `Khi học "${first}", em cần tập đọc đúng và viết đúng nét chữ. Điều này giúp ích gì?`, choices: ["Không có tác dụng gì", "Đọc, viết đúng chính tả tiếng Việt", "Chỉ để trang trí vở", "Không liên quan đến học tập"], correctIndex: 1, explanation: "Học đúng âm/chữ giúp đọc và viết đúng chính tả", difficulty: "easy" },
    { text: `Muốn ghép "${first}" với các âm khác thành tiếng có nghĩa, em cần làm gì?`, choices: ["Ghép âm đầu với vần rồi thêm dấu thanh nếu có", "Không cần ghép gì", "Chỉ đọc rời từng chữ cái", "Ghép ngẫu nhiên không theo quy tắc"], correctIndex: 0, explanation: "Cần ghép âm đầu với vần, thêm dấu thanh để tạo thành tiếng có nghĩa", difficulty: "medium" },
    { text: `Sau khi học bài ${bai}, em nên luyện tập bằng cách nào?`, choices: ["Không cần luyện tập", "Đọc và viết lại nhiều lần các chữ/âm đã học", "Chỉ học thuộc lòng không cần viết", "Bỏ qua phần luyện viết"], correctIndex: 1, explanation: "Luyện đọc và viết lại giúp ghi nhớ chữ/âm đã học", difficulty: "medium" },
  ];
}

const chapterCache = new Map();
async function getChapter(title, subject, grade, order, semester) {
  const key = `${subject._id}:${grade._id}:${title}`;
  if (chapterCache.has(key)) return chapterCache.get(key);
  const chapter = await Chapter.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id },
    { title, subject: subject._id, grade: grade._id, order, semester },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  chapterCache.set(key, chapter);
  return chapter;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  // Xoá sạch các chương ngữ âm cũ (Tập 1) để dựng lại đúng 81 bài.
  const OLD_CHAPTERS = ["Nét cơ bản và bảng chữ cái", "Học âm và dấu thanh", "Học vần", "Ôn tập giữa học kỳ 1 (Tiếng Việt)", "Ôn tập cuối học kỳ 1 (Tiếng Việt)"];
  for (const title of OLD_CHAPTERS) {
    const chapter = await Chapter.findOne({ title, subject: tv._id, grade: lop1._id });
    if (!chapter) continue;
    const lessons = await Lesson.find({ chapter: chapter._id });
    await Question.deleteMany({ lesson: { $in: lessons.map((l) => l._id) } });
    await ReviewContent.deleteMany({ lesson: { $in: lessons.map((l) => l._id) } });
    await Lesson.deleteMany({ chapter: chapter._id });
    await Chapter.deleteOne({ _id: chapter._id });
    console.log(`Đã xoá chương cũ "${title}" (${lessons.length} bài)`);
  }

  let n = 0;
  // Chia 81 bài thành 4 chương lớn (mỗi ~20 bài) để dễ điều hướng, giữ đúng thứ tự.
  const GROUPS = [
    { title: "Học chữ cái và âm đầu (Bài 1-20)", range: [1, 20] },
    { title: "Học vần có âm cuối (Bài 21-40)", range: [21, 40] },
    { title: "Học vần nâng cao (Bài 41-60)", range: [41, 60] },
    { title: "Học vần phức tạp và ôn tập cuối kỳ (Bài 61-81)", range: [61, 81] },
  ];

  for (let gi = 0; gi < GROUPS.length; gi++) {
    const group = GROUPS[gi];
    const chapter = await getChapter(group.title, tv, lop1, gi + 1, 1);
    for (const [bai, title] of BAI_LIST) {
      if (bai < group.range[0] || bai > group.range[1]) continue;
      const lessonTitle = `Bài ${bai}: ${title}`;
      const lesson = await Lesson.findOneAndUpdate(
        { title: lessonTitle, subject: tv._id, grade: lop1._id, chapter: chapter._id },
        { title: lessonTitle, description: isReview(title) ? "Ôn tập và kể chuyện." : `Học nhận biết, đọc và viết: ${title}.`, subject: tv._id, grade: lop1._id, chapter: chapter._id, order: bai, isPublished: true, isTrial: bai <= 2 },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      const existingCount = await Question.countDocuments({ lesson: lesson._id });
      if (existingCount === 0) {
        await Question.insertMany(genQuestions(bai, title).map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
      }
      await ReviewContent.findOneAndUpdate(
        { lesson: lesson._id },
        { $set: { title: `Kiến thức: ${lessonTitle}`, videoUrl: embed(VIDEO_MAP[title]) } },
        { upsert: true, setDefaultsOnInsert: true },
      );
      n++;
    }
  }

  console.log(`\nĐã tạo ${n} bài ngữ âm Tiếng Việt lớp 1 theo đúng 81 bài SGK Kết nối tri thức Tập 1.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
