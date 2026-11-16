import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Vị trí cuộn của từng mục lịch sử (theo location.key) để nút Lùi/Tiến trở về đúng chỗ đang xem dở.
const positions = new Map();

export default function ScrollToTop() {
  const { pathname, key } = useLocation();
  const type = useNavigationType();

  // Ghi nhớ vị trí cuộn của trang hiện tại.
  useEffect(() => {
    const save = () => positions.set(key, window.scrollY);
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [key]);

  useEffect(() => {
    // Bấm liên kết/chuyển trang mới → lên đầu trang. Lùi/Tiến (POP) → khôi phục vị trí cũ.
    if (type !== "POP") {
      window.scrollTo(0, 0);
      return undefined;
    }
    const target = positions.get(key) || 0;
    if (!target) {
      window.scrollTo(0, 0);
      return undefined;
    }
    // Nội dung có thể tải chậm: thử lại vài lần cho tới khi trang đủ cao để cuộn tới vị trí cũ.
    let tries = 0;
    let timer;
    const attempt = () => {
      window.scrollTo(0, target);
      if (Math.abs(window.scrollY - target) > 2 && tries++ < 30) timer = setTimeout(attempt, 100);
    };
    attempt();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
