const mongoose = require("mongoose");

// Chỉ sao lưu NỘI DUNG học tập (không có tài khoản/mật khẩu/bài làm của học sinh).
const COLLECTIONS = {
  grades: "Grade",
  subjects: "Subject",
  chapters: "Chapter",
  lessons: "Lesson",
  questions: "Question",
  practiceSets: "PracticeSet",
  tests: "Test",
  reviewContents: "ReviewContent",
  rewards: "Reward",
  missions: "Mission",
  badges: "Badge",
  articles: "Article",
};

const model = (name) => require(`../models/${name}`);

async function exportBackup(req, res, next) {
  try {
    const data = {};
    for (const [key, name] of Object.entries(COLLECTIONS)) {
      data[key] = await model(name).find({}).lean();
    }
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Disposition", `attachment; filename="vitoan-backup-${stamp}.json"`);
    res.json({ app: "vitoan", version: 1, exportedAt: new Date().toISOString(), data });
  } catch (err) {
    next(err);
  }
}

// Khôi phục kiểu "gộp": ghi đè/thêm theo _id, KHÔNG xoá dữ liệu hiện có.
async function importBackup(req, res, next) {
  try {
    const body = req.body;
    if (!body || body.app !== "vitoan" || typeof body.data !== "object") {
      return res.status(400).json({ success: false, message: "File sao lưu không hợp lệ" });
    }
    const summary = {};
    for (const [key, name] of Object.entries(COLLECTIONS)) {
      const docs = body.data[key];
      if (!Array.isArray(docs) || docs.length === 0) continue;
      const ops = docs
        .filter((d) => d && mongoose.isValidObjectId(d._id))
        .map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
      if (ops.length) await model(name).bulkWrite(ops, { ordered: false });
      summary[key] = ops.length;
    }
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { exportBackup, importBackup };
