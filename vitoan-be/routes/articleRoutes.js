const express = require("express");
const { list, getOne, create, update, remove, feeds, previewFeed, importItems } = require("../controllers/articleController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/feeds", protect, authorize("Manager"), feeds);
router.get("/feeds/:key", protect, authorize("Manager"), previewFeed);
router.post("/import", protect, authorize("Manager"), importItems);
router.get("/:id", optionalAuth, getOne);
router.post("/", protect, authorize("Manager"), create);
router.put("/:id", protect, authorize("Manager"), update);
router.delete("/:id", protect, authorize("Manager"), remove);

module.exports = router;
