const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade", required: true },
    order: { type: Number, default: 0 },
    semester: { type: Number, enum: [1, 2], default: 1 },
  },
  { timestamps: true }
);

chapterSchema.index({ subject: 1, grade: 1, order: 1 });

module.exports = mongoose.model("Chapter", chapterSchema);
