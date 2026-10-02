const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

// Ảnh minh hoạ cho câu hỏi / nội dung lý thuyết do admin tải lên.
const uploadDir = path.join(__dirname, "..", "uploads", "images");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!file.mimetype.startsWith("image/") || !ALLOWED_EXT.includes(ext)) {
    return cb(new Error("Chỉ chấp nhận file ảnh (png, jpg, gif, webp)"));
  }
  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
