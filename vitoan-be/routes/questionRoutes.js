const express = require("express");
const { tree, bulk, list, listByLesson, aiGenerate, checkAnswer, create, update, remove, importMany } = require("../controllers/questionController");
const { getHint } = require("../controllers/hintController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("Admin"), list);
router.get("/tree", protect, authorize("Admin"), tree);
router.post("/bulk", protect, authorize("Admin"), bulk);
router.get("/lesson/:lessonId", optionalAuth, listByLesson);
router.post("/:id/check", optionalAuth, checkAnswer);
router.post("/:id/hint", optionalAuth, getHint);
router.post("/ai-generate", protect, authorize("Admin"), aiGenerate);
router.post("/import", protect, authorize("Admin"), importMany);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
