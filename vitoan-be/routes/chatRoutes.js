const express = require("express");
const {
  listConversations,
  getConversation,
  sendMessage,
  removeConversation,
} = require("../controllers/chatController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("Student"));

router.get("/", listConversations);
router.get("/:id", getConversation);
router.post("/", sendMessage);
router.post("/:id/messages", sendMessage);
router.delete("/:id", removeConversation);

module.exports = router;
