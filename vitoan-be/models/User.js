const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    password: {
      type: String,
      required: function passwordRequired() {
        return !this.googleId;
      },
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ["Student", "Admin"], default: "Student" },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: "Grade" },
    // Điểm thưởng tích luỹ được từ hoàn thành nhiệm vụ, dùng để đổi quà.
    points: { type: Number, default: 0, min: 0 },
    // Đồ trang trí đang dùng (đổi từ trang Đổi quà).
    equippedFrame: { type: String, default: "" },
    equippedTitle: { type: String, default: "" },
    nameColor: { type: String, default: "" },
    vipUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    // Tài khoản thử nghiệm/demo: không tính vào thống kê và báo cáo của quản trị viên.
    isTest: { type: Boolean, default: false },
    // Cá nhân hoá: số bài luyện tập mỗi ngày em muốn đạt, và đã xem màn chào mừng lần đầu chưa.
    dailyGoal: { type: Number, default: 3, min: 1, max: 10 },
    onboarded: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "suspended", "disabled"], default: "active" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) return;
  if (!this.password) return;
  if (this.password.startsWith("$2")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function matchPassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
