const express = require("express");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;
const { tree, bulk, list, listByLesson, aiGenerate, checkAnswer, create, update, remove, importMany } = require("../controllers/questionController");
const { getHint } = require("../controllers/hintController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Chống dò đáp án: mỗi người chỉ kiểm tra tối đa 3 lần/câu trong 10 phút (làm bình thường chỉ cần 1 lần;
// học sinh bấm thử cả 4 đáp án để "cày" điểm sẽ bị chặn).
const checkLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user ? String(req.user._id) : ipKeyGenerator(req.ip)}:${req.params.id}`,
  message: { success: false, message: "Em đã kiểm tra câu này nhiều lần rồi, hãy suy nghĩ kỹ hơn hoặc thử lại sau ít phút nhé!" },
});

router.get("/", protect, authorize("Admin"), list);
router.get("/tree", protect, authorize("Admin"), tree);
router.post("/bulk", protect, authorize("Admin"), bulk);
router.get("/lesson/:lessonId", optionalAuth, listByLesson);
router.post("/:id/check", optionalAuth, checkLimiter, checkAnswer);
router.post("/:id/hint", optionalAuth, getHint);
router.post("/ai-generate", protect, authorize("Admin"), aiGenerate);
router.post("/import", protect, authorize("Admin"), importMany);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
