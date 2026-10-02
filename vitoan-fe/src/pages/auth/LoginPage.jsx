import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle } from "../../components/ui/icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import Button from "../../components/ui/Button.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import OwlMascot from "../../components/illustrations/OwlMascot.jsx";
import { BlobBackground } from "../../components/illustrations/Decorations.jsx";
import GoogleSignInButton, { isGoogleAuthEnabled } from "../../components/auth/GoogleSignInButton.jsx";
import { Img3D } from "../../lib/icons3d.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [shake, setShake] = useState(false);

  function goAfterLogin(user) {
    const from = location.state?.from?.pathname;
    navigate(from || (user.role === "Admin" ? "/admin/bai-hoc" : "/"), { replace: true });
  }

  function goAfterGoogleAuth(user) {
    if (user.role === "Student" && !user.grade) {
      navigate("/chon-lop", { replace: true });
      return;
    }
    goAfterLogin(user);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError("Vui lòng nhập tên đăng nhập/email và mật khẩu");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.username, form.password);
      goAfterLogin(user);
    } catch (err) {
      setError(err.apiMessage || "Đăng nhập thất bại");
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div className="relative overflow-clip">
      <BlobBackground className="pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-6 md:py-10">
        <div className="grid w-full grid-cols-1 overflow-clip rounded-[2rem] bg-white shadow-[0_30px_70px_-30px_rgba(11,35,64,0.45)] md:grid-cols-2">
          <div className="relative hidden flex-col items-center justify-center overflow-clip p-10 text-center md:flex" style={{ background: "linear-gradient(150deg,#d4ecff 0%,#e7dcff 55%,#ffdcee 100%)" }}>
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
            <Img3D name="star" className="absolute left-8 top-10 h-14 w-14 animate-[float-soft_4s_ease-in-out_infinite]" />
            <Img3D name="books" className="absolute right-10 top-16 h-12 w-12 animate-[float-soft_5s_ease-in-out_infinite]" />
            <Img3D name="pencil" className="absolute bottom-12 left-12 h-10 w-10 animate-[float-soft_4.5s_ease-in-out_infinite]" />
            <OwlMascot className="relative h-44 w-44 drop-shadow-[0_16px_20px_rgba(11,35,64,0.18)]" covering={passwordFocused} shake={shake} />
            <h2 className="relative mt-4 font-display text-3xl font-black text-[#0b2340]">Chào mừng trở lại!</h2>
            <p className="relative mt-2 max-w-xs font-semibold text-slate-600">Cùng tiếp tục luyện tập Toán &amp; Tiếng Việt hôm nay nhé.</p>
          </div>

          <div className="flex flex-col justify-center p-8 sm:p-10">
            <h1 className="font-display text-h2 text-slate-800">Đăng nhập</h1>

            {isGoogleAuthEnabled && (
              <div className="mt-6">
                <GoogleSignInButton onSuccess={goAfterGoogleAuth} onError={setError} />
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-caption text-slate-400">hoặc đăng nhập bằng tài khoản</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={isGoogleAuthEnabled ? "space-y-4" : "mt-6 space-y-4"}>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Tên đăng nhập hoặc Email <span className="text-red-500">*</span>
                </label>
                <input
                  className={`mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 ${
                    error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/20"
                  }`}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-600">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Link to="/quen-mat-khau" className="text-caption font-semibold text-primary">
                    Quên mật khẩu?
                  </Link>
                </div>
                <PasswordInput
                  className={`mt-1 w-full rounded-xl border bg-slate-50 px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 ${
                    error ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-primary focus:ring-primary/20"
                  }`}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                {error && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full py-2.5 shadow-elevation-1 hover:shadow-elevation-2" disabled={submitting}>
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <p className="mt-4 text-center text-caption text-slate-500">
              Chưa có tài khoản?{" "}
              <Link to="/dang-ky" className="font-semibold text-primary">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
