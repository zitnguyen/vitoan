import { useEffect, useState } from "react";
import { Search, Pencil, X, UserPlus, Gem } from "lucide-react";
import { userService, gradeService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { AdminPage, Card, Field, IconButton, inputClass } from "../../components/admin/adminUi.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const EMPTY_FORM = { fullName: "", username: "", email: "", phone: "", password: "", role: "Student", grade: "" };
const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt động", className: "bg-green-50 text-green-700 ring-green-200" },
  { value: "suspended", label: "Tạm khoá", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  { value: "disabled", label: "Vô hiệu hoá", className: "bg-red-50 text-red-600 ring-red-200" },
];

export default function AdminAccountsPage() {
  const dialog = useDialog();
  const { user: me } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState(null);

  async function loadAccounts() {
    const res = await userService.list({
      search: search || undefined,
      role: roleFilter || undefined,
      grade: gradeFilter || undefined,
      status: statusFilter || undefined,
    });
    setAccounts(res.data);
  }

  useEffect(() => {
    gradeService.list().then((res) => setGrades(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => loadAccounts().finally(() => setLoading(false)), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, gradeFilter, statusFilter]);

  async function startEdit(account) {
    setEditingId(account.id);
    setError("");
    setForm({
      fullName: account.fullName,
      username: account.username,
      email: account.email || "",
      phone: account.phone || "",
      password: "",
      role: account.role,
      grade: account.grade?._id || account.grade || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function closeForm() {
    setEditingId(null);
    setForm(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await userService.update(editingId, form);
        setMessage(form.password ? `Đã cập nhật và đặt lại mật khẩu cho ${form.fullName}.` : `Đã cập nhật ${form.fullName}.`);
      } else {
        const res = await userService.create(form);
        setMessage(`Đã tạo tài khoản @${res.data.username}.`);
      }
      closeForm();
      await loadAccounts();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleStatusChange(account, status) {
    if (status === account.status) return;
    const label = STATUS_OPTIONS.find((s) => s.value === status)?.label;
    if (status !== "active" && !(await dialog.confirm({ message: `Chuyển ${account.fullName} sang "${label}"? Tài khoản sẽ không đăng nhập được.`, danger: true }))) return;
    setSavingId(account.id);
    try {
      await userService.updateStatus(account.id, status);
      await loadAccounts();
    } catch (err) {
      dialog.alert(err.apiMessage || "Không thể đổi trạng thái");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminPage
      title="Tài khoản"
      subtitle="Tạo tài khoản, sửa thông tin, đặt lại mật khẩu và khoá tài khoản."
      actions={
        !form && (
          <Button
            onClick={() => {
              setEditingId(null);
              setError("");
              setForm({ ...EMPTY_FORM });
            }}
          >
            <UserPlus className="h-4 w-4" /> Tạo tài khoản
          </Button>
        )
      }
    >
      {message && (
        <p className="mb-4 flex items-center justify-between rounded-xl bg-green-50 px-4 py-2.5 font-semibold text-green-700">
          {message}
          <button type="button" onClick={() => setMessage("")} className="text-green-700/70 hover:text-green-800">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {form && (
        <form onSubmit={handleSubmit} className="mb-5 rounded-2xl bg-white p-5 shadow-elevation-2 ring-2 ring-primary/30">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-h3 text-slate-800">{editingId ? `Sửa tài khoản @${form.username}` : "Tạo tài khoản mới"}</p>
            <IconButton title="Đóng" onClick={closeForm}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Vai trò">
              <div className="flex gap-2">
                {[
                  { v: "Student", l: "Học sinh" },
                  { v: "Admin", l: "Quản trị viên" },
                ].map((r) => (
                  <button
                    key={r.v}
                    type="button"
                    disabled={editingId === me?.id && r.v !== "Admin"}
                    onClick={() => setForm((f) => ({ ...f, role: r.v }))}
                    className={cn(
                      "flex-1 rounded-xl py-2.5 font-bold ring-1 disabled:opacity-40",
                      form.role === r.v ? "bg-primary text-white ring-primary" : "bg-white text-slate-600 ring-slate-200"
                    )}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </Field>
            {form.role === "Student" ? (
              <Field label="Lớp">
                <select className={inputClass} value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}>
                  <option value="">Chưa chọn lớp</option>
                  {grades.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div />
            )}
            <Field label="Họ và tên" required>
              <input className={inputClass} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            </Field>
            <Field label="Tên đăng nhập" hint={editingId ? "Không đổi được tên đăng nhập." : "Để trống thì hệ thống tự tạo từ họ tên."}>
              <input
                className={inputClass}
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={!!editingId}
              />
            </Field>
            <Field
              label={editingId ? "Đặt lại mật khẩu" : "Mật khẩu"}
              required={!editingId}
              hint={editingId ? "Để trống nếu giữ mật khẩu cũ. Tối thiểu 6 ký tự." : "Tối thiểu 6 ký tự."}
            >
              <PasswordInput
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editingId}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Email" hint="Không bắt buộc — dùng để lấy lại mật khẩu.">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Số điện thoại (phụ huynh)">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <Button type="submit">{editingId ? "Lưu thay đổi" : "Tạo tài khoản"}</Button>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Tìm theo họ tên, tên đăng nhập, email, SĐT"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={cn(inputClass, "w-auto")} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Mọi vai trò</option>
          <option value="Student">Học sinh</option>
          <option value="Admin">Quản trị viên</option>
        </select>
        <select className={cn(inputClass, "w-auto")} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
          <option value="">Mọi lớp</option>
          {grades.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <select className={cn(inputClass, "w-auto")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <Card className="mt-4 overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Vai trò / Lớp</th>
                <th className="px-4 py-3">Email / SĐT</th>
                <th className="px-4 py-3 text-right">Điểm</th>
                <th className="px-4 py-3">Đăng nhập gần nhất</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const status = STATUS_OPTIONS.find((s) => s.value === a.status) || STATUS_OPTIONS[0];
                const isMe = a.id === me?.id;
                return (
                  <tr key={a.id} className={cn("border-t border-slate-100", a.id === editingId && "bg-primary/5")}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">
                        {a.fullName} {isMe && <span className="text-sm font-semibold text-primary">(bạn)</span>}
                      </p>
                      <p className="text-sm text-slate-400">@{a.username}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.role === "Admin" ? (
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-bold text-violet-700">Quản trị viên</span>
                      ) : (
                        a.grade?.name || <span className="text-slate-400">Chưa chọn lớp</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      <p>{a.email || "—"}</p>
                      {a.phone && <p>{a.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.role === "Student" && (
                        <span className="inline-flex items-center gap-1 font-bold text-vietnamese">
                          <Gem className="h-4 w-4" /> {a.points ?? 0}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        disabled={savingId === a.id || isMe}
                        onChange={(e) => handleStatusChange(a, e.target.value)}
                        className={cn("rounded-full px-3 py-1 text-sm font-bold ring-1 focus:outline-none disabled:opacity-60", status.className)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <IconButton title="Sửa / đặt lại mật khẩu" onClick={() => startEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}
