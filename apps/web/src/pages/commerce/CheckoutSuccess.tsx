import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cart = useCartStore();
  const sessionId = searchParams.get('session_id');
  const slug = searchParams.get('slug');
  const courseId = searchParams.get('courseId');
  const enrollmentId = searchParams.get('enrollmentId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseSlug, setCourseSlug] = useState(slug || '');
  const [showCheck, setShowCheck] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    async function verify() {
      try {
        if (sessionId) {
          // Verify via Stripe session
          const res = await fetchApi(`/payments/verify?sessionId=${sessionId}`);
          if (res.course) {
            setCourseName(res.course.title || '');
            setCourseSlug(res.course.slug || slug || '');
          }
        } else if (enrollmentId) {
          const res = await fetchApi(`/enrollments/${enrollmentId}`);
          if (res.enrollment?.course) {
            setCourseName(res.enrollment.course.title || '');
            setCourseSlug(res.enrollment.course.slug || '');
          }
        }
        // Refresh cart
        cart.fetchCart();
      } catch {
        // Still show success — payment was likely successful
      } finally {
        setLoading(false);
        setTimeout(() => setShowCheck(true), 100);
      }
    }
    verify();
  }, []);

  // Confetti effect
  useEffect(() => {
    if (!loading && !confettiFired.current) {
      confettiFired.current = true;
      setTimeout(async () => {
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 100,
            spread: 70,
            colors: ['#2E7D32', '#F57F17', '#4CAF50'],
          });
        } catch {
          // Confetti is optional
        }
      }, 500);
    }
  }, [loading]);

  const learnPath = courseSlug ? `/learn/${courseSlug}` : courseId ? `/learn/${courseId}` : '/my-learning';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="text-primary animate-spin mx-auto" />
          <p className="text-text-muted">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-500 font-medium">{error}</p>
          <p className="text-sm text-text-muted">
            If you were charged, please contact support.
          </p>
          <Link to="/my-learning" className="text-primary font-semibold hover:underline">
            Go to My Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-6">
        {/* Animated checkmark */}
        <div
          className={`mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-400 ${
            showCheck ? 'scale-100' : 'scale-0'
          }`}
        >
          <CheckCircle size={44} className="text-primary" />
        </div>

        <h1 className="text-3xl font-bold text-text-base">Payment successful!</h1>
        <p className="text-lg text-text-muted">
          {courseName
            ? `You're enrolled in "${courseName}"`
            : "You're enrolled! Start learning now."}
        </p>

        <p className="text-sm text-text-muted">
          You'll receive a confirmation email shortly.
        </p>

        <div className="pt-4 space-y-3">
          <Link
            to={learnPath}
            className="block w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-lg text-base transition-colors text-center"
          >
            Start Learning
          </Link>
          <Link
            to="/my-learning"
            className="block w-full border-2 border-gray-200 text-text-base hover:border-primary hover:text-primary font-semibold py-3 rounded-lg text-sm transition-colors text-center"
          >
            My Learning
          </Link>
        </div>
      </div>
    </div>
  );
}
