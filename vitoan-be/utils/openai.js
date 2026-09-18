// Gọi OpenAI Chat Completions dùng chung cho gợi ý câu hỏi, trợ lý AI và nhận
// xét kết quả kiểm tra — tránh lặp lại logic fetch/xử lý lỗi ở nhiều nơi.
async function chatCompletion(messages, { maxTokens = 300, temperature = 0.7 } = {}) {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("Tính năng AI chưa được cấu hình");
    err.statusCode = 503;
    throw err;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI trả về lỗi ${response.status}: ${text}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Trích JSON từ phản hồi của model — model đôi khi bọc JSON trong ```json ... ```
// hoặc thêm vài chữ thừa trước/sau dù đã yêu cầu chỉ trả JSON thuần.
function parseJsonLoose(raw) {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  const jsonSlice = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonSlice);
}

module.exports = { chatCompletion, parseJsonLoose };
