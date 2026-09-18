const express = require("express");
const rateLimit = require("express-rate-limit");
const { submit, submitGuest, getOne, myHistory, completedLessons, lessonStatus, stats } = require("../controllers/attemptController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Bạn đã làm thử quá nhiều lần, vui lòng đăng ký tài khoản để tiếp tục" },
});

router.post("/guest", guestLimiter, submitGuest);
router.post("/", protect, authorize("Student"), submit);
router.get("/me", protect, authorize("Student"), myHistory);
router.get("/completed-lessons", protect, authorize("Student"), completedLessons);
router.get("/lesson-status", protect, authorize("Student"), lessonStatus);
router.get("/stats", protect, authorize("Student"), stats);
router.get("/:id", protect, getOne);

module.exports = router;
