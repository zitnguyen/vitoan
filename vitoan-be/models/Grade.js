const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, required: true },
    // Lớp chưa triển khai nội dung thì ẩn khỏi học sinh/khách (quản trị viên vẫn thấy để soạn dần).
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grade", gradeSchema);
