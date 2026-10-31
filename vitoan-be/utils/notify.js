const Notification = require("../models/Notification");

// Tạo thông báo cho học sinh; lỗi thông báo không được làm hỏng luồng chính.
async function notify(userId, data) {
  try {
    await Notification.create({ user: userId, ...data });
  } catch (err) {
    console.error("notify lỗi:", err.message);
  }
}

module.exports = { notify };
