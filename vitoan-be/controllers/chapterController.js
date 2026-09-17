const Chapter = require("../models/Chapter");
const Lesson = require("../models/Lesson");

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.subject) filter.subject = req.query.subject;
    const chapters = await Chapter.find(filter).sort({ order: 1, createdAt: 1 });

    const counts = await Lesson.aggregate([
      { $match: { chapter: { $in: chapters.map((c) => c._id) } } },
      { $group: { _id: "$chapter", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json({
      success: true,
      data: chapters.map((c) => ({ ...c.toObject(), lessonCount: countMap.get(String(c._id)) || 0 })),
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const chapter = await Chapter.create(req.body);
    res.status(201).json({ success: true, data: chapter });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after", runValidators: true });
    if (!chapter) return res.status(404).json({ success: false, message: "Không tìm thấy chương" });
    res.json({ success: true, data: chapter });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const lessonCount = await Lesson.countDocuments({ chapter: req.params.id });
    if (lessonCount > 0) {
      return res.status(400).json({ success: false, message: "Chương còn bài học, không thể xoá" });
    }
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
