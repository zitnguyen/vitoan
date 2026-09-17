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

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    practiceSet: { type: mongoose.Schema.Types.ObjectId, ref: "PracticeSet" },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attemptSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Attempt", attemptSchema);
