const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Grade = require("../models/Grade");
const VerificationCode = require("../models/VerificationCode");
const { generateAccessToken, generateRefreshToken, setRefreshCookie } = require("../utils/tokens");
const { sendMailIfConfigured, buildOtpEmailHtml } = require("../services/emailService");
const { sendSms, buildOtpSmsText } = require("../services/smsService");
const { normalizePhone, looksLikePhone, maskPhone } = require("../utils/phone");
const { permissionsOf } = require("../utils/rbac");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    phoneVerified: !!user.phoneVerified,
    dateOfBirth: user.dateOfBirth,
    role: user.role,
    permissions: permissionsOf(user),
    grade: user.grade,
    points: user.points || 0,
    equippedFrame: user.equippedFrame || "",
    equippedTitle: user.equippedTitle || "",
    nameColor: user.nameColor || "",
    vipUntil: user.vipUntil || null,
    dailyGoal: user.dailyGoal || 3,
    onboarded: !!user.onboarded,
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
  const conditions = [{ username: value }, { email: value }];
  // Số điện thoại chỉ dùng để đăng nhập/lấy lại mật khẩu khi đã được xác thực OTP.
  const phone = looksLikePhone(value) ? normalizePhone(value) : null;
  if (phone) conditions.push({ phone, phoneVerified: true });
  return User.findOne({ $or: conditions });
}

// Mã hợp lệ = còn hạn, chưa dùng, chưa bị nhập sai quá MAX_OTP_ATTEMPTS lần.
async function findValidCode(userId, code, type) {
  const record = await VerificationCode.findOne({
    user: userId,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  if (!record || record.attempts >= MAX_OTP_ATTEMPTS) return null;
  if (record.codeHash !== hashCode(asTrimmedString(String(code ?? "")))) {
    record.attempts += 1;
    await record.save();
    return null;
  }
  return record;
}

// Chặn gửi lại mã liên tục (tốn tiền SMS, spam hộp thư). Trả về số giây còn phải chờ, 0 nếu được gửi.
async function resendWaitSeconds(userId, type) {
  const last = await VerificationCode.findOne({ user: userId, type }).sort({ createdAt: -1 });
  if (!last) return 0;
  const left = last.createdAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

// Tạo mã mới (xoá mã cũ cùng loại) và gửi qua kênh "email" hoặc "phone".
// Trả về { delivered, devCode? } — devCode chỉ có khi SMS_PROVIDER=console và không phải production.
async function issueOtp(user, type, channel, { subject, heading, target }) {
  const code = String(crypto.randomInt(100000, 999999));
  await VerificationCode.deleteMany({ user: user._id, type });
  await VerificationCode.create({
    user: user._id,
    type,
    channel,
    target,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
  });

  if (channel === "phone") {
    const result = await sendSms({
      to: target || user.phone,
      text: buildOtpSmsText(code),
    });
    const devCode = result.provider === "console" && process.env.NODE_ENV !== "production" ? code : undefined;
    return { delivered: result.sent, devCode };
  }

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
  return { delivered: true };
}

function maskTarget(user, channel) {
  return channel === "phone" ? maskPhone(user.phone) : maskEmail(user.email);
}

const SEND_FAILED = { success: false, message: "Không gửi được mã xác nhận, vui lòng thử lại sau ít phút" };

// Xoá tài khoản đăng ký dở (chưa xác thực OTP, chưa từng đăng nhập) đang giữ tên/email/SĐT, để người đó đăng ký lại được.
async function purgeStalePending({ username, email, phone }) {
  const conditions = [{ username }];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });
  const candidates = await User.find({ $or: conditions, isActive: false, lastLoginAt: { $exists: false }, googleId: { $exists: false } }).select("_id");
  for (const candidate of candidates) {
    await VerificationCode.deleteMany({ user: candidate._id });
    await User.deleteOne({ _id: candidate._id });
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
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";
    const emailInput = asTrimmedString(req.body.email).toLowerCase();
    const phoneInput = asTrimmedString(req.body.phone);
    const grade = asTrimmedString(req.body.grade);
    let username = asTrimmedString(req.body.username).toLowerCase();

    if (!fullName || !password) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }
    if (!emailInput && !phoneInput) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập số điện thoại hoặc email" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Xác nhận mật khẩu không khớp" });
    }

    // Mỗi tài khoản xác thực qua đúng 1 kênh: có số điện thoại thì dùng SĐT, nếu không thì dùng email.
    const phone = phoneInput ? normalizePhone(phoneInput) : null;
    if (phoneInput && !phone) {
      return res.status(400).json({ success: false, message: "Số điện thoại không đúng định dạng" });
    }
    const email = phone ? "" : emailInput;
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Email không đúng định dạng" });
    }
    const channel = phone ? "phone" : "email";

    await purgeStalePending({ username, email, phone });
    if (username) {
      if (await User.findOne({ username })) {
        return res.status(409).json({ success: false, message: "Tên đăng nhập đã tồn tại" });
      }
    } else {
      username = await generateUniqueUsername(email ? email.split("@")[0] : fullName);
    }
    if (email && (await User.findOne({ email }))) {
      return res.status(409).json({ success: false, message: "Email đã được sử dụng" });
    }
    if (phone && (await User.findOne({ phone, phoneVerified: true }))) {
      return res.status(409).json({ success: false, message: "Số điện thoại đã được sử dụng" });
    }

    const user = await User.create({
      fullName,
      username,
      password,
      email: email || undefined,
      phone: phone || undefined,
      phoneVerified: false,
      grade: grade || undefined,
      isActive: false,
    });

    const otp = await issueOtp(user, "register-verify", channel, {
      subject: "Mã xác nhận đăng ký ViToan",
      heading: "Mã xác nhận hoàn tất đăng ký tài khoản ViToan của bạn là:",
    });
    if (!otp.delivered) {
      await VerificationCode.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
      return res.status(502).json(SEND_FAILED);
    }

    res.status(201).json({
      success: true,
      data: { username: user.username, channel, maskedTarget: maskTarget(user, channel), devCode: otp.devCode },
      message: `Mã xác nhận đã được gửi tới ${channel === "phone" ? "số điện thoại" : "hộp thư"}, vui lòng nhập mã để hoàn tất đăng ký.`,
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
    const record = user && !user.isActive && (await findValidCode(user._id, code, "register-verify"));
    if (!user || !record) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn" });
    }

    user.isActive = true;
    if (record.channel === "phone") user.phoneVerified = true;
    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Số điện thoại đã được sử dụng" });
      }
      throw err;
    }
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

async function resendRegisterCode(req, res, next) {
  try {
    const username = asTrimmedString(req.body.username).toLowerCase();
    const user = username ? await User.findOne({ username }) : null;
    if (!user || user.isActive) {
      return res.status(400).json({ success: false, message: "Không tìm thấy đăng ký đang chờ xác nhận" });
    }
    const wait = await resendWaitSeconds(user._id, "register-verify");
    if (wait > 0) {
      return res.status(429).json({ success: false, message: `Vui lòng chờ ${wait} giây rồi gửi lại mã` });
    }
    const channel = user.phone && !user.email ? "phone" : "email";
    const otp = await issueOtp(user, "register-verify", channel, {
      subject: "Mã xác nhận đăng ký ViToan",
      heading: "Mã xác nhận hoàn tất đăng ký tài khoản ViToan của bạn là:",
    });
    if (!otp.delivered) return res.status(502).json(SEND_FAILED);
    res.json({ success: true, data: { channel, maskedTarget: maskTarget(user, channel), devCode: otp.devCode } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const identifier = asTrimmedString(req.body.username);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập số điện thoại, email hoặc tên đăng nhập và mật khẩu" });
    }

    const user = await findUserByIdentifier(identifier).select("+password").populate("grade");
    if (user && user.lockUntil && user.lockUntil > new Date()) {
      const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res
        .status(429)
        .json({ success: false, message: `Nhập sai mật khẩu quá nhiều lần, vui lòng thử lại sau ${minutes} phút` });
    }
    if (!user || !(await user.matchPassword(password))) {
      if (user) {
        const fails = (user.failedLoginCount || 0) + 1;
        const lock = fails >= MAX_LOGIN_FAILS;
        await User.updateOne(
          { _id: user._id },
          { $set: { failedLoginCount: lock ? 0 : fails, ...(lock ? { lockUntil: new Date(Date.now() + LOGIN_LOCK_MS) } : {}) } }
        );
      }
      return res.status(401).json({ success: false, message: "Sai thông tin đăng nhập hoặc mật khẩu" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Tài khoản chưa xác thực, vui lòng đăng ký lại để nhận mã mới" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Tài khoản đang bị tạm khóa, vui lòng liên hệ quản trị viên" });
    }
    if (user.status === "disabled") {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }
    user.lastLoginAt = new Date();
    user.failedLoginCount = 0;
    user.lockUntil = undefined;
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
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        changed = true;
      }
      // Ảnh Gmail: dùng khi em chưa tự chọn ảnh/cú khác; đăng nhập lần sau thì cập nhật nếu Google đổi ảnh.
      const usingGoogleOrNone = !user.avatarUrl || /googleusercontent\.com/.test(user.avatarUrl);
      if (payload.picture && usingGoogleOrNone && user.avatarUrl !== payload.picture) {
        user.avatarUrl = payload.picture;
        changed = true;
      }
      if (changed) await user.save();
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
      return res.status(400).json({ success: false, message: "Vui lòng nhập số điện thoại, email hoặc tên đăng nhập" });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản này trong hệ thống" });
    }
    const hasPhone = !!(user.phone && user.phoneVerified);
    let channel = null;
    if (hasPhone && looksLikePhone(identifier)) channel = "phone";
    else if (user.email) channel = "email";
    else if (hasPhone) channel = "phone";
    if (!channel) {
      return res
        .status(400)
        .json({ success: false, message: "Tài khoản này chưa có email hoặc số điện thoại đã xác thực để lấy lại mật khẩu" });
    }

    const wait = await resendWaitSeconds(user._id, "password-reset");
    if (wait > 0) {
      return res.status(429).json({ success: false, message: `Vui lòng chờ ${wait} giây rồi gửi lại mã` });
    }
    const otp = await issueOtp(user, "password-reset", channel, {
      subject: "Mã đặt lại mật khẩu ViToan",
      heading: "Mã xác nhận đặt lại mật khẩu ViToan của bạn là:",
    });
    if (!otp.delivered) return res.status(502).json(SEND_FAILED);

    res.json({
      success: true,
      data: { channel, maskedTarget: maskTarget(user, channel), devCode: otp.devCode },
      message: "Mã xác nhận đã được gửi.",
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

// Thêm/đổi số điện thoại trong hồ sơ: gửi mã tới số mới, nhập đúng mã mới lưu và coi là đã xác thực.
async function sendPhoneCode(req, res, next) {
  try {
    const phone = normalizePhone(asTrimmedString(req.body.phone));
    if (!phone) {
      return res.status(400).json({ success: false, message: "Số điện thoại không đúng định dạng" });
    }
    if (req.user.phone === phone && req.user.phoneVerified) {
      return res.status(400).json({ success: false, message: "Số điện thoại này đã được xác thực rồi" });
    }
    if (await User.findOne({ phone, phoneVerified: true, _id: { $ne: req.user._id } })) {
      return res.status(409).json({ success: false, message: "Số điện thoại đã được sử dụng" });
    }
    const wait = await resendWaitSeconds(req.user._id, "phone-verify");
    if (wait > 0) {
      return res.status(429).json({ success: false, message: `Vui lòng chờ ${wait} giây rồi gửi lại mã` });
    }
    const otp = await issueOtp(req.user, "phone-verify", "phone", { target: phone });
    if (!otp.delivered) return res.status(502).json(SEND_FAILED);
    res.json({ success: true, data: { maskedTarget: maskPhone(phone), devCode: otp.devCode } });
  } catch (err) {
    next(err);
  }
}

async function verifyPhoneCode(req, res, next) {
  try {
    const code = req.body.code;
    const record = code ? await findValidCode(req.user._id, code, "phone-verify") : null;
    if (!record || !record.target) {
      return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn" });
    }
    req.user.phone = record.target;
    req.user.phoneVerified = true;
    try {
      await req.user.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Số điện thoại đã được sử dụng" });
      }
      throw err;
    }
    record.isUsed = true;
    await record.save();
    await req.user.populate("grade");
    res.json({ success: true, data: { user: toPublicUser(req.user) }, message: "Đã xác thực số điện thoại" });
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
    const target = await Grade.findById(grade).select("isPublished");
    if (!target || target.isPublished === false) {
      return res.status(400).json({ success: false, message: "Lớp này chưa mở, em chọn lớp khác nhé" });
    }
    req.user.grade = grade;
    await req.user.save();
    await req.user.populate("grade");
    res.json({ success: true, data: { user: toPublicUser(req.user) } });
  } catch (err) {
    next(err);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const { dailyGoal, onboarded } = req.body;
    if (dailyGoal !== undefined) {
      const g = Number(dailyGoal);
      if (!Number.isInteger(g) || g < 1 || g > 10) return res.status(400).json({ success: false, message: "Mục tiêu mỗi ngày từ 1 đến 10 bài" });
      req.user.dailyGoal = g;
    }
    if (onboarded !== undefined) req.user.onboarded = !!onboarded;
    // Chọn cú đại diện: "owl:0".."owl:7"; chuỗi rỗng = quay về cú tự gán theo tài khoản.
    if (req.body.avatarUrl !== undefined) {
      const a = String(req.body.avatarUrl);
      if (a !== "" && !/^owl:[0-7]$/.test(a)) return res.status(400).json({ success: false, message: "Kiểu cú không hợp lệ" });
      req.user.avatarUrl = a || undefined;
    }
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
    const phoneInput = asTrimmedString(req.body.phone);
    const dateOfBirth = asTrimmedString(req.body.dateOfBirth);
    const avatarUrl = asTrimmedString(req.body.avatarUrl);

    if (!fullName) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập họ và tên" });
    }
    const phone = phoneInput ? normalizePhone(phoneInput) : null;
    if (phoneInput && !phone) {
      return res.status(400).json({ success: false, message: "Số điện thoại không đúng định dạng" });
    }
    if (phone && phone !== req.user.phone && (await User.findOne({ phone, phoneVerified: true, _id: { $ne: req.user._id } }))) {
      return res.status(409).json({ success: false, message: "Số điện thoại đã được sử dụng" });
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
    // Đổi số trong hồ sơ chưa qua OTP nên chưa được dùng để đăng nhập/lấy lại mật khẩu.
    if ((phone || undefined) !== req.user.phone) req.user.phoneVerified = false;
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
  resendRegisterCode,
  login,
  googleAuth,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  sendPhoneCode,
  verifyPhoneCode,
  setGrade,
  updateProfile,
  updatePreferences,
  uploadAvatar,
  changePassword,
  refresh,
  logout,
  me,
};
