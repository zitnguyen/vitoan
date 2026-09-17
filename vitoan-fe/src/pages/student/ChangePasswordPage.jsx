import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {message}
    </p>
  );
}

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }

  function validate() {
    const errors = {};
    if (!form.currentPassword) errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPassword) errors.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (form.newPassword.length < 6) errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    if (!form.confirmNewPassword) errors.confirmNewPassword = "Vui lòng xác nhận mật khẩu mới";
    else if (form.confirmNewPassword !== form.newPassword) errors.confirmNewPassword = "Xác nhận mật khẩu không khớp";
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await changePassword(form);
      toast.success("Đổi mật khẩu thành công!");
      navigate("/ho-so", { replace: true });
    } catch (err) {
      const message = err.apiMessage || "Đổi mật khẩu thất bại";
      if (message.includes("hiện tại")) {
        setFieldErrors({ currentPassword: message });
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-h2 text-slate-800">Đổi mật khẩu</h1>
      <p className="mt-2 text-caption text-slate-500">Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:p-8">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Lock className="h-4 w-4" /> Mật khẩu hiện tại <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={form.currentPassword}
            onChange={(e) => updateField("currentPassword", e.target.value)}
          />
          <FieldError message={fieldErrors.currentPassword} />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Lock className="h-4 w-4" /> Mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={form.newPassword}
            onChange={(e) => updateField("newPassword", e.target.value)}
          />
          <FieldError message={fieldErrors.newPassword} />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Lock className="h-4 w-4" /> Xác nhận mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={form.confirmNewPassword}
            onChange={(e) => updateField("confirmNewPassword", e.target.value)}
          />
          <FieldError message={fieldErrors.confirmNewPassword} />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link to="/ho-so" className="text-sm font-semibold text-slate-500 hover:text-primary">
            Quay lại
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </Button>
        </div>
      </form>
    </div>
  );
}
