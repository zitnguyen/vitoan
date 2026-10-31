const mongoose = require("mongoose");

const rewardRedemptionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reward: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", required: true },
    pointsSpent: { type: Number, required: true },
    // Quà hiện vật (type "other") cần admin xử lý: pending → done; huỷ đơn thì hoàn điểm. Quà ảo dùng ngay nên mặc định done.
    status: { type: String, enum: ["pending", "done", "cancelled"], default: "done" },
    note: { type: String, default: "" },
    refunded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

rewardRedemptionSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("RewardRedemption", rewardRedemptionSchema);
