import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Check,
  Sprout,
  CloudSun,
  PartyPopper,
  Star,
  Rocket,
  User,
  History,
  ShieldCheck,
  LogOut,
  Mail,
  Phone,
  Bell,
  Gem,
  GraduationCap,
  Trophy,
  Target,
  Swords,
  Gift,
  BookMarked,
  Newspaper,
  LifeBuoy,
  Menu,
  X,
  Sparkles,
  Bot,
  Medal,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { gradeService } from "../../api/services";
import Button from "../ui/Button.jsx";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import { cn } from "../../lib/utils";

const NAV_LINKS = [{ to: "/", label: "Trang chủ" }, { to: "/#vi-sao", label: "Vì sao chọn ViToan" }];

const TOP_NAV_ITEMS = [
  { to: "/nhiem-vu", label: "Nhiệm vụ", Icon: Target, color: "text-violet-500" },
  { to: "/mua-khoa-hoc", label: "Khoá học", Icon: BookMarked, color: "text-secondary" },
  { to: "/thanh-tich", label: "Thành tích", Icon: Trophy, color: "text-amber-500" },
  { to: "/doi-qua", label: "Đổi quà", Icon: Gift, color: "text-pink-500" },
  { to: "/ban-dong-hanh", label: "Bạn đồng hành", Icon: Bot, color: "text-primary" },
];

const MORE_NAV_ITEMS = [
  { to: "/xep-hang", label: "Bảng xếp hạng", Icon: Medal, color: "text-amber-500" },
  { to: "/thong-ke", label: "Thống kê học tập", Icon: BarChart3, color: "text-secondary" },
  { to: "/dau-truong", label: "Đấu trường", Icon: Swords, color: "text-rose-500" },
  { to: "/tin-tuc", label: "Tin tức", Icon: Newspaper, color: "text-teal-500" },
  { to: "/lien-he", label: "Liên hệ", Icon: LifeBuoy, color: "text-red-500" },
];

const MAIN_NAV_ITEMS = [...TOP_NAV_ITEMS, ...MORE_NAV_ITEMS];

const GRADE_THEMES = [
  { bg: "bg-primary", Icon: Sprout },
  { bg: "bg-secondary", Icon: CloudSun },
  { bg: "bg-vietnamese", Icon: PartyPopper },
  { bg: "bg-violet-500", Icon: Star },
  { bg: "bg-rose-500", Icon: Rocket },
];

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
        <div className="absolute left-1/2 top-full mt-3 w-72 -translate-x-1/2 rounded-2xl bg-white p-3 shadow-elevation-3 ring-1 ring-slate-100">
          <p className="px-2 pb-2 text-caption font-bold uppercase tracking-wide text-slate-400">Chọn lớp để vào học</p>
          <div className="grid grid-cols-2 gap-1.5">
            {grades.map((grade, idx) => {
              const theme = GRADE_THEMES[idx % GRADE_THEMES.length];
              const isActive = activeGrade?._id === grade._id;
              return (
                <Link
                  key={grade._id}
                  to={`/lop/${grade.slug}/toan`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-50",
                    isActive && "bg-primary/10 ring-1 ring-primary/30"
                  )}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${theme.bg}`}>
                    <theme.Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="flex-1 font-display font-bold text-slate-800">{grade.name}</span>
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

function MoreNavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 whitespace-nowrap font-semibold text-slate-600 hover:text-primary"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-secondary xl:h-4 xl:w-4" /> Khám phá
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl bg-white p-2 shadow-elevation-3 ring-1 ring-slate-100">
          {MORE_NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary"
            >
              <item.Icon className={cn("h-4 w-4 shrink-0", item.color)} /> {item.label}
            </Link>
          ))}
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
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-slate-100">
            <User className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-slate-700 xl:inline">
          {user.fullName}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white p-2 shadow-elevation-3 ring-1 ring-slate-100">
          <div className="flex items-center gap-3 border-b border-slate-100 p-2.5 pb-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display font-bold text-slate-800">{user.fullName}</p>
              <p className="truncate text-caption text-slate-400">@{user.username}</p>
            </div>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <Link to="/ho-so" onClick={() => setOpen(false)} className={menuItemClass}>
              <User className="h-4 w-4 text-slate-400" /> Hồ sơ cá nhân
            </Link>
            {user.role === "Student" && (
              <Link to="/lich-su" onClick={() => setOpen(false)} className={menuItemClass}>
                <History className="h-4 w-4 text-slate-400" /> Lịch sử làm bài
              </Link>
            )}
            {user.role === "Admin" && (
              <Link to="/admin" onClick={() => setOpen(false)} className={menuItemClass}>
                <ShieldCheck className="h-4 w-4 text-slate-400" /> Trang quản trị
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
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary";

  return (
    <div className="border-t border-slate-100 bg-white xl:hidden">
      <div className="max-h-[calc(100vh-64px)] overflow-y-auto px-4 py-3">
        <button type="button" onClick={() => go("/")} className={cn(itemClass, "w-full")}>
          Trang chủ
        </button>

        <p className="mt-2 px-3 text-caption font-bold uppercase tracking-wide text-slate-400">Vào học</p>
        <div className="mt-1 grid grid-cols-2 gap-1.5 px-1">
          {grades.map((grade, idx) => {
            const theme = GRADE_THEMES[idx % GRADE_THEMES.length];
            return (
              <button
                key={grade._id}
                type="button"
                onClick={() => go(`/lop/${grade.slug}/toan`)}
                className="flex items-center gap-2 rounded-xl p-2 text-left hover:bg-slate-50"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${theme.bg}`}>
                  <theme.Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="font-display text-sm font-bold text-slate-800">{grade.name}</span>
              </button>
            );
          })}
        </div>

        {user && (
          <>
            <p className="mt-3 px-3 text-caption font-bold uppercase tracking-wide text-slate-400">Chức năng</p>
            <div className="mt-1 space-y-0.5">
              {MAIN_NAV_ITEMS.map((item) => (
                <button key={item.to} type="button" onClick={() => go(item.to)} className={cn(itemClass, "w-full")}>
                  <item.Icon className={cn("h-4 w-4 shrink-0", item.color)} /> {item.label}
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
                <User className="h-4 w-4 text-slate-400" /> Hồ sơ cá nhân
              </button>
              {user.role === "Student" && (
                <button type="button" onClick={() => go("/lich-su")} className={cn(itemClass, "w-full")}>
                  <History className="h-4 w-4 text-slate-400" /> Lịch sử làm bài
                </button>
              )}
              {user.role === "Admin" && (
                <button type="button" onClick={() => go("/admin")} className={cn(itemClass, "w-full")}>
                  <ShieldCheck className="h-4 w-4 text-slate-400" /> Trang quản trị
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
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => go("/dang-ky")}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [user]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-20 bg-white shadow-elevation-1">
      {/* ===== Top utility bar ===== */}
      <div className="hidden border-b border-slate-100 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-caption text-slate-500">
          <div className="flex items-center gap-5">
            <a href="mailto:support@vitoan.vn" className="flex items-center gap-1.5 hover:text-primary">
              <Mail className="h-3.5 w-3.5" /> support@vitoan.vn
            </a>
            <a href="tel:19000000" className="flex items-center gap-1.5 hover:text-primary">
              <Phone className="h-3.5 w-3.5" /> 1900 000 000
            </a>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-secondary" /> 0
              </span>
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="group flex items-center gap-2">
          <OwlMascot
            className="h-10 w-10 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
            animated={false}
          />
          <span className="font-display text-xl font-extrabold text-slate-800">
            Vi<span className="text-primary">Toan</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-[13px] 2xl:gap-5 2xl:text-sm xl:flex">
          <a href={NAV_LINKS[0].to} className="whitespace-nowrap font-semibold text-slate-600 hover:text-primary">
            {NAV_LINKS[0].label}
          </a>
          <GradesDropdown activeGrade={user?.grade} />
          {user &&
            TOP_NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 whitespace-nowrap font-semibold text-slate-600 hover:text-primary"
              >
                <item.Icon className={cn("h-4 w-4 shrink-0", item.color)} /> {item.label}
              </Link>
            ))}
          {user && <MoreNavDropdown />}
          {!user && (
            <a href={NAV_LINKS[1].to} className="whitespace-nowrap font-semibold text-slate-600 hover:text-primary">
              {NAV_LINKS[1].label}
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/dang-nhap" className="hidden whitespace-nowrap font-semibold text-slate-600 hover:text-primary sm:inline">
                Đăng nhập
              </Link>
              <Button className="hidden whitespace-nowrap rounded-full px-5 sm:inline-flex" onClick={() => navigate("/dang-ky")}>
                Trải nghiệm ngay
              </Button>
              <Button className="whitespace-nowrap rounded-full px-4 sm:hidden" onClick={() => navigate("/dang-ky")}>
                Đăng ký
              </Button>
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
