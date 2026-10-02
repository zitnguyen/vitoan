const mongoose = require("mongoose");

// Điểm danh hằng ngày — mỗi học viên tối đa 1 lần / ngày (theo giờ Việt Nam).
// streak = số ngày điểm danh liên tục tính đến ngày này.
const checkInSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dayKey: { type: String, required: true }, // "YYYY-MM-DD" giờ Việt Nam
    streak: { type: Number, required: true, min: 1 },
    rewardPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

checkInSchema.index({ student: 1, dayKey: 1 }, { unique: true });
checkInSchema.index({ student: 1, dayKey: -1 });

module.exports = mongoose.model("CheckIn", checkInSchema);
