// Proxy tới dịch vụ TTS tiếng Việt qua mạng (không phụ thuộc voice cài sẵn trên
// máy học sinh, khác hẳn Web Speech API trước đây). Endpoint TTS của Google
// Dịch giới hạn ~200 ký tự/lần gọi, nên với câu dài ta cắt theo dấu câu rồi
// nối nhiều đoạn audio lại thành 1 file MP3 trả về (ghép trực tiếp các khung
// MP3 vẫn phát được liền mạch, không cần giải mã lại).
const MAX_CHUNK = 190;
const cache = new Map(); // text -> Buffer, giữ trong bộ nhớ tiến trình, tránh gọi lại dịch vụ ngoài cho câu đã đọc

function splitIntoChunks(text) {
  const sentences = text.split(/(?<=[.!?,])\s+/);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > MAX_CHUNK) {
      if (current) chunks.push(current.trim());
      current = sentence;
      while (current.length > MAX_CHUNK) {
        chunks.push(current.slice(0, MAX_CHUNK));
        current = current.slice(MAX_CHUNK);
      }
    } else {
      current = (current + " " + sentence).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, MAX_CHUNK)];
}

async function fetchChunkAudio(chunk, idx, total) {
  const url =
    "https://translate.google.com/translate_tts" +
    `?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(chunk)}&total=${total}&idx=${idx}&textlen=${chunk.length}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });
  if (!res.ok) throw new Error(`TTS upstream trả về ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function speak(req, res, next) {
  try {
    const text = String(req.query.text || "").trim();
    if (!text) return res.status(400).json({ success: false, message: "Thiếu tham số text" });
    const key = text.slice(0, 500);

    if (cache.has(key)) {
      res.set("Content-Type", "audio/mpeg");
      res.set("Cache-Control", "public, max-age=86400");
      return res.send(cache.get(key));
    }

    const chunks = splitIntoChunks(key);
    const buffers = [];
    for (let i = 0; i < chunks.length; i++) {
      buffers.push(await fetchChunkAudio(chunks[i], i, chunks.length));
    }
    const audio = Buffer.concat(buffers);

    if (cache.size > 500) cache.clear(); // giới hạn bộ nhớ đơn giản cho môi trường demo
    cache.set(key, audio);

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(audio);
  } catch (err) {
    next(err);
  }
}

module.exports = { speak };
