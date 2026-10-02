const express = require("express");
const { status, checkIn } = require("../controllers/checkinController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, authorize("Student"), status);
router.post("/", protect, authorize("Student"), checkIn);

module.exports = router;
