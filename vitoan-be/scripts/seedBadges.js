// Bổ sung vài mức huy hiệu còn thiếu cho hệ thống "Thành tích" hiện có (đã có
// sẵn các mốc lessons_completed 1/10/30/60, perfect_score 1/10, streak 3/7/30,
// và points_reached 100/500/1500/3000/6000) — chỉ thêm các mốc trung gian còn
// trống, tránh trùng với huy hiệu đã có theo (conditionType, conditionValue).
require("dotenv").config();
const mongoose = require("mongoose");
const Badge = require("../models/Badge");

const NEW_BADGES = [
  {
    name: "Nhà thông thái nhí",
    description: "Hoàn thành 15 bài học khác nhau.",
    conditionType: "lessons_completed",
    conditionValue: 15,
  },
  {
    name: "Siêu sao điểm 10",
    description: "Đạt điểm tuyệt đối 5 lần.",
    conditionType: "perfect_score",
    conditionValue: 5,
  },
  {
    name: "Bậc thầy chính xác",
    description: "Đạt điểm tuyệt đối 15 lần.",
    conditionType: "perfect_score",
    conditionValue: 15,
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Badge.find({}, "conditionType conditionValue");
  const existingKeys = new Set(existing.map((b) => `${b.conditionType}:${b.conditionValue}`));

  let created = 0;
  for (const data of NEW_BADGES) {
    if (existingKeys.has(`${data.conditionType}:${data.conditionValue}`)) continue;
    await Badge.create(data);
    created++;
  }

  console.log(`Đã tạo ${created} huy hiệu mới.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
