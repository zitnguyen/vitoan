import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LogOut, ExternalLink, Menu, X, User, Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { cn } from "../../lib/utils";
import OwlMascot from "../illustrations/OwlMascot.jsx";
import UserAvatar from "../common/UserAvatar.jsx";
import AdminIdLookup from "./AdminIdLookup.jsx";
import { ADMIN_NAV, IconTile, adminNavFor } from "./adminUi.jsx";

// Khung trang quản trị: thanh bên xanh đậm có icon 3D (thu thành ngăn kéo trên điện thoại),
// thanh trên cùng có tên trang, ô tra cứu ID và nút mở trang học sinh.
function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0b2340] to-[#12305a] text-white">
      <Link to="/admin" onClick={onNavigate} className="group flex h-[4.5rem] shrink-0 items-center gap-3 px-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.6)]">
          <OwlMascot className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" animated={false} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-xl font-black">
            Vi<span className="text-emerald-400">Toan</span>
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Quản trị</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {ADMIN_NAV.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.title && <p className="px-3 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/40">{group.title}</p>}
            {group.items.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-2xl px-2.5 py-1.5 font-bold transition duration-150 active:scale-[0.97]",
                    isActive ? "bg-white text-[#0b2340] shadow-[0_8px_18px_-8px_rgba(0,0,0,0.5)]" : "text-white/75 hover:bg-white/10 hover:text-white"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <IconTile
                      Icon={link.Icon}
                      color={link.color}
                      size="sm"
                      className={cn("transition", !isActive && "opacity-80 saturate-[0.85] group-hover:opacity-100 group-hover:saturate-100")}
                    />
                    <span className="truncate">{link.label}</span>
                    {isActive && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-2xl bg-white/[0.07] p-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="h-10 w-10" showVip={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{user?.fullName}</p>
            <p className="truncate text-xs text-white/50">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Đăng xuất"
            aria-label="Đăng xuất"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/60 transition hover:bg-red-500/20 hover:text-red-300 active:scale-90"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const current = adminNavFor(pathname);
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric" });

  // Đổi trang thì đóng ngăn kéo
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="admin-ui min-h-screen bg-[#f4f7fb]">
      {/* Thanh bên cố định trên máy tính */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Ngăn kéo trên điện thoại / máy tính bảng */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#0b2340]/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="admin-drawer absolute inset-y-0 left-0 w-72 shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng menu"
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-90 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden w-52 shrink-0 md:block">
            <p className="truncate font-display font-extrabold text-slate-800">{current?.label || "Quản trị"}</p>
            <p className="truncate text-xs font-semibold first-letter:uppercase text-slate-400">{today}</p>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <AdminIdLookup />
            <Link
              to="/"
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-primary/40 hover:text-primary active:scale-95 xl:flex"
            >
              <Home className="h-4 w-4" /> Trang học sinh <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
