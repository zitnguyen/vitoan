import axiosClient from "./axiosClient";

export const authService = {
  register: (payload) => axiosClient.post("/auth/register", payload),
  verifyRegisterCode: (payload) => axiosClient.post("/auth/verify-register", payload),
  forgotPassword: (identifier) => axiosClient.post("/auth/forgot-password", { identifier }),
  verifyResetCode: (payload) => axiosClient.post("/auth/verify-reset-code", payload),
  resetPassword: (payload) => axiosClient.post("/auth/reset-password", payload),
  setGrade: (grade) => axiosClient.post("/auth/grade", { grade }),
  updateProfile: (payload) => axiosClient.put("/auth/profile", payload),
  updatePreferences: (payload) => axiosClient.put("/auth/preferences", payload),
  changePassword: (payload) => axiosClient.put("/auth/change-password", payload),
};

export const gradeService = {
  list: () => axiosClient.get("/grades"),
  create: (payload) => axiosClient.post("/grades", payload),
  update: (id, payload) => axiosClient.put(`/grades/${id}`, payload),
  remove: (id) => axiosClient.delete(`/grades/${id}`),
};

export const subjectService = {
  list: () => axiosClient.get("/subjects"),
  create: (payload) => axiosClient.post("/subjects", payload),
  update: (id, payload) => axiosClient.put(`/subjects/${id}`, payload),
  remove: (id) => axiosClient.delete(`/subjects/${id}`),
};

export const chapterService = {
  list: (params) => axiosClient.get("/chapters", { params }),
  create: (payload) => axiosClient.post("/chapters", payload),
  update: (id, payload) => axiosClient.put(`/chapters/${id}`, payload),
  remove: (id) => axiosClient.delete(`/chapters/${id}`),
};

export const lessonService = {
  list: (params) => axiosClient.get("/lessons", { params }),
  getOne: (id, params) => axiosClient.get(`/lessons/${id}`, { params }),
  create: (payload) => axiosClient.post("/lessons", payload),
  update: (id, payload) => axiosClient.put(`/lessons/${id}`, payload),
  remove: (id) => axiosClient.delete(`/lessons/${id}`),
  toggleLike: (id) => axiosClient.post(`/lessons/${id}/like`),
};

export const questionService = {
  list: (params) => axiosClient.get("/questions", { params }),
  listByLesson: (lessonId) => axiosClient.get(`/questions/lesson/${lessonId}`),
  checkAnswer: (id, payload) => axiosClient.post(`/questions/${id}/check`, payload),
  getHint: (id) => axiosClient.post(`/questions/${id}/hint`),
  aiGenerate: (payload) => axiosClient.post("/questions/ai-generate", payload),
  importMany: (questions) => axiosClient.post("/questions/import", { questions }, { timeout: 60000 }),
  create: (payload) => axiosClient.post("/questions", payload),
  update: (id, payload) => axiosClient.put(`/questions/${id}`, payload),
  remove: (id) => axiosClient.delete(`/questions/${id}`),
  tree: (params) => axiosClient.get("/questions/tree", { params }),
  bulk: (payload) => axiosClient.post("/questions/bulk", payload),
};

export const userService = {
  listStudents: () => axiosClient.get("/users/students"),
  list: (params) => axiosClient.get("/users", { params }),
  getOne: (id) => axiosClient.get(`/users/${id}`),
  create: (payload) => axiosClient.post("/users", payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  updateStatus: (id, status) => axiosClient.put(`/users/${id}/status`, { status }),
  leaderboard: (semester) => axiosClient.get("/users/leaderboard", { params: { semester } }),
  publicLeaderboard: (grade) => axiosClient.get("/users/leaderboard/public", { params: { grade } }),
  publicStats: () => axiosClient.get("/users/stats/public"),
};

export const reviewContentService = {
  list: (params) => axiosClient.get("/review-content", { params }),
  getByLesson: (lessonId) => axiosClient.get(`/review-content/lesson/${lessonId}`),
  aiGenerate: (payload) => axiosClient.post("/review-content/ai-generate", payload),
  create: (payload) => axiosClient.post("/review-content", payload),
  update: (id, payload) => axiosClient.put(`/review-content/${id}`, payload),
  remove: (id) => axiosClient.delete(`/review-content/${id}`),
};

export const badgeService = {
  list: () => axiosClient.get("/badges"),
  myBadges: () => axiosClient.get("/badges/me"),
  progress: () => axiosClient.get("/badges/progress"),
  create: (payload) => axiosClient.post("/badges", payload),
  update: (id, payload) => axiosClient.put(`/badges/${id}`, payload),
  remove: (id) => axiosClient.delete(`/badges/${id}`),
};

export const missionService = {
  list: () => axiosClient.get("/missions"),
  claim: (id) => axiosClient.post(`/missions/${id}/claim`),
  create: (payload) => axiosClient.post("/missions", payload),
  update: (id, payload) => axiosClient.put(`/missions/${id}`, payload),
  remove: (id) => axiosClient.delete(`/missions/${id}`),
};

export const checkinService = {
  status: () => axiosClient.get("/checkin"),
  checkIn: () => axiosClient.post("/checkin"),
};

export const rewardService = {
  list: () => axiosClient.get("/rewards"),
  myRedemptions: () => axiosClient.get("/rewards/me"),
  redeem: (id) => axiosClient.post(`/rewards/${id}/redeem`),
  inventory: () => axiosClient.get("/rewards/inventory"),
  equip: (type, rewardId) => axiosClient.post("/rewards/equip", { type, rewardId: rewardId || null }),
  create: (payload) => axiosClient.post("/rewards", payload),
  update: (id, payload) => axiosClient.put(`/rewards/${id}`, payload),
  remove: (id) => axiosClient.delete(`/rewards/${id}`),
};

export const chatService = {
  list: () => axiosClient.get("/conversations"),
  getOne: (id) => axiosClient.get(`/conversations/${id}`),
  send: (id, message) => axiosClient.post(id ? `/conversations/${id}/messages` : "/conversations", { message }),
  remove: (id) => axiosClient.delete(`/conversations/${id}`),
};

export const attemptService = {
  submit: (payload) => axiosClient.post("/attempts", payload),
  submitGuest: (payload) => axiosClient.post("/attempts/guest", payload),
  getOne: (id) => axiosClient.get(`/attempts/${id}`),
  myHistory: () => axiosClient.get("/attempts/me"),
  completedLessons: () => axiosClient.get("/attempts/completed-lessons"),
  lessonStatus: (chapter) => axiosClient.get("/attempts/lesson-status", { params: { chapter } }),
  stats: () => axiosClient.get("/attempts/stats"),
  weakKnowledge: (params) => axiosClient.get("/attempts/weak-knowledge", { params }),
  record: (params) => axiosClient.get("/attempts/record", { params }),
  getLearning: (lesson) => axiosClient.get("/attempts/learning", { params: { lesson } }),
  saveLearning: (payload) => axiosClient.put("/attempts/learning", payload),
  // Lưu khi trang sắp đóng (keepalive: request vẫn được gửi dù tab đã huỷ).
  saveLearningKeepalive: (payload) => {
    let token = null;
    try {
      token = JSON.parse(localStorage.getItem("vitoan_auth") || "null")?.accessToken;
    } catch {
      // bỏ qua
    }
    return fetch(`${import.meta.env.VITE_API_URL || "/api"}/attempts/learning`, {
      method: "PUT",
      keepalive: true,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    }).catch(() => {});
  },
  getProgress: (params) => axiosClient.get("/attempts/progress", { params }),
  saveProgress: (payload) => axiosClient.put("/attempts/progress", payload),
  clearProgress: (params) => axiosClient.delete("/attempts/progress", { params }),
  myProgressList: () => axiosClient.get("/attempts/progress/me"),
};

export const practiceSetService = {
  list: (params) => axiosClient.get("/practice-sets", { params }),
  listByLesson: (lessonId) => axiosClient.get(`/practice-sets/lesson/${lessonId}`),
  getOne: (id) => axiosClient.get(`/practice-sets/${id}`),
  create: (payload) => axiosClient.post("/practice-sets", payload),
  update: (id, payload) => axiosClient.put(`/practice-sets/${id}`, payload),
  remove: (id) => axiosClient.delete(`/practice-sets/${id}`),
};

export const testService = {
  list: (params) => axiosClient.get("/tests", { params }),
  getOne: (id) => axiosClient.get(`/tests/${id}`),
  create: (payload) => axiosClient.post("/tests", payload),
  update: (id, payload) => axiosClient.put(`/tests/${id}`, payload),
  remove: (id) => axiosClient.delete(`/tests/${id}`),
  duplicate: (id) => axiosClient.post(`/tests/${id}/duplicate`),
};

export const arenaService = {
  overview: (subject) => axiosClient.get("/arena/overview", { params: { subject } }),
  classmates: () => axiosClient.get("/arena/classmates"),
  startRun: (payload) => axiosClient.post("/arena/runs", payload),
  createChallenge: (payload) => axiosClient.post("/arena/challenges", payload),
  answer: (runId, payload) => axiosClient.post(`/arena/runs/${runId}/answer`, payload),
  fifty: (runId, question) => axiosClient.post(`/arena/runs/${runId}/fifty`, { question }),
  finish: (runId) => axiosClient.post(`/arena/runs/${runId}/finish`),
};

export const adminStatsService = {
  overview: () => axiosClient.get("/admin/stats"),
  report: (params) => axiosClient.get("/admin/report", { params }),
  studentReport: (id) => axiosClient.get(`/admin/report/student/${id}`),
  backup: () => axiosClient.get("/admin/backup"),
  restore: (payload) => axiosClient.post("/admin/restore", payload),
  lookup: (id) => axiosClient.get(`/admin/lookup/${encodeURIComponent(id)}`),
  catalog: () => axiosClient.get("/admin/catalog"),
  comments: (params) => axiosClient.get("/admin/comments", { params }),
  deleteComments: (ids) => axiosClient.post("/admin/comments/bulk-delete", { ids }),
  redemptions: (params) => axiosClient.get("/admin/redemptions", { params }),
  updateRedemption: (id, payload) => axiosClient.patch(`/admin/redemptions/${id}`, payload),
  broadcasts: () => axiosClient.get("/admin/broadcasts"),
  sendBroadcast: (payload) => axiosClient.post("/admin/broadcasts", payload),
  arena: () => axiosClient.get("/admin/arena"),
};

export const commentService = {
  listByLesson: (lessonId, params) => axiosClient.get(`/comments/lesson/${lessonId}`, { params }),
  create: (payload) => axiosClient.post("/comments", payload),
  toggleLike: (id) => axiosClient.post(`/comments/${id}/like`),
  remove: (id) => axiosClient.delete(`/comments/${id}`),
};

export const testAttemptService = {
  submit: (payload) => axiosClient.post("/test-attempts", payload),
  getOne: (id) => axiosClient.get(`/test-attempts/${id}`),
  myHistory: (params) => axiosClient.get("/test-attempts/me", { params }),
  aiReview: (id) => axiosClient.post(`/test-attempts/${id}/ai-review`),
};

export const articleService = {
  list: (params) => axiosClient.get("/articles", { params }),
  getOne: (id) => axiosClient.get(`/articles/${id}`),
  create: (payload) => axiosClient.post("/articles", payload),
  update: (id, payload) => axiosClient.put(`/articles/${id}`, payload),
  remove: (id) => axiosClient.delete(`/articles/${id}`),
  feeds: () => axiosClient.get("/articles/feeds"),
  previewFeed: (key) => axiosClient.get(`/articles/feeds/${key}`),
  importItems: (payload) => axiosClient.post("/articles/import", payload),
};

export const uploadService = {
  image: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return axiosClient.post("/uploads/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

export const reviewSessionService = {
  summary: () => axiosClient.get("/practice-review/summary"),
  session: () => axiosClient.post("/practice-review/session"),
  answer: (payload) => axiosClient.post("/practice-review/answer", payload),
};

export const notificationService = {
  list: () => axiosClient.get("/notifications"),
  markRead: (id) => axiosClient.post(`/notifications/${id}/read`),
  readAll: () => axiosClient.post("/notifications/read-all"),
};
