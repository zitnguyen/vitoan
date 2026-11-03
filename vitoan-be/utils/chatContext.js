// Tìm trong CSDL (bài học + phần "kiến thức cần nhớ") những nội dung liên quan tới câu hỏi của
// học sinh để đưa vào prompt cho Trợ lý AI, giúp AI trả lời bám sát chương trình ViToan.
const Lesson = require("../models/Lesson");
const ReviewContent = require("../models/ReviewContent");
require("../models/Subject"); // đăng ký schema cho populate("subject")

const STOPWORDS = new Set(
  "là gì và của có không cho em mình bạn các một những này đó thì sao làm thế nào như khi nào tại vì sao hãy giúp cách nói rồi được để với trong ở bài".split(" ")
);
const MAX_SNIPPETS = 3;
const MAX_CONTENT_CHARS = 900;

function normalize(s) {
  return String(s || "").toLowerCase();
}

function keywords(text) {
  const words = normalize(text)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  // Thêm cụm 2 từ liền kề để khớp thuật ngữ như "phép cộng", "từ chỉ".
  const pairs = [];
  for (let i = 0; i < words.length - 1; i++) pairs.push(`${words[i]} ${words[i + 1]}`);
  return { words, pairs };
}

async function findRelevantContent(gradeId, question) {
  const { words, pairs } = keywords(question);
  if (!words.length) return [];

  const filter = { isPublished: true };
  if (gradeId) filter.grade = gradeId;
  const lessons = await Lesson.find(filter).select("title subject").populate("subject", "name").lean();
  if (!lessons.length) return [];
  const reviews = await ReviewContent.find({ lesson: { $in: lessons.map((l) => l._id) } })
    .select("lesson title content examples")
    .lean();
  const reviewByLesson = new Map(reviews.map((r) => [String(r.lesson), r]));

  const scored = lessons
    .map((l) => {
      const r = reviewByLesson.get(String(l._id));
      const title = normalize(`${l.title} ${r?.title || ""}`);
      const body = normalize(`${r?.content || ""} ${(r?.examples || []).join(" ")}`);
      let score = 0;
      for (const w of words) {
        if (title.includes(w)) score += 3;
        if (body.includes(w)) score += 1;
      }
      for (const p of pairs) {
        if (title.includes(p)) score += 5;
        if (body.includes(p)) score += 2;
      }
      return { l, r, score };
    })
    .filter((x) => x.score > 0 && x.r)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SNIPPETS);

  return scored.map(({ l, r }) => ({
    subject: l.subject?.name || "",
    lesson: l.title,
    content: String(r.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_CHARS),
    examples: (r.examples || []).slice(0, 3),
  }));
}

function formatContext(snippets) {
  if (!snippets.length) return "";
  const lines = snippets.map(
    (s, i) =>
      `${i + 1}. [${s.subject}] Bài "${s.lesson}": ${s.content}${s.examples.length ? ` Ví dụ: ${s.examples.join(" | ")}` : ""}`
  );
  return `\n\nKiến thức trong chương trình ViToan liên quan tới câu hỏi (ưu tiên dùng để giải thích):\n${lines.join("\n")}`;
}

module.exports = { findRelevantContent, formatContext };
