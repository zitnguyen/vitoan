/* eslint-disable react-refresh/only-export-components */
import { useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { LayoutDashboard, BookOpen, HelpCircle, ClipboardCheck, Newspaper, Gift, Users, Target, BarChart3, Award, Layers, MessageSquare, Package, Megaphone, Swords } from "lucide-react";

// Menu quản trị — dùng chung cho thanh bên (AdminShell) và đầu trang (AdminPage tự lấy icon theo đường dẫn)
export const ADMIN_NAV = [
  {
    title: null,
    items: [{ to: "/admin", label: "Tổng quan", Icon: LayoutDashboard, color: "from-sky-400 to-blue-500", end: true }],
  },
  {
    title: "Nội dung học tập",
    items: [
      { to: "/admin/bai-hoc", label: "Bài học & chủ đề", Icon: BookOpen, color: "from-emerald-400 to-green-500" },
      { to: "/admin/ngan-hang-cau-hoi", label: "Ngân hàng câu hỏi", Icon: HelpCircle, color: "from-violet-400 to-purple-500" },
      { to: "/admin/kiem-tra", label: "Bài kiểm tra", Icon: ClipboardCheck, color: "from-rose-400 to-pink-500" },
      { to: "/admin/tin-tuc", label: "Tin tức", Icon: Newspaper, color: "from-amber-400 to-orange-500" },
      { to: "/admin/lop-mon", label: "Lớp & Môn học", Icon: Layers, color: "from-sky-400 to-indigo-500" },
    ],
  },
  {
    title: "Học sinh & động lực",
    items: [
      { to: "/admin/bao-cao", label: "Báo cáo học tập", Icon: BarChart3, color: "from-teal-400 to-emerald-500" },
      { to: "/admin/tai-khoan", label: "Tài khoản", Icon: Users, color: "from-cyan-400 to-sky-500" },
      { to: "/admin/nhiem-vu", label: "Nhiệm vụ", Icon: Target, color: "from-violet-400 to-indigo-500" },
      { to: "/admin/huy-hieu", label: "Huy hiệu", Icon: Award, color: "from-amber-400 to-yellow-500" },
      { to: "/admin/doi-diem", label: "Đổi quà", Icon: Gift, color: "from-fuchsia-400 to-pink-500" },
      { to: "/admin/don-doi-qua", label: "Đơn đổi quà", Icon: Package, color: "from-orange-400 to-rose-500" },
      { to: "/admin/binh-luan", label: "Bình luận", Icon: MessageSquare, color: "from-lime-400 to-green-500" },
      { to: "/admin/thong-bao", label: "Thông báo chung", Icon: Megaphone, color: "from-red-400 to-orange-500" },
      { to: "/admin/dau-truong", label: "Đấu trường", Icon: Swords, color: "from-purple-400 to-fuchsia-500" },
    ],
  },
];

// Ô icon tròn góc: nền gradient màu + icon trắng (dùng chung thanh bên, đầu trang, thẻ số liệu)
export function IconTile({ Icon, color, size = "md", className }) {
  const box = { sm: "h-8 w-8 rounded-lg", md: "h-10 w-10 rounded-xl", lg: "h-12 w-12 rounded-2xl", xl: "h-14 w-14 rounded-2xl" }[size];
  const ic = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6", xl: "h-7 w-7" }[size];
  return (
    <span className={cn("flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(15,23,42,0.45)]", box, color, className)}>
      {Icon && <Icon className={ic} strokeWidth={2.2} />}
    </span>
  );
}

export function adminNavFor(pathname) {
  const all = ADMIN_NAV.flatMap((g) => g.items);
  return all.filter((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))).sort((a, b) => b.to.length - a.to.length)[0] || null;
}

// Các thành phần giao diện dùng chung cho trang quản trị — để mọi form/trang cùng một kiểu.
export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, hint, required, children, className }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </label>
  );
}

// Đầu trang quản trị: ô icon màu (tự lấy theo mục menu đang mở) + tiêu đề + mô tả + nút thao tác
export function AdminHeader({ title, subtitle, actions, icon, className }) {
  const { pathname } = useLocation();
  const nav = adminNavFor(pathname);
  const Icon = icon || nav?.Icon;
  return (
    <div className={cn("mb-6 flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-4">
        {Icon && <IconTile Icon={Icon} color={nav?.color || "from-slate-400 to-slate-500"} size="xl" />}
        <div className="min-w-0">
          {title && <h1 className="font-display text-2xl font-extrabold text-slate-800 sm:text-[1.7rem]">{title}</h1>}
          {subtitle && <p className="mt-0.5 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const adminPageClass = "mx-auto max-w-6xl px-4 py-6 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16";

export function AdminPage({ title, subtitle, actions, icon, children, className }) {
  return (
    <div className={cn(adminPageClass, className)}>
      {(title || actions) && <AdminHeader title={title} subtitle={subtitle} actions={actions} icon={icon} />}
      {children}
    </div>
  );
}

export function Card({ children, className }) {
  return <div className={cn("rounded-2xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100", className)}>{children}</div>;
}

export function IconButton({ title, onClick, children, tone = "default", disabled, className, ...rest }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger" ? "text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:border-primary/40 hover:text-primary",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function StatusChip({ ok, children, warn }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold",
        ok ? "bg-green-50 text-green-700" : warn ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
      )}
    >
      {children}
    </span>
  );
}

// Nhận link YouTube bất kỳ (watch?v=, youtu.be/, shorts/, embed/) → link nhúng /embed/ID.
export function toEmbedUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  const m =
    s.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    s.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    s.match(/[?&]v=([\w-]{6,})/) ||
    s.match(/youtu\.be\/([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : s;
}
