import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import CourseCatalog from '@/pages/catalog/CourseCatalog';
import CourseDetail from '@/pages/catalog/CourseDetail';
import InstructorDashboard from '@/pages/instructor/Dashboard';
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
import { useAuthStore } from '@/store/useAuthStore';
import { Layout, AuthLayout, HomeLayout } from '@/components/Layout';

function ProtectedRoute({ children, requireInstructor = false }: { children: React.ReactNode, requireInstructor?: boolean }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (requireInstructor && user?.role !== 'INSTRUCTOR' && user?.role !== 'ADMIN') {
    return <Navigate to="/courses" replace />;
  }
  return <>{children}</>;
}

import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersLayout } from './pages/admin/UsersLayout';
import { CoursesLayout } from './pages/admin/CoursesLayout';
import { ReviewsLayout } from './pages/admin/ReviewsLayout';

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/courses" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/courses" replace />;
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

        {/* Public pages */}
        <Route path="/courses" element={<Layout><CourseCatalog /></Layout>} />
        <Route path="/course/:slug" element={<Layout><CourseDetail /></Layout>} />

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

        {/* Instructor Routes */}
        <Route path="/instructor" element={
          <Layout>
            <ProtectedRoute requireInstructor>
              <InstructorDashboard />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/instructor/course/:id" element={
          <Layout>
            <ProtectedRoute requireInstructor>
              <CourseBuilder />
            </ProtectedRoute>
          </Layout>
        } />
        <Route path="/instructor/courses/:courseId/analytics" element={
          <Layout>
            <ProtectedRoute requireInstructor>
              <CourseAnalytics />
            </ProtectedRoute>
          </Layout>
        } />

        {/* Notifications */}
        <Route path="/notifications" element={
          <Layout>
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          </Layout>
        } />

        {/* Settings */}
        <Route path="/settings" element={
          <Layout>
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Layout>
        } />

        {/* Homepage for unauthenticated users, redirect to courses when logged in */}
        <Route path="/" element={<HomeRoute />} />

        {/* Admin Routes – uses its own AdminLayout, no shared Layout */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersLayout />} />
          <Route path="courses" element={<CoursesLayout />} />
          <Route path="reviews" element={<ReviewsLayout />} />
        </Route>
      </Routes>
    </Router>
  );
}
