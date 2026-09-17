// Âm thanh phản hồi đúng/sai khi luyện tập, tổng hợp bằng Web Audio API thay vì
// file mp3 — không cần tải asset ngoài, phát tức thì và nhẹ.
let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(ctx, freq, startTime, duration, peakGain) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playCorrectSound() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    playTone(ctx, 523.25, now, 0.16, 0.2); // C5
    playTone(ctx, 783.99, now + 0.12, 0.22, 0.2); // G5
  } catch {
    // Web Audio bị chặn (chưa có tương tác người dùng, trình duyệt cũ...) — bỏ qua,
    // âm thanh chỉ là hiệu ứng phụ, không ảnh hưởng luồng làm bài.
  }
}

export function playWrongSound() {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;
    playTone(ctx, 392, now, 0.16, 0.16); // G4
    playTone(ctx, 311.13, now + 0.13, 0.28, 0.16); // Eb4
  } catch {
    // ignore
  }
}
