const mongoose = require("mongoose");

// Thách đấu bất đồng bộ: người thách chơi trước một bộ 10 câu cố định, bạn nhận thách chơi đúng bộ đó,
// ai nhiều câu đúng hơn (bằng điểm thì nhanh hơn) thắng. opponent rỗng = thách cả lớp (ai nhận trước thì đấu).
const arenaChallengeSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    creatorRun: { type: mongoose.Schema.Types.ObjectId, ref: "ArenaRun" },
    opponentRun: { type: mongoose.Schema.Types.ObjectId, ref: "ArenaRun" },
    status: { type: String, enum: ["waiting", "open", "accepted", "done"], default: "waiting" },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    draw: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

arenaChallengeSchema.index({ status: 1, opponent: 1, expiresAt: 1 });

module.exports = mongoose.model("ArenaChallenge", arenaChallengeSchema);
