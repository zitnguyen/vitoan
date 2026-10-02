const express = require("express");
const { list, getOne, create, update, remove, feeds, previewFeed, importItems } = require("../controllers/articleController");
const { protect, optionalAuth, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, list);
router.get("/feeds", protect, authorize("Admin"), feeds);
router.get("/feeds/:key", protect, authorize("Admin"), previewFeed);
router.post("/import", protect, authorize("Admin"), importItems);
router.get("/:id", optionalAuth, getOne);
router.post("/", protect, authorize("Admin"), create);
router.put("/:id", protect, authorize("Admin"), update);
router.delete("/:id", protect, authorize("Admin"), remove);

module.exports = router;
