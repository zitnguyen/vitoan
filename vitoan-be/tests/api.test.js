// Bộ kiểm thử API tự động: chạy `npm test` khi backend đang chạy (mặc định http://localhost:9002).
// Phủ: quyền truy cập, chấm điểm chống gian lận, ràng buộc học-rồi-mới-kiểm-tra, đấu trường, ôn câu sai,
// thông báo, và các trang quản trị. Dùng tài khoản học sinh mô phỏng + một admin tạm (tự tạo, tự xoá).
//   TEST_API (mặc định http://localhost:9002/api), TEST_STUDENT, TEST_STUDENT2, TEST_PASSWORD
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
const mongoose = require("mongoose");
const User = require("../models/User");

const API = process.env.TEST_API || "http://localhost:9002/api";
const PASS = process.env.TEST_PASSWORD || "Hocsinh@123";
const STUDENT = process.env.TEST_STUDENT || "sim.minhan01";
const STUDENT2 = process.env.TEST_STUDENT2 || "sim.baochau02";
const ADMIN = { username: "qa_admin_tmp", password: "QaAdmin@12345" };

const call = async (method, url, token, body) => {
  const r = await fetch(API + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await r.json();
  } catch {
    // không phải JSON
  }
  return { status: r.status, body: json };
};
const login = async (username, password = PASS) => {
  const r = await call("POST", "/auth/login", null, { username, password });
  assert.equal(r.status, 200, `đăng nhập ${username} phải thành công`);
  return r.body.accessToken || r.body.data.accessToken;
};

let student;
let student2;
let admin;
let grade;
let subjects;

test.before(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteOne({ username: ADMIN.username });
  await User.create({ fullName: "QA Admin", username: ADMIN.username, password: ADMIN.password, role: "Admin", isTest: true });
  student = await login(STUDENT);
  student2 = await login(STUDENT2);
  admin = await login(ADMIN.username, ADMIN.password);
  grade = (await call("GET", "/grades")).body.data;
  subjects = (await call("GET", "/subjects")).body.data;
});

test.after(async () => {
  await User.deleteOne({ username: ADMIN.username });
  await mongoose.disconnect();
});

test("công khai: danh sách lớp chỉ có lớp đã mở", async () => {
  assert.ok(grade.length >= 1);
  assert.ok(grade.every((g) => g.isPublished !== false));
});

test("phân quyền: khách/học sinh không vào được trang quản trị", async () => {
  for (const url of ["/admin/stats", "/admin/report", "/admin/backup", "/questions/tree", "/questions"]) {
    assert.equal((await call("GET", url)).status, 401, `${url} cần đăng nhập`);
    assert.equal((await call("GET", url, student)).status, 403, `${url} cấm học sinh`);
  }
  assert.equal((await call("POST", "/questions/bulk", student, { ids: ["x"], action: "delete" })).status, 403);
});

test("phân quyền: quản trị không dùng được API của học sinh", async () => {
  assert.equal((await call("GET", "/arena/overview", admin)).status, 403);
  assert.equal((await call("GET", "/notifications", admin)).status, 403);
});

test("admin: tổng quan, báo cáo, cây danh mục, phân trang câu hỏi", async () => {
  const stats = await call("GET", "/admin/stats", admin);
  assert.equal(stats.status, 200);
  assert.ok(Array.isArray(stats.body.data.attention));
  const report = await call("GET", "/admin/report", admin);
  assert.equal(report.status, 200);
  assert.ok(report.body.data.students.every((s) => !("password" in s)));
  const tree = await call("GET", `/questions/tree?grade=${grade[0]._id}`, admin);
  assert.ok(tree.body.data.length >= 1 && tree.body.data[0].chapters.length >= 1);
  const q = await call("GET", "/questions?limit=5&page=1", admin);
  assert.ok(q.body.data.length <= 5 && q.body.total >= q.body.data.length && q.body.pages >= 1);
  const evil = await call("GET", "/questions?search=%28%5B%5C", admin); // ([\ — ký tự regex đặc biệt
  assert.equal(evil.status, 200, "tìm kiếm có ký tự đặc biệt không được gây lỗi 500");
});

test("admin: lỗi dữ liệu trả 400 kèm lý do, không phải 500", async () => {
  const r = await call("POST", "/missions", admin, { title: "x", type: "daily", goalType: "khong-co", goalValue: 0, rewardPoints: 1 });
  assert.equal(r.status, 400);
  assert.match(r.body.message, /không hợp lệ|Thiếu|quá nhỏ/);
  assert.equal((await call("GET", "/tests/not-an-id", student)).status, 400);
});

test("luyện tập: gửi lặp một câu nhiều lần chỉ tính một lần (chống cày điểm)", async () => {
  const toan = subjects.find((s) => s.slug === "toan") || subjects[0];
  const lessons = (await call("GET", `/lessons?grade=${grade[0]._id}&subject=${toan._id}`)).body.data;
  const lesson = lessons[0];
  const qs = (await call("GET", `/questions/lesson/${lesson._id}`, student)).body.data;
  const dup = Array.from({ length: 30 }, () => ({ question: qs[0]._id, selectedIndex: 0 }));
  const r = await call("POST", "/attempts", student, { lesson: lesson._id, durationSeconds: 5, answers: dup });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.totalQuestions, 1, "30 bản của một câu chỉ được tính 1 câu");
  assert.equal((await call("POST", "/attempts", student, { lesson: lesson._id, answers: [] })).status, 400);
  await mongoose.connection.db.collection("attempts").deleteOne({ _id: new mongoose.Types.ObjectId(r.body.data._id) }); // dọn lượt thử
});

test("kiểm tra: chấm theo danh sách câu của đề, đề bị khóa thì không nộp được", async () => {
  const tests = (await call("GET", "/tests", student)).body.data;
  const locked = tests.find((t) => t.locked);
  if (locked) {
    assert.equal((await call("GET", `/tests/${locked._id}`, student)).status, 403, "đề khóa không cho mở");
    assert.equal((await call("POST", "/test-attempts", student, { test: locked._id, answers: [{ question: "x", selectedIndex: 0 }] })).status, 403);
  }
  const open = tests.find((t) => !t.locked && t.questionCount >= 5);
  assert.ok(open, "cần ít nhất một đề đang mở để kiểm thử");
  const full = (await call("GET", `/tests/${open._id}`, student)).body.data;
  const r = await call("POST", "/test-attempts", student, { test: open._id, durationSeconds: 1, answers: [{ question: full.questions[0]._id, selectedIndex: 0 }] });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.totalQuestions, full.questions.length, "tổng số câu lấy theo đề, không theo số câu gửi lên");
  await mongoose.connection.db.collection("testattempts").deleteOne({ _id: new mongoose.Types.ObjectId(r.body.data._id) }); // dọn lượt thử
});

test("học sinh chỉ xem được câu hỏi/bài học đúng lớp của mình", async () => {
  const hidden = (await call("GET", "/grades", admin)).body.data.find((g) => g.isPublished === false);
  if (!hidden) return;
  const other = (await call("GET", `/lessons?grade=${hidden._id}`, admin)).body.data[0];
  if (!other) return;
  assert.equal((await call("GET", `/lessons/${other._id}`, student)).status, 403);
  assert.equal((await call("GET", `/questions/lesson/${other._id}`, student)).status, 403);
});

test("đấu trường: phiên chơi do máy chủ chấm, chặn trả lời trùng và nộp hai lần", async () => {
  const subject = subjects[0]._id;
  const ov = await call("GET", `/arena/overview?subject=${subject}`, student);
  assert.equal(ov.status, 200);
  assert.ok(ov.body.data.tier.name && Array.isArray(ov.body.data.weekly.top));
  const run = (await call("POST", "/arena/runs", student, { subject })).body.data;
  assert.equal(run.questions.length, 10);
  assert.ok(run.questions.every((q) => !("correctIndex" in q)), "không lộ đáp án khi phát câu hỏi");
  const a1 = await call("POST", `/arena/runs/${run.runId}/answer`, student, { question: run.questions[0]._id, selectedIndex: 0, ms: 3000 });
  assert.equal(a1.status, 200);
  assert.equal((await call("POST", `/arena/runs/${run.runId}/answer`, student, { question: run.questions[0]._id, selectedIndex: 1, ms: 100 })).status, 409);
  assert.equal((await call("POST", `/arena/runs/${run.runId}/answer`, student2, { question: run.questions[1]._id, selectedIndex: 0, ms: 100 })).status, 404, "không trả lời hộ lượt của bạn khác");
  const fin = await call("POST", `/arena/runs/${run.runId}/finish`, student);
  assert.equal(fin.status, 200);
  assert.ok(fin.body.data.score <= 1 && fin.body.data.total === 10);
  assert.equal((await call("POST", `/arena/runs/${run.runId}/finish`, student)).status, 404);
});

test("đấu trường: thách đấu hai bạn dùng chung bộ câu, người thách không tự nhận được", async () => {
  const subject = subjects[0]._id;
  const ch = (await call("POST", "/arena/challenges", student, { subject })).body.data;
  for (const q of ch.questions) await call("POST", `/arena/runs/${ch.runId}/answer`, student, { question: q._id, selectedIndex: 0, ms: 2000 });
  assert.equal((await call("POST", `/arena/runs/${ch.runId}/finish`, student)).body.data.duel.role, "creator");
  const incoming = (await call("GET", `/arena/overview?subject=${subject}`, student2)).body.data.incoming;
  const inc = incoming.find((c) => c.creator.name);
  assert.ok(inc, "bạn phải thấy lời mời thách đấu");
  assert.equal((await call("POST", "/arena/runs", student, { challengeId: inc._id })).status, 400);
  const run2 = (await call("POST", "/arena/runs", student2, { challengeId: inc._id })).body.data;
  assert.deepEqual(run2.questions.map((q) => q._id), ch.questions.map((q) => q._id));
  for (const q of run2.questions) await call("POST", `/arena/runs/${run2.runId}/answer`, student2, { question: q._id, selectedIndex: 1, ms: 1500 });
  const fin = (await call("POST", `/arena/runs/${run2.runId}/finish`, student2)).body.data;
  assert.ok(["win", "lose", "draw"].includes(fin.duel.result));
});

test("ôn câu sai: có phiên ôn, chấm phía máy chủ, không lộ đáp án trước khi trả lời", async () => {
  const sum = await call("GET", "/practice-review/summary", student);
  assert.equal(sum.status, 200);
  const sess = (await call("POST", "/practice-review/session", student)).body.data;
  assert.ok(sess.questions.length <= 10);
  if (sess.questions.length) {
    assert.ok(sess.questions.every((q) => !("correctIndex" in q) && !("correctText" in q)));
    const a = await call("POST", "/practice-review/answer", student, { question: sess.questions[0]._id, selectedIndex: 0, textAnswer: "" });
    assert.equal(a.status, 200);
    assert.equal(typeof a.body.data.correct, "boolean");
  }
});

test("thông báo & mục tiêu: xem được, đổi mục tiêu hợp lệ, từ chối giá trị sai", async () => {
  const n = await call("GET", "/notifications", student);
  assert.equal(n.status, 200);
  assert.ok(Array.isArray(n.body.data.items) && typeof n.body.data.unread === "number");
  assert.equal((await call("PUT", "/auth/preferences", student, { dailyGoal: 99 })).status, 400);
  const ok = await call("PUT", "/auth/preferences", student, { dailyGoal: 3 });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.user.dailyGoal, 3);
});

test("avatar: chỉ nhận kiểu cú hợp lệ, không cho gắn link ảnh lạ, chọn lại được cú tự gán", async () => {
  assert.equal((await call("PUT", "/auth/preferences", student2, { avatarUrl: "http://evil.example/x.png" })).status, 400);
  assert.equal((await call("PUT", "/auth/preferences", student2, { avatarUrl: "owl:9" })).status, 400);
  const pick = await call("PUT", "/auth/preferences", student2, { avatarUrl: "owl:3" });
  assert.equal(pick.body.data.user.avatarUrl, "owl:3");
  const reset = await call("PUT", "/auth/preferences", student2, { avatarUrl: "" });
  assert.ok(!reset.body.data.user.avatarUrl);
});

test("điểm danh/nhiệm vụ: không nhận thưởng hai lần", async () => {
  const missions = (await call("GET", "/missions", student)).body.data;
  const claimed = missions.find((m) => m.claimed);
  if (claimed) assert.equal((await call("POST", `/missions/${claimed._id}/claim`, student)).status, 409);
  const notDone = missions.find((m) => m.progress < m.goalValue);
  if (notDone) assert.equal((await call("POST", `/missions/${notDone._id}/claim`, student)).status, 400);
});

test("admin mới: lớp-môn, bình luận, đơn quà, thông báo, đấu trường chỉ dành cho admin", async () => {
  for (const url of ["/admin/catalog", "/admin/comments", "/admin/redemptions", "/admin/broadcasts", "/admin/arena"]) {
    assert.equal((await call("GET", url, student)).status, 403, `${url} phải cấm học sinh`);
    assert.equal((await call("GET", url, admin)).status, 200, `${url} phải mở cho admin`);
  }
  const cat = (await call("GET", "/admin/catalog", admin)).body.data;
  assert.ok(cat.grades.every((g) => typeof g.chapters === "number" && typeof g.students === "number"));
  // lớp còn chương không xoá được
  const used = cat.grades.find((g) => g.chapters > 0);
  if (used) assert.equal((await call("DELETE", `/grades/${used._id}`, admin)).status, 400);
  const usedSubject = cat.subjects.find((s) => s.chapters > 0);
  if (usedSubject) assert.equal((await call("DELETE", `/subjects/${usedSubject._id}`, admin)).status, 400);
});

test("admin: thông báo chung kiểm tra đầu vào (không gửi thật để khỏi làm phiền học sinh)", async () => {
  assert.equal((await call("POST", "/admin/broadcasts", admin, { title: "  " })).status, 400);
  assert.equal((await call("POST", "/admin/broadcasts", admin, { title: "x", link: "http://evil.example" })).status, 400);
  assert.equal((await call("POST", "/admin/broadcasts", student, { title: "x" })).status, 403);
});

test("admin: câu hỏi riêng của đề (không thuộc bài học) tạo/lọc/xoá được và không làm hỏng thống kê", async () => {
  const q = await call("POST", "/questions", admin, { testOnly: true, type: "multiple_choice", text: "QA câu riêng", choices: ["1", "2"], correctIndex: 1 });
  assert.equal(q.status, 201);
  const id = q.body.data._id;
  const tree = (await call("GET", "/questions/tree", admin)).body;
  assert.ok(tree.customCount >= 1);
  const list = (await call("GET", "/questions?testOnly=1", admin)).body.data;
  assert.ok(list.some((x) => x._id === id));
  // không testOnly mà thiếu bài học → bị từ chối
  assert.equal((await call("POST", "/questions", admin, { type: "multiple_choice", text: "thiếu bài", choices: ["1", "2"], correctIndex: 0 })).status, 400);
  assert.equal((await call("GET", "/admin/report", admin)).status, 200);
  assert.equal((await call("DELETE", `/questions/${id}`, admin)).status, 200);
});
