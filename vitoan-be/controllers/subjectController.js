const Subject = require("../models/Subject");

async function list(req, res, next) {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!subject) return res.status(404).json({ success: false, message: "Không tìm thấy môn học" });
    res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
