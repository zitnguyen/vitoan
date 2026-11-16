// Tạo ảnh minh hoạ bằng Gemini (model "image") cho đáp án / câu hỏi.
// Cấu hình: GEMINI_API_KEY (dùng chung), GEMINI_IMAGE_MODEL (mặc định gemini-2.5-flash-image),
// GEMINI_IMAGE_FALLBACK_MODELS (cách nhau dấu phẩy). Tạo ảnh cần khoá có hạn mức/thanh toán cho model ảnh —
// gói miễn phí thường báo 429 (hết hạn mức).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MODELS = [
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
  ...(process.env.GEMINI_IMAGE_FALLBACK_MODELS || "gemini-3.1-flash-image,gemini-3.1-flash-lite-image").split(",").map((s) => s.trim()).filter(Boolean),
];
const uploadDir = path.join(__dirname, "..", "uploads", "images");

const STYLE =
  "Minh hoạ phẳng, nét tròn dễ thương, màu tươi sáng, nền trắng trơn, một đối tượng rõ ràng ở giữa, KHÔNG có chữ hay số trong ảnh, phù hợp học sinh tiểu học lớp 1.";

const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

async function generateImage(prompt) {
  if (!process.env.GEMINI_API_KEY) throw fail("Tính năng AI chưa được cấu hình", 503);
  const text = String(prompt || "").trim().slice(0, 300);
  if (!text) throw fail("Hãy mô tả ảnh cần tạo", 400);

  let quota = false;
  let lastError = "";
  for (const model of MODELS) {
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${STYLE} Nội dung: ${text}` }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (e) {
      lastError = `Không kết nối được model ảnh: ${e.message}`;
      continue;
    }
    if (response.status === 429) { quota = true; continue; }
    if (!response.ok) { lastError = `Model ảnh ${model} lỗi ${response.status}`; continue; }
    const json = await response.json();
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part) { lastError = "AI không trả về ảnh (có thể nội dung bị chặn), thử mô tả khác"; continue; }
    const mime = part.inlineData.mimeType || "image/png";
    const ext = mime.includes("jpeg") ? ".jpg" : mime.includes("webp") ? ".webp" : ".png";
    fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `ai-${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(part.inlineData.data, "base64"));
    return `/uploads/images/${filename}`;
  }
  if (quota) throw fail("Khoá AI hiện chưa có hạn mức tạo ảnh (gói miễn phí không hỗ trợ). Hãy bật thanh toán cho khoá Gemini hoặc tải ảnh lên.", 503);
  throw fail(lastError || "Không tạo được ảnh, thử lại sau", 502);
}

module.exports = { generateImage };
