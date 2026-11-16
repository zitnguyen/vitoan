const express = require("express");
const { list, getOne, toggleLike, create, update, remove, exportLessons, importLessons } = require("../controllers/lessonController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/export", protect, authorize("Manager"), exportLessons);
router.post("/import", protect, authorize("Manager"), importLessons);
router.get("/:id", optionalAuth, getOne);
router.post("/:id/like", protect, toggleLike);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
