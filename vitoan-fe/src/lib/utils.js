import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Xáo trộn thứ tự mảng (Fisher-Yates), trả về mảng mới — dùng để mỗi lượt
// luyện tập/kiểm tra hiện câu hỏi theo thứ tự ngẫu nhiên, không lặp lại 1 trật tự cố định.
export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
