require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const seedAdmin = require("./scripts/seedAdmin");

const PORT = process.env.PORT || 9002;

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[vitoan-be] Đã kết nối MongoDB");
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`[vitoan-be] Server đang chạy tại port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[vitoan-be] Lỗi khởi động server:", err);
  process.exit(1);
});
