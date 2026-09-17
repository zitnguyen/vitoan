require("dotenv").config();
const mongoose = require("mongoose");
const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const ReviewContent = require("../models/ReviewContent");
const Grade = require("../models/Grade");
const Subject = require("../models/Subject");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const grade1 = await Grade.findOne({ slug: "lop-1" });
  const toanSubject = await Subject.findOne({ slug: "toan" });
  const chapter = await Chapter.findOne({ subject: toanSubject._id, grade: grade1._id, title: "Phép cộng, phép trừ trong phạm vi 10" });

  const lesson = await Lesson.findOneAndUpdate(
    { chapter: chapter._id, order: 3 },
    {
      $setOnInsert: {
        title: "Bảng cộng, bảng trừ trong phạm vi 10",
        description: "Ghi nhớ bảng cộng và bảng trừ trong phạm vi 10 để tính nhanh, tính đúng.",
        subject: toanSubject._id,
        grade: grade1._id,
        chapter: chapter._id,
        order: 3,
        isPublished: true,
        isTrial: true,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await ReviewContent.findOneAndUpdate(
    { lesson: lesson._id },
    {
      $setOnInsert: {
        title: lesson.title,
        content:
          "Bảng cộng và bảng trừ trong phạm vi 10 giúp em tính nhẩm nhanh mà không cần đếm ngón tay. Em nên học thuộc để làm bài nhanh hơn.",
        examples: ["4 + 6 = 10", "10 - 4 = 6", "7 + 3 = 10"],
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const existingQuestions = await Question.countDocuments({ lesson: lesson._id });
  if (existingQuestions === 0) {
    await Question.insertMany([
      { lesson: lesson._id, text: "4 + 6 = ?", choices: ["8", "9", "10", "11"], correctIndex: 2, order: 1 },
      { lesson: lesson._id, text: "10 - 4 = ?", choices: ["5", "6", "7", "4"], correctIndex: 1, order: 2 },
      { lesson: lesson._id, text: "Số nào cộng với 3 thì bằng 10?", choices: ["6", "7", "8", "9"], correctIndex: 1, order: 3 },
      { lesson: lesson._id, text: "9 - 2 = ?", choices: ["6", "7", "8", "5"], correctIndex: 1, order: 4 },
    ]);
  }

  console.log("Fixed missing lesson 3 of:", chapter.title, "->", lesson.title);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
