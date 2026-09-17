function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const isClientError = status >= 400 && status < 500;
  res.status(status).json({
    success: false,
    message: isClientError ? err.message || "Yêu cầu không hợp lệ" : "Lỗi máy chủ, vui lòng thử lại sau",
  });
}

module.exports = errorHandler;
