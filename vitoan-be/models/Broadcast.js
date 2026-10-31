const mongoose = require("mongoose");

// Thông báo chung do quản trị viên gửi cho học sinh (tất cả hoặc theo lớp). Mỗi lần gửi lưu một dòng lịch sử.
const broadcastSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, default: "", trim: true, maxlength: 500 },
    icon: { type: String, default: "📢" },
    link: { type: String, default: "" },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade" }, // rỗng = tất cả học sinh
    recipients: { type: Number, default: 0 },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Broadcast", broadcastSchema);
