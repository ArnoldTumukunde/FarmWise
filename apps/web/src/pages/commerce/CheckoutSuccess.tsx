/**
 * Pesapal redirects the customer to /payments/return after they complete (or
 * cancel) payment, with `?OrderTrackingId=...&OrderMerchantReference=...`.
 *
 * The IPN may not have landed yet by the time the user lands here, so we poll
 * /payments/status/:orderTrackingId — server-side that endpoint also re-fetches
 * authoritative status from Pesapal so we don't deadlock waiting for IPN.
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { CheckCircle, Loader2, XCircle, AlertCircle } from 'lucide-react';

type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'CANCELLED';

interface StatusResponse {
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  failureDescription: string | null;
  enrollments: Array<{ courseId: string; courseSlug: string; courseTitle: string; status: string }>;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ≈ 60s

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const cart = useCartStore();
  // Pesapal sends `OrderTrackingId`; fall back to lowercase variants in case of
  // proxy normalization.
  const orderTrackingId =
    searchParams.get('OrderTrackingId') ||
    searchParams.get('orderTrackingId') ||
    '';

  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState('');
  const [showCheck, setShowCheck] = useState(false);
  const confettiFired = useRef(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!orderTrackingId) {
      setError('Missing order reference. If you were charged, contact support with your bank/MoMo reference.');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = (await fetchApi(`/payments/status/${orderTrackingId}`)) as StatusResponse;
        if (cancelled) return;
        setData(res);
        if (res.status === 'COMPLETED') {
          cart.fetchCart();
          setTimeout(() => setShowCheck(true), 100);
          return;
        }
        if (res.status === 'FAILED' || res.status === 'CANCELLED' || res.status === 'REVERSED') {
          return; // terminal failure — stop polling
        }
        // PENDING — keep polling
        if (pollsRef.current < MAX_POLLS) {
          pollsRef.current += 1;
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to verify payment');
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderTrackingId]);

  useEffect(() => {
    if (data?.status === 'COMPLETED' && !confettiFired.current) {
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
          /* optional */
        }
      }, 500);
    }
  }, [data?.status]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle size={48} className="text-amber-500 mx-auto" />
          <p className="text-text-base font-semibold">We couldn't verify your payment</p>
          <p className="text-sm text-text-muted">{error}</p>
          <Link to="/farmer/learning" className="text-primary font-semibold hover:underline">
            Go to My Learning
          </Link>
        </div>
      </div>
    );
  }

  if (!data || data.status === 'PENDING') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="text-primary animate-spin mx-auto" />
          <p className="text-text-base font-semibold">Verifying your payment…</p>
          <p className="text-sm text-text-muted max-w-sm">
            Mobile money confirmations can take up to 60 seconds. Don't close this page.
          </p>
        </div>
      </div>
    );
  }

  if (data.status === 'FAILED' || data.status === 'CANCELLED' || data.status === 'REVERSED') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <XCircle size={48} className="text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-text-base">Payment didn't go through</h1>
          <p className="text-sm text-text-muted">
            {data.failureDescription || 'Your payment was not completed. You have not been charged. Please try again.'}
          </p>
          <div className="pt-4 space-y-3">
            <Link
              to="/cart"
              className="block w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-lg text-base transition-colors text-center"
            >
              Back to Cart
            </Link>
            <Link
              to="/courses"
              className="block w-full border-2 border-gray-200 text-text-base hover:border-primary hover:text-primary font-semibold py-3 rounded-lg text-sm transition-colors text-center"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETED
  const firstSlug = data.enrollments[0]?.courseSlug;
  const learnPath = firstSlug ? `/learn/${firstSlug}` : '/farmer/learning';
  const headline =
    data.enrollments.length === 1
      ? `You're enrolled in "${data.enrollments[0].courseTitle}"`
      : `You're enrolled in ${data.enrollments.length} courses`;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-6">
        <div
          className={`mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center transition-transform duration-400 ${
            showCheck ? 'scale-100' : 'scale-0'
          }`}
        >
          <CheckCircle size={44} className="text-primary" />
        </div>

        <h1 className="text-3xl font-bold text-text-base">Payment successful!</h1>
        <p className="text-lg text-text-muted">{headline}</p>
        {data.paymentMethod && (
          <p className="text-xs text-text-muted">Paid via {data.paymentMethod}</p>
        )}
        <p className="text-sm text-text-muted">You'll receive a confirmation email shortly.</p>

        <div className="pt-4 space-y-3">
          <Link
            to={learnPath}
            className="block w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-lg text-base transition-colors text-center"
          >
            Start Learning
          </Link>
          <Link
            to="/farmer/learning"
            className="block w-full border-2 border-gray-200 text-text-base hover:border-primary hover:text-primary font-semibold py-3 rounded-lg text-sm transition-colors text-center"
          >
            My Learning
          </Link>
        </div>
      </div>
    </div>
  );
}
