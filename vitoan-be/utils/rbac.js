// RBAC phân cấp (Hierarchical RBAC).
// - Mỗi vai trò có một cấp (level); cấp cao KẾ THỪA mọi quyền của cấp thấp hơn.
// - Chỉ được tạo / sửa / khoá / đặt lại mật khẩu tài khoản có cấp THẤP HƠN mình
//   (riêng cấp cao nhất được quản lý cả các tài khoản cùng cấp để còn có người sửa được Admin).
// Muốn thêm vai trò mới (vd. "Teacher") chỉ cần thêm vào ROLES + (nếu cần) ROLE_PERMISSIONS.

const ROLES = {
  Student: { level: 0, label: "Học sinh" },
  Manager: { level: 50, label: "Quản lý" },
  Admin: { level: 100, label: "Quản trị viên" },
};

// Quyền được cấp trực tiếp cho từng vai trò. Vai trò cấp cao tự động có thêm quyền của các cấp dưới.
const ROLE_PERMISSIONS = {
  Student: [],
  Manager: [
    "content.manage", // bài học, chủ đề, câu hỏi, luyện tập, kiểm tra, tin tức, huy hiệu, nhiệm vụ, quà
    "students.manage", // xem/sửa/khoá học sinh, tick bài đã học
    "reports.view", // thống kê, báo cáo lớp
    "community.moderate", // bình luận, đổi quà, thông báo, đấu trường
  ],
  Admin: [
    "staff.manage", // tạo và quản lý Quản lý / Admin khác
    "system.backup", // sao lưu / khôi phục dữ liệu
  ],
};

const ROLE_NAMES = Object.keys(ROLES);
const TOP_LEVEL = Math.max(...ROLE_NAMES.map((r) => ROLES[r].level));

function roleOf(userOrRole) {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  return ROLES[role] ? role : null;
}

function levelOf(userOrRole) {
  const role = roleOf(userOrRole);
  return role ? ROLES[role].level : -1;
}

// Có phải nhân sự quản trị (Quản lý trở lên) không.
function isStaff(userOrRole) {
  return levelOf(userOrRole) >= ROLES.Manager.level;
}

// Vai trò `userOrRole` có cấp >= cấp của `minRole` không.
function atLeast(userOrRole, minRole) {
  return levelOf(userOrRole) >= levelOf(minRole);
}

// Toàn bộ quyền (đã kế thừa) của một vai trò.
function permissionsOf(userOrRole) {
  const level = levelOf(userOrRole);
  const set = new Set();
  for (const name of ROLE_NAMES) {
    if (ROLES[name].level <= level) (ROLE_PERMISSIONS[name] || []).forEach((p) => set.add(p));
  }
  return [...set];
}

function can(userOrRole, permission) {
  return permissionsOf(userOrRole).includes(permission);
}

// actor có được GÁN vai trò `role` cho người khác không.
function canAssign(actor, role) {
  if (!ROLES[role]) return false;
  const a = levelOf(actor);
  if (a < ROLES.Manager.level) return false;
  return ROLES[role].level < a || (a === TOP_LEVEL && ROLES[role].level === TOP_LEVEL);
}

// Các vai trò actor được phép gán (dùng cho form tạo tài khoản).
function assignableRoles(actor) {
  return ROLE_NAMES.filter((r) => canAssign(actor, r));
}

// actor có được quản lý (xem/sửa/khoá) tài khoản `target` không. Tự quản lý hồ sơ của mình xử lý riêng.
function canManage(actor, target) {
  const t = levelOf(target);
  if (t < 0) return false;
  return canAssign(actor, roleOf(target));
}

module.exports = {
  ROLES,
  ROLE_NAMES,
  roleOf,
  levelOf,
  isStaff,
  atLeast,
  permissionsOf,
  can,
  canAssign,
  assignableRoles,
  canManage,
};
