const express = require("express");
const { myRoles, listLessonProgress, setLessonProgress, listStudents, list, getOne, create, update, updateStatus, leaderboard, publicLeaderboard, publicStats } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats/public", publicStats);
router.get("/leaderboard/public", publicLeaderboard);
router.get("/leaderboard", protect, authorize("Student"), leaderboard);
router.get("/roles/mine", protect, authorize("Manager"), myRoles);
router.get("/students", protect, authorize("Manager"), listStudents);
router.get("/", protect, authorize("Manager"), list);
router.get("/:id/lessons", protect, authorize("Manager"), listLessonProgress);
router.put("/:id/lessons", protect, authorize("Manager"), setLessonProgress);
router.get("/:id", protect, authorize("Manager"), getOne);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.put("/:id/status", protect, authorize("Manager"), updateStatus);

module.exports = router;
