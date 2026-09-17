require("dotenv").config();
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const Chapter = require("../models/Chapter");
const ReviewContent = require("../models/ReviewContent");
const PracticeSet = require("../models/PracticeSet");
const Test = require("../models/Test");

// Simple original illustrations, embedded as inline SVG — no external/copyrighted assets.
function topicIllustration(emoji, label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240" width="600" height="240">
    <rect width="600" height="240" rx="20" fill="${color}" />
    <text x="300" y="110" font-size="72" text-anchor="middle">${emoji}</text>
    <text x="300" y="180" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const REVIEW_CONTENT = [
  {
    lessonTitle: "Phép cộng trong phạm vi 10",
    title: "Kiến thức: Phép cộng trong phạm vi 10",
    content:
      "Phép cộng là phép tính gộp hai hay nhiều số lại với nhau để được một số lớn hơn.\nKý hiệu phép cộng là dấu \"+\". Kết quả của phép cộng gọi là tổng.\nKhi cộng hai số trong phạm vi 10, ta có thể đếm thêm hoặc dùng que tính, ngón tay để đếm.",
    examples: ["3 + 4 = 7 (ba cộng bốn bằng bảy)", "5 + 2 = 7 (năm cộng hai bằng bảy)", "6 + 3 = 9 (sáu cộng ba bằng chín)"],
    imageUrl: topicIllustration("➕", "Phép cộng trong phạm vi 10", "#00b14f"),
  },
  {
    lessonTitle: "Phép trừ trong phạm vi 10",
    title: "Kiến thức: Phép trừ trong phạm vi 10",
    content:
      "Phép trừ là phép tính bớt đi một số từ một số khác để được kết quả nhỏ hơn hoặc bằng.\nKý hiệu phép trừ là dấu \"-\". Kết quả của phép trừ gọi là hiệu.\nSố bị trừ phải lớn hơn hoặc bằng số trừ khi làm việc trong phạm vi số tự nhiên.",
    examples: ["9 - 4 = 5 (chín trừ bốn bằng năm)", "7 - 2 = 5 (bảy trừ hai bằng năm)", "10 - 6 = 4 (mười trừ sáu bằng bốn)"],
    imageUrl: topicIllustration("➖", "Phép trừ trong phạm vi 10", "#ff8a00"),
  },
  {
    lessonTitle: "Dấu câu cơ bản",
    title: "Kiến thức: Dấu câu cơ bản",
    content:
      "Dấu câu giúp câu văn rõ nghĩa và thể hiện đúng ý người viết.\n- Dấu chấm (.) đặt cuối câu kể.\n- Dấu hỏi (?) đặt cuối câu hỏi.\n- Dấu chấm than (!) đặt cuối câu cảm thán hoặc câu cầu khiến.\n- Dấu phẩy (,) dùng để ngăn cách các bộ phận trong câu.",
    examples: ["Hôm nay trời đẹp. (câu kể)", "Bạn tên là gì? (câu hỏi)", "Ôi, đẹp quá! (câu cảm)"],
    imageUrl: topicIllustration("✏️", "Dấu câu cơ bản", "#3b82f6"),
  },
  {
    lessonTitle: "Phép nhân bảng 2",
    title: "Kiến thức: Bảng nhân 2",
    content:
      "Phép nhân là cách cộng nhiều lần một số giống nhau.\nBảng nhân 2 giúp tính nhanh khi nhân một số với 2.\nVí dụ: 2 x 3 nghĩa là 2 được lấy 3 lần, tức 2 + 2 + 2.",
    examples: ["2 x 3 = 6", "2 x 5 = 10", "2 x 7 = 14"],
    imageUrl: topicIllustration("✖️", "Bảng nhân 2", "#8b5cf6"),
  },
  {
    lessonTitle: "Phép cộng có nhớ trong phạm vi 100",
    title: "Kiến thức: Phép cộng có nhớ",
    content:
      "Khi cộng hai số có tổng các chữ số hàng đơn vị lớn hơn 9, ta cần \"nhớ 1\" sang hàng chục.\nCác bước: cộng hàng đơn vị trước, nếu đủ 10 thì viết 0 (hoặc số dư) và nhớ 1 sang hàng chục, sau đó cộng hàng chục cùng với số nhớ.",
    examples: ["27 + 15 = 42 (7+5=12, viết 2 nhớ 1; 2+1+1=4)", "38 + 26 = 64", "45 + 19 = 64"],
    imageUrl: topicIllustration("🔢", "Phép cộng có nhớ", "#00b14f"),
  },
  {
    lessonTitle: "Từ chỉ sự vật, hoạt động, đặc điểm",
    title: "Kiến thức: Từ chỉ sự vật, hoạt động, đặc điểm",
    content:
      "- Từ chỉ sự vật: gọi tên người, con vật, đồ vật, hiện tượng... (ví dụ: cây bàng, con mèo).\n- Từ chỉ hoạt động: chỉ hành động, việc làm (ví dụ: chạy, học tập).\n- Từ chỉ đặc điểm: miêu tả tính chất, hình dáng, màu sắc (ví dụ: cao lớn, xinh xắn).",
    examples: ["Cây bàng (sự vật)", "Bơi lội (hoạt động)", "Cao lớn (đặc điểm)"],
    imageUrl: topicIllustration("📖", "Từ chỉ sự vật, hoạt động, đặc điểm", "#3b82f6"),
  },
  {
    lessonTitle: "Bảng nhân 3, 4, 5",
    title: "Kiến thức: Bảng nhân 3, 4, 5",
    content:
      "Học thuộc bảng nhân 3, 4, 5 giúp tính toán nhanh hơn trong các bài toán hàng ngày.\nMẹo: bảng nhân 5 luôn có kết quả kết thúc bằng 0 hoặc 5.",
    examples: ["3 x 6 = 18", "4 x 7 = 28", "5 x 8 = 40"],
    imageUrl: topicIllustration("✖️", "Bảng nhân 3, 4, 5", "#8b5cf6"),
  },
  {
    lessonTitle: "Từ đồng nghĩa, trái nghĩa",
    title: "Kiến thức: Từ đồng nghĩa, trái nghĩa",
    content:
      "- Từ đồng nghĩa là những từ có nghĩa giống nhau hoặc gần giống nhau.\n- Từ trái nghĩa là những từ có nghĩa trái ngược nhau.\nViệc dùng từ đồng nghĩa, trái nghĩa giúp câu văn phong phú và tránh lặp từ.",
    examples: ["Chăm chỉ - Siêng năng (đồng nghĩa)", "Cao - Thấp (trái nghĩa)", "To lớn - Khổng lồ (đồng nghĩa)"],
    imageUrl: topicIllustration("🔤", "Từ đồng nghĩa, trái nghĩa", "#3b82f6"),
  },
  {
    lessonTitle: "Phân số cơ bản",
    title: "Kiến thức: Phân số cơ bản",
    content:
      "Phân số gồm tử số (số trên) và mẫu số (số dưới), cách nhau bởi dấu gạch ngang.\nPhân số biểu diễn một phần của một tổng thể được chia đều.\nVí dụ 1/2 nghĩa là chia thành 2 phần bằng nhau, lấy 1 phần.",
    examples: ["1/2 = một phần hai (một nửa)", "3/4 = ba phần tư", "1/4 + 1/4 = 2/4 = 1/2"],
    imageUrl: topicIllustration("🍕", "Phân số cơ bản", "#00b14f"),
  },
  {
    lessonTitle: "Câu ghép",
    title: "Kiến thức: Câu ghép",
    content:
      "Câu ghép là câu do hai hay nhiều vế câu ghép lại, mỗi vế câu có đủ chủ ngữ - vị ngữ.\nCác vế câu thường nối với nhau bằng quan hệ từ (và, nhưng, vì...nên, nếu...thì...) hoặc dấu phẩy.",
    examples: ["Trời mưa to nên em ở nhà.", "Vì trời lạnh nên em mặc áo ấm.", "Em học giỏi và em còn hát hay."],
    imageUrl: topicIllustration("📝", "Câu ghép", "#3b82f6"),
  },
  {
    lessonTitle: "Số thập phân",
    title: "Kiến thức: Số thập phân",
    content:
      "Số thập phân gồm phần nguyên và phần thập phân, ngăn cách bởi dấu phẩy.\nKhi cộng, trừ số thập phân, ta đặt tính sao cho các dấu phẩy thẳng cột với nhau.",
    examples: ["3,5 đọc là 'ba phẩy năm'", "1,5 + 2,3 = 3,8", "0,25 = 1/4"],
    imageUrl: topicIllustration("🔢", "Số thập phân", "#00b14f"),
  },
  {
    lessonTitle: "Biện pháp tu từ: So sánh và nhân hóa",
    title: "Kiến thức: So sánh và nhân hóa",
    content:
      "- So sánh: đối chiếu hai sự vật, hiện tượng có nét tương đồng, thường dùng từ 'như', 'là'.\n- Nhân hóa: gán đặc điểm, hành động của con người cho sự vật, con vật, cây cối.",
    examples: ["Mặt trời như quả cầu lửa. (so sánh)", "Ông mặt trời đội mũ đi ngủ sớm. (nhân hóa)", "Chị gió thổi mát rượi. (nhân hóa)"],
    imageUrl: topicIllustration("🎨", "Biện pháp tu từ", "#8b5cf6"),
  },
];

function splitInHalf(arr) {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[seedContent] Đã kết nối MongoDB");

  const lessons = await Lesson.find();
  const lessonByTitle = new Map(lessons.map((l) => [l.title, l]));

  // 1. Review content per lesson
  for (const rc of REVIEW_CONTENT) {
    const lesson = lessonByTitle.get(rc.lessonTitle);
    if (!lesson) {
      console.warn(`[seedContent] Không tìm thấy bài học: ${rc.lessonTitle}`);
      continue;
    }
    await ReviewContent.findOneAndUpdate(
      { lesson: lesson._id },
      {
        lesson: lesson._id,
        title: rc.title,
        content: rc.content,
        examples: rc.examples,
        imageUrl: rc.imageUrl,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    console.log(`[seedContent] Ôn tập: ${rc.lessonTitle}`);
  }

  // 2. Practice sets: split each lesson's questions into "Cơ bản" and "Nâng cao"
  for (const lesson of lessons) {
    const questions = await Question.find({ lesson: lesson._id }).sort({ order: 1 });
    if (questions.length < 2) continue;
    const [basic, advanced] = splitInHalf(questions);

    const existing = await PracticeSet.countDocuments({ lesson: lesson._id });
    if (existing > 0) continue;

    await PracticeSet.create({
      lesson: lesson._id,
      title: "Luyện tập cơ bản",
      level: "easy",
      order: 1,
      questions: basic.map((q) => q._id),
    });
    if (advanced.length > 0) {
      await PracticeSet.create({
        lesson: lesson._id,
        title: "Luyện tập nâng cao",
        level: "hard",
        order: 2,
        questions: advanced.map((q) => q._id),
      });
    }
    console.log(`[seedContent] Bài luyện tập: ${lesson.title}`);
  }

  // 3. Topic tests: one per chapter, pooling all of that chapter's questions
  const chapters = await Chapter.find();
  for (const chapter of chapters) {
    const chapterLessons = lessons.filter((l) => String(l.chapter) === String(chapter._id));
    if (chapterLessons.length === 0) continue;
    const questionGroups = await Promise.all(
      chapterLessons.map((l) => Question.find({ lesson: l._id }))
    );
    const allQuestions = questionGroups.flat();
    if (allQuestions.length === 0) continue;

    const existing = await Test.findOne({ testType: "topic", chapter: chapter._id });
    if (existing) continue;

    await Test.create({
      title: `Kiểm tra: ${chapter.title}`,
      testType: "topic",
      subject: chapter.subject,
      grade: chapter.grade,
      chapter: chapter._id,
      level: "medium",
      timeLimitSeconds: 600,
      questions: allQuestions.map((q) => q._id),
      isActive: true,
    });
    console.log(`[seedContent] Bài kiểm tra chủ đề: ${chapter.title}`);
  }

  console.log("[seedContent] Hoàn tất seed nội dung ôn tập / luyện tập / kiểm tra mẫu");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seedContent] Lỗi:", err);
  process.exit(1);
});
