const mongoose = require("mongoose");

// Nhật ký "Ôn lại câu sai": mỗi lần em trả lời lại 1 câu đã từng sai. Cùng với kết quả luyện tập/kiểm tra
// để quyết định câu nào đã nhớ (đúng 2 lần liên tiếp sau lần sai gần nhất) và câu nào còn cần ôn.
const reviewLogSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    correct: { type: Boolean, required: true },
    paid: { type: Boolean, default: false }, // lượt này có được cộng điểm thưởng không
  },
  { timestamps: true }
);

reviewLogSchema.index({ student: 1, createdAt: -1 });
reviewLogSchema.index({ student: 1, question: 1, createdAt: -1 });

module.exports = mongoose.model("ReviewLog", reviewLogSchema);
