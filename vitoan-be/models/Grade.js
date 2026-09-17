const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grade", gradeSchema);
