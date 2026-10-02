const mongoose = require("mongoose");

// Tiến độ học 1 bài học của học sinh (ngoài phần luyện tập đã có Attempt/PracticeProgress):
// đã xem những đoạn nào của video và đã đọc phần "kiến thức cần nhớ" chưa.
const lessonProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    // Video chia thành các đoạn VIDEO_BUCKET_SECONDS giây; lưu chỉ số các đoạn đã thực sự phát qua
    // (tua bỏ qua thì không tính, xem lại không cộng trùng).
    videoBuckets: { type: [Number], default: [] },
    videoPosition: { type: Number, default: 0 }, // vị trí đang xem dở, để lần sau phát tiếp
    videoDuration: { type: Number, default: 0 },
    videoSeconds: { type: Number, default: 0 }, // (cũ) mốc xa nhất — chỉ dùng cho dữ liệu trước đây
    videoDone: { type: Boolean, default: false },
    theoryDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model("LessonProgress", lessonProgressSchema);
