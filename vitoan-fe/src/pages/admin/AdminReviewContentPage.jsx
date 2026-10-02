import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, X, Trash2, Sparkles, CheckCircle2 } from "lucide-react";
import AdminLessonHeader from "../../components/admin/AdminLessonHeader.jsx";
import ImageUploadField from "../../components/admin/ImageUploadField.jsx";
import { AdminPage, Card, Field, IconButton, inputClass, toEmbedUrl } from "../../components/admin/adminUi.jsx";
import { lessonService, reviewContentService } from "../../api/services";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { cn } from "../../lib/utils";
import { useDialog } from "../../context/DialogContext.jsx";

const EMPTY_FORM = { content: "", imageUrl: "", videoUrl: "", examples: [] };

export default function AdminReviewContentPage() {
  const dialog = useDialog();
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [review, setReview] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    Promise.all([lessonService.getOne(lessonId), reviewContentService.getByLesson(lessonId).catch(() => ({ data: null }))]).then(
      ([lessonRes, reviewRes]) => {
        setLesson(lessonRes.data);
        setReview(reviewRes.data);
        setForm(
          reviewRes.data
            ? {
                content: reviewRes.data.content || "",
                imageUrl: reviewRes.data.imageUrl || "",
                videoUrl: reviewRes.data.videoUrl || "",
                examples: reviewRes.data.examples || [],
              }
            : EMPTY_FORM
        );
        setLoading(false);
      }
    );
  }, [lessonId]);

  async function update(patch) {
    setSaved(false);
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const res = await reviewContentService.aiGenerate({ lessonId });
      update({
        content: res.data.content || form.content,
        examples: Array.isArray(res.data.examples) && res.data.examples.length ? res.data.examples : form.examples,
      });
    } catch (err) {
      setError(err.apiMessage || "Không thể tạo nội dung bằng AI lúc này");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        // Tiêu đề lấy theo tên bài học — không bắt admin nhập lại.
        title: `Kiến thức: ${lesson.title}`,
        content: form.content.trim(),
        imageUrl: form.imageUrl,
        videoUrl: toEmbedUrl(form.videoUrl),
        examples: form.examples.map((x) => x.trim()).filter(Boolean),
        lesson: lessonId,
      };
      const res = review ? await reviewContentService.update(review._id, payload) : await reviewContentService.create(payload);
      setReview(res.data);
      setForm((f) => ({ ...f, videoUrl: payload.videoUrl, examples: payload.examples }));
      setSaved(true);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.apiMessage || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!review || !(await dialog.confirm({ message: "Xoá toàn bộ lý thuyết và video của bài học này?", danger: true, confirmText: "Xoá" }))) return;
    await reviewContentService.remove(review._id);
    setReview(null);
    setForm(EMPTY_FORM);
    setVersion((v) => v + 1);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const embed = toEmbedUrl(form.videoUrl);
  const isYoutube = embed.includes("youtube.com/embed/");

  return (
    <AdminPage>
      <AdminLessonHeader lesson={lesson} active="on-tap" version={version} />

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-h3 text-slate-800">Kiến thức cần nhớ</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <Sparkles className="h-4 w-4" /> {generating ? "Đang soạn..." : "Soạn bằng AI"}
            </Button>
          </div>
          <Field label="Nội dung" hint="Mỗi dòng là một ý — học sinh sẽ thấy dạng gạch đầu dòng.">
            <textarea
              className={cn(inputClass, "min-h-[180px] leading-relaxed")}
              value={form.content}
              onChange={(e) => update({ content: e.target.value })}
            />
          </Field>

          <Field label="Ví dụ minh hoạ">
            <div className="space-y-2">
              {form.examples.map((example, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center font-bold text-slate-400">{idx + 1}</span>
                  <input
                    className={inputClass}
                    value={example}
                    onChange={(e) => {
                      const examples = [...form.examples];
                      examples[idx] = e.target.value;
                      update({ examples });
                    }}
                  />
                  <IconButton title="Xoá ví dụ" tone="danger" onClick={() => update({ examples: form.examples.filter((_, i) => i !== idx) })}>
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update({ examples: [...form.examples, ""] })}
                className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                <Plus className="h-4 w-4" /> Thêm ví dụ
              </button>
            </div>
          </Field>

          <ImageUploadField
            label="Ảnh minh hoạ (không bắt buộc)"
            value={form.imageUrl}
            onChange={(url) => update({ imageUrl: url })}
            inputClass={inputClass}
          />
        </Card>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-3">
            <p className="font-display text-h3 text-slate-800">Video bài giảng</p>
            <Field label="Link YouTube" hint="Dán link bất kỳ: youtube.com/watch?v=…, youtu.be/…, hoặc link nhúng.">
              <input
                className={inputClass}
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={(e) => update({ videoUrl: e.target.value })}
              />
            </Field>
            {form.videoUrl ? (
              isYoutube ? (
                <div className="aspect-video overflow-hidden rounded-xl bg-slate-900">
                  <iframe src={embed} title="Xem trước video" className="h-full w-full" allowFullScreen />
                </div>
              ) : (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">Không nhận ra link YouTube — hãy kiểm tra lại.</p>
              )
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">Chưa có video</p>
            )}
          </Card>

          <Card className="space-y-2">
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 font-semibold text-red-600">{error}</p>}
            {saved && (
              <p className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 font-semibold text-green-700">
                <CheckCircle2 className="h-5 w-5" /> Đã lưu
              </p>
            )}
            <Button type="submit" disabled={saving} className="w-full py-3">
              {saving ? "Đang lưu..." : "Lưu lý thuyết & video"}
            </Button>
            {review && (
              <Button type="button" variant="ghost" onClick={handleDelete} className="w-full text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Xoá toàn bộ
              </Button>
            )}
          </Card>
        </div>
      </form>
    </AdminPage>
  );
}
