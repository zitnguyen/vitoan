// Lỗi do dữ liệu người dùng gửi lên (thiếu trường, sai kiểu, ID hỏng) là lỗi 400 kèm lý do cụ thể,
// không phải "lỗi máy chủ" — để quản trị viên biết mình nhập sai ở đâu.
const FIELD_LABELS = {
  title: "Tên",
  name: "Tên",
  text: "Nội dung",
  goalValue: "Mục tiêu",
  rewardPoints: "Điểm thưởng",
  costPoints: "Giá (điểm)",
  goalType: "Cách tính tiến độ",
  type: "Loại",
  subject: "Môn",
  grade: "Lớp",
  lesson: "Bài học",
};

function describeValidation(err) {
  const first = Object.values(err.errors || {})[0];
  if (!first) return "Dữ liệu không hợp lệ";
  const label = FIELD_LABELS[first.path] || first.path;
  if (first.kind === "required") return `Thiếu thông tin bắt buộc: ${label}`;
  if (first.kind === "min") return `${label} quá nhỏ (tối thiểu ${first.properties?.min})`;
  if (first.kind === "enum") return `${label} không hợp lệ`;
  if (first.name === "CastError") return `${label} sai định dạng`;
  return first.message || "Dữ liệu không hợp lệ";
}

function errorHandler(err, req, res, next) {
  console.error(err);
  let status = err.status || 500;
  let message = err.message;
  if (err.name === "ValidationError") {
    status = 400;
    message = describeValidation(err);
  } else if (err.name === "CastError") {
    status = 400;
    message = "Mã (ID) hoặc giá trị gửi lên sai định dạng";
  } else if (err.code === 11000) {
    status = 409;
    message = "Dữ liệu này đã tồn tại";
  }
  const isClientError = status >= 400 && status < 500;
  res.status(status).json({
    success: false,
    message: isClientError ? message || "Yêu cầu không hợp lệ" : "Lỗi máy chủ, vui lòng thử lại sau",
  });
}

module.exports = errorHandler;
