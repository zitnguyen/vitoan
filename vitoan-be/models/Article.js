const mongoose = require("mongoose");

// Bài viết trang Tin tức. Tin lấy từ báo chỉ lưu tiêu đề + tóm tắt + ảnh (nhúng link gốc)
// và dẫn về bài gốc (sourceUrl) — không sao chép toàn văn. Bài do ViToan tự viết thì có `content`.
const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "", trim: true },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["giao-duc", "tieu-hoc", "phu-huynh", "vitoan"],
      default: "giao-duc",
    },
    sourceName: { type: String, default: "", trim: true },
    sourceUrl: { type: String, trim: true },
    publishedAt: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Một bài gốc chỉ nhập 1 lần.
articleSchema.index({ sourceUrl: 1 }, { unique: true, partialFilterExpression: { sourceUrl: { $type: "string" } } });
articleSchema.index({ isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model("Article", articleSchema);
