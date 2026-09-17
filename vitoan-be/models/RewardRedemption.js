const mongoose = require("mongoose");

const rewardRedemptionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reward: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", required: true },
    pointsSpent: { type: Number, required: true },
  },
  { timestamps: true }
);

rewardRedemptionSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("RewardRedemption", rewardRedemptionSchema);
