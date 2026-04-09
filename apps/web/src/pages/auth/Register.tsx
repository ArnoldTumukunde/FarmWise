import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { fetchApi } from '@/lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Loader2, Eye, EyeOff } from 'lucide-react';

/* ── Schemas ──────────────────────────────────────────── */

const emailSchema = z.object({
  name: z.string().min(2, 'Please enter your full name').max(80),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters and include a number and uppercase letter')
    .regex(/[A-Z]/, 'Password must be at least 8 characters and include a number and uppercase letter')
    .regex(/[0-9]/, 'Password must be at least 8 characters and include a number and uppercase letter'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, { message: 'You must accept the terms to continue' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const phoneSchema = z.object({
  name: z.string().min(2, 'Please enter your full name').max(80),
  countryCode: z.string(),
  phone: z.string().min(7, 'Please enter a valid mobile number').max(15),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters and include a number and uppercase letter')
    .regex(/[A-Z]/, 'Password must be at least 8 characters and include a number and uppercase letter')
    .regex(/[0-9]/, 'Password must be at least 8 characters and include a number and uppercase letter'),
  terms: z.boolean().refine(val => val === true, { message: 'You must accept the terms to continue' }),
});

type EmailForm = z.infer<typeof emailSchema>;
type PhoneForm = z.infer<typeof phoneSchema>;
type Method = 'email' | 'phone';

/* ── Password strength ────────────────────────────────── */

function getStrength(pw: string): { level: number; label: string; color: string } {
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
  Weak: 'text-red-500',
  Fair: 'text-amber-500',
  Good: 'text-yellow-600',
  Strong: 'text-primary',
};

const COUNTRIES = [
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
];

/* ── Component ────────────────────────────────────────── */

export default function Register() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // Email form
  const emailForm = useForm<EmailForm>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', terms: false as any },
  });

  // Phone form
  const phoneForm = useForm<PhoneForm>({
    mode: 'onBlur',
    defaultValues: { name: '', countryCode: '+256', phone: '', password: '', terms: false as any },
  });

  const emailPassword = emailForm.watch('password');
  const phonePassword = phoneForm.watch('password');
  const passwordStr = method === 'email' ? emailPassword : phonePassword;
  const strength = getStrength(passwordStr || '');

  const onSubmitEmail = useCallback(async (data: EmailForm) => {
    setHasAttempted(true);
    setServerError('');
    setSubmitting(true);

    // Validate with zod
    const result = emailSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((e: any) => {
        emailForm.setError(e.path[0] as any, { message: e.message });
      });
      setSubmitting(false);
      return;
    }

    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      sessionStorage.setItem('verifyEmail', data.email);
      navigate('/register/verify-email');
    } catch (err: any) {
      if (err.status === 409) {
        emailForm.setError('email', {
          message: 'An account with this email already exists.',
        });
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [emailForm, navigate]);

  const onSubmitPhone = useCallback(async (data: PhoneForm) => {
    setHasAttempted(true);
    setServerError('');
    setSubmitting(true);

    const result = phoneSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((e: any) => {
        phoneForm.setError(e.path[0] as any, { message: e.message });
      });
      setSubmitting(false);
      return;
    }

    const fullPhone = `${data.countryCode}${data.phone.replace(/^0+/, '')}`;
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: data.name, phone: fullPhone, password: data.password }),
      });
      sessionStorage.setItem('verifyPhone', fullPhone);
      navigate('/register/verify-phone');
    } catch (err: any) {
      if (err.status === 409) {
        phoneForm.setError('phone', {
          message: 'An account with this phone number already exists.',
        });
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [phoneForm, navigate]);

  const emailErrors = emailForm.formState.errors;
  const phoneErrors = phoneForm.formState.errors;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">FarmWise</span>
          </div>
          <p className="text-sm text-text-muted text-center mt-1 mb-6">
            Join 12,000+ farmers learning with FarmWise
          </p>

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
            <span className="text-xs text-text-muted">or register with</span>
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

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
              {serverError}
            </div>
          )}

          {/* ─── Email Form ─── */}
          {method === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="e-name" className="block text-sm font-medium text-text-base mb-1">Full Name</label>
                <input
                  id="e-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  {...emailForm.register('name', { required: 'Please enter your full name', minLength: { value: 2, message: 'Please enter your full name' } })}
                  className={`w-full h-11 px-3 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    emailErrors.name ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {emailErrors.name && <p className="text-sm text-red-500 mt-1">{emailErrors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="e-email" className="block text-sm font-medium text-text-base mb-1">Email Address</label>
                <input
                  id="e-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...emailForm.register('email', { required: 'Please enter a valid email address' })}
                  className={`w-full h-11 px-3 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    emailErrors.email ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {emailErrors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {emailErrors.email.message}
                    {emailErrors.email.message?.includes('already exists') && (
                      <> <Link to="/login" className="text-primary font-semibold underline">Sign in instead →</Link></>
                    )}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="e-password" className="block text-sm font-medium text-text-base mb-1">Password</label>
                <div className="relative">
                  <input
                    id="e-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    {...emailForm.register('password', {
                      required: 'Password must be at least 8 characters and include a number and uppercase letter',
                      minLength: { value: 8, message: 'Password must be at least 8 characters and include a number and uppercase letter' },
                    })}
                    className={`w-full h-11 px-3 pr-10 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      emailErrors.password ? 'border-red-400' : 'border-gray-300'
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
                {/* Strength bar */}
                {emailPassword && (
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
                {emailErrors.password && <p className="text-sm text-red-500 mt-1">{emailErrors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="e-confirm" className="block text-sm font-medium text-text-base mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    id="e-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    {...emailForm.register('confirmPassword', {
                      required: 'Passwords do not match',
                      validate: (val) => val === emailForm.getValues('password') || 'Passwords do not match',
                    })}
                    className={`w-full h-11 px-3 pr-10 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      emailErrors.confirmPassword ? 'border-red-400' : 'border-gray-300'
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
                {emailErrors.confirmPassword && <p className="text-sm text-red-500 mt-1">{emailErrors.confirmPassword.message}</p>}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  {...emailForm.register('terms', { required: 'You must accept the terms to continue' })}
                  className="mt-0.5 accent-primary flex-shrink-0"
                />
                <span>
                  I agree to FarmWise's{' '}
                  <a href="/terms" className="text-primary underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary underline">Privacy Policy</a>
                </span>
              </label>
              {emailErrors.terms && <p className="text-sm text-red-500 -mt-2">{emailErrors.terms.message}</p>}

              <button
                type="submit"
                disabled={submitting || (hasAttempted && !emailForm.formState.isValid)}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>
          )}

          {/* ─── Phone Form ─── */}
          {method === 'phone' && (
            <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="p-name" className="block text-sm font-medium text-text-base mb-1">Full Name</label>
                <input
                  id="p-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  {...phoneForm.register('name', { required: 'Please enter your full name', minLength: { value: 2, message: 'Please enter your full name' } })}
                  className={`w-full h-11 px-3 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    phoneErrors.name ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {phoneErrors.name && <p className="text-sm text-red-500 mt-1">{phoneErrors.name.message}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="p-phone" className="block text-sm font-medium text-text-base mb-1">Phone Number</label>
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
                    id="p-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="07X XXX XXXX"
                    {...phoneForm.register('phone', { required: 'Please enter a valid mobile number' })}
                    className={`flex-1 h-11 px-3 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      phoneErrors.phone ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                </div>
                {phoneErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {phoneErrors.phone.message}
                    {phoneErrors.phone.message?.includes('already exists') && (
                      <> <Link to="/login" className="text-primary font-semibold underline">Sign in instead →</Link></>
                    )}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="p-password" className="block text-sm font-medium text-text-base mb-1">Password</label>
                <div className="relative">
                  <input
                    id="p-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    {...phoneForm.register('password', {
                      required: 'Password must be at least 8 characters and include a number and uppercase letter',
                      minLength: { value: 8, message: 'Password must be at least 8 characters and include a number and uppercase letter' },
                    })}
                    className={`w-full h-11 px-3 pr-10 rounded-lg border text-sm text-text-base placeholder:text-text-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      phoneErrors.password ? 'border-red-400' : 'border-gray-300'
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
                {phonePassword && (
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
                {phoneErrors.password && <p className="text-sm text-red-500 mt-1">{phoneErrors.password.message}</p>}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 text-xs text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  {...phoneForm.register('terms', { required: 'You must accept the terms to continue' })}
                  className="mt-0.5 accent-primary flex-shrink-0"
                />
                <span>
                  I agree to FarmWise's{' '}
                  <a href="/terms" className="text-primary underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary underline">Privacy Policy</a>
                </span>
              </label>
              {phoneErrors.terms && <p className="text-sm text-red-500 -mt-2">{phoneErrors.terms.message}</p>}

              <button
                type="submit"
                disabled={submitting || (hasAttempted && !phoneForm.formState.isValid)}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Creating account…' : 'Send OTP & Create Account'}
              </button>
            </form>
          )}

          {/* Sign in link */}
          <p className="text-sm text-text-muted text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
