const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    iconUrl: { type: String, default: "" },
    conditionType: {
      type: String,
      enum: ["lessons_completed", "perfect_score", "streak"],
      default: "lessons_completed",
    },
    conditionValue: { type: Number, default: 1 },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
