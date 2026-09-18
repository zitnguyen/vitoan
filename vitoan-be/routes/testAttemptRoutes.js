const express = require("express");
const { submit, getOne, myHistory, aiReview } = require("../controllers/testAttemptController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("Student"), submit);
router.get("/me", protect, authorize("Student"), myHistory);
router.get("/:id", protect, getOne);
router.post("/:id/ai-review", protect, authorize("Student"), aiReview);

module.exports = router;
