// Dữ liệu mẫu cho "Nhiệm vụ" và "Đổi quà" — chạy 1 lần, bỏ qua nếu đã có bản
// ghi trùng tên để có thể chạy lại an toàn.
require("dotenv").config();
const mongoose = require("mongoose");
const Mission = require("../models/Mission");
const Reward = require("../models/Reward");

const MISSIONS = [
  {
    title: "Khởi động mỗi ngày",
    description: "Hoàn thành 1 lượt luyện tập hôm nay.",
    type: "daily",
    goalType: "attempts_count",
    goalValue: 1,
    rewardPoints: 10,
  },
  {
    title: "Luyện tập chăm chỉ",
    description: "Hoàn thành 3 lượt luyện tập hôm nay.",
    type: "daily",
    goalType: "attempts_count",
    goalValue: 3,
    rewardPoints: 20,
  },
  {
    title: "Chính xác tuyệt đối",
    description: "Đạt điểm tuyệt đối 1 lần hôm nay.",
    type: "daily",
    goalType: "perfect_score",
    goalValue: 1,
    rewardPoints: 15,
  },
  {
    title: "Khám phá nhiều bài học",
    description: "Luyện tập ở 3 bài học khác nhau hôm nay.",
    type: "daily",
    goalType: "lessons_completed",
    goalValue: 3,
    rewardPoints: 25,
  },
  {
    title: "Chiến binh tuần này",
    description: "Hoàn thành 10 lượt luyện tập trong tuần.",
    type: "weekly",
    goalType: "attempts_count",
    goalValue: 10,
    rewardPoints: 60,
  },
  {
    title: "Học đều cả tuần",
    description: "Luyện tập ở 8 bài học khác nhau trong tuần.",
    type: "weekly",
    goalType: "lessons_completed",
    goalValue: 8,
    rewardPoints: 80,
  },
  {
    title: "Tuần lễ hoàn hảo",
    description: "Đạt điểm tuyệt đối 5 lần trong tuần.",
    type: "weekly",
    goalType: "perfect_score",
    goalValue: 5,
    rewardPoints: 100,
  },
];

const REWARDS = [
  { name: "Khung avatar Ngôi sao", description: "Khung viền lấp lánh cho ảnh đại diện.", costPoints: 50, icon: "star" },
  { name: "Khung avatar Cầu vồng", description: "Khung viền rực rỡ sắc màu.", costPoints: 100, icon: "sparkles" },
  { name: "Danh hiệu Chăm chỉ", description: "Hiển thị danh hiệu đặc biệt trên hồ sơ.", costPoints: 150, icon: "medal" },
  { name: "Nhãn dán Cú thông thái", description: "Bộ nhãn dán mascot ViToan dễ thương.", costPoints: 80, icon: "smile" },
  { name: "Vé đổi tên hiển thị", description: "Đổi tên hiển thị 1 lần miễn phí.", costPoints: 200, icon: "gift" },
  { name: "Huy hiệu VIP tuần", description: "Huy hiệu đặc biệt hiển thị trong 1 tuần.", costPoints: 300, icon: "crown" },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  let missionsCreated = 0;
  for (const data of MISSIONS) {
    const exists = await Mission.findOne({ title: data.title });
    if (exists) continue;
    await Mission.create(data);
    missionsCreated++;
  }

  let rewardsCreated = 0;
  for (const data of REWARDS) {
    const exists = await Reward.findOne({ name: data.name });
    if (exists) continue;
    await Reward.create(data);
    rewardsCreated++;
  }

  console.log(`Đã tạo ${missionsCreated} nhiệm vụ mới, ${rewardsCreated} phần quà mới.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
