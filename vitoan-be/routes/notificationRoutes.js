const express = require("express");
const { list, markRead, markAllRead } = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorize("Student"));

router.get("/", list);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);

module.exports = router;
