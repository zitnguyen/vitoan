const express = require("express");
const { list, myRedemptions, redeem, create, update, remove } = require("../controllers/rewardController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/me", protect, authorize("Student"), myRedemptions);
router.post("/:id/redeem", protect, authorize("Student"), redeem);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
