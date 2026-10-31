import { Link } from "react-router-dom";
import OwlMascot from "../illustrations/OwlMascot.jsx";

// Hiện khi mở link kết quả không còn tồn tại (đã xoá) hoặc không phải của tài khoản đang đăng nhập.
export default function ResultMissing({ to = "/lich-su", label = "Xem lịch sử làm bài" }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <OwlMascot className="h-24 w-24" covering animated={false} />
      <p className="mt-4 font-display text-xl font-black text-slate-800">Không tìm thấy kết quả này</p>
      <p className="mt-1 text-slate-500">Kết quả có thể đã bị xoá hoặc không thuộc tài khoản của em.</p>
      <Link to={to} className="mt-5 rounded-full bg-primary px-6 py-2.5 font-black text-white shadow-[0_4px_0_0_#049245]">
        {label}
      </Link>
    </div>
  );
}
