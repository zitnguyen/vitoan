const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { atLeast, can } = require("../utils/rbac");

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

// RBAC phân cấp: authorize("Manager") cho Quản lý VÀ Admin (cấp cao kế thừa quyền cấp thấp),
// authorize("Admin") chỉ Admin. "Student" là vai trò riêng của học sinh nên chỉ khớp chính xác.
function authorize(...roles) {
  return (req, res, next) => {
    const ok =
      req.user &&
      roles.some((r) => (r === "Student" ? req.user.role === "Student" : atLeast(req.user, r)));
    if (!ok) return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
    next();
  };
}

// Chặn theo quyền cụ thể (đã kế thừa theo cấp), vd. requirePermission("system.backup").
function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user || !perms.every((p) => can(req.user, p))) {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
    }
    next();
  };
}

module.exports = { protect, optionalAuth, authorize, requirePermission };
