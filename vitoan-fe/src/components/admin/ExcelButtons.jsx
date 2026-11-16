import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Upload, X, CheckCircle2 } from "lucide-react";
import Button from "../ui/Button.jsx";
import { IconButton } from "./adminUi.jsx";

// Cặp nút "Xuất Excel" / "Nhập Excel" dùng chung.
//  - onExport(): tải tệp về (tự lo việc gọi API + ghi tệp)
//  - onImport(file): đọc tệp, gọi API, trả về { inserted, updated, unchanged, errors, ... }
// Khi nhập lại tệp đã xuất: dòng có mã chỉ được cập nhật nếu nội dung đã đổi, dòng không đổi được bỏ qua.
export default function ExcelButtons({ onExport, onImport, onDone, importHint, className }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function doExport() {
    setBusy("export");
    setError("");
    try {
      await onExport();
    } catch (err) {
      setError(err?.apiMessage || "Không xuất được tệp");
    } finally {
      setBusy("");
    }
  }

  async function doImport(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("import");
    setError("");
    try {
      const res = await onImport(file);
      setResult(res);
      if (res.inserted || res.updated) onDone?.();
    } catch (err) {
      setError(err?.apiMessage || err?.message || "Không đọc được tệp. Hãy dùng tệp .xlsx đã xuất từ hệ thống.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className={className || "flex flex-wrap items-center gap-2"}>
        <Button variant="outline" onClick={doExport} disabled={!!busy} className="px-3 py-1.5 text-sm" title="Tải tệp Excel về để xem hoặc sửa">
          <Download className="h-4 w-4" /> {busy === "export" ? "Đang xuất..." : "Xuất Excel"}
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={doImport} />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!!busy} className="px-3 py-1.5 text-sm" title={importHint || "Nhập tệp Excel (dòng có mã chỉ cập nhật nếu đã sửa)"}>
          <Upload className="h-4 w-4" /> {busy === "import" ? "Đang nhập..." : "Nhập Excel"}
        </Button>
      </div>
      {(result || error) &&
        createPortal(
          <div className="admin-ui fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onClick={() => { setResult(null); setError(""); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-extrabold text-slate-800">{error ? "Không nhập được" : "Kết quả nhập Excel"}</h2>
                <IconButton title="Đóng" onClick={() => { setResult(null); setError(""); }}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
              {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}
              {result && (
                <>
                  <p className="mt-3 flex items-center gap-1.5 font-bold text-green-700">
                    <CheckCircle2 className="h-5 w-5" /> Xong
                  </p>
                  <ul className="mt-1 space-y-0.5 text-slate-700">
                    <li>Thêm mới: <b>{result.inserted || 0}</b></li>
                    <li>Cập nhật (chỉ các dòng đã sửa): <b>{result.updated || 0}</b></li>
                    <li>Không đổi, bỏ qua: <b>{result.unchanged || 0}</b></li>
                    {result.chaptersCreated > 0 && <li>Chủ đề mới được tạo: <b>{result.chaptersCreated}</b></li>}
                  </ul>
                  {result.errors?.length > 0 && (
                    <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                      <p className="font-bold">{result.errors.length} dòng lỗi (đã bỏ qua):</p>
                      <ul className="mt-1 max-h-48 overflow-y-auto">
                        {result.errors.map((er, i) => (
                          <li key={i}>Dòng {er.row}: {er.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <div className="mt-4 text-right">
                <Button onClick={() => { setResult(null); setError(""); }} className="px-4 py-1.5">Đóng</Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
