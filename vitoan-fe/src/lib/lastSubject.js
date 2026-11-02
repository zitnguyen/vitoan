// Nhớ môn học em đang xem gần nhất (slug) để trang Kiểm tra mở đúng môn đó thay vì luôn là môn đầu tiên.
const KEY = "vitoan_last_subject";

export function getLastSubject() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function setLastSubject(slug) {
  if (!slug) return;
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    // trình duyệt chặn lưu trữ: bỏ qua
  }
}
