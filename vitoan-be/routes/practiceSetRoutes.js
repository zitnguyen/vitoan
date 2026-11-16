const express = require("express");
const { list, listByLesson, getOne, create, update, remove, exportSets, importSets } = require("../controllers/practiceSetController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("Manager"), list);
router.get("/export", protect, authorize("Manager"), exportSets);
router.post("/import", protect, authorize("Manager"), importSets);
router.get("/lesson/:lessonId", optionalAuth, listByLesson);
router.get("/:id", optionalAuth, getOne);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
