const express = require("express");
const { summary, session, answer } = require("../controllers/reviewSessionController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorize("Student"));

router.get("/summary", summary);
router.post("/session", session);
router.post("/answer", answer);

module.exports = router;
