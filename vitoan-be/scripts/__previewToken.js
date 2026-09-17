require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const Lesson = require("../models/Lesson");
const Question = require("../models/Question");
const { generateAccessToken } = require("../utils/tokens");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ username: "__preview_student" });
  if (!user) {
    user = await User.create({
      fullName: "Preview Student",
      username: "__preview_student",
      password: "preview123456",
      role: "Student",
      points: 120,
    });
  } else {
    user.points = 120;
    await user.save();
  }

  const lessons = await Lesson.find().limit(4);
  const existingAttempts = await Attempt.countDocuments({ student: user._id });
  if (existingAttempts === 0 && lessons.length > 0) {
    for (const lesson of lessons) {
      const q = await Question.findOne({ lesson: lesson._id });
      await Attempt.create({
        student: user._id,
        lesson: lesson._id,
        score: 3,
        totalQuestions: 3,
        answers: q ? [{ question: q._id, selectedIndex: 0, correct: true }] : [],
      });
    }
  }

  const token = generateAccessToken(user);
  console.log(JSON.stringify({ userId: String(user._id), token }));
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
