// Chuẩn hoá số điện thoại.
//  - Số di động Việt Nam -> "0xxxxxxxxx" (10 số). Nhận: 0912345678, 091 234 5678, +84912345678, 84912345678.
//  - Số quốc tế khác -> "+<mã nước><số>" (E.164), ví dụ +14155550123.
function normalizePhone(input) {
  let digits = String(input || "").replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("84") && digits.length === 11) digits = `0${digits.slice(2)}`;
  if (/^0[35789]\d{8}$/.test(digits)) return digits;
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}

// Chuỗi người dùng nhập trông giống số điện thoại (không phải email/tên đăng nhập)?
function looksLikePhone(input) {
  const value = String(input || "").trim();
  return !value.includes("@") && /^\+?[\d\s.\-()]{9,16}$/.test(value);
}

// Dạng E.164 để gửi cho nhà cung cấp quốc tế: 0912345678 -> +84912345678.
function toE164(phone) {
  const p = String(phone || "");
  return p.startsWith("+") ? p : `+84${p.slice(1)}`;
}

function maskPhone(phone) {
  const p = String(phone || "");
  if (p.length < 7) return p;
  return `${p.slice(0, 3)}****${p.slice(-3)}`;
}

module.exports = { normalizePhone, looksLikePhone, toE164, maskPhone };
