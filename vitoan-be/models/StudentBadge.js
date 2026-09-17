const mongoose = require("mongoose");

const studentBadgeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", required: true },
  achievedAt: { type: Date, default: Date.now },
});

studentBadgeSchema.index({ student: 1, badge: 1 }, { unique: true });

module.exports = mongoose.model("StudentBadge", studentBadgeSchema);
