const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter" },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    isTrial: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

lessonSchema.index({ subject: 1, grade: 1, order: 1 });

module.exports = mongoose.model("Lesson", lessonSchema);
