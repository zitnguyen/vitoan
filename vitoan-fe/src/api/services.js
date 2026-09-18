import axiosClient from "./axiosClient";

export const authService = {
  register: (payload) => axiosClient.post("/auth/register", payload),
  verifyRegisterCode: (payload) => axiosClient.post("/auth/verify-register", payload),
  forgotPassword: (identifier) => axiosClient.post("/auth/forgot-password", { identifier }),
  verifyResetCode: (payload) => axiosClient.post("/auth/verify-reset-code", payload),
  resetPassword: (payload) => axiosClient.post("/auth/reset-password", payload),
  setGrade: (grade) => axiosClient.post("/auth/grade", { grade }),
  updateProfile: (payload) => axiosClient.put("/auth/profile", payload),
  changePassword: (payload) => axiosClient.put("/auth/change-password", payload),
};

export const gradeService = {
  list: () => axiosClient.get("/grades"),
};

export const subjectService = {
  list: () => axiosClient.get("/subjects"),
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
  create: (payload) => axiosClient.post("/questions", payload),
  update: (id, payload) => axiosClient.put(`/questions/${id}`, payload),
  remove: (id) => axiosClient.delete(`/questions/${id}`),
};

export const userService = {
  listStudents: () => axiosClient.get("/users/students"),
  list: (params) => axiosClient.get("/users", { params }),
  getOne: (id) => axiosClient.get(`/users/${id}`),
  create: (payload) => axiosClient.post("/users", payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  updateStatus: (id, status) => axiosClient.put(`/users/${id}/status`, { status }),
  leaderboard: (semester) => axiosClient.get("/users/leaderboard", { params: { semester } }),
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
};

export const missionService = {
  list: () => axiosClient.get("/missions"),
  claim: (id) => axiosClient.post(`/missions/${id}/claim`),
};

export const rewardService = {
  list: () => axiosClient.get("/rewards"),
  myRedemptions: () => axiosClient.get("/rewards/me"),
  redeem: (id) => axiosClient.post(`/rewards/${id}/redeem`),
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
};

export const adminStatsService = {
  overview: () => axiosClient.get("/admin/stats"),
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
  myHistory: () => axiosClient.get("/test-attempts/me"),
  aiReview: (id) => axiosClient.post(`/test-attempts/${id}/ai-review`),
};
