const mongoose = require("mongoose");

// Câu trắc nghiệm phải có ĐÚNG 4 đáp án (không để lẻ); câu Đúng/Sai có 2.
// Ngoại lệ: câu nghe "Có/Không" (listen_choice) giữ 2 đáp án.
function choicesProblem(type, choices) {
  if (type === "fill_blank" || type === "listen_fill") return null;
  const arr = Array.isArray(choices) ? choices : [];
  if (type === "true_false") return arr.length === 2 ? null : "Câu Đúng/Sai cần đúng 2 đáp án";
  if (type === "listen_choice" && arr.length === 2 && arr[0] === "Có" && arr[1] === "Không") return null;
  if (arr.length !== 4) return "Câu trắc nghiệm cần đúng 4 đáp án";
  if (arr.some((c) => !String(c).trim())) return "Không được để trống đáp án";
  if (new Set(arr.map((c) => String(c).trim().toLowerCase())).size !== 4) return "Các đáp án không được trùng nhau";
  return null;
}

const questionSchema = new mongoose.Schema(
  {
    // Câu hỏi thuộc bài học nào. Câu "riêng của đề kiểm tra" (testOnly) không thuộc bài học/chương nào,
    // chỉ xuất hiện trong bài kiểm tra chứa nó — không vào luyện tập, đấu trường hay ôn câu theo bài.
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: function lessonRequired() {
        return !this.testOnly;
      },
    },
    testOnly: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "listen_choice", "multi_choice", "fill_blank", "listen_fill"],
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
          // Với findByIdAndUpdate `this` là Query (không có type) — controller tự kiểm tra bằng choicesProblem.
          if (!this.type) return true;
          const problem = choicesProblem(this.type, arr);
          return !problem;
        },
        message: "Câu trắc nghiệm cần đúng 4 đáp án (không trống, không trùng nhau)",
      },
    },
    // Ảnh riêng cho từng đáp án (song song với `choices`; "" = đáp án không có ảnh).
    choiceImages: { type: [String], default: [] },
    correctIndex: {
      type: Number,
      min: 0,
      max: 3,
      required: function correctIndexRequired() {
        return this.type !== "fill_blank" && this.type !== "listen_fill";
      },
      default: 0,
    },
    // Câu "chọn nhiều đáp án" (multi_choice): danh sách vị trí các đáp án đúng.
    correctIndexes: { type: [Number], default: [] },
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
    // Nguồn câu hỏi — để chứng minh được câu lấy từ đâu (SGK/SBT trang mấy) hay do dự án tự biên soạn.
    source: {
      kind: { type: String, enum: ["self", "sgk", "sbt", "other"], default: "self" },
      book: { type: String, default: "", trim: true }, // vd "Toán 1 – Kết nối tri thức với cuộc sống"
      volume: { type: String, default: "", trim: true }, // vd "Tập 1"
      page: { type: String, default: "", trim: true }, // vd "24" hoặc "24–25"
      exercise: { type: String, default: "", trim: true }, // vd "Bài 3"
      url: { type: String, default: "", trim: true },
      note: { type: String, default: "", trim: true },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ lesson: 1, order: 1 });

const Question = mongoose.model("Question", questionSchema);
Question.choicesProblem = choicesProblem;
module.exports = Question;
