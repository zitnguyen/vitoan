import { Route, Routes, useLocation, useParams, Navigate } from "react-router-dom";
import SiteHeader from "./components/layout/SiteHeader.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AdminShell from "./components/admin/AdminShell.jsx";

import HomePage from "./pages/public/HomePage.jsx";
import LessonListPage from "./pages/public/LessonListPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import SelectGradePage from "./pages/auth/SelectGradePage.jsx";
import LessonContentPage from "./pages/student/LessonContentPage.jsx";
import PlayQuizPage from "./pages/student/PlayQuizPage.jsx";
import ResultPage from "./pages/student/ResultPage.jsx";
import HistoryPage from "./pages/student/HistoryPage.jsx";
import AchievementsPage from "./pages/student/AchievementsPage.jsx";
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
import AdminTestsPage from "./pages/admin/AdminTestsPage.jsx";
import AdminAccountsPage from "./pages/admin/AdminAccountsPage.jsx";
import NotFoundPage from "./pages/common/NotFoundPage.jsx";
import ComingSoonPage from "./pages/common/ComingSoonPage.jsx";
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

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!isAdminRoute && <SiteHeader />}
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
            path="/nhiem-vu"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <MissionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dau-truong" element={<ComingSoonPage title="Đấu trường ViToan" description="Sắp tới em có thể thi đấu trực tiếp với các bạn học khác tại đây." />} />
          <Route
            path="/doi-qua"
            element={
              <ProtectedRoute allowedRoles={["Student"]}>
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/mua-khoa-hoc" element={<ComingSoonPage title="Khoá học nâng cao" description="ViToan hiện hoàn toàn miễn phí. Các gói khoá học nâng cao (nếu có) sẽ được thông báo tại đây." />} />
          <Route path="/tin-tuc" element={<ComingSoonPage title="Tin tức" description="Những bài viết, mẹo học tập và tin tức mới nhất từ ViToan sẽ được cập nhật tại đây." />} />
          <Route path="/lien-he" element={<ComingSoonPage title="Liên hệ" description="Trang liên hệ đang được hoàn thiện. Bạn có thể nhắn tin qua trang chủ để được hỗ trợ." />} />
          <Route path="/ban-dong-hanh" element={<ComingSoonPage title="Bạn đồng hành" description="Trợ lý AI đồng hành cùng em trong suốt quá trình học tập sắp ra mắt tại đây." />} />

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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isAdminRoute && <SiteFooter />}
    </div>
  );
}
