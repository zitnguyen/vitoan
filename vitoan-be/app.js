const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitizeExpress5 = require("./middleware/mongoSanitizeExpress5");
const hpp = require("hpp");

const { getAllowedOrigins } = require("./config/corsOrigins");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const reviewContentRoutes = require("./routes/reviewContentRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const userRoutes = require("./routes/userRoutes");
const practiceSetRoutes = require("./routes/practiceSetRoutes");
const testRoutes = require("./routes/testRoutes");
const testAttemptRoutes = require("./routes/testAttemptRoutes");
const adminStatsRoutes = require("./routes/adminStatsRoutes");
const commentRoutes = require("./routes/commentRoutes");
const ttsRoutes = require("./routes/ttsRoutes");
const missionRoutes = require("./routes/missionRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).slice(2);
  next();
});

const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Không được phép bởi CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút" },
});
app.use(
  [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/verify-register",
    "/api/auth/forgot-password",
    "/api/auth/verify-reset-code",
    "/api/auth/reset-password",
  ],
  authLimiter
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitizeExpress5());
app.use(hpp());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders(res) {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/review-content", reviewContentRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/practice-sets", practiceSetRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/test-attempts", testAttemptRoutes);
app.use("/api/admin", adminStatsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/conversations", chatRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Không tìm thấy tài nguyên" });
});

app.use(errorHandler);

module.exports = app;
