const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const VerificationCode = require("../models/VerificationCode");
const { generateAccessToken, generateRefreshToken, setRefreshCookie } = require("../utils/tokens");
const { sendMailIfConfigured, buildOtpEmailHtml } = require("../services/emailService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    role: user.role,
    grade: user.grade,
  };
}

async function generateUniqueUsername(base) {
  const cleaned = (base || "hocsinh")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "hocsinh";
  let candidate = cleaned;
  let suffix = 0;
  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${cleaned}${suffix}`;
  }
  return candidate;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function findUserByIdentifier(identifier) {
  const value = asTrimmedString(identifier).toLowerCase();
  if (!value) return null;
  return User.findOne({ $or: [{ username: value }, { email: value }] });
}

async function findValidCode(userId, code, type) {
  const record = await VerificationCode.findOne({
    user: userId,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!record || record.codeHash !== hashCode(code)) return null;
  return record;
}

async function sendOtpEmail(user, code, { subject, heading }) {
  const result = await sendMailIfConfigured({
    to: user.email,
    subject,
    text: `${heading}\n\nMã xác nhận của bạn là: ${code}\n\nMã có hiệu lực trong 15 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: buildOtpEmailHtml({ heading, code }),
  });
  if (!result.sent && !result.skipped) {
    console.error("[authController] Gửi email thất bại:", result.error);
  }
  if (result.skipped) {
    console.info(`[authController] SMTP chưa cấu hình — mã OTP cho ${user.email}: ${code}`);
  }
}

function maskEmail(email) {
  const [name, domain] = String(email).split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

async function register(req, res, next) {
  try {
    const fullName = asTrimmedString(req.body.fullName);
    const username = asTrimmedString(req.body.username).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";
    const email = asTrimmedString(req.body.email).toLowerCase();
    const grade = asTrimmedString(req.body.grade);

    if (!fullName || !username || !password || !email) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Xác nhận mật khẩu không khớp" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Email không đúng định dạng" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: "Tên đăng nhập đã tồn tại" });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email đã được sử dụng" });
    }

    const user = await User.create({
      fullName,
      username,
      password,
      email,
      grade: grade || undefined,
      isActive: false,
    });

    const code = String(crypto.randomInt(100000, 999999));
    await VerificationCode.create({
      user: user._id,
      type: "register-verify",
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
    });
    await sendOtpEmail(user, code, {
      subject: "Mã xác nhận đăng ký ViToan",
      heading: "Mã xác nhận hoàn tất đăng ký tài khoản ViToan của bạn là:",
    });

    res.status(201).json({
      success: true,
      data: { username: user.username, maskedEmail: maskEmail(user.email) },
      message: "Mã xác nhận đã được gửi tới hộp thư, vui lòng nhập mã để hoàn tất đăng ký.",
    });
  } catch (err) {
    next(err);
  }
}

async function verifyRegisterCode(req, res, next) {
  try {
    const username = asTrimmedString(req.body.username).toLowerCase();
    const { code } = req.body;
    if (!username || !code) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const user = await User.findOne({ username });
    const record = user && (await findValidCode(user._id, code, "register-verify"));
    if (!user || !record) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn" });
    }

    user.isActive = true;
    await user.save();
    await user.populate("grade");
    record.isUsed = true;
    await record.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user: toPublicUser(user), accessToken } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const identifier = asTrimmedString(req.body.username);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên đăng nhập hoặc email và mật khẩu" });
    }

    const user = await findUserByIdentifier(identifier).select("+password").populate("grade");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Sai tên đăng nhập/email hoặc mật khẩu" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Tài khoản chưa xác thực, vui lòng kiểm tra email" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Tài khoản đang bị tạm khóa, vui lòng liên hệ quản trị viên" });
    }
    if (user.status === "disabled") {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }
    user.lastLoginAt = new Date();
    await user.save();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user: toPublicUser(user), accessToken } });
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Thiếu Google credential" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, message: "Server chưa cấu hình đăng nhập Google" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ success: false, message: "Không lấy được thông tin tài khoản Google" });
    }

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (!user) {
      const username = await generateUniqueUsername(payload.email.split("@")[0]);
      user = await User.create({
        fullName: payload.name || username,
        username,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
        role: "Student",
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.avatarUrl) user.avatarUrl = payload.picture;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa" });
    }
    await user.populate("grade");

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user: toPublicUser(user), accessToken } });
  } catch (err) {
    if (err.message && err.message.includes("Token used too late")) {
      return res.status(401).json({ success: false, message: "Phiên đăng nhập Google đã hết hạn, thử lại" });
    }
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const identifier = asTrimmedString(req.body.identifier) || asTrimmedString(req.body.email);
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên đăng nhập hoặc email" });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản này trong hệ thống" });
    }
    if (!user.email) {
      return res
        .status(400)
        .json({ success: false, message: "Tài khoản này chưa liên kết email, không thể lấy lại mật khẩu qua email" });
    }

    const code = String(crypto.randomInt(100000, 999999));
    await VerificationCode.deleteMany({ user: user._id, type: "password-reset" });
    await VerificationCode.create({
      user: user._id,
      type: "password-reset",
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
    });

    await sendOtpEmail(user, code, {
      subject: "Mã đặt lại mật khẩu ViToan",
      heading: "Mã xác nhận đặt lại mật khẩu ViToan của bạn là:",
    });

    res.json({
      success: true,
      data: { maskedEmail: maskEmail(user.email) },
      message: "Mã xác nhận đã được gửi tới hộp thư.",
    });
  } catch (err) {
    next(err);
  }
}

async function verifyResetCode(req, res, next) {
  try {
    const identifier = asTrimmedString(req.body.identifier) || asTrimmedString(req.body.email);
    const { code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const user = await findUserByIdentifier(identifier);
    const record = user && (await findValidCode(user._id, code, "password-reset"));
    if (!record) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn" });
    }

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const identifier = asTrimmedString(req.body.identifier) || asTrimmedString(req.body.email);
    const { code, newPassword, confirmNewPassword } = req.body;
    if (!identifier || !code || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Xác nhận mật khẩu không khớp" });
    }

    const user = await findUserByIdentifier(identifier);
    const record = user && (await findValidCode(user._id, code, "password-reset"));
    if (!record) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn" });
    }

    user.password = newPassword;
    await user.save();
    record.isUsed = true;
    await record.save();

    res.json({ success: true, data: null, message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
}

async function setGrade(req, res, next) {
  try {
    const { grade } = req.body;
    if (!grade) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn lớp" });
    }
    req.user.grade = grade;
    await req.user.save();
    await req.user.populate("grade");
    res.json({ success: true, data: { user: toPublicUser(req.user) } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const fullName = asTrimmedString(req.body.fullName);
    const email = asTrimmedString(req.body.email).toLowerCase();
    const phone = asTrimmedString(req.body.phone);
    const dateOfBirth = asTrimmedString(req.body.dateOfBirth);
    const avatarUrl = asTrimmedString(req.body.avatarUrl);

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập họ và tên" });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Email không đúng định dạng" });
    }
    if (email && email !== req.user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: "Email đã được sử dụng" });
      }
    }

    req.user.fullName = fullName;
    if (email) req.user.email = email;
    req.user.phone = phone || undefined;
    req.user.dateOfBirth = dateOfBirth || undefined;
    if (avatarUrl) req.user.avatarUrl = avatarUrl;
    await req.user.save();

    res.json({ success: true, data: { user: toPublicUser(req.user) }, message: "Cập nhật thông tin thành công" });
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh" });
    }
    req.user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await req.user.save();
    res.json({ success: true, data: { user: toPublicUser(req.user) } });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "Xác nhận mật khẩu mới không khớp" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user.password || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, data: null, message: "Cập nhật mật khẩu thành công" });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "Không có refresh token" });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "Tài khoản không hợp lệ" });
    const accessToken = generateAccessToken(user);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: "Refresh token hết hạn" });
  }
}

async function logout(req, res) {
  res.clearCookie("refreshToken");
  res.json({ success: true, data: null });
}

async function me(req, res) {
  res.json({ success: true, data: { user: toPublicUser(req.user) } });
}

module.exports = {
  register,
  verifyRegisterCode,
  login,
  googleAuth,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  setGrade,
  updateProfile,
  uploadAvatar,
  changePassword,
  refresh,
  logout,
  me,
};
