const mongoose = require("mongoose");

// Thông báo lưu sẵn (thách đấu, kết quả trận, giải đấu tuần…). Các nhắc nhở tính theo thời điểm
// (giữ chuỗi ngày học, nhiệm vụ chờ nhận thưởng) được sinh tại lúc xem, không lưu ở đây.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, default: "info" },
    icon: { type: String, default: "🔔" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
