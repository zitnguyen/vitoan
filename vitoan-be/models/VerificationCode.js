const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    codeHash: { type: String, required: true },
    type: { type: String, enum: ["password-reset", "register-verify", "phone-verify"], default: "password-reset" },
    // Kênh đã gửi mã; số lần nhập sai để chặn dò mã 6 số.
    channel: { type: String, enum: ["email", "phone"], default: "email" },
    attempts: { type: Number, default: 0 },
    // Số điện thoại đang chờ xác thực (loại phone-verify).
    target: { type: String },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

verificationCodeSchema.index({ user: 1, type: 1 });
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VerificationCode", verificationCodeSchema);
