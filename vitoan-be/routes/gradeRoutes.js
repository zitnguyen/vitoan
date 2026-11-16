const express = require("express");
const { list, create, update, remove } = require("../controllers/gradeController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
