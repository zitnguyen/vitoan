const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Cuộc trò chuyện mới" },
  },
  { timestamps: true }
);

conversationSchema.index({ student: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
