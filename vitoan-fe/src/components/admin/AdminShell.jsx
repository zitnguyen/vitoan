import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Users,
  Gift,
  HelpCircle,
  LogOut,
  ArrowLeftCircle,
  User,
  Newspaper,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { cn } from "../../lib/utils";
import AdminIdLookup from "./AdminIdLookup.jsx";

const LINK_GROUPS = [
  {
    title: null,
    items: [{ to: "/admin", label: "Tổng quan", Icon: LayoutDashboard, end: true }],
  },
  {
    title: "Nội dung học tập",
    items: [
      { to: "/admin/bai-hoc", label: "Chương trình học", Icon: BookOpen },
      { to: "/admin/ngan-hang-cau-hoi", label: "Ngân hàng câu hỏi", Icon: HelpCircle },
      { to: "/admin/kiem-tra", label: "Bài kiểm tra", Icon: ClipboardCheck },
    ],
  },
  {
    title: "Vận hành",
    items: [
      { to: "/admin/tin-tuc", label: "Tin tức", Icon: Newspaper },
      { to: "/admin/doi-diem", label: "Phần quà", Icon: Gift },
      { to: "/admin/tai-khoan", label: "Tài khoản", Icon: Users },
    ],
  },
];

export default function AdminShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="admin-ui flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-extrabold text-white">
            V
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold text-slate-800">ViToan</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quản trị</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {LINK_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.title && (
                <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{group.title}</p>
              )}
              {group.items.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-base font-semibold transition",
                      isActive ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    )
                  }
                >
                  <link.Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  {link.label}
                </NavLink>
              ))}
            </div>
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
              <p className="truncate text-xs text-slate-400">@{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pl-64">
        <div className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <AdminIdLookup />
        </div>
        {children}
      </div>
    </div>
  );
}
