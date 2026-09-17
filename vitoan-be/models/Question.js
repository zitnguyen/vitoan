const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "listen_choice", "fill_blank", "listen_fill"],
      default: "multiple_choice",
    },
    text: { type: String, required: true },
    // Câu để đọc to (Web Speech API) cho câu hỏi "nghe rồi..." — tách riêng khỏi
    // `text` vì với listen_fill, `text` chỉ chứa ô trống "___" (giấu đáp án khi hiển
    // thị), còn audioText mới là câu đầy đủ cần phát ra cho bé nghe và điền lại.
    // Không cần giấu field này với client vì nghe được vốn chính là mục đích của bài.
    audioText: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    choices: {
      type: [String],
      default: [],
      validate: {
        validator: function validateChoices(arr) {
          if (this.type === "fill_blank" || this.type === "listen_fill") return true;
          return Array.isArray(arr) && arr.length >= 2 && arr.length <= 4;
        },
        message: "Cần từ 2 đến 4 đáp án lựa chọn",
      },
    },
    correctIndex: {
      type: Number,
      min: 0,
      max: 3,
      required: function correctIndexRequired() {
        return this.type !== "fill_blank" && this.type !== "listen_fill";
      },
      default: 0,
    },
    // Đáp án đúng dạng chữ/số cho câu "điền vào chỗ trống" — question.text chứa
    // dấu "___" đánh dấu vị trí ô nhập; so khớp không phân biệt hoa/thường, bỏ khoảng trắng thừa.
    correctText: {
      type: String,
      default: "",
      required: function correctTextRequired() {
        return this.type === "fill_blank" || this.type === "listen_fill";
      },
    },
    explanation: { type: String, default: "" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ lesson: 1, order: 1 });

module.exports = mongoose.model("Question", questionSchema);
