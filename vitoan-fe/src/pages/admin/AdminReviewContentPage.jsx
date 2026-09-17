import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react";
import { lessonService, reviewContentService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";

const EMPTY_FORM = { title: "", content: "", imageUrl: "", videoUrl: "", examples: [] };
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function AdminReviewContentPage() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [review, setReview] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([lessonService.getOne(lessonId), reviewContentService.getByLesson(lessonId).catch(() => ({ data: null }))]).then(
      ([lessonRes, reviewRes]) => {
        setLesson(lessonRes.data);
        if (reviewRes.data) {
          setReview(reviewRes.data);
          setForm({
            title: reviewRes.data.title,
            content: reviewRes.data.content || "",
            imageUrl: reviewRes.data.imageUrl || "",
            videoUrl: reviewRes.data.videoUrl || "",
            examples: reviewRes.data.examples || [],
          });
        } else {
          setForm((f) => ({ ...f, title: lessonRes.data.title }));
        }
        setLoading(false);
      }
    );
  }, [lessonId]);

  function updateExample(idx, value) {
    setForm((f) => {
      const examples = [...f.examples];
      examples[idx] = value;
      return { ...f, examples };
    });
  }

  function addExample() {
    setForm((f) => ({ ...f, examples: [...f.examples, ""] }));
  }

  function removeExample(idx) {
    setForm((f) => ({ ...f, examples: f.examples.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, examples: form.examples.filter((ex) => ex.trim()), lesson: lessonId };
      if (review) {
        const res = await reviewContentService.update(review._id, payload);
        setReview(res.data);
      } else {
        const res = await reviewContentService.create(payload);
        setReview(res.data);
      }
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!review || !confirm("Xóa nội dung ôn tập của bài học này?")) return;
    await reviewContentService.remove(review._id);
    setReview(null);
    setForm({ ...EMPTY_FORM, title: lesson?.title || "" });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/admin/bai-hoc" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách bài học
      </Link>
      <h1 className="mt-2 font-display text-h2 text-slate-800">Ôn tập: {lesson?.title}</h1>
      <p className="mt-1 text-caption text-slate-500">
        Nội dung "kiến thức cần nhớ" hiển thị cho học sinh trước khi làm bài luyện tập.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-elevation-1 ring-1 ring-slate-100">
        <div>
          <label className="text-caption font-semibold text-slate-500">Tiêu đề</label>
          <input
            className={`${inputClass} mt-1`}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-caption font-semibold text-slate-500">Kiến thức cần nhớ</label>
          <textarea
            className={`${inputClass} mt-1 min-h-[140px]`}
            placeholder="Nội dung kiến thức..."
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-caption font-semibold text-slate-500">Ảnh minh họa (URL)</label>
            <input
              className={`${inputClass} mt-1`}
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-caption font-semibold text-slate-500">Video (URL nhúng)</label>
            <input
              className={`${inputClass} mt-1`}
              placeholder="https://www.youtube.com/embed/..."
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
            />
          </div>
        </div>
        {form.imageUrl && (
          <img src={form.imageUrl} alt="" className="max-h-48 rounded-xl object-cover ring-1 ring-slate-100" />
        )}

        <div>
          <div className="flex items-center justify-between">
            <label className="text-caption font-semibold text-slate-500">Ví dụ minh họa</label>
            <button type="button" onClick={addExample} className="flex items-center gap-1 text-caption font-semibold text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Thêm ví dụ
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {form.examples.map((example, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder={`Ví dụ ${idx + 1}`}
                  value={example}
                  onChange={(e) => updateExample(idx, e.target.value)}
                />
                <button type="button" onClick={() => removeExample(idx)} className="shrink-0 text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {form.examples.length === 0 && <p className="text-caption text-slate-400">Chưa có ví dụ nào.</p>}
          </div>
        </div>

        {error && <p className="text-caption text-red-600">{error}</p>}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : review ? "Cập nhật" : "Lưu nội dung"}
          </Button>
          {review && (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Xóa
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
