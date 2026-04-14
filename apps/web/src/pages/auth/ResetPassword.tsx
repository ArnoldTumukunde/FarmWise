import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { fetchApi } from '@/lib/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Leaf, Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

/* ── Password strength (reused from Register) ─────────── */

function getStrength(pw: string) {
  if (!pw) return { level: 0, label: '', color: '' };
  let types = 0;
  if (/[a-z]/.test(pw)) types++;
  if (/[A-Z]/.test(pw)) types++;
  if (/[0-9]/.test(pw)) types++;
  if (/[^a-zA-Z0-9]/.test(pw)) types++;
  if (pw.length < 8 || types <= 1) return { level: 1, label: 'Weak', color: 'bg-red-400' };
  if (types === 2) return { level: 2, label: 'Fair', color: 'bg-amber-400' };
  if (types === 3) return { level: 3, label: 'Good', color: 'bg-yellow-400' };
  return { level: 4, label: 'Strong', color: 'bg-primary' };
}

const LABEL_COLORS: Record<string, string> = {
  Weak: 'text-red-500', Fair: 'text-amber-500', Good: 'text-yellow-600', Strong: 'text-primary',
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isPhoneMethod = searchParams.get('method') === 'phone';
  const storedPhone = sessionStorage.getItem('resetPhone') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const form = useForm({
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  const password = form.watch('password');
  const strength = getStrength(password || '');

  // Email method requires a token
  if (!isPhoneMethod && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Leaf className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold text-primary">AAN Academy</span>
            </div>
            <h1 className="text-2xl font-bold text-text-base mb-2">Invalid reset link</h1>
            <p className="text-sm text-text-muted mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
            >
              Request a new one →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: { otp: string; password: string; confirmPassword: string }) => {
    setServerError('');

    if (data.password !== data.confirmPassword) {
      form.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    if (data.password.length < 8) {
      form.setError('password', { message: 'Password must be at least 8 characters' });
      return;
    }

    setSubmitting(true);
    try {
      if (isPhoneMethod) {
        await fetchApi('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ phone: storedPhone, otp: data.otp, newPassword: data.password }),
        });
      } else {
        await fetchApi('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, newPassword: data.password }),
        });
      }
      setSuccess(true);
      toast.success('Password updated!');
    } catch (err: any) {
      const status = err.status || err.statusCode;
      if (status === 410) {
        setServerError('This reset link has expired.');
      } else if (status === 400) {
        setServerError('Invalid reset link.');
      } else {
        setServerError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Leaf className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold text-primary">AAN Academy</span>
            </div>
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-base mb-1">Password reset successful</h2>
            <p className="text-sm text-text-muted mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary hover:bg-primary-light text-white font-semibold py-3 px-8 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">AAN Academy</span>
          </div>
          <h1 className="text-2xl font-bold text-text-base text-center">Set new password</h1>
          <p className="text-sm text-text-muted text-center mt-1 mb-6">
            {isPhoneMethod
              ? 'Enter the OTP sent to your phone and choose a new password.'
              : 'Enter your new password below.'}
          </p>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
              {serverError}
              {(serverError.includes('expired') || serverError.includes('Invalid')) && (
                <Link
                  to="/forgot-password"
                  className="block mt-1 text-primary font-semibold text-sm hover:underline"
                >
                  Request a new one →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            {/* OTP input for phone method */}
            {isPhoneMethod && (
              <div>
                <label htmlFor="rp-otp" className="block text-sm font-medium text-text-base mb-1">
                  OTP Code
                </label>
                <input
                  id="rp-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter 4-digit code"
                  {...form.register('otp', { required: 'Please enter the OTP code' })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm text-text-base text-center tracking-[0.3em] font-bold placeholder:font-normal placeholder:tracking-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
                {form.formState.errors.otp && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.otp.message}</p>
                )}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="rp-password" className="block text-sm font-medium text-text-base mb-1">New Password</label>
              <div className="relative">
                <input
                  id="rp-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  {...form.register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                  className={`w-full h-11 px-3 pr-10 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    form.formState.errors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          seg <= strength.level ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${LABEL_COLORS[strength.label] || ''}`}>
                    {strength.label}
                  </span>
                </div>
              )}
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="rp-confirm" className="block text-sm font-medium text-text-base mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="rp-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...form.register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === form.getValues('password') || 'Passwords do not match',
                  })}
                  className={`w-full h-11 px-3 pr-10 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    form.formState.errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Resetting…' : 'Set New Password'}
            </button>
          </form>

          <p className="text-center mt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-base"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
