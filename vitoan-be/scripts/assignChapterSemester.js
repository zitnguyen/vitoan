const mongoose = require("mongoose");
require("dotenv").config();
const Chapter = require("../models/Chapter");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const chapters = await Chapter.find({}).sort({ order: 1, createdAt: 1 });
  const groups = new Map();
  for (const c of chapters) {
    const key = `${c.grade}_${c.subject}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  let updated = 0;
  for (const list of groups.values()) {
    const mid = Math.ceil(list.length / 2);
    for (let i = 0; i < list.length; i++) {
      const semester = i < mid ? 1 : 2;
      list[i].semester = semester;
      await list[i].save();
      updated++;
    }
  }
  console.log(`Đã gán học kỳ cho ${updated} chương.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
