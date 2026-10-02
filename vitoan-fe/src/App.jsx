import { Route, Routes, useLocation, useParams, Navigate } from "react-router-dom";
import SiteHeader from "./components/layout/SiteHeader.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AdminShell from "./components/admin/AdminShell.jsx";

import HomePage from "./pages/public/HomePage.jsx";
import LessonListPage from "./pages/public/LessonListPage.jsx";
import NewsPage from "./pages/public/NewsPage.jsx";
import NewsDetailPage from "./pages/public/NewsDetailPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import SelectGradePage from "./pages/auth/SelectGradePage.jsx";
import LessonContentPage from "./pages/student/LessonContentPage.jsx";
import PlayQuizPage from "./pages/student/PlayQuizPage.jsx";
import ResultPage from "./pages/student/ResultPage.jsx";
import HistoryPage from "./pages/student/HistoryPage.jsx";
import AchievementsPage from "./pages/student/AchievementsPage.jsx";
import StatsPage from "./pages/student/StatsPage.jsx";
import AIChatPage from "./pages/student/AIChatPage.jsx";
import LeaderboardPage from "./pages/student/LeaderboardPage.jsx";
import ProfilePage from "./pages/student/ProfilePage.jsx";
import ChangePasswordPage from "./pages/student/ChangePasswordPage.jsx";
import OnTapPage from "./pages/student/OnTapPage.jsx";
import TestListPage from "./pages/student/TestListPage.jsx";
import TestTakingPage from "./pages/student/TestTakingPage.jsx";
import TestResultPage from "./pages/student/TestResultPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminLessonsPage from "./pages/admin/AdminLessonsPage.jsx";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage.jsx";
import AdminPracticeSetsPage from "./pages/admin/AdminPracticeSetsPage.jsx";
import AdminReviewContentPage from "./pages/admin/AdminReviewContentPage.jsx";
import AdminQuestionBankPage from "./pages/admin/AdminQuestionBankPage.jsx";
import AdminTestsPage from "./pages/admin/AdminTestsPage.jsx";
import AdminAccountsPage from "./pages/admin/AdminAccountsPage.jsx";
import AdminRewardsPage from "./pages/admin/AdminRewardsPage.jsx";
import AdminNewsPage from "./pages/admin/AdminNewsPage.jsx";
import NotFoundPage from "./pages/common/NotFoundPage.jsx";
import MissionsPage from "./pages/student/MissionsPage.jsx";
import RewardsPage from "./pages/student/RewardsPage.jsx";

function GradeDefaultRedirect() {
  const { gradeSlug } = useParams();
  return <Navigate to={`/lop/${gradeSlug}/toan`} replace />;
}

function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  // Chế độ tập trung khi đang làm bài: ẩn header/footer để trang làm bài gọn, không bị phân tâm.
  const isFocusRoute =
    /^\/luyen-tap\//.test(location.pathname) ||
    /^\/bai\/[^/]+\/luyen-tap/.test(location.pathname) ||
    /^\/kiem-tra\/(?!ket-qua)[^/]+$/.test(location.pathname);
  const hideChrome = isAdminRoute || isFocusRoute;

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!hideChrome && <SiteHeader />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lop/:gradeSlug" element={<GradeDefaultRedirect />} />
          <Route path="/lop/:gradeSlug/:subjectSlug" element={<LessonListPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route
            path="/chon-lop"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <SelectGradePage />
              </ProtectedRoute>
            }
          />

          <Route path="/bai/:lessonId" element={<LessonContentPage />} />
          <Route path="/bai/:lessonId/luyen-tap" element={<PlayQuizPage />} />
          <Route path="/luyen-tap/:practiceSetId" element={<PlayQuizPage />} />
          <Route
            path="/ket-qua/:attemptId"
            element={
              <ProtectedRoute allowedRoles={["Student", "Admin"]}>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/on-tap"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <OnTapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kiem-tra"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <TestListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kiem-tra/:testId"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <TestTakingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kiem-tra/ket-qua/:attemptId"
            element={
              <ProtectedRoute allowedRoles={["Student", "Admin"]}>
                <TestResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lich-su"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ho-so"
            element={
              <ProtectedRoute allowedRoles={["Student", "Admin"]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doi-mat-khau"
            element={
              <ProtectedRoute allowedRoles={["Student", "Admin"]}>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/thanh-tich"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <AchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/thong-ke"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <StatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/xep-hang"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nhiem-vu"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <MissionsPage />
              </ProtectedRoute>
            }
          />
          {/* Các trang chưa làm (Đấu trường, Khoá học, Liên hệ) đã bỏ — link cũ quay về trang chủ */}
          <Route path="/dau-truong" element={<Navigate to="/" replace />} />
          <Route path="/mua-khoa-hoc" element={<Navigate to="/" replace />} />
          <Route path="/lien-he" element={<Navigate to="/" replace />} />
          <Route
            path="/doi-qua"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/tin-tuc" element={<NewsPage />} />
          <Route path="/tin-tuc/:id" element={<NewsDetailPage />} />
          <Route
            path="/ban-dong-hanh"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <AIChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/bai-hoc"
            element={
              <AdminLayout>
                <AdminLessonsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/bai-hoc/:lessonId/cau-hoi"
            element={
              <AdminLayout>
                <AdminQuestionsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/bai-hoc/:lessonId/luyen-tap"
            element={
              <AdminLayout>
                <AdminPracticeSetsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/bai-hoc/:lessonId/on-tap"
            element={
              <AdminLayout>
                <AdminReviewContentPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/noi-dung-on-tap"
            element={<Navigate to="/admin/bai-hoc" replace />}
          />
          <Route
            path="/admin/ngan-hang-cau-hoi"
            element={
              <AdminLayout>
                <AdminQuestionBankPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/danh-sach-luyen-tap"
            element={<Navigate to="/admin/bai-hoc" replace />}
          />
          <Route
            path="/admin/kiem-tra"
            element={
              <AdminLayout>
                <AdminTestsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/tai-khoan"
            element={
              <AdminLayout>
                <AdminAccountsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/tin-tuc"
            element={
              <AdminLayout>
                <AdminNewsPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/doi-diem"
            element={
              <AdminLayout>
                <AdminRewardsPage />
              </AdminLayout>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!hideChrome && <SiteFooter />}
    </div>
  );
}
