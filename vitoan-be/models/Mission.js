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
      // checkin_days: số ngày điểm danh; tests_completed: số bài kiểm tra; correct_answers: tổng câu trả lời đúng
      enum: ["attempts_count", "lessons_completed", "perfect_score", "checkin_days", "tests_completed", "correct_answers"],
      required: true,
    },
    goalValue: { type: Number, required: true, min: 1 },
    rewardPoints: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mission", missionSchema);
