import { MapPin, Mail } from "lucide-react";
import OwlMascot from "../illustrations/OwlMascot.jsx";

export default function SiteFooter() {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <OwlMascot className="h-9 w-9 shrink-0" animated={false} />
            <span className="font-display text-lg font-extrabold text-white">
              Vi<span className="text-primary">Toan</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Nền tảng luyện tập Toán &amp; Tiếng Việt trực tuyến dành cho học sinh tiểu học.
            Đề tài khóa luận tốt nghiệp.
          </p>
        </div>
        <div>
          <p className="font-bold text-white">Giới thiệu</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>Về ViToan</li>
            <li>Chính sách bảo mật</li>
            <li>Điều khoản sử dụng</li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-white">Liên hệ</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> Trường Đại học — Khóa luận tốt nghiệp
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> support@vitoan.edu.vn
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © 2026 ViToan. Đồ án tốt nghiệp — không phải sản phẩm thương mại.
        <br />
        Avatar minh hoạ: "Big Smile" bởi Ashley Seo qua{" "}
        <a href="https://www.dicebear.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
          DiceBear
        </a>
        , giấy phép CC BY 4.0.
      </div>
    </footer>
  );
}
