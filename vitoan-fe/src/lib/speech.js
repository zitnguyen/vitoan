// Đọc to văn bản bằng giọng tiếng Việt thật qua dịch vụ TTS trên mạng (backend
// proxy tại /api/tts/speak), KHÔNG dùng Web Speech API của trình duyệt nữa —
// Web Speech API phụ thuộc voice cài sẵn ở tầng hệ điều hành, nhiều máy (đặc
// biệt Windows) không có giọng tiếng Việt nên bị đọc lệch sang giọng Anh.
// Cách này phát âm thanh MP3 thật, giống nhau trên mọi thiết bị/trình duyệt.
let currentAudio = null;

export function speak(text) {
  if (!text) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
  }
  const audio = new Audio(`/api/tts/speak?text=${encodeURIComponent(text)}`);
  currentAudio = audio;
  audio.play().catch(() => {
    // Trình duyệt có thể chặn autoplay nếu chưa có tương tác của người dùng —
    // bỏ qua lỗi này, người dùng có thể bấm lại nút "Nghe lại".
  });
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

// Bỏ dấu điền chỗ trống ("___") và xuống dòng khỏi văn bản trước khi đọc to,
// để câu nghe tự nhiên thay vì đọc ra "gạch dưới gạch dưới gạch dưới".
export function speakQuestionText(text) {
  speak(text.replace(/___/g, "").replace(/\n/g, " "));
}

export const FILL_TYPES = ["fill_blank", "listen_fill"];
