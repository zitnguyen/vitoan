const express = require("express");
const { list, claim, create, update, remove } = require("../controllers/missionController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.post("/:id/claim", protect, authorize("Student"), claim);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
