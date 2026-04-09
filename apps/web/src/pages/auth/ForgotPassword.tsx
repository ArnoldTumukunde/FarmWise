import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchApi } from '@/lib/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Leaf, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const COUNTRIES = [
  { code: '+256', flag: '🇺🇬' },
  { code: '+254', flag: '🇰🇪' },
  { code: '+255', flag: '🇹🇿' },
  { code: '+250', flag: '🇷🇼' },
  { code: '+233', flag: '🇬🇭' },
];

type Method = 'email' | 'phone';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>(
    searchParams.get('method') === 'phone' ? 'phone' : 'email'
  );
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailForm = useForm({ defaultValues: { email: '' } });
  const phoneForm = useForm({ defaultValues: { countryCode: '+256', phone: '' } });

  const handleEmailSubmit = async (data: { email: string }) => {
    setSubmitting(true);
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email }),
      });
    } catch {
      // Always show success to prevent user enumeration
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (data: { countryCode: string; phone: string }) => {
    setSubmitting(true);
    const fullPhone = `${data.countryCode}${data.phone.replace(/^0+/, '')}`;
    try {
      await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ phone: fullPhone }),
      });
      sessionStorage.setItem('resetPhone', fullPhone);
      navigate('/reset-password?method=phone');
    } catch (err: any) {
      if (err.status === 429) {
        toast.error('Too many requests. Try again in 15 minutes.');
      } else {
        // Still navigate to prevent enumeration
        sessionStorage.setItem('resetPhone', fullPhone);
        navigate('/reset-password?method=phone');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-base transition-colors mb-6 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">FarmWise</span>
          </div>

          {sent ? (
            /* ─── Success State ─── */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-text-base font-semibold">If an account exists for that email, we've sent a reset link.</p>
                <p className="text-sm text-text-muted mt-2">Check your inbox — the link expires in 1 hour.</p>
              </div>
              <Link
                to="/login"
                className="inline-block mt-4 text-sm font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-base text-center">Reset your password</h1>
              <p className="text-sm text-text-muted text-center mt-1 mb-6">
                Enter your email or phone number and we'll send you a reset link.
              </p>

              {/* Method toggle */}
              <div className="flex rounded-lg border border-gray-200 mb-5 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    method === 'email' ? 'bg-white shadow-sm text-text-base' : 'text-text-muted'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('phone')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    method === 'phone' ? 'bg-white shadow-sm text-text-base' : 'text-text-muted'
                  }`}
                >
                  Phone
                </button>
              </div>

              {method === 'email' ? (
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-medium text-text-base mb-1">Email address</label>
                    <input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...emailForm.register('email', { required: true })}
                      className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="fp-phone" className="block text-sm font-medium text-text-base mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        {...phoneForm.register('countryCode')}
                        className="h-11 px-2 rounded-lg border border-gray-300 bg-white text-sm text-text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 w-[110px] flex-shrink-0"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        id="fp-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="07X XXX XXXX"
                        {...phoneForm.register('phone', { required: true })}
                        className="flex-1 h-11 px-3 rounded-lg border border-gray-300 text-sm text-text-base placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? 'Sending…' : 'Send OTP'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
