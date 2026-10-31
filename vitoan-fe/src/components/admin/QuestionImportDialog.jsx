import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readSheet } from "read-excel-file/browser";
import writeExcelFile from "write-excel-file/browser";
import { X, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { questionService } from "../../api/services";
import Button from "../ui/Button.jsx";
import { IconButton } from "./adminUi.jsx";
import { cn } from "../../lib/utils";
import { formatSource } from "../../lib/questionSource.js";

// Nhập câu hỏi hàng loạt từ tệp Excel theo mẫu, mỗi câu ghi rõ nguồn (SGK/SBT, tập, trang).
// Quy trình: tải tệp mẫu → điền → chọn tệp → xem trước & kiểm lỗi từng dòng → nhập.
const COLUMNS = [
  { key: "lesson", header: "Mã bài học (để trống = bài đang mở)", width: 26 },
  { key: "type", header: "Dạng câu (trac_nghiem / dung_sai / dien / nghe_chon / nghe_dien)", width: 24 },
  { key: "text", header: "Câu hỏi (câu điền: gõ ___ ở chỗ trống)", width: 50 },
  { key: "a", header: "Đáp án A", width: 16 },
  { key: "b", header: "Đáp án B", width: 16 },
  { key: "c", header: "Đáp án C", width: 16 },
  { key: "d", header: "Đáp án D", width: 16 },
  { key: "correct", header: "Đáp án đúng (A/B/C/D, hoặc chữ cần điền)", width: 22 },
  { key: "audio", header: "Câu đọc cho bé nghe (câu nghe)", width: 26 },
  { key: "explanation", header: "Giải thích", width: 30 },
  { key: "difficulty", header: "Độ khó (de / trung_binh / kho)", width: 14 },
  { key: "kind", header: "Loại nguồn (sgk / sbt / khac / tu_bien_soan)", width: 16 },
  { key: "book", header: "Tên sách", width: 34 },
  { key: "volume", header: "Tập", width: 8 },
  { key: "page", header: "Trang", width: 8 },
  { key: "exercise", header: "Bài tập số", width: 12 },
  { key: "url", header: "Đường dẫn nguồn (nếu có)", width: 26 },
];

const TYPE_ALIAS = {
  trac_nghiem: "multiple_choice", "trắc nghiệm": "multiple_choice", multiple_choice: "multiple_choice",
  dung_sai: "true_false", "đúng sai": "true_false", "đúng/sai": "true_false", true_false: "true_false",
  dien: "fill_blank", "điền": "fill_blank", fill_blank: "fill_blank",
  nghe_chon: "listen_choice", "nghe chọn": "listen_choice", listen_choice: "listen_choice",
  nghe_dien: "listen_fill", "nghe điền": "listen_fill", listen_fill: "listen_fill",
};
const DIFF_ALIAS = { de: "easy", "dễ": "easy", easy: "easy", trung_binh: "medium", "trung bình": "medium", medium: "medium", kho: "hard", "khó": "hard", hard: "hard" };
const KIND_ALIAS = { sgk: "sgk", sbt: "sbt", vbt: "sbt", khac: "other", "khác": "other", other: "other", tu_bien_soan: "self", "tự biên soạn": "self", self: "self" };
const TYPE_LABEL = { multiple_choice: "Trắc nghiệm", true_false: "Đúng/Sai", fill_blank: "Điền", listen_choice: "Nghe chọn", listen_fill: "Nghe điền" };
const EXAMPLE_MARK = "[VÍ DỤ]";

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());

async function downloadTemplate(lessonId) {
  const header = COLUMNS.map((c) => ({ value: c.header, fontWeight: "bold", backgroundColor: "#DCFCE7" }));
  const ex = (cells) => COLUMNS.map((c) => ({ value: cells[c.key] ?? "", color: "#64748B" }));
  const data = [
    header,
    ex({ lesson: lessonId, type: "trac_nghiem", text: `${EXAMPLE_MARK} Ghi đúng nội dung câu hỏi như trong sách (dòng ví dụ sẽ được bỏ qua)`, a: "…", b: "…", c: "…", d: "…", correct: "B", explanation: "…", difficulty: "de", kind: "sgk", book: "Toán 1 – Kết nối tri thức với cuộc sống", volume: "Tập 1", page: "(số trang)", exercise: "Bài …" }),
    ex({ lesson: lessonId, type: "dien", text: `${EXAMPLE_MARK} … ___ …`, correct: "(chữ/số cần điền)", difficulty: "de", kind: "sbt", book: "Vở bài tập Toán 1 – Kết nối tri thức với cuộc sống", volume: "Tập 1", page: "(số trang)", exercise: "Bài …" }),
  ];
  await writeExcelFile(data, { columns: COLUMNS.map((c) => ({ width: c.width })) }).toFile("mau-nhap-cau-hoi-vitoan.xlsx");
}

// Chuyển 1 dòng Excel → câu hỏi + danh sách lỗi
function parseRow(cells, rowNo, defaultLesson) {
  const v = Object.fromEntries(COLUMNS.map((c, i) => [c.key, str(cells[i])]));
  if (!v.text && !v.a && !v.correct) return null; // dòng trống
  if (v.text.startsWith(EXAMPLE_MARK)) return null;
  const errors = [];
  const type = TYPE_ALIAS[v.type.toLowerCase()] || (v.type ? null : "multiple_choice");
  if (!type) errors.push(`Dạng câu "${v.type}" không hợp lệ`);
  if (!v.text) errors.push("Thiếu nội dung câu hỏi");
  const isFill = type === "fill_blank" || type === "listen_fill";
  const q = {
    row: rowNo,
    lesson: v.lesson || defaultLesson,
    type: type || "multiple_choice",
    text: v.text,
    audioText: v.audio,
    explanation: v.explanation,
    difficulty: DIFF_ALIAS[v.difficulty.toLowerCase()] || "easy",
    choices: [],
    correctIndex: 0,
    correctText: "",
    source: { kind: KIND_ALIAS[v.kind.toLowerCase()] || (v.book || v.page ? "sgk" : "self"), book: v.book, volume: v.volume, page: v.page, exercise: v.exercise, url: v.url, note: "" },
  };
  if (v.lesson && !/^[a-f0-9]{24}$/i.test(v.lesson)) errors.push("Mã bài học không đúng (24 ký tự)");
  if (v.kind && !KIND_ALIAS[v.kind.toLowerCase()]) errors.push(`Loại nguồn "${v.kind}" không hợp lệ`);
  if (q.source.kind !== "self" && !q.source.book) errors.push("Có nguồn nhưng thiếu tên sách");
  if (q.source.kind !== "self" && !q.source.page && !q.source.url) errors.push("Thiếu số trang (hoặc đường dẫn) của nguồn");
  if (isFill) {
    if (!v.correct) errors.push("Thiếu đáp án cần điền");
    if (v.text && !v.text.includes("___")) errors.push('Câu điền phải có "___" ở chỗ trống');
    if (type === "listen_fill" && !v.audio) errors.push("Câu nghe điền cần có câu đọc cho bé nghe");
    q.correctText = v.correct;
  } else {
    q.choices = type === "true_false" ? (v.a || v.b ? [v.a || "Đúng", v.b || "Sai"] : ["Đúng", "Sai"]) : [v.a, v.b, v.c, v.d].filter(Boolean);
    if (q.choices.length < 2) errors.push("Cần ít nhất 2 đáp án");
    const letter = v.correct.toUpperCase();
    let idx = "ABCD".indexOf(letter);
    if (letter.length !== 1 || idx < 0) idx = q.choices.findIndex((c) => c.toLowerCase() === v.correct.toLowerCase());
    if (idx < 0 || idx >= q.choices.length) errors.push("Đáp án đúng phải là A/B/C/D (hoặc trùng một đáp án)");
    if (new Set(q.choices).size !== q.choices.length) errors.push("Có đáp án bị trùng");
    q.correctIndex = Math.max(0, idx);
  }
  return { q, errors };
}

export default function QuestionImportDialog({ lessonId, lessonTitle, onClose, onImported }) {
  const fileRef = useRef(null);
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setResult(null);
    try {
      const sheet = await readSheet(file);
      const body = sheet.slice(1);
      const parsed = body.map((cells, i) => parseRow(cells, i + 2, lessonId)).filter(Boolean);
      if (!parsed.length) setError("Tệp không có câu hỏi nào (ngoài các dòng ví dụ).");
      setRows(parsed);
      setFileName(file.name);
    } catch {
      setError("Không đọc được tệp. Hãy dùng tệp .xlsx theo đúng mẫu.");
    }
  }

  async function handleImport() {
    const ok = rows.filter((r) => !r.errors.length).map((r) => r.q);
    if (!ok.length) return;
    setBusy(true);
    setError("");
    try {
      const res = await questionService.importMany(ok);
      setResult(res.data);
      if (res.data.inserted) onImported?.();
    } catch (err) {
      setError(err.apiMessage || "Nhập câu hỏi thất bại");
    } finally {
      setBusy(false);
    }
  }

  const valid = rows?.filter((r) => !r.errors.length).length || 0;
  const invalid = (rows?.length || 0) - valid;

  return createPortal(
    <div className="admin-ui fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-slate-800">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> Nhập câu hỏi từ Excel
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Mặc định nhập vào bài <b className="text-slate-700">{lessonTitle}</b> (mã <code className="rounded bg-slate-100 px-1">{lessonId}</code>). Muốn nhập cho bài khác thì điền mã bài ở cột đầu.
            </p>
          </div>
          <IconButton title="Đóng" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-sm font-bold text-slate-700">1. Tải tệp mẫu</p>
            <p className="mt-0.5 text-xs text-slate-500">Mỗi dòng là một câu. Ghi đúng nguyên văn trong sách và điền tên sách, tập, trang.</p>
            <Button variant="outline" onClick={() => downloadTemplate(lessonId)} className="mt-2 px-3 py-1.5 text-sm">
              <Download className="h-4 w-4" /> Tải tệp mẫu (.xlsx)
            </Button>
          </li>
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-sm font-bold text-slate-700">2. Chọn tệp đã điền</p>
            <p className="mt-0.5 text-xs text-slate-500">Hệ thống kiểm tra từng dòng trước khi nhập.</p>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleFile} />
            <Button onClick={() => fileRef.current?.click()} className="mt-2 px-3 py-1.5 text-sm">
              <Upload className="h-4 w-4" /> Chọn tệp
            </Button>
            {fileName && <p className="mt-1 truncate text-xs text-slate-500">{fileName}</p>}
          </li>
          <li className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-sm font-bold text-slate-700">3. Nhập các câu hợp lệ</p>
            <p className="mt-0.5 text-xs text-slate-500">Câu lỗi được bỏ qua và báo theo số dòng để sửa lại.</p>
            <Button onClick={handleImport} disabled={!valid || busy || !!result} className="mt-2 px-3 py-1.5 text-sm">
              {busy ? "Đang nhập..." : `Nhập ${valid} câu`}
            </Button>
          </li>
        </ol>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-600">{error}</p>}
        {result && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-green-800">
            <p className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="h-5 w-5" /> Đã nhập {result.inserted} câu hỏi.
            </p>
            {result.errors?.length > 0 && (
              <ul className="mt-1 text-sm text-red-600">
                {result.errors.map((e) => (
                  <li key={e.row}>Dòng {e.row}: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <p className="mt-4 text-sm font-semibold text-slate-600">
              {rows.length} câu trong tệp · <span className="text-green-700">{valid} hợp lệ</span>
              {invalid > 0 && <span className="text-red-600"> · {invalid} có lỗi</span>}
            </p>
            <div className="mt-2 max-h-[50vh] overflow-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Dòng</th>
                    <th className="px-3 py-2">Dạng</th>
                    <th className="px-3 py-2">Câu hỏi</th>
                    <th className="px-3 py-2">Đáp án đúng</th>
                    <th className="px-3 py-2">Nguồn</th>
                    <th className="px-3 py-2">Kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ q, errors }) => (
                    <tr key={q.row} className={cn(errors.length && "bg-red-50/50")}>
                      <td className="px-3 py-2 text-slate-400">{q.row}</td>
                      <td className="whitespace-nowrap px-3 py-2">{TYPE_LABEL[q.type]}</td>
                      <td className="max-w-xs px-3 py-2 text-slate-700">{q.text}</td>
                      <td className="px-3 py-2 font-semibold text-green-700">{q.correctText || q.choices[q.correctIndex]}</td>
                      <td className="max-w-[14rem] px-3 py-2 text-xs text-slate-500">{formatSource(q.source)}</td>
                      <td className="px-3 py-2">
                        {errors.length ? (
                          <span className="flex items-start gap-1 text-xs font-semibold text-red-600">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {errors.join("; ")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
