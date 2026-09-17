const jwt = require("jsonwebtoken");
const User = require("../models/User");

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;
  return null;
}

async function protect(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("grade");
    if (!user || !user.isActive || user.status !== "active") {
      return res.status(401).json({ success: false, message: "Tài khoản không hợp lệ" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Phiên đăng nhập hết hạn" });
  }
}

async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // invalid/expired token: treat as guest instead of failing the request
  }
  next();
}

function authorize(...roles) {
  const allowed = roles.map((r) => r.toLowerCase());
  return (req, res, next) => {
    if (!req.user || !allowed.includes(String(req.user.role).toLowerCase())) {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
    }
    next();
  };
}

module.exports = { protect, optionalAuth, authorize };
