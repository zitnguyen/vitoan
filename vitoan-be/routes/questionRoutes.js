const express = require("express");
const { listByLesson, create, update, remove } = require("../controllers/questionController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/lesson/:lessonId", optionalAuth, listByLesson);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
