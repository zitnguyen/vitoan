import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadService } from "../../api/services";

// Ô ảnh minh hoạ: tải ảnh từ máy lên server (hoặc dán URL), có xem trước.
export default function ImageUploadField({ value, onChange, inputClass, label = "Ảnh minh hoạ" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadService.image(file);
      onChange(res.data.url);
    } catch (err) {
      setError(err.apiMessage || "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-caption font-semibold text-slate-500">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          className={inputClass}
          placeholder="Dán URL ảnh hoặc bấm “Tải ảnh lên”"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 text-sm font-bold text-white hover:bg-secondary-dark disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Tải ảnh lên
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="mt-1 text-caption text-red-600">{error}</p>}
      {value && (
        <div className="relative mt-2 inline-block">
          <img src={value} alt="" className="max-h-40 rounded-xl object-contain ring-1 ring-slate-100" />
          <button
            type="button"
            onClick={() => onChange("")}
            title="Bỏ ảnh"
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
