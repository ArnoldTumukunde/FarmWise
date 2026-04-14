import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Leaf, Loader2, Mail, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const token = searchParams.get('token');
  const email = sessionStorage.getItem('verifyEmail') || '';

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resendCount, setResendCount] = useState(0);

  // If token present in URL, auto-verify
  useEffect(() => {
    if (!token) return;
    setVerifying(true);
    fetchApi('/auth/verify', { method: 'POST', body: JSON.stringify({ token }) })
      .then((res) => {
        setAuth(res.user, res.accessToken);
        toast.success('Email verified! Welcome to AAN Academy');
        navigate('/my-learning');
      })
      .catch((err) => {
        if (err.message?.includes('expired')) {
          setError('expired');
        } else {
          setError(err.message || 'Verification failed');
        }
      })
      .finally(() => setVerifying(false));
  }, [token]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (resendCount >= 3) return;
    try {
      await fetchApi('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success('Email sent!');
      setResendCount((c) => c + 1);
      setCountdown(60);
    } catch {
      toast.error('Failed to resend. Try again later.');
    }
  }, [email, resendCount]);

  // Auto-verify loading state
  if (token && verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-base font-medium">Verifying your email…</p>
        </div>
      </div>
    );
  }

  // Token expired/invalid
  if (token && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Leaf className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold text-primary">AAN Academy</span>
            </div>
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-text-base mb-1">
              {error === 'expired' ? 'This link has expired.' : 'Verification failed'}
            </h2>
            <p className="text-sm text-text-muted mb-6">
              {error === 'expired'
                ? 'Verification links expire after 24 hours.'
                : error}
            </p>
            <button
              onClick={handleResend}
              disabled={resendCount >= 3}
              className="bg-primary hover:bg-primary-light text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Request a new link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting state (no token — user just registered)
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">AAN Academy</span>
          </div>

          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-7 w-7 text-primary" />
          </div>

          <h2 className="text-xl font-bold text-text-base mb-1">Check your email</h2>
          <p className="text-sm text-text-muted mt-2">
            We sent a verification link to:
          </p>
          <p className="text-sm font-bold text-text-base mt-1">{email || 'your email address'}</p>
          <p className="text-sm text-text-muted mt-3">
            Click the link in the email to activate your account.
          </p>

          {/* Resend */}
          <div className="mt-8">
            {resendCount >= 3 ? (
              <p className="text-sm text-text-muted">
                Maximum resends reached. Contact support.
              </p>
            ) : countdown > 0 ? (
              <p className="text-sm text-text-muted">
                Resend in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary font-semibold text-sm hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Resend verification email
              </button>
            )}
          </div>

          <Link
            to="/register"
            className="inline-block mt-4 text-sm text-text-muted underline hover:text-text-base"
          >
            Wrong email?
          </Link>
        </div>
      </div>
    </div>
  );
}
