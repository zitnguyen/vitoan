const express = require("express");
const {
  register,
  verifyRegisterCode,
  login,
  googleAuth,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  setGrade,
  updateProfile,
  uploadAvatar,
  changePassword,
  refresh,
  logout,
  me,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const uploadAvatarMiddleware = require("../middleware/uploadAvatar");

const router = express.Router();

router.post("/register", register);
router.post("/verify-register", verifyRegisterCode);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.post("/grade", protect, setGrade);
router.put("/profile", protect, updateProfile);
router.post("/avatar", protect, (req, res, next) => {
  uploadAvatarMiddleware.single("avatar")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.code === "LIMIT_FILE_SIZE" ? "Ảnh không được vượt quá 5MB" : err.message || "Tải ảnh thất bại",
      });
    }
    next();
  });
}, uploadAvatar);
router.put("/change-password", protect, changePassword);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, me);

module.exports = router;
