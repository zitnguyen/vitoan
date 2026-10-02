const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    costPoints: { type: Number, required: true, min: 1 },
    icon: { type: String, default: "gift" },
    // Loại quà quyết định cách dùng sau khi đổi:
    //  frame = khung avatar, avatar = ảnh đại diện hoạt hình, title = danh hiệu cạnh tên,
    //  name_color = màu tên, vip = huy hiệu VIP có thời hạn, other = quà hiện vật/khác.
    type: { type: String, enum: ["frame", "avatar", "title", "name_color", "vip", "other"], default: "other" },
    // Giá trị áp dụng: mã khung (star, rainbow...), style avatar DiceBear, chữ danh hiệu, mã màu tên.
    value: { type: String, default: "" },
    // Số ngày hiệu lực (chỉ dùng cho vip).
    durationDays: { type: Number, default: 0 },
    // -1 = không giới hạn số lượng đổi.
    stock: { type: Number, default: -1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reward", rewardSchema);
