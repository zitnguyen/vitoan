const express = require("express");
const { list, myBadges, progress, create, update, remove, award } = require("../controllers/badgeController");
const { optionalAuth, protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/me", protect, authorize("Student"), myBadges);
router.get("/progress", protect, authorize("Student"), progress);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);
router.post("/:id/award", protect, authorize("Admin"), award);

module.exports = router;
