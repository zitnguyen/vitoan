// Gợi ý AI cho từng câu hỏi luyện tập, gọi OpenAI Chat Completions. Gợi ý phải
// gợi mở cách suy nghĩ, KHÔNG được nói ra đáp án đúng — giữ giá trị luyện tập.
// Cache theo câu hỏi (nội dung gợi ý không đổi giữa các học sinh) để tiết kiệm
// chi phí gọi API, tương tự cách ttsController cache audio.
const Question = require("../models/Question");
const Lesson = require("../models/Lesson");

const cache = new Map(); // questionId -> hint string

async function requestHintFromOpenAI(question) {
  const choicesText = question.choices?.length ? `Các lựa chọn: ${question.choices.join(", ")}.` : "";
  const prompt = `Học sinh tiểu học đang làm câu hỏi luyện tập: "${question.text}". ${choicesText}
Hãy đưa ra một gợi ý NGẮN GỌN (1-2 câu), thân thiện, giúp em suy nghĩ đúng hướng để tự tìm ra đáp án.
Tuyệt đối KHÔNG được nói ra đáp án đúng hoặc gợi ý trực tiếp phương án nào đúng. Dùng tiếng Việt, giọng điệu vui vẻ, khích lệ, phù hợp với trẻ em.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI trả về lỗi ${response.status}: ${text}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Xin lỗi, hiện AI chưa nghĩ ra gợi ý cho câu này.";
}

async function getHint(req, res, next) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: "Tính năng gợi ý AI chưa được cấu hình" });
    }

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: "Không tìm thấy câu hỏi" });

    const lesson = await Lesson.findById(question.lesson).select("isTrial");
    if (!req.user && !lesson?.isTrial) {
      return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để dùng gợi ý AI" });
    }

    const key = String(question._id);
    if (!cache.has(key)) {
      const hint = await requestHintFromOpenAI(question);
      if (cache.size > 500) cache.clear();
      cache.set(key, hint);
    }

    res.json({ success: true, data: { hint: cache.get(key) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHint };
