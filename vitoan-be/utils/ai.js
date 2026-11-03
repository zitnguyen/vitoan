// Gọi Google Gemini dùng chung cho gợi ý câu hỏi, trợ lý AI và nhận xét kết quả kiểm tra —
// tránh lặp lại logic fetch/xử lý lỗi ở nhiều nơi. Giữ nguyên dạng messages kiểu
// [{ role: "system" | "user" | "assistant", content }] để các nơi gọi không phải đổi.
// Cấu hình: GEMINI_API_KEY (bắt buộc), GEMINI_MODEL (mặc định gemini-3.1-flash-lite, nhanh nhất).
// GEMINI_FALLBACK_MODELS (cách nhau dấu phẩy) là các model dự phòng khi model chính hết lượt.
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  ...(process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash,gemini-flash-latest").split(",").map((s) => s.trim()).filter(Boolean),
];
const cooldownUntil = new Map();
const REQUEST_TIMEOUT_MS = 20_000;

// Bộ lọc nội dung của Gemini đặt mức chặn thấp nhất vì người dùng là trẻ tiểu học.
const SAFETY_SETTINGS = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
].map((category) => ({ category, threshold: "BLOCK_LOW_AND_ABOVE" }));

async function chatCompletion(messages, { maxTokens = 300, temperature = 0.7 } = {}) {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error("Tính năng AI chưa được cấu hình");
    err.statusCode = 503;
    throw err;
  }

  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  // Gemini chỉ có vai trò "user" / "model"; gộp các tin liên tiếp cùng vai trò thành một.
  const contents = [];
  for (const m of messages.filter((x) => x.role !== "system")) {
    const role = m.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n${m.content}`;
    else contents.push({ role, parts: [{ text: m.content }] });
  }

  const body = JSON.stringify({
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      // Tắt "suy nghĩ" để câu trả lời ngắn không bị cắt cụt vì hết token.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  // Gói miễn phí giới hạn số lượt/ngày theo TỪNG model, nên hết lượt (429), quá tải (503) hoặc
  // model ngừng (404) thì thử model kế tiếp; model hết lượt được bỏ qua một lúc để khỏi gọi lại.
  let response;
  let lastError = "";
  for (const model of MODELS) {
    if ((cooldownUntil.get(model) || 0) > Date.now()) continue;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      // Quá hạn / lỗi mạng: model này đang treo, thử model khác.
      lastError = `Gemini (${model}) không phản hồi: ${e.message}`;
      cooldownUntil.set(model, Date.now() + 2 * 60_000);
      response = null;
      continue;
    }
    if (response.ok) break;
    const text = await response.text();
    lastError = `Gemini (${model}) trả về lỗi ${response.status}: ${text}`;
    if (![404, 429, 503].includes(response.status)) throw new Error(lastError);
    cooldownUntil.set(model, Date.now() + (response.status === 429 ? 30 * 60_000 : 60_000));
    response = null;
  }
  if (!response) {
    console.error(lastError || "Gemini: mọi model đang tạm không dùng được");
    const err = new Error("Cú đang hơi bận, em thử lại sau một lúc nhé!");
    err.statusCode = 503;
    throw err;
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (text) return text;
  // Bị bộ lọc an toàn chặn hoặc không có nội dung.
  return "Câu này mình chưa trả lời được. Em thử hỏi cách khác hoặc hỏi thầy cô nhé!";
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
