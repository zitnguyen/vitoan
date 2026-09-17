// Dựng lại phần "đọc hiểu / kể chuyện" của Tiếng Việt lớp 1 theo đúng tên bài
// (tên truyện) thật của SGK "Kết nối tri thức với cuộc sống", theo đúng chủ đề
// và thứ tự trong SGK. Nguồn đối chiếu:
// https://vndoc.com/giai-tieng-viet-1-ket-noi-tri-thuc-voi-cuoc-song
// Nội dung câu hỏi do dự án tự biên soạn (kỹ năng đọc hiểu tổng quát), không sao
// chép nội dung truyện từ SGK — chỉ dùng đúng TÊN bài/truyện công khai.
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

// Bộ câu hỏi đọc hiểu tổng quát, không phụ thuộc nội dung cụ thể của truyện
// (không sao chép truyện từ SGK) — chỉ đổi tên truyện vào câu dẫn.
function readingQuestions(storyTitle) {
  return [
    {
      text: `Khi đọc truyện "${storyTitle}", em nên đọc như thế nào để hiểu đúng nội dung?`,
      choices: ["Đọc thật nhanh, bỏ qua chi tiết", "Đọc kỹ từng câu, chú ý từ ngữ quan trọng", "Chỉ đọc câu đầu tiên", "Không cần đọc kỹ"],
      correctIndex: 1, explanation: "Cần đọc kỹ từng câu và chú ý các từ ngữ quan trọng để hiểu đúng nội dung", difficulty: "easy",
    },
    {
      text: "Muốn trả lời đúng câu hỏi về nội dung bài đọc, em cần làm gì?",
      choices: ["Đoán bừa đáp án", "Đọc lại bài để tìm thông tin liên quan", "Không cần đọc lại", "Chỉ dựa vào tên bài"],
      correctIndex: 1, explanation: "Nên đọc lại bài để tìm thông tin chính xác trả lời câu hỏi", difficulty: "easy",
    },
    {
      text: `Sau khi đọc "${storyTitle}", em có thể kể lại nội dung bằng cách nào?`,
      choices: ["Không thể kể lại", "Kể theo đúng diễn biến: mở đầu - diễn biến - kết thúc", "Chỉ kể tên nhân vật", "Kể lộn xộn không theo thứ tự"],
      correctIndex: 1, explanation: "Kể lại theo đúng diễn biến câu chuyện giúp người nghe hiểu rõ", difficulty: "medium",
    },
    {
      text: "Đọc hiểu tốt giúp ích gì cho em?",
      choices: ["Không có tác dụng gì", "Hiểu đúng nội dung và học được bài học từ câu chuyện", "Chỉ để thi", "Không liên quan đến học tập"],
      correctIndex: 1, explanation: "Đọc hiểu tốt giúp em nắm nội dung và rút ra bài học từ câu chuyện", difficulty: "medium",
    },
  ];
}

async function upsertLesson({ title, description, subject, grade, chapterTitle, chapterOrder, semester, order, videoId }) {
  const chapter = await getChapter(chapterTitle, subject, grade, chapterOrder, semester);
  const lesson = await Lesson.findOneAndUpdate(
    { title, subject: subject._id, grade: grade._id, chapter: chapter._id },
    { title, description, subject: subject._id, grade: grade._id, chapter: chapter._id, order, isPublished: true, isTrial: false },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const existingCount = await Question.countDocuments({ lesson: lesson._id });
  if (existingCount === 0) {
    await Question.insertMany(readingQuestions(title).map((q, idx) => ({ ...q, lesson: lesson._id, order: idx })));
  }
  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    { $set: { title: `Kiến thức: ${title}`, videoUrl: embed(videoId) } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return lesson;
}

// videoId tái dùng từ kho video đã xác minh trước đó (video đọc hiểu chung, gần chủ đề).
const REVIEW_VIDEO = "07CINdlMhE0";
const FAMILY_VIDEO = "QLVkJ9eXAS0";
const SCHOOL_VIDEO = "YT7giqt7xD4";
const ANIMAL_VIDEO = "9OG1Ogl6T2c";
const NATURE_VIDEO = "Ie8kxiWtTr4";

const TAP1_THEMES = [
  {
    title: "Tôi và các bạn", order: 12, semester: 1,
    lessons: ["Tôi là học sinh lớp 1", "Đôi tai xấu xí", "Bạn của gió", "Giải thưởng tình bạn", "Sinh nhật của voi con", "Ôn tập"],
  },
  {
    title: "Mái ấm gia đình", order: 13, semester: 1,
    lessons: ["Nụ hôn trên bàn tay", "Làm anh", "Cả nhà đi chơi núi", "Quạt cho bà ngủ", "Bữa cơm gia đình", "Ngôi nhà"],
    video: FAMILY_VIDEO,
  },
  {
    title: "Mái trường mến yêu", order: 14, semester: 1,
    lessons: ["Tôi đi học", "Đi học", "Hoa yêu thương", "Cây bàng và lớp học", "Bác trống trường", "Giờ ra chơi", "Ôn tập"],
    video: SCHOOL_VIDEO,
  },
  {
    title: "Điều em cần biết", order: 15, semester: 1,
    lessons: ["Rửa tay trước khi ăn", "Lời chào", "Khi mẹ vắng nhà", "Nếu không may bị lạc", "Đèn giao thông", "Ôn tập"],
  },
];

const TAP2_THEMES = [
  {
    title: "Bài học từ cuộc sống", order: 1, semester: 2,
    lessons: ["Kiến và chim bồ câu", "Câu chuyện của rễ", "Câu hỏi của sói", "Chú bé chăn cừu", "Tiếng vọng của núi"],
  },
  {
    title: "Thiên nhiên kì thú", order: 2, semester: 2,
    lessons: ["Loài chim của biển cả", "Bảy sắc cầu vồng", "Chúa tể rừng xanh", "Cuộc thi tài năng rừng xanh", "Cây liễu dẻo dai", "Ôn tập"],
    video: NATURE_VIDEO,
  },
  {
    title: "Thế giới trong mắt em", order: 3, semester: 2,
    lessons: ["Tia nắng đi đâu?", "Trong giấc mơ buổi sáng", "Ngày mới bắt đầu", "Hỏi mẹ", "Những cánh cò", "Buổi trưa hè", "Hoa phượng", "Ôn tập"],
  },
  {
    title: "Đất nước và con người", order: 4, semester: 2,
    lessons: ["Cậu bé thông minh", "Lính cứu hỏa", "Lớn lên bạn làm gì?", "Ruộng bậc thang ở Sa Pa", "Nhớ ơn", "Du lịch biển Việt Nam", "Ôn tập"],
    video: ANIMAL_VIDEO,
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const grades = await Grade.find();
  const subjects = await Subject.find();
  const lop1 = grades.find((g) => g.slug === "lop-1");
  const tv = subjects.find((s) => s.slug === "tieng-viet");

  let n = 0;
  for (const theme of TAP1_THEMES) {
    for (let i = 0; i < theme.lessons.length; i++) {
      const title = theme.lessons[i];
      const isReview = title === "Ôn tập";
      await upsertLesson({
        title: isReview ? `Ôn tập chủ đề: ${theme.title}` : title,
        description: isReview
          ? `Ôn tập kỹ năng đọc hiểu các bài trong chủ đề "${theme.title}".`
          : `Bài đọc thuộc chủ đề "${theme.title}" — luyện đọc hiểu và trả lời câu hỏi.`,
        subject: tv, grade: lop1,
        chapterTitle: `Chủ đề: ${theme.title}`, chapterOrder: theme.order, semester: theme.semester,
        order: i + 1,
        videoId: isReview ? REVIEW_VIDEO : theme.video,
      });
      n++;
    }
  }
  for (const theme of TAP2_THEMES) {
    for (let i = 0; i < theme.lessons.length; i++) {
      const title = theme.lessons[i];
      const isReview = title === "Ôn tập";
      await upsertLesson({
        title: isReview ? `Ôn tập chủ đề: ${theme.title}` : title,
        description: isReview
          ? `Ôn tập kỹ năng đọc hiểu các bài trong chủ đề "${theme.title}".`
          : `Bài đọc thuộc chủ đề "${theme.title}" — luyện đọc hiểu và trả lời câu hỏi.`,
        subject: tv, grade: lop1,
        chapterTitle: `Chủ đề: ${theme.title}`, chapterOrder: 20 + theme.order, semester: theme.semester,
        order: i + 1,
        videoId: isReview ? REVIEW_VIDEO : theme.video,
      });
      n++;
    }
  }

  // Ôn tập và đánh giá cuối năm (3 bài ôn tập tổng hợp)
  const finalReviews = [
    { title: "Ôn tập và đánh giá: Đọc hiểu tổng hợp", videoId: REVIEW_VIDEO },
    { title: "Ôn tập và đánh giá: Kể chuyện và luyện nói", videoId: SCHOOL_VIDEO },
    { title: "Ôn tập và đánh giá: Tổng kết năm học", videoId: FAMILY_VIDEO },
  ];
  for (let i = 0; i < finalReviews.length; i++) {
    await upsertLesson({
      title: finalReviews[i].title,
      description: "Ôn tập và đánh giá cuối năm học môn Tiếng Việt lớp 1.",
      subject: tv, grade: lop1,
      chapterTitle: "Ôn tập và đánh giá cuối năm (Tiếng Việt)", chapterOrder: 30, semester: 2,
      order: i + 1,
      videoId: finalReviews[i].videoId,
    });
    n++;
  }

  console.log(`\nĐã tạo/cập nhật ${n} bài đọc hiểu/kể chuyện Tiếng Việt lớp 1 theo đúng tên SGK.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
