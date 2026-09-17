const mongoose = require("mongoose");

const reviewContentSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true, unique: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    examples: { type: [String], default: [] },
    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReviewContent", reviewContentSchema);
