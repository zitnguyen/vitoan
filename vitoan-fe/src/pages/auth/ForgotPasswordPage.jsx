import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, KeyRound, Lock, CheckCircle2, AlertCircle } from "../../components/ui/icons.jsx";
import { authService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { BlobBackground } from "../../components/illustrations/Decorations.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

function fieldClass(hasError) {
  const base = "mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2";
  return hasError
    ? `${base} border-red-400 focus:border-red-500 focus:ring-red-200`
    : `${base} border-slate-200 focus:border-primary focus:ring-primary/20`;
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {message}
    </p>
  );
}

const STEPS = [
  { id: 1, label: "Tài khoản" },
  { id: 2, label: "Mã xác nhận" },
  { id: 3, label: "Mật khẩu mới" },
];

function StepIndicator({ step }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {STEPS.map((s, idx) => (
        <div key={s.id} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step > s.id
                ? "bg-primary text-white"
                : step === s.id
                  ? "bg-primary/10 text-primary ring-2 ring-primary"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 rounded ${step > s.id ? "bg-primary" : "bg-slate-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [shake, setShake] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleRequestCode(e) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Vui lòng nhập tên đăng nhập hoặc email");
      triggerShake();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await authService.forgotPassword(identifier);
      setMaskedEmail(res.data?.maskedEmail || "");
      toast.success("Đã gửi mã xác nhận tới email của bạn.");
      setStep(2);
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra, thử lại sau");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã xác nhận");
      triggerShake();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await authService.verifyResetCode({ identifier, code });
      toast.success("Mã xác nhận chính xác!");
      setStep(3);
    } catch (err) {
      setError(err.apiMessage || "Mã xác nhận không đúng hoặc đã hết hạn");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu");
      triggerShake();
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      triggerShake();
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Xác nhận mật khẩu không khớp");
      triggerShake();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await authService.resetPassword({ identifier, code, newPassword, confirmNewPassword });
      toast.success("Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.");
      navigate("/dang-nhap", { replace: true });
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra, thử lại sau");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-clip">
      <BlobBackground className="pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-6 md:py-10">
        <div className="grid w-full grid-cols-1 overflow-clip rounded-[2rem] bg-white shadow-[0_30px_70px_-30px_rgba(11,35,64,0.45)] md:grid-cols-2">
          <div className="relative hidden flex-col items-center justify-center overflow-clip p-10 text-center md:flex" style={{ background: "linear-gradient(150deg,#d7f5e3 0%,#e6f7d4 55%,#fff6d6 100%)" }}>
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
            <Img3D name="key" className="absolute left-8 top-10 h-14 w-14 animate-[float-soft_4s_ease-in-out_infinite]" />
            <Img3D name="shield" className="absolute right-10 top-16 h-12 w-12 animate-[float-soft_5s_ease-in-out_infinite]" />
            <Img3D name="sparkles" className="absolute bottom-12 left-12 h-10 w-10 animate-[float-soft_4.5s_ease-in-out_infinite]" />
            <OwlMascot className="relative h-44 w-44 drop-shadow-[0_16px_20px_rgba(11,35,64,0.18)]" covering={passwordFocused} shake={shake} />
            <h2 className="relative mt-4 font-display text-3xl font-black text-[#0b2340]">Quên mật khẩu?</h2>
            <p className="relative mt-2 max-w-xs font-semibold text-slate-600">Đừng lo, chỉ mất một phút để lấy lại mật khẩu qua email.</p>
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-10">
            <StepIndicator step={step} />

            {step === 1 && (
              <>
                <h1 className="font-display text-h2 text-slate-800">Tìm tài khoản của em</h1>
                <p className="mt-2 text-caption text-slate-500">
                  Nhập tên đăng nhập hoặc email đã đăng ký, mã xác nhận sẽ được gửi tới email gắn với tài khoản đó.
                </p>
                <form onSubmit={handleRequestCode} noValidate className="mt-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <User className="h-4 w-4" /> Tên đăng nhập hoặc Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={fieldClass(Boolean(error))}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                    <FieldError message={error} />
                  </div>
                  <Button type="submit" className="w-full py-2.5" disabled={submitting}>
                    {submitting ? "Đang gửi..." : "Gửi mã xác nhận"}
                  </Button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="font-display text-h2 text-slate-800">Nhập mã xác nhận</h1>
                <p className="mt-2 text-caption text-slate-500">
                  Mã gồm 6 chữ số đã gửi tới email{" "}
                  <span className="font-semibold text-slate-700">{maskedEmail}</span> gắn với tài khoản này.
                </p>
                <form onSubmit={handleVerifyCode} noValidate className="mt-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <KeyRound className="h-4 w-4" /> Mã xác nhận (6 số) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={fieldClass(Boolean(error))}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                    />
                    <FieldError message={error} />
                  </div>
                  <Button type="submit" className="w-full py-2.5" disabled={submitting}>
                    {submitting ? "Đang kiểm tra..." : "Xác nhận mã"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-caption text-slate-500 hover:text-primary"
                  >
                    Gửi lại mã / đổi tài khoản khác
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="font-display text-h2 text-slate-800">Đặt mật khẩu mới</h1>
                <p className="mt-2 text-caption text-slate-500">Nhập mật khẩu mới của em, tối thiểu 6 ký tự.</p>
                <form onSubmit={handleResetPassword} noValidate className="mt-6 space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Lock className="h-4 w-4" /> Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <PasswordInput
                      className={fieldClass(Boolean(error))}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <Lock className="h-4 w-4" /> Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <PasswordInput
                      className={fieldClass(Boolean(error))}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <FieldError message={error} />
                  </div>
                  <Button type="submit" className="w-full py-2.5" disabled={submitting}>
                    {submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                  </Button>
                </form>
              </>
            )}

            <p className="mt-4 text-center text-caption text-slate-500">
              Đã nhớ mật khẩu?{" "}
              <Link to="/dang-nhap" className="font-semibold text-primary">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
