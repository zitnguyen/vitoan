const express = require("express");
const { list, getByLesson, aiGenerate, create, update, remove } = require("../controllers/reviewContentController");
const { optionalAuth, protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("Admin"), list);
router.get("/lesson/:lessonId", optionalAuth, getByLesson);
router.post("/ai-generate", protect, authorize("Admin"), aiGenerate);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
