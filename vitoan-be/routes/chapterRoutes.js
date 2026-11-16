const express = require("express");
const { list, create, update, remove } = require("../controllers/chapterController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", list);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
