const mongoose = require("mongoose");

const runAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, default: -1 }, // -1 = hết giờ / bỏ qua
    correct: { type: Boolean, required: true },
    ms: { type: Number, default: 0 },
  },
  { _id: false }
);

// Một lượt thi ở Đấu trường. Máy chủ giữ bộ câu hỏi và chấm từng câu (học sinh không tự báo điểm):
// status "playing" → đang chơi, "done" → đã nộp. Lượt cũ (trước khi có phiên chơi) không có status = đã xong.
const arenaRunSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    mode: { type: String, enum: ["solo", "duel"], default: "solo" },
    status: { type: String, enum: ["playing", "done"], default: "done" },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: "ArenaChallenge" },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    answers: { type: [runAnswerSchema], default: [] },
    lifelineUsed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 10 },
    durationSeconds: { type: Number, default: 0 },
    maxCombo: { type: Number, default: 0 },
    rating: { type: Number }, // điểm xếp hạng nhận được (undefined ở lượt cũ → tính score × 10)
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

arenaRunSchema.index({ grade: 1, subject: 1, score: -1, durationSeconds: 1 });
arenaRunSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("ArenaRun", arenaRunSchema);
