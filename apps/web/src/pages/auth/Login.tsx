import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchApi } from '@/lib/api';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Leaf, Loader2, Eye, EyeOff } from 'lucide-react';

type Method = 'email' | 'phone';

const COUNTRIES = [
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
];

function getRedirectForRole(role: string | undefined, requestedRedirect: string): string {
  // If user explicitly requested a redirect (e.g. from a protected page), honor it
  if (requestedRedirect !== '/my-learning' && requestedRedirect.startsWith('/')) {
    return requestedRedirect;
  }
  // Role-based default redirect
  if (role === 'ADMIN') return '/admin';
  if (role === 'INSTRUCTOR') return '/instructor';
  return '/';
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/my-learning';
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const [method, setMethod] = useState<Method>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Email form
  const emailForm = useForm({
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  // Phone form
  const phoneForm = useForm({
    defaultValues: { countryCode: '+256', phone: '', password: '', rememberMe: true },
  });

  const handleEmailSubmit = async (data: { email: string; password: string; rememberMe: boolean }) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: data.email, passwordPlain: data.password, rememberMe: data.rememberMe }),
      });
      setAuth(res.user, res.accessToken);
      toast.success('Welcome back!');
      // Role-aware redirect
      const target = getRedirectForRole(res.user?.role, redirectTo);
      navigate(target);
    } catch (err: any) {
      const status = err.status || err.statusCode;
      if (status === 401) {
        setServerError('Incorrect email or password.');
      } else if (status === 403) {
        if (err.message?.includes('verify')) {
          setServerError('Please verify your email first.');
        } else {
          setServerError('Your account has been suspended. Contact support.');
        }
      } else if (status === 429) {
        setServerError('Too many sign in attempts. Try again in 15 minutes.');
      } else {
        setServerError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (data: { countryCode: string; phone: string; password: string; rememberMe: boolean }) => {
    setServerError('');
    setSubmitting(true);
    const fullPhone = `${data.countryCode}${data.phone.replace(/^0+/, '')}`;
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: fullPhone, passwordPlain: data.password, rememberMe: data.rememberMe }),
      });
      setAuth(res.user, res.accessToken);
      toast.success('Welcome back!');
      const target = getRedirectForRole(res.user?.role, redirectTo);
      navigate(target);
    } catch (err: any) {
      const status = err.status || err.statusCode;
      if (status === 401) {
        setServerError('Incorrect phone number or password.');
      } else if (status === 429) {
        setServerError('Too many sign in attempts. Try again in 15 minutes.');
      } else {
        setServerError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">FarmWise</span>
          </div>
          <h1 className="text-2xl font-bold text-text-base text-center">Welcome back</h1>
          <p className="text-sm text-text-muted text-center mt-1 mb-6">Sign in to continue learning</p>

          {/* Google OAuth */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-text-base hover:bg-gray-50 transition-colors duration-150 mb-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <img src="/icons/google.svg" alt="" width={18} height={18} />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-text-muted">or sign in with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Method toggle */}
          <div className="flex rounded-lg border border-gray-200 mb-5 p-0.5 bg-gray-50">
            <button
              type="button"
              onClick={() => { setMethod('email'); setServerError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                method === 'email' ? 'bg-white shadow-sm text-text-base' : 'text-text-muted'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setMethod('phone'); setServerError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                method === 'phone' ? 'bg-white shadow-sm text-text-base' : 'text-text-muted'
              }`}
            >
              Phone
            </button>
          </div>

          {/* Server error banner */}
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
              {serverError}
              {serverError.includes('verify your email') && (
                <button
                  type="button"
                  className="block mt-1 text-primary font-semibold text-sm hover:underline"
                  onClick={() => {
                    toast('Resend not yet implemented');
                  }}
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {/* ─── Email Login ─── */}
          {method === 'email' && (
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="l-email" className="block text-sm font-medium text-text-base mb-1">Email</label>
                <input
                  id="l-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...emailForm.register('email', { required: true })}
                  className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="l-password" className="text-sm font-medium text-text-base">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="l-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...emailForm.register('password', { required: true })}
                    className="w-full h-11 px-3 pr-10 rounded-lg border border-gray-300 text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              </div>

              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer mt-3">
                <input
                  type="checkbox"
                  {...emailForm.register('rememberMe')}
                  defaultChecked
                  className="accent-primary"
                />
                Keep me signed in for 7 days
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* ─── Phone Login ─── */}
          {method === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="l-phone" className="block text-sm font-medium text-text-base mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    {...phoneForm.register('countryCode')}
                    className="h-11 px-2 rounded-lg border border-gray-300 bg-white text-sm text-text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-[110px] flex-shrink-0"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="l-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="07X XXX XXXX"
                    {...phoneForm.register('phone', { required: true })}
                    className="flex-1 h-11 px-3 rounded-lg border border-gray-300 text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="lp-password" className="text-sm font-medium text-text-base">Password</label>
                  <Link to="/forgot-password?method=phone" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...phoneForm.register('password', { required: true })}
                    className="w-full h-11 px-3 pr-10 rounded-lg border border-gray-300 text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              </div>

              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer mt-3">
                <input
                  type="checkbox"
                  {...phoneForm.register('rememberMe')}
                  defaultChecked
                  className="accent-primary"
                />
                Keep me signed in for 7 days
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Sign up link */}
          <p className="text-sm text-text-muted text-center mt-6">
            New to FarmWise?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create a free account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
