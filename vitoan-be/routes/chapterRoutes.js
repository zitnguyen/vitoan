const express = require("express");
const { list, create, update, remove } = require("../controllers/chapterController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", list);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
