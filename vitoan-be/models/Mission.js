const mongoose = require("mongoose");

// Nhiệm vụ hằng ngày/tuần — tiến độ tính động từ Attempt trong khoảng thời gian
// tương ứng (xem utils/missionStats.js), không lưu tiến độ ở đây để tránh lệch
// dữ liệu khi học sinh làm bài ở nhiều nơi.
const missionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["daily", "weekly"], required: true },
    goalType: {
      type: String,
      enum: ["attempts_count", "lessons_completed", "perfect_score"],
      required: true,
    },
    goalValue: { type: Number, required: true, min: 1 },
    rewardPoints: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mission", missionSchema);
