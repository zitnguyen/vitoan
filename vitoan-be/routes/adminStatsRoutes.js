const express = require("express");
const { overview } = require("../controllers/adminStatsController");
const { lookup } = require("../controllers/adminLookupController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorize("Admin"), overview);
router.get("/lookup/:id", protect, authorize("Admin"), lookup);

module.exports = router;
