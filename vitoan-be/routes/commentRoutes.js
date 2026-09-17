const express = require("express");
const { listByLesson, create, toggleLike, remove } = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/lesson/:lessonId", optionalAuth, listByLesson);
router.post("/", protect, create);
router.post("/:id/like", protect, toggleLike);
router.delete("/:id", protect, remove);

module.exports = router;
