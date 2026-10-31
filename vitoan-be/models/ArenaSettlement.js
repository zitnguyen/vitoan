const mongoose = require("mongoose");

// Đã chốt giải đấu tuần nào chưa (mỗi tuần chốt đúng một lần) + danh sách người đoạt giải.
const arenaSettlementSchema = new mongoose.Schema(
  {
    weekKey: { type: String, required: true, unique: true }, // ngày Thứ Hai của tuần, giờ Việt Nam
    winners: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
        rank: Number,
        reward: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ArenaSettlement", arenaSettlementSchema);
