const mongoose = require("mongoose");

// Ghi nhận 1 lần nhận thưởng nhiệm vụ trong 1 kỳ (ngày/tuần) cụ thể — periodKey
// là "YYYY-MM-DD" (daily, ngày hiện tại) hoặc "YYYY-MM-DD" của thứ Hai đầu tuần
// (weekly). Unique index chặn nhận thưởng 2 lần trong cùng 1 kỳ.
const missionClaimSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mission: { type: mongoose.Schema.Types.ObjectId, ref: "Mission", required: true },
    periodKey: { type: String, required: true },
    rewardPoints: { type: Number, required: true },
  },
  { timestamps: true }
);

missionClaimSchema.index({ student: 1, mission: 1, periodKey: 1 }, { unique: true });

module.exports = mongoose.model("MissionClaim", missionClaimSchema);
