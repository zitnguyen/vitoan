import { readSheet } from "read-excel-file/browser";
import writeExcelFile from "write-excel-file/browser";

// Ô → chuỗi gọn (số/ngày/rỗng đều về chuỗi).
export const cellStr = (v) => (v === null || v === undefined ? "" : String(v).trim());

// Ghi tệp .xlsx: columns = [{ header, width, readonly? }], rows = mảng các mảng giá trị.
// Cột `readonly` (mã, thông tin tham khảo) tô xám để admin biết không nên sửa.
export async function saveSheet(fileName, columns, rows) {
  const header = columns.map((c) => ({ value: c.header, fontWeight: "bold", backgroundColor: c.readonly ? "#E2E8F0" : "#DCFCE7" }));
  const body = rows.map((r) =>
    columns.map((c, i) => {
      const v = r[i];
      const value = v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "x" : "") : typeof v === "number" ? v : String(v);
      return c.readonly ? { value, color: "#64748B" } : { value };
    })
  );
  await writeExcelFile([header, ...body], { columns: columns.map((c) => ({ width: c.width || 16 })) }).toFile(fileName);
}

// Đọc tệp .xlsx → các dòng dữ liệu (bỏ dòng tiêu đề), kèm số dòng trong Excel để báo lỗi.
export async function readRows(file) {
  const sheet = await readSheet(file);
  return sheet.slice(1).map((cells, i) => ({ cells, row: i + 2 })).filter(({ cells }) => cells.some((c) => cellStr(c)));
}

export const stamp = () => new Date().toISOString().slice(0, 10);
