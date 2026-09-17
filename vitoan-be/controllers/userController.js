const User = require("../models/User");
const Attempt = require("../models/Attempt");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toAccountView(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    grade: user.grade,
    status: user.status,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

async function listStudents(req, res, next) {
  try {
    const students = await User.find({ role: "Student" }).populate("grade", "name").sort({ createdAt: -1 });
    const stats = await Attempt.aggregate([
      { $group: { _id: "$student", attemptCount: { $sum: 1 }, avgScore: { $avg: "$score" }, avgTotal: { $avg: "$totalQuestions" } } },
    ]);
    const statsMap = new Map(stats.map((s) => [String(s._id), s]));
    const data = students.map((student) => {
      const stat = statsMap.get(String(student._id));
      return {
        id: student._id,
        fullName: student.fullName,
        username: student.username,
        grade: student.grade,
        createdAt: student.createdAt,
        attemptCount: stat?.attemptCount || 0,
        avgScorePercent: stat && stat.avgTotal ? Math.round((stat.avgScore / stat.avgTotal) * 100) : null,
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ fullName: regex }, { email: regex }];
    }
    const users = await User.find(filter).populate("grade", "name").sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(toAccountView) });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const user = await User.findById(req.params.id).populate("grade", "name");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    res.json({ success: true, data: toAccountView(user) });
  } catch (err) {
    next(err);
  }
}

function generateUsernameBase(fullName) {
  return (fullName || "user")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";
}

async function create(req, res, next) {
  try {
    const fullName = (req.body.fullName || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    const role = req.body.role === "Admin" ? "Admin" : "Student";
    const grade = req.body.grade || undefined;
    const phone = (req.body.phone || "").trim();

    if (!fullName || !password) {
      return res.status(400).json({ success: false, message: "Thiếu họ tên hoặc mật khẩu" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Email không đúng định dạng" });
    }

    let username = (req.body.username || "").trim().toLowerCase();
    if (!username) {
      const base = generateUsernameBase(fullName);
      username = base;
      let suffix = 0;
      while (await User.findOne({ username })) {
        suffix += 1;
        username = `${base}${suffix}`;
      }
    } else if (await User.findOne({ username })) {
      return res.status(409).json({ success: false, message: "Tên đăng nhập đã tồn tại" });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(409).json({ success: false, message: "Email đã được sử dụng" });
    }

    const user = await User.create({
      fullName,
      username,
      email: email || undefined,
      password,
      phone: phone || undefined,
      role,
      grade: role === "Student" ? grade : undefined,
      isActive: true,
      status: "active",
    });
    await user.populate("grade", "name");
    res.status(201).json({ success: true, data: toAccountView(user) });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });

    const fullName = (req.body.fullName || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    if (!fullName) return res.status(400).json({ success: false, message: "Vui lòng nhập họ và tên" });
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Email không đúng định dạng" });
    }
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(409).json({ success: false, message: "Email đã được sử dụng" });
    }

    user.fullName = fullName;
    if (email) user.email = email;
    user.phone = (req.body.phone || "").trim() || undefined;
    if (req.body.role === "Admin" || req.body.role === "Student") user.role = req.body.role;
    user.grade = user.role === "Student" ? req.body.grade || undefined : undefined;
    await user.save();
    await user.populate("grade", "name");
    res.json({ success: true, data: toAccountView(user) });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!["active", "suspended", "disabled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }
    if (String(req.params.id) === String(req.user._id) && status !== "active") {
      return res.status(400).json({ success: false, message: "Không thể tự khóa tài khoản của chính mình" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { returnDocument: "after" }).populate(
      "grade",
      "name"
    );
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    res.json({ success: true, data: toAccountView(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStudents, list, getOne, create, update, updateStatus };
