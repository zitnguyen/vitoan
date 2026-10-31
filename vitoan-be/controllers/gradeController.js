const Grade = require("../models/Grade");
const Chapter = require("../models/Chapter");

async function list(req, res, next) {
  try {
    const isAdmin = req.user && req.user.role === "Admin";
    const grades = await Grade.find(isAdmin ? {} : { isPublished: { $ne: false } }).sort({ order: 1 });
    res.json({ success: true, data: grades });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const grade = await Grade.create(req.body);
    res.status(201).json({ success: true, data: grade });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!grade) return res.status(404).json({ success: false, message: "Không tìm thấy lớp" });
    res.json({ success: true, data: grade });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const used = await Chapter.countDocuments({ grade: req.params.id });
    if (used) return res.status(400).json({ success: false, message: `Lớp này còn ${used} chương học, hãy xoá hoặc chuyển chương trước. Muốn ẩn khỏi học sinh thì tắt “Hiển thị”.` });
    await Grade.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
