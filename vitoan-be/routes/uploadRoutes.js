const express = require("express");
const uploadImage = require("../middleware/uploadImage");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateImage } = require("../utils/aiImage");

const router = express.Router();

router.post("/image", protect, authorize("Manager"), (req, res) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.code === "LIMIT_FILE_SIZE" ? "Ảnh không được vượt quá 5MB" : err.message || "Tải ảnh thất bại",
      });
    }
    if (!req.file) return res.status(400).json({ success: false, message: "Chưa chọn ảnh" });
    res.status(201).json({ success: true, data: { url: `/uploads/images/${req.file.filename}` } });
  });
});

// AI tạo ảnh minh hoạ từ mô tả (admin). Ảnh được lưu như ảnh tải lên.
router.post("/ai-image", protect, authorize("Manager"), async (req, res, next) => {
  try {
    const url = await generateImage(req.body?.prompt);
    res.status(201).json({ success: true, data: { url } });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
