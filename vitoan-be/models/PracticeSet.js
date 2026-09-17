const mongoose = require("mongoose");

const practiceSetSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    title: { type: String, required: true, trim: true },
    level: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    order: { type: Number, default: 0 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    timeLimitSeconds: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

practiceSetSchema.index({ lesson: 1, order: 1 });

module.exports = mongoose.model("PracticeSet", practiceSetSchema);
