import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { adminStatsService } from "../../api/services";

const TYPE_LABEL = {
  lesson: "Bài học",
  question: "Câu hỏi",
  chapter: "Chủ đề",
  practiceSet: "Bài luyện tập",
  reviewContent: "Lý thuyết",
  test: "Bài kiểm tra",
  subject: "Môn học",
  grade: "Lớp",
  user: "Tài khoản",
};

export function contentUrl({ subject, grade, chapter, lesson } = {}) {
  const params = new URLSearchParams();
  if (subject?._id) params.set("mon", subject._id);
  if (grade?._id) params.set("lop", grade._id);
  if (chapter?._id) params.set("chu-de", chapter._id);
  if (lesson?._id) params.set("bai", lesson._id);
  const qs = params.toString();
  return `/admin/bai-hoc${qs ? `?${qs}` : ""}`;
}

// Ô tra cứu ID: dán ID hoặc cả đường dẫn copy từ trang học sinh (vd /bai/<id>) để
// nhảy thẳng tới đúng chỗ quản trị dữ liệu đó.
export default function AdminIdLookup() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const id = (value.match(/[a-f0-9]{24}/i) || [])[0];
    if (!id) {
      setMessage("Không tìm thấy ID hợp lệ (24 ký tự)");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await adminStatsService.lookup(id);
      const { type, path } = res.data;
      setMessage(`${TYPE_LABEL[type] || type}: ${res.data.label || path?.lesson?.title || path?.chapter?.title || id}`);
      if (type === "question") navigate(`/admin/bai-hoc/${path.lesson._id}/cau-hoi?q=${id}`);
      else if (type === "practiceSet") navigate(`/admin/bai-hoc/${path.lesson._id}/luyen-tap?edit=${id}`);
      else if (type === "reviewContent") navigate(`/admin/bai-hoc/${path.lesson._id}/on-tap`);
      else if (type === "test") navigate(`/admin/kiem-tra?edit=${id}`);
      else if (type === "user") navigate(`/admin/tai-khoan`);
      else navigate(contentUrl(path));
      setValue("");
    } catch (err) {
      setMessage(err.apiMessage || "Không tìm thấy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tra cứu ID hoặc dán link từ trang học sinh (vd /bai/...)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button type="submit" disabled={busy} className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-900">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm"}
      </button>
      {message && <span className="hidden truncate text-sm text-slate-500 md:inline">{message}</span>}
    </form>
  );
}
