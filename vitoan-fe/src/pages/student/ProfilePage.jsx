import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  KeyRound,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { gradeService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {message}
    </p>
  );
}

function FieldLabel({ icon: Icon, children, required }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
      <Icon className="h-4 w-4 text-slate-400" /> {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function compressImage(file, maxSize = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" })) : reject(new Error("Không thể xử lý ảnh"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không thể đọc ảnh"));
    };
    img.src = objectUrl;
  });
}

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar, setGrade } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dateOfBirth: toDateInputValue(user?.dateOfBirth),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState(user?.grade?._id || "");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    if (user?.role === "Student") gradeService.list().then((res) => setGrades(res.data));
  }, [user?.role]);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    setAvatarUploading(true);
    try {
      const resized = await compressImage(file);
      await uploadAvatar(resized);
      toast.success("Đã cập nhật ảnh đại diện!");
    } catch (err) {
      toast.error(err.apiMessage || err.message || "Tải ảnh thất bại");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleGradeSave() {
    if (!gradeId || gradeId === user?.grade?._id) return;
    setSavingGrade(true);
    try {
      await setGrade(gradeId);
      toast.success("Đã đổi lớp thành công!");
    } catch (err) {
      toast.error(err.apiMessage || "Đổi lớp thất bại");
    } finally {
      setSavingGrade(false);
    }
  }

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setFieldErrors({ fullName: "Vui lòng nhập họ và tên" });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await updateProfile(form);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      const message = err.apiMessage || "Cập nhật thất bại";
      if (message.includes("Email")) {
        setFieldErrors({ email: message });
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-5 rounded-3xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:p-7">
        <div className="relative shrink-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-4 ring-slate-100"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-slate-100">
              <User className="h-9 w-9" strokeWidth={1.75} />
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            aria-label="Đổi ảnh đại diện"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-elevation-1 ring-2 ring-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-wide text-slate-400">Hồ sơ của em</p>
          <h1 className="truncate font-display text-h3 text-slate-800">{form.fullName || user?.username}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              @{user?.username}
            </span>
            {user?.grade?.name && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                <GraduationCap className="h-3.5 w-3.5" /> {user.grade.name}
              </span>
            )}
          </div>
          {avatarUploading && <p className="mt-1 text-caption text-primary">Đang tải ảnh lên...</p>}
        </div>
      </div>

      {/* Grade card */}
      {user?.role === "Student" && (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <GraduationCap className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <h2 className="font-display font-bold text-slate-800">Lớp đang học</h2>
          </div>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <select
              className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
            >
              <option value="">-- Chọn lớp --</option>
              {grades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={handleGradeSave}
              disabled={savingGrade || !gradeId || gradeId === user?.grade?._id}
              className="shrink-0"
            >
              {savingGrade ? "Đang lưu..." : "Đổi lớp"}
            </Button>
          </div>
          <p className="mt-2.5 text-caption text-slate-500">
            Lớp này quyết định nội dung mặc định khi em bấm "Vào học" ở trang chủ và thanh menu.
          </p>
        </div>
      )}

      {/* Basic info form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-3xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100 sm:p-8"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <h2 className="font-display font-bold text-slate-800">Thông tin cơ bản</h2>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <FieldLabel icon={User} required>
              Họ và tên
            </FieldLabel>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
            <FieldError message={fieldErrors.fullName} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel icon={Calendar}>Ngày sinh</FieldLabel>
              <input
                type="date"
                className={inputClass}
                value={form.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel icon={Phone}>Số điện thoại</FieldLabel>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <FieldLabel icon={Mail}>Email liên hệ</FieldLabel>
            <input
              className={inputClass}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
            <FieldError message={fieldErrors.email} />
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <Button type="submit" disabled={submitting} className="px-6">
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>

      {/* Security */}
      <Link
        to="/doi-mat-khau"
        className="group mt-6 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-elevation-1 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-elevation-2 hover:ring-primary/30"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-vietnamese/10 text-vietnamese">
          <ShieldCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="flex items-center gap-1.5 font-display font-bold text-slate-800">
            <KeyRound className="h-4 w-4 text-slate-400" /> Đổi mật khẩu
          </p>
          <p className="text-caption text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản của em</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </div>
  );
}
