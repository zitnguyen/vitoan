const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    testType: { type: String, enum: ["topic", "midterm", "final"], required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    level: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    timeLimitSeconds: { type: Number, default: 0 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testSchema.index({ subject: 1, grade: 1, testType: 1 });

module.exports = mongoose.model("Test", testSchema);
