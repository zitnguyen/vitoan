const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    costPoints: { type: Number, required: true, min: 1 },
    icon: { type: String, default: "gift" },
    // -1 = không giới hạn số lượng đổi.
    stock: { type: Number, default: -1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reward", rewardSchema);
