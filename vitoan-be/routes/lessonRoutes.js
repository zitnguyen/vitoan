const express = require("express");
const { list, getOne, toggleLike, create, update, remove } = require("../controllers/lessonController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", list);
router.get("/:id", optionalAuth, getOne);
router.post("/:id/like", protect, toggleLike);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
