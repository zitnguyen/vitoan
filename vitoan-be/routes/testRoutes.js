const express = require("express");
const { list, getOne, create, update, remove, duplicate } = require("../controllers/testController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/:id", protect, getOne);
router.post("/", protect, authorize("Admin"), create);
router.post("/:id/duplicate", protect, authorize("Admin"), duplicate);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
