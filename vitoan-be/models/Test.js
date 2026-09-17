const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    testType: { type: String, enum: ["topic", "midterm", "final"], required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    // Chỉ có ý nghĩa với testType "midterm"/"final" — đề kiểm tra "topic" đã gắn
    // với 1 chương nên học kỳ suy ra được từ chapter.semester.
    semester: { type: Number, enum: [1, 2], default: 1 },
    level: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    timeLimitSeconds: { type: Number, default: 0 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testSchema.index({ subject: 1, grade: 1, testType: 1 });

module.exports = mongoose.model("Test", testSchema);
