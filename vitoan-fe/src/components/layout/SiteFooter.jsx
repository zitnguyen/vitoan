import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

// Chân trang kiểu sản phẩm: dải sóng chuyển tiếp, thẻ kêu gọi (khách: học thử / học sinh: học tiếp),
// 4 cột liên kết thật của ViToan, thanh bản quyền + ghi nguồn hình ảnh (thu gọn).

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="group inline-flex items-center gap-1.5 font-semibold text-slate-300 transition hover:text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 transition group-hover:bg-lime-300" />
        {children}
      </Link>
    </li>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <p className="font-display text-lg font-black text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-[15px]">{children}</ul>
    </div>
  );
}

export default function SiteFooter() {
  const { user } = useAuth();
  const isStudent = user?.role === "Student";
  const learnTo = user?.grade?.slug ? `/lop/${user.grade.slug}` : user ? "/chon-lop" : "/#chon-lop";

  return (
    <footer className="relative mt-16">
      {/* sóng chuyển tiếp từ nền trang xuống chân trang */}
      <svg aria-hidden viewBox="0 0 1440 80" preserveAspectRatio="none" className="block h-12 w-full sm:h-16">
        <path d="M0 80V40C240 0 480 0 720 30s480 50 720 10v40z" fill="#0b2340" />
      </svg>
      <div className="relative overflow-clip bg-[#0b2340] text-slate-300">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16">
          {/* Thẻ kêu gọi */}
          <div className="relative -mt-2 flex flex-col items-center gap-5 overflow-clip rounded-[2rem] bg-gradient-to-r from-primary to-emerald-500 px-6 py-6 text-center shadow-[0_20px_50px_-20px_rgba(0,177,79,0.7)] sm:flex-row sm:px-8 sm:text-left">
            <Img3D name="sparkles" className="absolute right-[30%] top-3 hidden h-7 w-7 opacity-80 md:block" />
            <OwlMascot className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <p className="font-display text-2xl font-black text-white">{isStudent ? "Hôm nay mình học gì nhỉ?" : "Cùng cú ViToan học mỗi ngày!"}</p>
              <p className="mt-1 font-semibold text-white/90">
                {isStudent ? "Mỗi ngày 3 bài luyện tập nhỏ — em sẽ tiến bộ rất nhanh." : "Toán & Tiếng Việt lớp 1–5, miễn phí, không quảng cáo."}
              </p>
            </div>
            <Link
              to={user ? learnTo : "/dang-ky"}
              className="shrink-0 rounded-full bg-white px-7 py-3 font-display text-lg font-black text-primary shadow-lg transition hover:-translate-y-0.5"
            >
              {user ? "Vào học ngay" : "Học thử miễn phí"}
            </Link>
          </div>

          {/* Các cột */}
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="col-span-2 lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <OwlMascot className="h-12 w-12" animated={false} />
                <span className="flex flex-col leading-none">
                  <span className="font-display text-3xl font-black text-white">
                    Vi<span className="text-lime-400">Toan</span>
                  </span>
                  <span className="mt-1 text-xs font-extrabold tracking-wide text-sky-300">Toán & Tiếng Việt cho bé</span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm leading-relaxed text-slate-400">
                Nền tảng tự học trực tuyến cho học sinh tiểu học: video bài giảng, luyện tập chấm từng câu, kiểm tra theo chủ đề và trợ lý AI cú ViToan.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["gift", "Miễn phí"],
                  ["shield", "Không quảng cáo"],
                  ["books", "Bám sát SGK"],
                ].map(([icon, label]) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    <Img3D name={icon} className="h-5 w-5" /> {label}
                  </span>
                ))}
              </div>
            </div>

            <FooterCol title="Học tập">
              <FooterLink to={user?.grade?.slug ? `/lop/${user.grade.slug}/toan` : "/#chon-lop"}>Học Toán</FooterLink>
              <FooterLink to={user?.grade?.slug ? `/lop/${user.grade.slug}/tieng-viet` : "/#chon-lop"}>Học Tiếng Việt</FooterLink>
              <FooterLink to="/on-tap">Ôn tập</FooterLink>
              <FooterLink to="/kiem-tra">Kiểm tra</FooterLink>
              <FooterLink to="/thong-ke">Thống kê học tập</FooterLink>
            </FooterCol>

            <FooterCol title="Vui học">
              <FooterLink to="/nhiem-vu">Nhiệm vụ hằng ngày</FooterLink>
              <FooterLink to="/thanh-tich">Huy hiệu & thành tích</FooterLink>
              <FooterLink to="/xep-hang">Bảng xếp hạng</FooterLink>
              <FooterLink to="/doi-qua">Đổi quà</FooterLink>
              <FooterLink to="/ban-dong-hanh">Hỏi cú AI</FooterLink>
            </FooterCol>

            <FooterCol title="Tài khoản & hỗ trợ">
              {user ? (
                <>
                  <FooterLink to="/ho-so">Hồ sơ của em</FooterLink>
                  <FooterLink to="/lich-su">Lịch sử làm bài</FooterLink>
                  <FooterLink to="/doi-mat-khau">Đổi mật khẩu</FooterLink>
                </>
              ) : (
                <>
                  <FooterLink to="/dang-ky">Đăng ký miễn phí</FooterLink>
                  <FooterLink to="/dang-nhap">Đăng nhập</FooterLink>
                  <FooterLink to="/quen-mat-khau">Quên mật khẩu</FooterLink>
                </>
              )}
              <FooterLink to="/tin-tuc">Tin tức giáo dục</FooterLink>
              <li>
                <a href="mailto:support@vitoan.edu.vn" className="inline-flex items-center gap-2 font-semibold text-slate-300 transition hover:text-white">
                  <Img3D name="mail" className="h-5 w-5" /> support@vitoan.edu.vn
                </a>
              </li>
            </FooterCol>
          </div>

          {/* Thanh cuối */}
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row md:items-start md:justify-between">
            <p>© {new Date().getFullYear()} ViToan · Sản phẩm khóa luận tốt nghiệp.</p>
            <details className="group max-w-xl md:text-right">
              <summary className="cursor-pointer list-none font-semibold text-slate-400 hover:text-slate-200">Ghi nguồn hình ảnh ▾</summary>
              <p className="mt-2 leading-relaxed">
                Hình 3D:{" "}
                <a href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
                  Fluent Emoji
                </a>{" "}
                © Microsoft (MIT). Avatar: "Big Smile" bởi Ashley Seo qua{" "}
                <a href="https://www.dicebear.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
                  DiceBear
                </a>{" "}
                (CC BY 4.0). Hình câu hỏi:{" "}
                <a href="https://github.com/twitter/twemoji" target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
                  Twemoji
                </a>{" "}
                © Twitter, Inc. và cộng tác viên (CC BY 4.0).
              </p>
            </details>
          </div>
        </div>
      </div>
    </footer>
  );
}
