const express = require("express");
const { list, getOne, create, update, remove, duplicate } = require("../controllers/testController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/:id", protect, getOne);
router.post("/", protect, authorize("Manager"), create);
router.post("/:id/duplicate", protect, authorize("Manager"), duplicate);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
