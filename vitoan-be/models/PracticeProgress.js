const mongoose = require("mongoose");

// Lộ trình làm bài luyện tập đang dở: thứ tự câu, câu đang làm và các câu đã trả lời
// (đã chấm), để học sinh thoát ra rồi quay lại vẫn làm tiếp đúng chỗ, giữ nguyên điểm tích luỹ.
const progressAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, default: -1 },
    textAnswer: { type: String, default: "" },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const practiceProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    practiceSet: { type: mongoose.Schema.Types.ObjectId, ref: "PracticeSet", default: null },
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answers: { type: [progressAnswerSchema], default: [] },
    current: { type: Number, default: 0 },
    elapsedSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

practiceProgressSchema.index({ student: 1, lesson: 1, practiceSet: 1 }, { unique: true });
practiceProgressSchema.index({ student: 1, updatedAt: -1 });

module.exports = mongoose.model("PracticeProgress", practiceProgressSchema);
