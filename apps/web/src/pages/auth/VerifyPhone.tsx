import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Leaf, Loader2 } from 'lucide-react';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const phone = sessionStorage.getItem('verifyPhone') || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [countdown, setCountdown] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-submit when all 4 digits filled
  useEffect(() => {
    const code = digits.join('');
    if (code.length === 4 && !verifying && !locked) {
      const timer = setTimeout(() => submitOtp(code), 300);
      return () => clearTimeout(timer);
    }
  }, [digits, verifying, locked]);

  const submitOtp = async (otp: string) => {
    setError('');
    setVerifying(true);
    try {
      const res = await fetchApi('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
      setAuth(res.user, res.accessToken);
      toast.success('Phone verified! Welcome to AAN Academy');
      navigate('/my-learning');
    } catch (err: any) {
      const status = err.status || err.statusCode;
      if (status === 429) {
        setError('Too many attempts. Request a new code.');
        setLocked(true);
      } else if (status === 410) {
        setError('Code expired. Please request a new one.');
      } else {
        const remaining = attemptsLeft - 1;
        setAttemptsLeft(remaining);
        if (remaining <= 0) {
          setError('Too many attempts. Request a new code.');
          setLocked(true);
        } else {
          setError(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        }
      }
      // Shake and clear
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleInput = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 3 : nextEmpty]?.focus();
  };

  const handleResend = useCallback(async () => {
    if (resendCount >= 3) return;
    try {
      await fetchApi('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      toast.success('New code sent!');
      setResendCount((c) => c + 1);
      setCountdown(60);
      setAttemptsLeft(5);
      setLocked(false);
      setError('');
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend. Try again later.');
    }
  }, [phone, resendCount]);

  // Mask phone for display
  const maskedPhone = phone
    ? phone.slice(0, 4) + ' ' + phone.slice(4, 7) + ' XXX ' + phone.slice(-3)
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold text-primary">AAN Academy</span>
          </div>

          <h2 className="text-xl font-bold text-text-base mb-1">Enter the code we sent to:</h2>
          <p className="text-sm font-bold text-text-base">{maskedPhone}</p>
          <p className="text-sm text-text-muted mt-3 mb-6">Enter the 4-digit code:</p>

          {/* OTP Inputs */}
          <div
            className={`flex justify-center gap-2 mb-4 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
            onPaste={handlePaste}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={locked || verifying}
                className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-lg transition-colors focus:outline-none focus:border-primary ${
                  error ? 'border-red-400' : 'border-gray-300'
                } disabled:bg-gray-50 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {/* Verifying spinner */}
          {verifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-text-muted mb-4">
              <Loader2 size={14} className="animate-spin" />
              Verifying…
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {/* Resend */}
          <div className="mt-6">
            {resendCount >= 3 ? (
              <p className="text-sm text-text-muted">Maximum resends reached. Contact support.</p>
            ) : countdown > 0 ? (
              <p className="text-sm text-text-muted">Resend in {countdown}s</p>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary font-semibold text-sm hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                Resend code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
