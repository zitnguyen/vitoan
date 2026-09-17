require("dotenv").config();
const mongoose = require("mongoose");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");
const PracticeSet = require("../models/PracticeSet");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");

function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}

// ===== ÂM groups (9 lessons, following the standard Vietnamese alphabet teaching order) =====
const AM_GROUPS = [
  {
    letters: "a, b, c, o",
    title: "Âm a, b, c, o và dấu huyền, dấu sắc",
    video: "1hP3H8bwC8Q",
    content:
      "Âm a, b, c, o là những âm đầu tiên trong bảng chữ cái tiếng Việt. Dấu huyền (`) đọc thấp giọng xuống, dấu sắc (´) đọc cao giọng lên.",
    examples: ["bà (âm b + a + dấu huyền)", "cá (âm c + a + dấu sắc)", "bó (âm b + o + dấu sắc)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'b'?", choices: ["bà", "cá", "ô", "nhà"], correctIndex: 0 },
      { text: "Tiếng nào chứa âm 'c'?", choices: ["bà", "cá", "đi", "mẹ"], correctIndex: 1 },
      { text: "Dấu huyền có hình dạng nào?", choices: ["Nét thẳng đứng", "Nét xiên từ trên xuống, hướng trái", "Dấu chấm", "Dấu móc"], correctIndex: 1 },
      { text: "Tiếng 'bó' có dấu gì?", choices: ["Dấu huyền", "Dấu hỏi", "Dấu sắc", "Không có dấu"], correctIndex: 2 },
    ],
  },
  {
    letters: "ô, ơ, d, đ",
    title: "Âm ô, ơ, d, đ và dấu ngã, dấu hỏi",
    video: "lzJM5WkDzxQ",
    content:
      "Âm ô, ơ có cách mở miệng khác a rõ rệt. Chữ d và đ dễ nhầm vì chỉ khác nét ngang trên đầu chữ đ. Dấu ngã (~) đọc giọng gãy lên, dấu hỏi (?) đọc giọng xuống rồi lên.",
    examples: ["dê (âm d)", "đò (âm đ)", "cô đỡ (âm đ + dấu hỏi)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'đ'?", choices: ["dê", "đò", "cá", "bà"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'd'?", choices: ["đò", "dê", "ba", "mẹ"], correctIndex: 1 },
      { text: "Chữ đ khác chữ d ở điểm nào?", choices: ["Đ có thêm nét ngang trên đầu", "Đ không có nét móc", "D có dấu mũ", "Không khác nhau"], correctIndex: 0 },
      { text: "Dấu hỏi đọc giọng như thế nào?", choices: ["Đều đều", "Xuống rồi lên", "Chỉ lên cao", "Chỉ xuống thấp"], correctIndex: 1 },
    ],
  },
  {
    letters: "e, ê, h, k, kh",
    title: "Âm e, ê, h, k, kh và dấu nặng",
    video: "t1IUfKVg-Zo",
    content:
      "Âm e và ê phát âm gần giống nhau nhưng ê tròn môi hơn. Âm kh là âm ghép từ k và h, đọc bật hơi ở cổ họng. Dấu nặng (.) đọc giọng thấp và ngắn.",
    examples: ["hè (âm h)", "kẹo (âm k + dấu nặng)", "khế (âm kh)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'kh'?", choices: ["hè", "khế", "kẹo", "dê"], correctIndex: 1 },
      { text: "Tiếng nào có dấu nặng?", choices: ["hè", "kẹo", "khế", "cá"], correctIndex: 1 },
      { text: "Âm 'kh' được ghép từ hai chữ cái nào?", choices: ["k và h", "k và g", "n và h", "c và h"], correctIndex: 0 },
      { text: "Tiếng nào chứa âm 'h'?", choices: ["kẹo", "hè", "khế", "bó"], correctIndex: 1 },
    ],
  },
  {
    letters: "g, gh, i, gi",
    title: "Âm g, gh, i, gi",
    video: "vOPs6lWNfMY",
    content:
      "Âm g và gh đọc giống nhau nhưng gh chỉ viết trước i, e, ê. Âm gi cũng là âm ghép, đọc như 'd' trong nhiều vùng miền.",
    examples: ["gà (âm g)", "ghế (âm gh)", "gì (âm gi)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'gh'?", choices: ["gà", "ghế", "gì", "bà"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'g'?", choices: ["gà", "ghế", "gì", "hè"], correctIndex: 0 },
      { text: "Âm 'gh' thường đứng trước những chữ nào?", choices: ["a, o, u", "i, e, ê", "b, c, d", "không có quy tắc"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'gi'?", choices: ["gà", "ghế", "gì", "cá"], correctIndex: 2 },
    ],
  },
  {
    letters: "l, m, n, nh",
    title: "Âm l, m, n, nh",
    video: "-O4dFQ3Xkcw",
    content:
      "Âm l và n rất dễ nhầm lẫn khi phát âm, cần chú ý vị trí đầu lưỡi. Âm nh là âm ghép, đọc bật ra ở giữa lưỡi và vòm miệng.",
    examples: ["lá (âm l)", "nhà (âm nh)", "nụ (âm n)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'l'?", choices: ["lá", "nhà", "nụ", "bà"], correctIndex: 0 },
      { text: "Tiếng nào chứa âm 'nh'?", choices: ["lá", "nhà", "nụ", "cá"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'n'?", choices: ["lá", "nhà", "nụ", "hè"], correctIndex: 2 },
      { text: "Âm nào dễ bị nhầm lẫn với nhau nhất?", choices: ["l và n", "m và nh", "l và m", "n và nh"], correctIndex: 0 },
    ],
  },
  {
    letters: "ng, ngh, u, ư",
    title: "Âm ng, ngh, u, ư",
    video: "JdXQZHRXGTk",
    content:
      "Âm ng và ngh đọc giống nhau, ngh chỉ dùng trước i, e, ê giống quy tắc của gh. Âm u và ư khác nhau ở độ tròn môi khi phát âm.",
    examples: ["ngà (âm ng)", "nghé (âm ngh)", "sư tử (âm ư)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'ngh'?", choices: ["ngà", "nghé", "cá", "lá"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'ng'?", choices: ["nghé", "ngà", "bà", "nhà"], correctIndex: 1 },
      { text: "Âm 'ngh' thường đứng trước chữ nào?", choices: ["a, o, u", "i, e, ê", "b, c", "không quy tắc"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'ư'?", choices: ["ngà", "nghé", "sư (tử)", "gà"], correctIndex: 2 },
    ],
  },
  {
    letters: "qu, ph, r, v",
    title: "Âm qu, ph, r, v",
    video: "l3ZkvMW5UV0",
    content:
      "Âm qu là âm ghép từ q và u, luôn đi liền nhau. Âm ph đọc gần giống 'f' trong tiếng Anh. Âm r và v cũng cần phân biệt rõ khi đọc.",
    examples: ["quả (âm qu)", "phố (âm ph)", "vở (âm v)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'qu'?", choices: ["quả", "phố", "vở", "rổ"], correctIndex: 0 },
      { text: "Tiếng nào chứa âm 'ph'?", choices: ["quả", "phố", "vở", "rổ"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'v'?", choices: ["quả", "phố", "vở", "rổ"], correctIndex: 2 },
      { text: "Tiếng nào chứa âm 'r'?", choices: ["quả", "phố", "vở", "rổ"], correctIndex: 3 },
    ],
  },
  {
    letters: "t, th, ch, tr",
    title: "Âm t, th, ch, tr",
    video: "iY6zhkO6i2Q",
    content:
      "Âm th là âm ghép từ t và h, đọc bật hơi mạnh hơn t. Âm ch và tr là hai âm dễ nhầm lẫn với nhau, đầu lưỡi chạm vị trí gần giống nhau.",
    examples: ["tổ (âm t)", "thỏ (âm th)", "chó (âm ch)"],
    quiz: [
      { text: "Tiếng nào chứa âm 'th'?", choices: ["tổ", "thỏ", "chó", "trê"], correctIndex: 1 },
      { text: "Tiếng nào chứa âm 'ch'?", choices: ["tổ", "thỏ", "chó", "trê"], correctIndex: 2 },
      { text: "Tiếng nào chứa âm 'tr'?", choices: ["tổ", "thỏ", "chó", "trê (cá trê)"], correctIndex: 3 },
      { text: "Âm nào dễ nhầm lẫn với âm 'ch'?", choices: ["th", "tr", "t", "kh"], correctIndex: 1 },
    ],
  },
  {
    letters: "s, x, y, ia",
    title: "Âm s, x, y và vần ia",
    video: "ppZhel4eL80",
    content:
      "Âm s và x là hai âm dễ nhầm lẫn, cần chú ý vị trí đầu lưỡi khi phát âm. Chữ y đôi khi đóng vai trò như nguyên âm i. Vần ia là vần đôi đầu tiên các em được học.",
    examples: ["sẻ (âm s)", "xe (âm x)", "chia (vần ia)"],
    quiz: [
      { text: "Tiếng nào chứa âm 's'?", choices: ["sẻ", "xe", "chia", "y tá"], correctIndex: 0 },
      { text: "Tiếng nào chứa âm 'x'?", choices: ["sẻ", "xe", "chia", "y tá"], correctIndex: 1 },
      { text: "Tiếng nào chứa vần 'ia'?", choices: ["sẻ", "xe", "chia", "y tá"], correctIndex: 2 },
      { text: "Âm nào dễ nhầm lẫn với âm 's'?", choices: ["x", "y", "t", "k"], correctIndex: 0 },
    ],
  },
];

// ===== VẦN groups (23 lessons) =====
const VAN_GROUPS = [
  { van: "ua, ưa, ai, oi", title: "Vần ua, ưa, ai, oi", video: "IknbUlA17Zk", examples: ["mua (vần ua)", "cưa (vần ưa)", "mai (vần ai)"] },
  { van: "ôi, ui, uôi, ươi", title: "Vần ôi, ui, uôi, ươi", video: "6_oVgekTE4U", examples: ["bơi → ôi trong 'nồi'", "núi (vần ui)", "chuối (vần uôi)"] },
  { van: "ay, ây, eo, ao", title: "Vần ay, ây, eo, ao", video: "9su99pQjkp8", examples: ["máy bay (vần ay)", "cây (vần ây)", "mèo (vần eo)"] },
  { van: "au, âu, iu, êu", title: "Vần au, âu, iu, êu", video: "WhvQg7l_bi8", examples: ["rau (vần au)", "câu (vần âu)", "rìu (vần iu)"] },
  { van: "iêu, yêu, ưu, ươu", title: "Vần iêu, yêu, ưu, ươu", video: "jXy6gESJiKA", examples: ["diều (vần iêu)", "yêu thương (vần yêu)", "cừu (vần ưu)"] },
  { van: "on, an, en, ên", title: "Vần on, an, en, ên", video: "Hl9bEatBlTo", examples: ["con (vần on)", "bàn (vần an)", "sen (vần en)"] },
  { van: "iên, yên, uôn, ươn", title: "Vần iên, yên, uôn, ươn", video: "9NfxtRV6vKo", examples: ["tiên (vần iên)", "yên xe (vần yên)", "muốn (vần uôn)"] },
  { van: "ong, ăng, ung, ang", title: "Vần ong, ăng, ung, ang", video: "DcQPlRt5vXc", examples: ["bóng (vần ong)", "trăng (vần ăng)", "súng (vần ung)"] },
  { van: "eng, iêng, uông, ương", title: "Vần eng, iêng, uông, ương", video: "sdi0p-CSS5Q", examples: ["xẻng (vần eng)", "chiêng (vần iêng)", "chuông (vần uông)"] },
  { van: "anh, ênh, inh", title: "Vần anh, ênh, inh", video: "qx2TW8XaKM0", examples: ["cành (vần anh)", "kênh (vần ênh)", "bình (vần inh)"] },
  { van: "om, am, em, im", title: "Vần om, am, em, im", video: "jUOhq8GOP9k", examples: ["tôm (vần om)", "làm (vần am)", "kem (vần em)"] },
  { van: "iêm, yêm, uôm, ươm", title: "Vần iêm, yêm, uôm, ươm", video: "ws3c0d877NY", examples: ["chiêm (vần iêm)", "yếm (vần yêm)", "nhuộm (vần uôm)"] },
  { van: "ot, at, et, ut", title: "Vần ot, at, et, ut", video: "Vaa80uqEjvM", examples: ["hót (vần ot)", "hát (vần at)", "bét (vần et)"] },
  { van: "it, iêt, uôt, ươt", title: "Vần it, iêt, uôt, ươt", video: "IUiKpGaf8To", examples: ["mít (vần it)", "viết (vần iêt)", "chuột (vần uôt)"] },
  { van: "ăc, âc, uc, ưc", title: "Vần ăc, âc, uc, ưc", video: "2JIhCaWCa0A", examples: ["mắc áo (vần ăc)", "gấc (vần âc)", "chúc mừng (vần uc)"] },
  { van: "ôc, uôc, iêc, ươc", title: "Vần ôc, uôc, iêc, ươc", video: "R4cxe8X0NWU", examples: ["cóc (vần ôc)", "guốc (vần uôc)", "việc (vần iêc)"] },
  { van: "ach, êch, ich", title: "Vần ach, êch, ich", video: "wz4A-h29iCk", examples: ["sạch sẽ (vần ach)", "ếch (vần êch)", "thích (vần ich)"] },
  { van: "op, ap, ăp, âp", title: "Vần op, ap, ăp, âp", video: "FLvJwYSI6MI", examples: ["họp (vần op)", "đạp xe (vần ap)", "sắp (vần ăp)"] },
  { van: "ôp, ơp, ep, êp", title: "Vần ôp, ơp, ep, êp", video: "uogpxECj6SI", examples: ["hộp (vần ôp)", "hợp (vần ơp)", "đẹp (vần ep)"] },
  { van: "ip, up, iêp, ươp", title: "Vần ip, up, iêp, ươp", video: "Ri5v6O8sRYs", examples: ["nhịp (vần ip)", "búp (vần up)", "tiếp (vần iêp)"] },
  { van: "oa, oe, oai, oay", title: "Vần oa, oe, oai, oay", video: "lEsjMQQD5_s", examples: ["hoa (vần oa)", "khỏe (vần oe)", "xoài (vần oai)"] },
  { van: "oan, oăn, oang, oăng", title: "Vần oan, oăn, oang, oăng", video: "pNs_t7FFbxs", examples: ["ngoan (vần oan)", "xoăn (vần oăn)", "hoang (vần oang)"] },
  { van: "oanh, oach, oat, oăt", title: "Vần oanh, oach, oat, oăt", video: "hlE-cAzVPiE", examples: ["doanh trại (vần oanh)", "thoát (vần oat)", "nhọn hoắt (vần oăt)"] },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const grade1 = await Grade.findOne({ slug: "lop-1" });
  const tvSubject = await Subject.findOne({ slug: "tieng-viet" });

  const oldChapterTitles = ["Làm quen chữ cái và nét cơ bản", "Âm - vần - chữ viết"];
  const oldChapters = await Chapter.find({ subject: tvSubject._id, grade: grade1._id, title: { $in: oldChapterTitles } });
  const oldChapterIds = oldChapters.map((c) => c._id);
  const oldLessons = await Lesson.find({ chapter: { $in: oldChapterIds } });
  const oldLessonIds = oldLessons.map((l) => l._id);

  console.log(`Removing ${oldLessons.length} old coarse-grained lessons across ${oldChapters.length} chapters...`);
  await Question.deleteMany({ lesson: { $in: oldLessonIds } });
  await ReviewContent.deleteMany({ lesson: { $in: oldLessonIds } });
  await PracticeSet.deleteMany({ lesson: { $in: oldLessonIds } });
  await Lesson.deleteMany({ _id: { $in: oldLessonIds } });
  await Chapter.deleteMany({ _id: { $in: oldChapterIds } });

  // Shift all other semester-1 TV chapters' order up to make room for 3 new chapters at order 1,2,3
  const otherSem1Chapters = await Chapter.find({ subject: tvSubject._id, grade: grade1._id, semester: 1 }).sort({ order: 1 });
  for (const c of otherSem1Chapters) {
    c.order = c.order + 1; // shift: old order 3(Ôn tập giữa),4(Ghép âm vần),5(Ôn tập cuối) -> 4,5,6
    await c.save();
  }

  const chapterNet = await Chapter.create({
    title: "Nét cơ bản và bảng chữ cái",
    subject: tvSubject._id,
    grade: grade1._id,
    order: 1,
    semester: 1,
  });
  const chapterAm = await Chapter.create({
    title: "Học âm và dấu thanh",
    subject: tvSubject._id,
    grade: grade1._id,
    order: 2,
    semester: 1,
  });
  const chapterVan = await Chapter.create({
    title: "Học vần",
    subject: tvSubject._id,
    grade: grade1._id,
    order: 3,
    semester: 1,
  });

  async function makeLesson(chapter, order, title, description) {
    return Lesson.create({
      title,
      description,
      subject: tvSubject._id,
      grade: grade1._id,
      chapter: chapter._id,
      order,
      isPublished: true,
      isTrial: true,
    });
  }

  // --- Chương "Nét cơ bản và bảng chữ cái" (2 bài) ---
  const lNet1 = await makeLesson(chapterNet, 1, "Các nét cơ bản trong chữ viết", "Làm quen với các nét sổ, nét ngang, nét cong, nét móc để chuẩn bị viết chữ cái.");
  await ReviewContent.create({
    lesson: lNet1._id,
    title: lNet1.title,
    content: "Trước khi viết được chữ cái, em cần làm quen với các nét cơ bản: nét sổ thẳng, nét ngang, nét xiên, nét cong, nét móc. Mỗi chữ cái tiếng Việt đều được tạo nên từ những nét cơ bản này.",
    examples: ["Nét sổ thẳng: giống chữ i không có dấu chấm", "Nét cong kín: giống chữ o", "Nét móc: xuất hiện trong chữ n, m"],
  });
  await Question.insertMany([
    { lesson: lNet1._id, text: "Chữ 'o' được tạo từ nét nào?", choices: ["Nét sổ thẳng", "Nét cong kín", "Nét móc", "Nét ngang"], correctIndex: 1, order: 1 },
    { lesson: lNet1._id, text: "Nét sổ thẳng có hình dạng như thế nào?", choices: ["Cong tròn", "Một đường thẳng đứng", "Một đường ngang", "Hình móc câu"], correctIndex: 1, order: 2 },
    { lesson: lNet1._id, text: "Nét móc thường xuất hiện trong chữ cái nào?", choices: ["o", "n", "a", "e"], correctIndex: 1, order: 3 },
    { lesson: lNet1._id, text: "Viết chữ cái tiếng Việt được tạo nên từ đâu?", choices: ["Từ các nét cơ bản", "Từ hình vẽ", "Từ số", "Từ màu sắc"], correctIndex: 0, order: 4 },
  ]);

  const lBang = await makeLesson(chapterNet, 2, "Bảng chữ cái và 6 dấu thanh tiếng Việt", "Làm quen tổng quan với 29 chữ cái và 6 dấu thanh: ngang, huyền, sắc, hỏi, ngã, nặng.");
  await ReviewContent.create({
    lesson: lBang._id,
    title: lBang.title,
    content: "Bảng chữ cái tiếng Việt có 29 chữ cái. Mỗi tiếng còn có thể mang 1 trong 6 dấu thanh: thanh ngang (không dấu), huyền, sắc, hỏi, ngã, nặng, giúp thay đổi cách đọc và nghĩa của tiếng.",
    examples: ["ma - má - mà - mả - mã - mạ (cùng một âm nhưng khác dấu thanh)", "ba (thanh ngang) khác bà (thanh huyền)", "la (thanh ngang) khác lá (thanh sắc)"],
    videoUrl: embed("oyiLHbIvPNU"),
  });
  await Question.insertMany([
    { lesson: lBang._id, text: "Tiếng Việt có bao nhiêu dấu thanh?", choices: ["4", "5", "6", "7"], correctIndex: 2, order: 1 },
    { lesson: lBang._id, text: "Tiếng không mang dấu nào gọi là thanh gì?", choices: ["Thanh sắc", "Thanh ngang", "Thanh huyền", "Thanh nặng"], correctIndex: 1, order: 2 },
    { lesson: lBang._id, text: "Tiếng 'bà' mang dấu thanh nào?", choices: ["Sắc", "Huyền", "Hỏi", "Ngã"], correctIndex: 1, order: 3 },
    { lesson: lBang._id, text: "Tiếng 'má' mang dấu thanh nào?", choices: ["Sắc", "Huyền", "Nặng", "Ngã"], correctIndex: 0, order: 4 },
  ]);

  // --- Chương "Học âm và dấu thanh" (9 bài) ---
  for (let i = 0; i < AM_GROUPS.length; i++) {
    const g = AM_GROUPS[i];
    const lesson = await makeLesson(chapterAm, i + 1, g.title, `Nhận biết và luyện đọc, luyện viết âm ${g.letters}.`);
    await ReviewContent.create({
      lesson: lesson._id,
      title: g.title,
      content: g.content,
      examples: g.examples,
      videoUrl: embed(g.video),
    });
    await Question.insertMany(
      g.quiz.map((q, idx) => ({ lesson: lesson._id, text: q.text, choices: q.choices, correctIndex: q.correctIndex, order: idx + 1 }))
    );
  }

  // --- Chương "Học vần" (23 bài) ---
  for (let i = 0; i < VAN_GROUPS.length; i++) {
    const g = VAN_GROUPS[i];
    const lesson = await makeLesson(chapterVan, i + 1, g.title, `Nhận biết và luyện đọc, luyện viết vần ${g.van}.`);
    await ReviewContent.create({
      lesson: lesson._id,
      title: g.title,
      content: `Vần ${g.van} là các vần ghép từ nhiều nguyên âm. Em hãy đọc trơn rồi đánh vần chậm từng vần, sau đó ghép với âm đầu và dấu thanh để tạo thành tiếng có nghĩa.`,
      examples: g.examples,
      videoUrl: embed(g.video),
    });
    const vans = g.van.split(", ");
    const questions = vans.slice(0, 3).map((v, idx) => ({
      lesson: lesson._id,
      text: `Ví dụ nào chứa vần '${v}'?`,
      choices: [g.examples[idx % g.examples.length].split(" (")[0], "con mèo", "quả bóng", "bàn ghế"],
      correctIndex: 0,
      order: idx + 1,
    }));
    questions.push({
      lesson: lesson._id,
      text: `Bài học này giúp em nhận biết nhóm vần nào?`,
      choices: [g.van, "Các dấu thanh", "Bảng chữ cái", "Nét cơ bản"],
      correctIndex: 0,
      order: 4,
    });
    await Question.insertMany(questions);
  }

  console.log("Done. New phonics structure:");
  console.log(`- ${chapterNet.title}: 2 bài`);
  console.log(`- ${chapterAm.title}: ${AM_GROUPS.length} bài`);
  console.log(`- ${chapterVan.title}: ${VAN_GROUPS.length} bài`);

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
