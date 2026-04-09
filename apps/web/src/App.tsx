import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import VerifyPhone from '@/pages/auth/VerifyPhone';
import CourseCatalog from '@/pages/catalog/CourseCatalog';
import CourseDetail from '@/pages/catalog/CourseDetail';
import InstructorDashboard from '@/pages/instructor/Dashboard';
import InstructorLayout from '@/pages/instructor/InstructorLayout';
import CourseBuilder from '@/pages/instructor/CourseBuilder';
import CourseAnalytics from '@/pages/instructor/CourseAnalytics';
import BecomeInstructor from '@/pages/instructor/BecomeInstructor';
import Cart from '@/pages/commerce/Cart';
import CheckoutSuccess from '@/pages/commerce/CheckoutSuccess';
import CheckoutCancel from '@/pages/commerce/CheckoutCancel';
import { CoursePlayer } from '@/pages/learn/CoursePlayer';
import { MyLibrary } from '@/pages/library/MyLibrary';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import HomePage from '@/pages/HomePage';
import LoggedInHomePage from '@/pages/LoggedInHomePage';
import InstructorProfilePage from '@/pages/InstructorProfilePage';
import { useAuthStore } from '@/store/useAuthStore';
import { Layout, AuthLayout, HomeLayout } from '@/components/Layout';

// Admin imports
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UsersLayout } from '@/pages/admin/UsersLayout';
import { CoursesLayout } from '@/pages/admin/CoursesLayout';
import { ReviewsLayout } from '@/pages/admin/ReviewsLayout';
import { CourseReview } from '@/pages/admin/CourseReview';
import { UserDetail } from '@/pages/admin/UserDetail';
import { CategoriesLayout } from '@/pages/admin/CategoriesLayout';
import { CouponsLayout } from '@/pages/admin/CouponsLayout';
import { RefundsLayout } from '@/pages/admin/RefundsLayout';
import { RevenueLayout } from '@/pages/admin/RevenueLayout';
import { BroadcastLayout } from '@/pages/admin/BroadcastLayout';
import { ModerationLayout } from '@/pages/admin/ModerationLayout';
import { SettingsLayout } from '@/pages/admin/SettingsLayout';
import { HomepageConfigLayout } from '@/pages/admin/HomepageConfigLayout';
import { PagesLayout } from '@/pages/admin/PagesLayout';
import { AuditLogLayout } from '@/pages/admin/AuditLogLayout';
import StaticPage from '@/pages/StaticPage';

// Farmer / Learning imports
import MyLearning from '@/pages/learning/MyLearning';
import Wishlist from '@/pages/learning/Wishlist';
import Certificates from '@/pages/learning/Certificates';
import SearchPage from '@/pages/search/SearchPage';
import ProfilePage from '@/pages/learning/ProfilePage';

// Instructor imports
import MyCourses from '@/pages/instructor/MyCourses';
import CourseWizard from '@/pages/instructor/CourseWizard';
import StudentList from '@/pages/instructor/StudentList';
import QAManagement from '@/pages/instructor/QAManagement';
import ReviewManagement from '@/pages/instructor/ReviewManagement';
import Announcements from '@/pages/instructor/Announcements';
import PayoutSettings from '@/pages/instructor/PayoutSettings';
import EnhancedAnalytics from '@/pages/instructor/EnhancedAnalytics';
import Communication from '@/pages/instructor/Communication';

function ProtectedRoute({ children, requireInstructor = false }: { children: React.ReactNode, requireInstructor?: boolean }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (requireInstructor && user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return <Navigate to="/courses" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (token) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'INSTRUCTOR') return <Navigate to="/instructor" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function HomeRoute() {
  const { token } = useAuthStore();
  if (token) {
    return <Layout><LoggedInHomePage /></Layout>;
  }
  return <HomeLayout><HomePage /></HomeLayout>;
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return (
    <Router>
      <Toaster position="bottom-center" />
      <Routes>
        {/* Auth pages – minimal layout (navbar, no footer) */}
        <Route path="/login" element={<GuestRoute><AuthLayout><Login /></AuthLayout></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><AuthLayout><Register /></AuthLayout></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><AuthLayout><ForgotPassword /></AuthLayout></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><AuthLayout><ResetPassword /></AuthLayout></GuestRoute>} />
        <Route path="/register/verify-email" element={<AuthLayout><VerifyEmail /></AuthLayout>} />
        <Route path="/verify" element={<AuthLayout><VerifyEmail /></AuthLayout>} />
        <Route path="/register/verify-phone" element={<AuthLayout><VerifyPhone /></AuthLayout>} />

        {/* Public pages */}
        <Route path="/courses" element={<Layout><CourseCatalog /></Layout>} />
        <Route path="/course/:slug" element={<Layout><CourseDetail /></Layout>} />
        <Route path="/instructors/:id" element={<Layout><InstructorProfilePage /></Layout>} />
        <Route path="/search" element={<Layout><SearchPage /></Layout>} />
        <Route path="/page/:slug" element={<Layout><StaticPage /></Layout>} />

        {/* Protected pages */}
        <Route path="/cart" element={
          <Layout>
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
        <Route path="/checkout/cancel" element={<Layout><CheckoutCancel /></Layout>} />

        {/* Learning Routes */}
        <Route path="/my-library" element={
          <Layout>
            <ProtectedRoute>
              <MyLibrary />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/my-learning" element={
          <Layout>
            <ProtectedRoute>
              <MyLearning />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/wishlist" element={
          <Layout>
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/certificates" element={
          <Layout>
            <ProtectedRoute>
              <Certificates />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/learn/:courseId" element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        } />

        {/* Become Instructor */}
        <Route path="/become-instructor" element={
          <Layout>
            <ProtectedRoute>
              <BecomeInstructor />
            </ProtectedRoute>
          </Layout>
        } />

        {/* Instructor Routes – uses InstructorLayout with sidebar */}
        <Route path="/instructor" element={
          <ProtectedRoute requireInstructor>
            <InstructorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<InstructorDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="courses/new" element={<CourseWizard />} />
          <Route path="course/:id" element={<CourseBuilder />} />
          <Route path="courses/:courseId/analytics" element={<CourseAnalytics />} />
          <Route path="courses/:courseId/students" element={<StudentList />} />
          <Route path="courses/:courseId/qa" element={<QAManagement />} />
          <Route path="courses/:courseId/reviews" element={<ReviewManagement />} />
          <Route path="courses/:courseId/announcements" element={<Announcements />} />
          <Route path="analytics" element={<EnhancedAnalytics />} />
          <Route path="payouts" element={<PayoutSettings />} />
          <Route path="communication" element={<Communication />} />
        </Route>

        {/* Notifications */}
        <Route path="/notifications" element={
          <Layout>
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          </Layout>
        } />

        {/* Settings / Profile */}
        <Route path="/settings" element={
          <Layout>
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </Layout>
        } />

        {/* Homepage for unauthenticated users, redirect to courses when logged in */}
        <Route path="/" element={<HomeRoute />} />

        {/* Admin Routes – uses its own AdminLayout, no shared Layout */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersLayout />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="courses" element={<CoursesLayout />} />
          <Route path="courses/:id/review" element={<CourseReview />} />
          <Route path="categories" element={<CategoriesLayout />} />
          <Route path="coupons" element={<CouponsLayout />} />
          <Route path="refunds" element={<RefundsLayout />} />
          <Route path="revenue" element={<RevenueLayout />} />
          <Route path="notifications" element={<BroadcastLayout />} />
          <Route path="moderation" element={<ModerationLayout />} />
          <Route path="settings" element={<SettingsLayout />} />
          <Route path="homepage" element={<HomepageConfigLayout />} />
          <Route path="pages" element={<PagesLayout />} />
          <Route path="audit-log" element={<AuditLogLayout />} />
          <Route path="reviews" element={<ReviewsLayout />} />
        </Route>
      </Routes>
    </Router>
  );
}
