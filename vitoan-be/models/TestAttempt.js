const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, default: -1 },
    textAnswer: { type: String, default: "" },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testAttemptSchema.index({ student: 1, createdAt: -1 });
testAttemptSchema.index({ student: 1, test: 1 });

module.exports = mongoose.model("TestAttempt", testAttemptSchema);
