// Avatar hoạt hình dễ thương lấy trực tiếp từ DiceBear API (style "Big Smile" của
// Ashley Seo, giấy phép CC BY 4.0) — không cần lưu ảnh, không cần backend, mỗi
// seed (thường là id bài học) luôn ra đúng 1 khuôn mặt cố định.
const AVATAR_BACKGROUNDS = ["b6e3f4", "ffd5dc", "c0f0c0", "ffdfbf", "d6c6f5"];

export function avatarUrl(seed, idx = 0) {
  const bg = AVATAR_BACKGROUNDS[idx % AVATAR_BACKGROUNDS.length];
  return `https://api.dicebear.com/9.x/big-smile/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}`;
}
