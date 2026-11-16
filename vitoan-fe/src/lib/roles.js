// RBAC phân cấp (khớp vitoan-be/utils/rbac.js). Quyền thật sự do backend kiểm tra; ở đây chỉ để ẩn/hiện giao diện.
export const ROLE_LABEL = { Student: "Học sinh", Manager: "Quản lý", Admin: "Quản trị viên" };
export const ROLE_BADGE = {
  Manager: "bg-sky-100 text-sky-700",
  Admin: "bg-violet-100 text-violet-700",
};
export const STAFF_ROLES = ["Manager", "Admin"];

export const isStaff = (user) => !!user && STAFF_ROLES.includes(user.role);
// Quyền đã kế thừa theo cấp do backend trả về trong user.permissions (vd. "system.backup", "staff.manage").
export const can = (user, permission) => !!user?.permissions?.includes(permission);

// Mô tả quyền từng vai trò để hiện trong form tài khoản (khớp ROLE_PERMISSIONS ở backend).
export const ROLE_INFO = {
  Student: {
    can: ["Học, làm bài luyện tập, bài kiểm tra, đấu trường, đổi quà"],
    cannot: ["Vào khu quản trị"],
  },
  Manager: {
    can: [
      "Soạn bài học, chủ đề, câu hỏi, luyện tập, kiểm tra, tin tức, huy hiệu, nhiệm vụ, quà",
      "Xem thống kê, báo cáo lớp và học sinh",
      "Tạo, sửa, khoá học sinh; đặt lại mật khẩu học sinh",
      "Kiểm duyệt bình luận, duyệt đổi quà, gửi thông báo chung",
    ],
    cannot: ["Tạo hay sửa Quản lý / Quản trị viên", "Sao lưu và khôi phục dữ liệu"],
  },
  Admin: {
    can: ["Mọi quyền của Quản lý", "Tạo, sửa, khoá Quản lý và Quản trị viên khác", "Sao lưu và khôi phục dữ liệu"],
    cannot: [],
  },
};
