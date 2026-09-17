import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { gradeService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { BlobBackground } from "../../components/illustrations/Decorations.jsx";
import GoogleSignInButton, { isGoogleAuthEnabled } from "../../components/auth/GoogleSignInButton.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {message}
    </p>
  );
}

export default function RegisterPage() {
  const { register, verifyRegisterCode } = useAuth();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    grade: "",
  });
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [shake, setShake] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  useEffect(() => {
    gradeService.list().then((res) => setGrades(res.data));
  }, []);

  function validate() {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    if (!form.username.trim()) errors.username = "Vui lòng nhập tên đăng nhập";
    if (!form.email.trim()) errors.email = "Vui lòng nhập email";
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Email không đúng định dạng";
    if (!form.password) errors.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!form.confirmPassword) errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (form.confirmPassword !== form.password) errors.confirmPassword = "Xác nhận mật khẩu không khớp";
    return errors;
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("");
      triggerShake();
      return;
    }
    setFieldErrors({});
    setFormError("");
    setSubmitting(true);
    try {
      const res = await register(form);
      setMaskedEmail(res.maskedEmail || "");
      setStep("otp");
    } catch (err) {
      const message = err.apiMessage || "Đăng ký thất bại";
      if (message.includes("Tên đăng nhập")) {
        setFieldErrors({ username: message });
      } else if (message.includes("Email")) {
        setFieldErrors({ email: message });
      } else {
        setFormError(message);
      }
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!code.trim()) {
      setFormError("Vui lòng nhập mã xác nhận");
      triggerShake();
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const user = await verifyRegisterCode({ username: form.username, code });
      if (user.role === "Student" && !user.grade) {
        navigate("/chon-lop", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setFormError(err.apiMessage || "Mã xác nhận không đúng hoặc đã hết hạn");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSuccess(user) {
    if (user.role === "Student" && !user.grade) {
      navigate("/chon-lop", { replace: true });
      return;
    }
    navigate("/", { replace: true });
  }

  function fieldClass(field) {
    const base =
      "mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2";
    return fieldErrors[field]
      ? `${base} border-red-400 focus:border-red-500 focus:ring-red-200`
      : `${base} border-slate-200 focus:border-primary focus:ring-primary/20`;
  }

  return (
    <div className="relative overflow-hidden">
      <BlobBackground className="pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-12 md:py-16">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-elevation-4 md:grid-cols-2">
          <div className="hidden flex-col items-center justify-center bg-gradient-to-br from-vietnamese to-amber-500 p-8 text-center text-white md:flex">
            <OwlMascot className="h-40 w-40 drop-shadow-lg" covering={passwordFocused} shake={shake} />
            <h2 className="mt-4 font-display text-h3">Bắt đầu hành trình!</h2>
            <p className="mt-2 text-body text-white/85">Tạo tài khoản để lưu lại tiến bộ luyện tập của em mỗi ngày.</p>
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-10">
            {step === "form" ? (
              <>
                <h1 className="font-display text-h2 text-slate-800">Đăng ký học sinh</h1>

                {isGoogleAuthEnabled && (
                  <div className="mt-6">
                    <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={setFormError} />
                    <div className="my-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-slate-200" />
                      <span className="text-caption text-slate-400">hoặc đăng ký bằng tài khoản</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className={isGoogleAuthEnabled ? "space-y-4" : "mt-6 space-y-4"}>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={fieldClass("fullName")}
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                    />
                    <FieldError message={fieldErrors.fullName} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={fieldClass("username")}
                      value={form.username}
                      onChange={(e) => updateField("username", e.target.value)}
                    />
                    <FieldError message={fieldErrors.username} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Email (để khôi phục mật khẩu) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={fieldClass("email")}
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                    <FieldError message={fieldErrors.email} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <PasswordInput
                      className={fieldClass("password")}
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <FieldError message={fieldErrors.password} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <PasswordInput
                      className={fieldClass("confirmPassword")}
                      value={form.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <FieldError message={fieldErrors.confirmPassword} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Lớp</label>
                    <select
                      className={fieldClass("grade")}
                      value={form.grade}
                      onChange={(e) => updateField("grade", e.target.value)}
                    >
                      <option value="">-- Chọn lớp --</option>
                      {grades.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formError && <FieldError message={formError} />}
                  <Button type="submit" className="w-full py-2.5 shadow-elevation-1 hover:shadow-elevation-2" disabled={submitting}>
                    {submitting ? "Đang đăng ký..." : "Đăng ký"}
                  </Button>
                </form>

                <p className="mt-4 text-center text-caption text-slate-500">
                  Đã có tài khoản?{" "}
                  <Link to="/dang-nhap" className="font-semibold text-primary">
                    Đăng nhập
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-h2 text-slate-800">Xác nhận email</h1>
                <p className="mt-2 text-caption text-slate-500">
                  Mã gồm 6 chữ số đã gửi tới email{" "}
                  <span className="font-semibold text-slate-700">{maskedEmail}</span>. Nhập mã để hoàn tất đăng ký.
                </p>
                <form onSubmit={handleVerify} noValidate className="mt-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <KeyRound className="h-4 w-4" /> Mã xác nhận (6 số) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                    />
                    <FieldError message={formError} />
                  </div>
                  <Button type="submit" className="w-full py-2.5" disabled={submitting}>
                    {submitting ? "Đang xác nhận..." : "Xác nhận"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="w-full text-center text-caption text-slate-500 hover:text-primary"
                  >
                    Quay lại chỉnh sửa thông tin
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
