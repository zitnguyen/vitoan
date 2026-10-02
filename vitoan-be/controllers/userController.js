const User = require("../models/User");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");
const Lesson = require("../models/Lesson");
const Grade = require("../models/Grade");

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
    points: user.points || 0,
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
      filter.$or = [{ fullName: regex }, { email: regex }, { username: regex }, { phone: regex }];
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
    if (req.body.role === "Admin" || req.body.role === "Student") {
      if (String(user._id) === String(req.user._id) && req.body.role !== "Admin") {
        return res.status(400).json({ success: false, message: "Không thể tự bỏ quyền quản trị của chính mình" });
      }
      user.role = req.body.role;
    }
    // Admin đặt lại mật khẩu cho tài khoản (để trống = giữ nguyên).
    const newPassword = req.body.password || "";
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      }
      user.password = newPassword;
    }
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

// Tính điểm học tập của học sinh 1 lớp. semester = 1/2, hoặc null = cả năm.
async function computeGradeScores(gradeId, semester) {
  const students = await User.find({ grade: gradeId, role: "Student", isActive: true }).select(
    "fullName username avatarUrl equippedFrame equippedTitle nameColor vipUntil"
  );
  const studentIds = students.map((s) => s._id);

  const attempts = await Attempt.find({ student: { $in: studentIds } })
    .select("student score lesson practiceSet")
    .populate({ path: "lesson", select: "chapter", populate: { path: "chapter", select: "semester" } });

  // Điểm học tập = tổng số câu đúng của LẦN LÀM TỐT NHẤT ở mỗi bộ luyện tập trong học kỳ.
  // Làm lại cùng 1 bộ chỉ được tính khi làm tốt hơn, tránh "cày" điểm bằng cách làm đi làm lại.
  const bestBySet = new Map(); // "studentId|setId" -> điểm cao nhất
  for (const a of attempts) {
    const sem = a.lesson?.chapter?.semester || 1;
    if (semester && sem !== semester) continue;
    const key = `${a.student}|${a.practiceSet || `lesson:${a.lesson?._id}`}`;
    bestBySet.set(key, Math.max(bestBySet.get(key) || 0, a.score));
  }
  const scoreByStudent = new Map();
  const setsByStudent = new Map();
  for (const [key, best] of bestBySet) {
    const sid = key.split("|")[0];
    scoreByStudent.set(sid, (scoreByStudent.get(sid) || 0) + best);
    setsByStudent.set(sid, (setsByStudent.get(sid) || 0) + 1);
  }
  return { students, scoreByStudent, setsByStudent };
}

// Đánh số hạng: bằng điểm thì cùng hạng (1, 2, 2, 4...).
function assignRanks(rows) {
  rows.forEach((r, i) => {
    r.rank = i > 0 && r.score === rows[i - 1].score ? rows[i - 1].rank : i + 1;
  });
  return rows;
}

async function leaderboard(req, res, next) {
  try {
    const gradeId = req.user.grade;
    const semester = Number(req.query.semester) || 1;
    if (!gradeId) return res.json({ success: true, data: [] });

    const { students, scoreByStudent, setsByStudent } = await computeGradeScores(gradeId, semester);

    const rankings = students
      .map((s) => ({
        _id: s._id,
        fullName: s.fullName,
        username: s.username,
        avatarUrl: s.avatarUrl,
        equippedFrame: s.equippedFrame,
        equippedTitle: s.equippedTitle,
        nameColor: s.nameColor,
        vipUntil: s.vipUntil,
        score: scoreByStudent.get(String(s._id)) || 0,
        sets: setsByStudent.get(String(s._id)) || 0,
        isMe: String(s._id) === String(req.user._id),
      }))
      .sort((a, b) => b.score - a.score || a.fullName.localeCompare(b.fullName, "vi"));

    res.json({ success: true, data: assignRanks(rankings) });
  } catch (err) {
    next(err);
  }
}

// Tên hiển thị công khai: chỉ tên gọi + chữ cái đầu của họ ("Nguyễn Văn An" -> "An N.") để không lộ họ tên trẻ em.
function publicName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "Bạn nhỏ";
  return `${parts[parts.length - 1]} ${parts[0][0].toUpperCase()}.`;
}

// Bảng vinh danh trên trang chủ (không cần đăng nhập): top 10 cả năm của 1 lớp, chỉ học sinh đã có điểm.
async function publicLeaderboard(req, res, next) {
  try {
    const gradeId = req.query.grade;
    if (!gradeId || !/^[0-9a-f]{24}$/i.test(gradeId)) return res.json({ success: true, data: [] });
    const { students, scoreByStudent } = await computeGradeScores(gradeId, null);
    const rows = students
      // Không công khai ảnh do học sinh tự tải lên (có thể là ảnh thật của trẻ) — chỉ giữ avatar hoạt hình.
      .map((s) => ({
        name: publicName(s.fullName),
        avatarUrl: /^https:\/\/api\.dicebear\.com\//.test(s.avatarUrl || "") ? s.avatarUrl : "",
        score: scoreByStudent.get(String(s._id)) || 0,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "vi"))
      .slice(0, 10);
    res.json({ success: true, data: assignRanks(rows) });
  } catch (err) {
    next(err);
  }
}

// Số liệu thật cho trang chủ (không cần đăng nhập).
async function publicStats(req, res, next) {
  try {
    const [questions, lessons, grades, students, attempts] = await Promise.all([
      Question.countDocuments(),
      Lesson.countDocuments(),
      Grade.countDocuments(),
      User.countDocuments({ role: "Student", isActive: true }),
      Attempt.countDocuments(),
    ]);
    res.json({ success: true, data: { questions, lessons, grades, students, attempts } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listStudents, list, getOne, create, update, updateStatus, leaderboard, publicLeaderboard, publicStats };
