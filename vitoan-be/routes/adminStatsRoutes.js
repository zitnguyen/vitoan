const express = require("express");
const { overview } = require("../controllers/adminStatsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("Admin"), overview);

module.exports = router;
