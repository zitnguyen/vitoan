import SiteHeader from "./SiteHeader.jsx";
import SiteFooter from "./SiteFooter.jsx";

// Khung đầy đủ (menu + chân trang) dùng cho các trạng thái phụ của trang làm bài — đang tải, lỗi, không có dữ liệu —
// vì khi đang làm bài thật, App ẩn menu/chân trang để em tập trung. Có khung này thì không bao giờ gặp trang trống trơn.
export default function FocusShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
