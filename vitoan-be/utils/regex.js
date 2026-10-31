// Thoát ký tự đặc biệt để ô tìm kiếm ở trang quản trị không gây lỗi (vd gõ "(" hoặc "[").
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { escapeRegExp };
