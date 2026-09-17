const express = require("express");
const { getByLesson, create, update, remove } = require("../controllers/reviewContentController");
const { optionalAuth, protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/lesson/:lessonId", optionalAuth, getByLesson);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
