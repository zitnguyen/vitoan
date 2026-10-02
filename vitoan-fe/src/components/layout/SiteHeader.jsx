import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ChevronDown,
  Check,
  User,
  History,
  ShieldCheck,
  LogOut,
  Mail,
  Gem,
  GraduationCap,
  Trophy,
  Target,
  Gift,
  Newspaper,
  Menu,
  X,
  Bot,
  Medal,
  BarChart3,
} from "../ui/icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { gradeService } from "../../api/services";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { cn } from "../../lib/utils";
import UserAvatar from "../common/UserAvatar.jsx";
import UserName from "../common/UserName.jsx";

const NAV_LINKS = [{ to: "/", label: "Trang chủ" }, { to: "/#vi-sao", label: "Vì sao chọn ViToan" }];
// Menu của khách trên trang chủ: nhảy tới các khối của trang giới thiệu
const GUEST_LINKS = [
  { to: "/#chon-lop", label: "Chương trình học" },
  { to: "/#vinh-danh", label: "Bảng vàng" },
  { to: "/#lo-trinh", label: "Lộ trình" },
  { to: "/#vi-sao", label: "Vì sao chọn ViToan" },
  { to: "/tin-tuc", label: "Tin tức" },
];

// Menu chính khi đã đăng nhập (đã gộp các mục của "Khám phá" cũ vào đây)
const TOP_NAV_ITEMS = [
  { to: "/nhiem-vu", label: "Nhiệm vụ", Icon: Target, color: "text-violet-500" },
  { to: "/thanh-tich", label: "Thành tích", Icon: Trophy, color: "text-amber-500" },
  { to: "/xep-hang", label: "Xếp hạng", Icon: Medal, color: "text-amber-500" },
  { to: "/thong-ke", label: "Thống kê", Icon: BarChart3, color: "text-secondary" },
  { to: "/doi-qua", label: "Đổi quà", Icon: Gift, color: "text-pink-500" },
  { to: "/ban-dong-hanh", label: "Bạn đồng hành", Icon: Bot, color: "text-primary" },
  { to: "/tin-tuc", label: "Tin tức", Icon: Newspaper, color: "text-teal-500" },
];

const MAIN_NAV_ITEMS = TOP_NAV_ITEMS;

// Màu số lớp (giống trang "Chọn lớp")
const GRADE_NUM = ["from-emerald-400 to-green-500", "from-sky-400 to-blue-500", "from-amber-400 to-orange-500", "from-violet-400 to-purple-500", "from-pink-400 to-rose-500"];

function GradesDropdown({ activeGrade }) {
  const [open, setOpen] = useState(false);
  const [grades, setGrades] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    gradeService.list().then((res) => setGrades(res.data));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-0.5">
      {activeGrade ? (
        <Link to={`/lop/${activeGrade.slug}/toan`} className="whitespace-nowrap font-semibold text-slate-600 hover:text-primary">
          Vào học
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="whitespace-nowrap font-semibold text-slate-600 hover:text-primary"
        >
          Vào học
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Đổi lớp"
        className="flex items-center p-0.5 text-slate-400 hover:text-primary"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full mt-3 w-80 -translate-x-1/2 rounded-[1.5rem] bg-white p-4 shadow-[0_24px_60px_-20px_rgba(11,35,64,0.45)]">
          <p className="px-2 pb-3 text-xs font-black uppercase tracking-wider text-slate-400">Chọn lớp để vào học</p>
          <div className="grid grid-cols-2 gap-2">
            {grades.map((grade, idx) => {
              const num = GRADE_NUM[idx % GRADE_NUM.length];
              const isActive = activeGrade?._id === grade._id;
              return (
                <Link
                  key={grade._id}
                  to={`/lop/${grade.slug}/toan`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl p-2 transition hover:bg-slate-50",
                    isActive && "bg-primary/10 ring-2 ring-primary/30"
                  )}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display text-lg font-black text-white shadow ${num}`}>
                    {grade.order || idx + 1}
                  </span>
                  <span className="flex-1 font-display font-black text-slate-800">{grade.name}</span>
                  {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItemClass =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-slate-50"
      >
        <UserAvatar user={user} size="h-9 w-9" decoSize="text-xs" />
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 min-[1760px]:inline">
          {user.fullName}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white p-2 shadow-elevation-3">
          <div className="flex items-center gap-3 border-b border-slate-100 p-2.5 pb-3">
            <UserAvatar user={user} size="h-12 w-12" decoSize="text-sm" />
            <div className="min-w-0">
              <UserName user={user} className="whitespace-normal break-words" />
              <p className="truncate text-caption text-slate-400">@{user.username}</p>
            </div>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <Link to="/ho-so" onClick={() => setOpen(false)} className={menuItemClass}>
              <User className="h-6 w-6" /> Hồ sơ cá nhân
            </Link>
            {user.role === "Student" && (
              <Link to="/lich-su" onClick={() => setOpen(false)} className={menuItemClass}>
                <History className="h-6 w-6" /> Lịch sử làm bài
              </Link>
            )}
            {user.role === "Admin" && (
              <Link to="/admin" onClick={() => setOpen(false)} className={menuItemClass}>
                <ShieldCheck className="h-6 w-6" /> Trang quản trị
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={cn(menuItemClass, "w-full text-red-500 hover:bg-red-50 hover:text-red-600")}
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ user, onLogout, onClose }) {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    gradeService.list().then((res) => setGrades(res.data));
  }, []);

  function go(to) {
    onClose();
    navigate(to);
  }

  const itemClass =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary";
  const TILE_BG = ["bg-violet-50", "bg-amber-50", "bg-orange-50", "bg-sky-50", "bg-pink-50", "bg-emerald-50", "bg-teal-50"];

  return (
    <div className={cn("mt-2 rounded-[1.75rem] bg-white shadow-[0_20px_50px_-20px_rgba(11,35,64,0.4)] xl:hidden", user && "mx-3 mb-3 sm:mx-6")}>
      <div className="max-h-[calc(100vh-96px)] overflow-y-auto px-4 py-4">
        <button type="button" onClick={() => go("/")} className={cn(itemClass, "w-full text-base")}>
          <Home className="h-6 w-6" /> Trang chủ
        </button>

        <p className="mt-3 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Vào học</p>
        <div className="mt-2 grid grid-cols-5 gap-2 px-1">
          {grades.map((grade, idx) => (
            <button
              key={grade._id}
              type="button"
              onClick={() => go(`/lop/${grade.slug}/toan`)}
              className="flex flex-col items-center gap-1 rounded-2xl p-2 transition hover:bg-slate-50"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br font-display text-xl font-black text-white shadow ${GRADE_NUM[idx % GRADE_NUM.length]}`}>
                {grade.order || idx + 1}
              </span>
              <span className="text-xs font-black text-slate-600">{grade.name}</span>
            </button>
          ))}
        </div>

        {user && (
          <>
            <p className="mt-4 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Chức năng</p>
            <div className="mt-2 grid grid-cols-3 gap-2 px-1 sm:grid-cols-4">
              {MAIN_NAV_ITEMS.map((item, i) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => go(item.to)}
                  className={cn("flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition hover:-translate-y-0.5", TILE_BG[i % TILE_BG.length])}
                >
                  <item.Icon className="h-9 w-9" />
                  <span className="text-xs font-black leading-tight text-slate-700">{item.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!user && (
          <button type="button" onClick={() => go(NAV_LINKS[1].to)} className={cn(itemClass, "mt-2 w-full")}>
            {NAV_LINKS[1].label}
          </button>
        )}

        <div className="mt-3 border-t border-slate-100 pt-3">
          {user ? (
            <div className="space-y-0.5">
              <button type="button" onClick={() => go("/ho-so")} className={cn(itemClass, "w-full")}>
                <User className="h-6 w-6" /> Hồ sơ cá nhân
              </button>
              {user.role === "Student" && (
                <button type="button" onClick={() => go("/lich-su")} className={cn(itemClass, "w-full")}>
                  <History className="h-6 w-6" /> Lịch sử làm bài
                </button>
              )}
              {user.role === "Admin" && (
                <button type="button" onClick={() => go("/admin")} className={cn(itemClass, "w-full")}>
                  <ShieldCheck className="h-6 w-6" /> Trang quản trị
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className={cn(itemClass, "w-full text-red-500 hover:bg-red-50 hover:text-red-600")}
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex gap-3 px-1">
              <button
                type="button"
                onClick={() => go("/dang-nhap")}
                className="flex-1 rounded-full py-2.5 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:text-primary hover:ring-primary/40"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => go("/dang-ky")}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-black text-white shadow-[0_4px_0_0_#049245]"
              >
                Trải nghiệm ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const guestLanding = !user && pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [user]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header
      className={cn(
        "z-30",
        // Khách: thanh menu trắng bo tròn nổi (kiểu VioEdu) ở MỌI trang — trang chủ thì nổi đè lên nền trời,
        // trang khác thì dính trên cùng. Đã đăng nhập: thanh menu đầy đủ.
        !user && "px-3 pt-3 sm:px-6",
        guestLanding ? "fixed inset-x-0 top-0" : "sticky top-0",
        user && "border-b border-slate-200/70 bg-white/95 shadow-[0_6px_20px_-14px_rgba(11,35,64,0.35)] backdrop-blur"
      )}
    >
      {/* ===== Top utility bar (chỉ khi đã đăng nhập) ===== */}
      <div className={cn("hidden border-b border-slate-100", user && "md:block")}>
        <div className="mx-auto flex max-w-6xl xl:max-w-none xl:px-10 2xl:px-16 items-center justify-between px-4 py-1.5 sm:px-6 text-caption text-slate-500">
          <div className="flex items-center gap-5">
            <a href="mailto:support@vitoan.edu.vn" className="flex items-center gap-1.5 hover:text-primary">
              <Mail className="h-3.5 w-3.5" /> support@vitoan.edu.vn
            </a>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <Link to="/doi-qua" className="flex items-center gap-1.5 hover:text-vietnamese">
                <Gem className="h-3.5 w-3.5 text-vietnamese" /> {user.points ?? 0}
              </Link>
              {user.grade?.name && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> {user.grade.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Main nav ===== */}
      <div
        className={cn(
          "mx-auto flex items-center justify-between gap-2 px-3 py-2 sm:gap-5 sm:px-6",
          !user
            ? "max-w-7xl rounded-full bg-white/90 shadow-[0_8px_30px_-12px_rgba(11,35,64,0.3)] backdrop-blur"
            : "max-w-6xl xl:max-w-none xl:px-10 2xl:px-16"
        )}
      >
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <OwlMascot
            className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
            animated={false}
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl font-black text-ink">
              Vi<span className="text-primary">Toan</span>
            </span>
            <span className="mt-0.5 hidden text-[11px] font-extrabold tracking-wide text-secondary sm:block">Toán &amp; Tiếng Việt cho bé ✏️</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-xs xl:flex 2xl:gap-1.5 2xl:text-sm">
          <a href={NAV_LINKS[0].to} className="whitespace-nowrap rounded-full px-2.5 py-1.5 font-bold text-slate-600 transition hover:bg-slate-100 hover:text-primary">
            {NAV_LINKS[0].label}
          </a>
          <GradesDropdown activeGrade={user?.grade} />
          {user &&
            TOP_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 font-bold transition",
                    isActive ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                  )
                }
              >
                <item.Icon className="hidden h-5 w-5 shrink-0 2xl:block" /> {item.label}
              </NavLink>
            ))}
          {!user &&
            GUEST_LINKS.map((l) => (
              <a key={l.to} href={l.to} className="whitespace-nowrap font-bold text-slate-600 hover:text-primary">
                {l.label}
              </a>
            ))}
        </nav>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link
                to="/dang-nhap"
                className="hidden whitespace-nowrap rounded-full border border-slate-300 bg-white px-5 py-2 font-bold text-slate-700 transition hover:border-primary hover:text-primary sm:inline"
              >
                Đăng nhập
              </Link>
              <Link
                to="/dang-ky"
                className="whitespace-nowrap rounded-full bg-primary px-4 py-2 font-black text-white shadow-[0_4px_0_0_#049245] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:px-5"
              >
                <span className="hidden sm:inline">Trải nghiệm ngay</span>
                <span className="sm:hidden">Đăng ký</span>
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 xl:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && <MobileMenu user={user} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />}
    </header>
  );
}
