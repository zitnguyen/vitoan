// Tiện ích dùng chung cho nhập/xuất Excel ở trang quản trị.
// Nguyên tắc: tệp xuất ra có cột "Mã" của từng dòng. Khi nhập lại:
//   - dòng có mã  → so với dữ liệu hiện tại, CHỈ cập nhật các trường thật sự đổi (không đổi thì bỏ qua);
//   - dòng không có mã → thêm mới.
const mongoose = require("mongoose");

const isObjectId = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);

// So sánh giá trị đơn giản/mảng/ObjectId (khác kiểu số-chuỗi vẫn coi là bằng nhau nếu cùng chữ).
function same(a, b) {
  const norm = (v) => {
    if (v === undefined || v === null) return "";
    if (v instanceof mongoose.Types.ObjectId) return String(v);
    if (Array.isArray(v)) return JSON.stringify(v.map((x) => (x instanceof mongoose.Types.ObjectId ? String(x) : x)));
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  return norm(a) === norm(b);
}

// Trả về { field: newValue } cho các trường khác với bản ghi hiện có.
function diffFields(existing, next) {
  const changed = {};
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) continue;
    if (!same(existing[k], v)) changed[k] = v;
  }
  return changed;
}

const toBool = (v, fallback) => {
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["x", "1", "true", "có", "co", "yes", "y", "hiện", "hien"].includes(s)) return true;
  if (["0", "false", "không", "khong", "no", "n", "ẩn", "an"].includes(s)) return false;
  return fallback;
};

module.exports = { isObjectId, same, diffFields, toBool };
