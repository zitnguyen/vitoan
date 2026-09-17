const express = require("express");
const { listStudents, list, getOne, create, update, updateStatus } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/students", protect, authorize("Admin"), listStudents);
router.get("/", protect, authorize("Admin"), list);
router.get("/:id", protect, authorize("Admin"), getOne);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.put("/:id/status", protect, authorize("Admin"), updateStatus);

module.exports = router;
