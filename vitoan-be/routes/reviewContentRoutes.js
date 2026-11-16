const express = require("express");
const { list, getByLesson, aiGenerate, create, update, remove } = require("../controllers/reviewContentController");
const { optionalAuth, protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("Manager"), list);
router.get("/lesson/:lessonId", optionalAuth, getByLesson);
router.post("/ai-generate", protect, authorize("Manager"), aiGenerate);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
