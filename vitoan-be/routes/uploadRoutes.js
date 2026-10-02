const express = require("express");
const uploadImage = require("../middleware/uploadImage");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/image", protect, authorize("Admin"), (req, res) => {
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

module.exports = router;
