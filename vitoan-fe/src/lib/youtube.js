// Theo dõi việc xem video YouTube nhúng (IFrame Player API): đoạn nào đã thực sự phát qua,
// đang xem tới đâu. Script API chỉ nạp 1 lần cho cả trang.
let apiPromise = null;

export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

// Thêm mốc bắt đầu phát (giây) vào link nhúng — cách chắc chắn nhất để phát tiếp chỗ đang xem dở
// (seekTo lúc player vừa sẵn sàng hay bị trình duyệt chặn / tự phát video).
export function withStart(url, seconds) {
  const s = Math.floor(seconds || 0);
  if (!url || s <= 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}start=${s}`;
}

// Link nhúng + bật JS API (bắt buộc để đọc được thời gian đang xem).
export function withJsApi(url) {
  if (!url || !url.includes("youtube.com/embed/")) return url;
  if (url.includes("enablejsapi=1")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}enablejsapi=1&rel=0`;
}

/**
 * Gắn theo dõi vào 1 iframe YouTube.
 *  - startAt: giây video bắt đầu phát (đã gắn sẵn vào link bằng withStart).
 *  - onTick({ position, duration, bucket }): gọi mỗi giây khi đang phát — để cập nhật giao diện ngay.
 *  - onFlush({ buckets, position, duration, final }): gọi mỗi FLUSH_MS và khi dừng/hết/rời trang — để lưu server.
 *    final = true khi đóng tab / tải lại trang: cần gửi kiểu keepalive vì trang sắp bị huỷ.
 * Trả về hàm huỷ.
 */
const TICK_MS = 1000;
const FLUSH_MS = 5000;

export function trackYouTube(iframe, { bucketSeconds = 10, startAt = 0, onTick, onFlush }) {
  let player = null;
  let tickTimer = null;
  let flushTimer = null;
  let cancelled = false;
  let pending = new Set();
  let lastPosition = 0;
  let duration = 0;

  function tick() {
    if (!player?.getCurrentTime) return;
    const position = Math.floor(player.getCurrentTime() || 0);
    duration = Math.floor(player.getDuration() || duration);
    // Chỉ tính đoạn đang phát liền mạch (không tính khi vừa tua nhảy xa).
    const bucket = Math.floor(position / bucketSeconds);
    const counted = Math.abs(position - lastPosition) <= 3;
    if (counted) pending.add(bucket);
    lastPosition = position;
    onTick?.({ position, duration, bucket: counted ? bucket : null });
  }

  function flush(final = false) {
    if (!player?.getCurrentTime) return;
    const buckets = [...pending];
    pending = new Set();
    onFlush?.({ buckets, position: Math.floor(player.getCurrentTime() || lastPosition), duration, final });
  }

  // Đóng tab / tải lại / chuyển sang ứng dụng khác: React không kịp chạy dọn dẹp nên lưu ngay tại đây.
  function onPageHide() {
    if (tickTimer) tick();
    flush(true);
  }
  function onVisibility() {
    if (document.visibilityState === "hidden") onPageHide();
  }
  window.addEventListener("pagehide", onPageHide);
  document.addEventListener("visibilitychange", onVisibility);

  function stopTimers() {
    clearInterval(tickTimer);
    clearInterval(flushTimer);
    tickTimer = null;
    flushTimer = null;
  }

  loadYouTubeApi().then((YT) => {
    if (cancelled || !iframe) return;
    player = new YT.Player(iframe, {
      events: {
        onReady: () => {
          duration = Math.floor(player.getDuration() || 0);
          lastPosition = startAt;
          onTick?.({ position: startAt, duration, bucket: null });
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            lastPosition = Math.floor(player.getCurrentTime() || 0);
            if (!tickTimer) tickTimer = setInterval(tick, TICK_MS);
            if (!flushTimer) flushTimer = setInterval(() => flush(), FLUSH_MS);
          } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
            tick();
            stopTimers();
            flush();
          }
        },
      },
    });
  });

  return () => {
    cancelled = true;
    stopTimers();
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibility);
    try {
      flush();
    } catch {
      // player có thể đã bị huỷ
    }
  };
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
