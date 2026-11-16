import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound } from "../../components/ui/icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { authService, gradeService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { BlobBackground } from "../../components/illustrations/Decorations.jsx";
import GoogleSignInButton, { isGoogleAuthEnabled } from "../../components/auth/GoogleSignInButton.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Số di động Việt Nam hoặc số quốc tế dạng +<mã nước><số>.
const PHONE_REGEX = /^((0|\+?84)[35789]\d{8}|\+[1-9]\d{7,14})$/;

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
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    grade: "",
  });
  // Đăng ký bằng số điện thoại hoặc email (chọn 1 trong 2); tên đăng nhập do hệ thống tự tạo.
  const [contactType, setContactType] = useState("phone");
  const [registered, setRegistered] = useState({ username: "", channel: "phone", maskedTarget: "" });
  const [devCode, setDevCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
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

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function validate() {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    if (contactType === "phone") {
      if (!form.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại";
      else if (!PHONE_REGEX.test(form.phone.replace(/[\s.\-()]/g, ""))) errors.phone = "Số điện thoại không đúng định dạng";
    } else if (!form.email.trim()) errors.email = "Vui lòng nhập email";
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
      const payload = {
        fullName: form.fullName,
        password: form.password,
        confirmPassword: form.confirmPassword,
        grade: form.grade,
        ...(contactType === "phone" ? { phone: form.phone } : { email: form.email }),
      };
      const res = await register(payload);
      setRegistered({ username: res.username, channel: res.channel, maskedTarget: res.maskedTarget || "" });
      setDevCode(res.devCode || "");
      setCode("");
      setCooldown(60);
      setStep("otp");
    } catch (err) {
      const message = err.apiMessage || "Đăng ký thất bại";
      if (message.includes("Số điện thoại")) {
        setFieldErrors({ phone: message });
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
      const user = await verifyRegisterCode({ username: registered.username, code });
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

  async function handleResend() {
    if (cooldown > 0 || submitting) return;
    setFormError("");
    setSubmitting(true);
    try {
      const res = await authService.resendRegister(registered.username);
      setDevCode(res.data?.devCode || "");
      setCooldown(60);
    } catch (err) {
      setFormError(err.apiMessage || "Không gửi lại được mã, thử lại sau");
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
    <div className="relative overflow-clip">
      <BlobBackground className="pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-6 md:py-10">
        <div className="grid w-full grid-cols-1 overflow-clip rounded-[2rem] bg-white shadow-[0_30px_70px_-30px_rgba(11,35,64,0.45)] md:grid-cols-2">
          <div className="relative hidden flex-col items-center justify-center overflow-clip p-10 text-center md:flex" style={{ background: "linear-gradient(150deg,#ffeccc 0%,#ffe2d6 55%,#ffdcea 100%)" }}>
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
            <Img3D name="rocket" className="absolute left-8 top-10 h-14 w-14 animate-[float-soft_4s_ease-in-out_infinite]" />
            <Img3D name="gift" className="absolute right-10 top-16 h-12 w-12 animate-[float-soft_5s_ease-in-out_infinite]" />
            <Img3D name="sparkles" className="absolute bottom-12 left-12 h-10 w-10 animate-[float-soft_4.5s_ease-in-out_infinite]" />
            <OwlMascot className="relative h-44 w-44 drop-shadow-[0_16px_20px_rgba(11,35,64,0.18)]" covering={passwordFocused} shake={shake} />
            <h2 className="relative mt-4 font-display text-3xl font-black text-[#0b2340]">Bắt đầu hành trình!</h2>
            <p className="relative mt-2 max-w-xs font-semibold text-slate-600">Tạo tài khoản để lưu lại tiến bộ luyện tập của em mỗi ngày.</p>
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
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
                      {[
                        { id: "phone", label: "Số điện thoại" },
                        { id: "email", label: "Email" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={contactType === tab.id}
                          onClick={() => {
                            setContactType(tab.id);
                            setFieldErrors((prev) => ({ ...prev, phone: "", email: "" }));
                          }}
                          className={`rounded-lg py-2 text-sm font-semibold transition ${
                            contactType === tab.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {contactType === "phone" ? (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-slate-600">
                          Số điện thoại (nhận mã xác nhận) <span className="text-red-500">*</span>
                        </label>
                        <input
                          className={fieldClass("phone")}
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="0912 345 678 hoặc +1 415 555 0123"
                        />
                        <FieldError message={fieldErrors.phone} />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-slate-600">
                          Email (nhận mã xác nhận) <span className="text-red-500">*</span>
                        </label>
                        <input
                          className={fieldClass("email")}
                          value={form.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          inputMode="email"
                          autoComplete="email"
                          placeholder="ten@email.com"
                        />
                        <FieldError message={fieldErrors.email} />
                      </div>
                    )}
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
                <h1 className="font-display text-h2 text-slate-800">
                  {registered.channel === "phone" ? "Xác nhận số điện thoại" : "Xác nhận email"}
                </h1>
                <p className="mt-2 text-caption text-slate-500">
                  Mã gồm 6 chữ số đã gửi tới {registered.channel === "phone" ? "số" : "email"}{" "}
                  <span className="font-semibold text-slate-700">{registered.maskedTarget}</span>. Nhập mã để hoàn tất đăng ký.
                </p>
                {devCode && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-caption text-amber-800">
                    Chế độ thử nghiệm (chưa bật SMS thật): mã của em là <span className="font-black tracking-widest">{devCode}</span>
                  </p>
                )}
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
                    onClick={handleResend}
                    disabled={cooldown > 0 || submitting}
                    className="w-full text-center text-caption font-semibold text-primary disabled:text-slate-400"
                  >
                    {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
                  </button>
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
