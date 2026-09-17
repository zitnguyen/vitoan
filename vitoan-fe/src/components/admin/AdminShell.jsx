import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, ClipboardCheck, Users, LogOut, ArrowLeftCircle, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { cn } from "../../lib/utils";

const LINKS = [
  { to: "/admin", label: "Tổng quan", Icon: LayoutDashboard, end: true },
  { to: "/admin/bai-hoc", label: "Bài học", Icon: BookOpen },
  { to: "/admin/kiem-tra", label: "Kiểm tra", Icon: ClipboardCheck },
  { to: "/admin/tai-khoan", label: "Tài khoản", Icon: Users },
];

export default function AdminShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-extrabold text-white">
            V
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold text-slate-800">ViToan</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quản trị</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )
              }
            >
              <link.Icon className="h-4.5 w-4.5" strokeWidth={2} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-slate-100 p-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeftCircle className="h-4.5 w-4.5" /> Về trang người dùng
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4.5 w-4.5" /> Đăng xuất
          </button>
          <div className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-700">{user?.fullName}</p>
              <p className="truncate text-[11px] text-slate-400">@{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 pl-60">{children}</div>
    </div>
  );
}
