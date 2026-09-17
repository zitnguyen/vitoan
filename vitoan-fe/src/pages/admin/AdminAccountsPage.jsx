import { useEffect, useState } from "react";
import { Users, Search, Pencil, X, UserPlus, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { userService, gradeService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";

const EMPTY_FORM = { fullName: "", username: "", email: "", phone: "", password: "", role: "Student", grade: "" };
const inputClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

const STATUS_LABEL = { active: "Hoạt động", suspended: "Tạm khóa", disabled: "Vô hiệu hóa" };
const STATUS_STYLE = {
  active: "bg-primary/10 text-primary",
  suspended: "bg-amber-100 text-amber-700",
  disabled: "bg-red-100 text-red-600",
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
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
    const timer = setTimeout(() => {
      loadAccounts().finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, gradeFilter, statusFilter]);

  function startEdit(account) {
    setEditingId(account.id);
    setShowForm(true);
    setForm({
      fullName: account.fullName,
      username: account.username,
      email: account.email || "",
      phone: account.phone || "",
      password: "",
      role: account.role,
      grade: account.grade?._id || account.grade || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await userService.update(editingId, form);
      } else {
        await userService.create(form);
      }
      resetForm();
      await loadAccounts();
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    }
  }

  async function handleStatusChange(account, status) {
    setSavingId(account.id);
    try {
      await userService.updateStatus(account.id, status);
      await loadAccounts();
    } catch (err) {
      alert(err.apiMessage || "Không thể đổi trạng thái");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-h2 text-slate-800">
          <Users className="h-6 w-6 text-primary" /> Quản lý tài khoản
        </h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <UserPlus className="h-4 w-4" /> Tạo tài khoản
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:grid-cols-2"
        >
          <input
            className={inputClass}
            placeholder="Họ và tên"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
          <input
            className={inputClass}
            placeholder="Tên đăng nhập (để trống sẽ tự sinh)"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            disabled={!!editingId}
          />
          <input
            className={inputClass}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          {!editingId && (
            <PasswordInput
              className={inputClass}
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          )}
          <select
            className={inputClass}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="Student">Học sinh</option>
            <option value="Admin">Quản trị viên</option>
          </select>
          {form.role === "Student" && (
            <select
              className={inputClass}
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
            >
              <option value="">-- Lớp --</option>
              {grades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          {error && <p className="text-caption text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">{editingId ? "Cập nhật" : "Tạo tài khoản"}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4" /> Hủy
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} w-full pl-9`}
            placeholder="Tìm theo họ tên hoặc email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={inputClass} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="Student">Học sinh</option>
          <option value="Admin">Quản trị viên</option>
        </select>
        <select className={inputClass} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
          <option value="">Tất cả lớp</option>
          {grades.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>
        <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="suspended">Tạm khóa</option>
          <option value="disabled">Vô hiệu hóa</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-elevation-1 ring-1 ring-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-caption font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Tên đăng nhập</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Lớp</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Đăng nhập gần nhất</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{account.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">@{account.username}</td>
                  <td className="px-4 py-3 text-slate-500">{account.email || "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{account.role === "Admin" ? "Quản trị viên" : "Học sinh"}</td>
                  <td className="px-4 py-3 text-slate-500">{account.grade?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-caption font-semibold", STATUS_STYLE[account.status])}>
                      {STATUS_LABEL[account.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-caption text-slate-400">
                    {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="outline" onClick={() => startEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {account.status !== "active" && (
                        <button
                          type="button"
                          title="Kích hoạt"
                          disabled={savingId === account.id}
                          onClick={() => handleStatusChange(account, "active")}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-primary hover:bg-primary/5"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      )}
                      {account.status !== "suspended" && (
                        <button
                          type="button"
                          title="Tạm khóa"
                          disabled={savingId === account.id}
                          onClick={() => handleStatusChange(account, "suspended")}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-amber-600 hover:bg-amber-50"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                      )}
                      {account.status !== "disabled" && (
                        <button
                          type="button"
                          title="Vô hiệu hóa"
                          disabled={savingId === account.id}
                          onClick={() => handleStatusChange(account, "disabled")}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-red-500 hover:bg-red-50"
                        >
                          <ShieldX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
