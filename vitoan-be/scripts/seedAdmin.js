const User = require("../models/User");

async function seedAdmin() {
  const username = (process.env.SEED_ADMIN_USERNAME || "admin").toLowerCase();
  const existing = await User.findOne({ username });
  if (existing) return;
  await User.create({
    fullName: "Quản trị viên",
    username,
    password: process.env.SEED_ADMIN_PASSWORD || "admin123456",
    role: "Admin",
  });
  console.log(`[vitoan-be] Đã tạo tài khoản Admin mặc định: ${username}`);
}

module.exports = seedAdmin;
