// Xoá các câu hỏi "Đúng/Sai" tự sinh bởi scripts/addQuestionVariety.js (dạng
// 'Bài học này có tên là "..."'), vì nội dung máy móc, không phù hợp cho học sinh.
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const PracticeSet = require("../models/PracticeSet");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const junk = await Question.find({ text: /^Bài học này có tên là/ });
  const junkIds = junk.map((q) => q._id);

  if (junkIds.length === 0) {
    console.log("Không tìm thấy câu hỏi nào cần xoá.");
    process.exit(0);
  }

  const pullRes = await PracticeSet.updateMany({ questions: { $in: junkIds } }, { $pull: { questions: { $in: junkIds } } });
  const deleteRes = await Question.deleteMany({ _id: { $in: junkIds } });

  console.log(`Đã gỡ khỏi ${pullRes.modifiedCount} bộ luyện tập.`);
  console.log(`Đã xoá ${deleteRes.deletedCount} câu hỏi.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
