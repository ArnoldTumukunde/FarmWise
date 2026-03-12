import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import CourseCatalog from '@/pages/catalog/CourseCatalog';
import CourseDetail from '@/pages/catalog/CourseDetail';
import InstructorDashboard from '@/pages/instructor/Dashboard';
import CourseBuilder from '@/pages/instructor/CourseBuilder';
import Cart from '@/pages/commerce/Cart';
import CheckoutSuccess from '@/pages/commerce/CheckoutSuccess';
import CheckoutCancel from '@/pages/commerce/CheckoutCancel';
import { CoursePlayer } from '@/pages/learn/CoursePlayer';
import { MyLibrary } from '@/pages/library/MyLibrary';
import { useAuthStore } from '@/store/useAuthStore';

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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/course/:slug" element={<CourseDetail />} />

        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />

        {/* Learning Routes */}
        <Route path="/my-library" element={
          <ProtectedRoute>
            <MyLibrary />
          </ProtectedRoute>
        } />
        <Route path="/learn/:courseId" element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        } />

        {/* Instructor Routes */}
        <Route path="/instructor" element={
          <ProtectedRoute requireInstructor>
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/instructor/course/:id" element={
          <ProtectedRoute requireInstructor>
            <CourseBuilder />
          </ProtectedRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/courses" replace />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
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
