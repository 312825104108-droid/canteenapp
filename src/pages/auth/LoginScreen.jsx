import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { COLLEGE_DOMAINS } from '../../data/mockData';
import { requestStudentOtp } from '../../utils/api';
import { getSupabaseClient } from '../../utils/supabase';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

// OTP Input component
const OtpInput = ({ value, onChange }) => {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    const newOtp = [...digits];
    if (val.length > 1) {
      // Pasting
      const pasted = val.slice(0, 6);
      onChange(pasted);
      const next = document.getElementById(`otp-${Math.min(pasted.length - 1, 5)}`);
      next?.focus();
      return;
    }
    newOtp[idx] = val;
    onChange(newOtp.join(''));
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          aria-label={`OTP digit ${i + 1}`}
          className={`
            w-12 h-14 text-center text-xl font-bold rounded-card border-2
            transition-all duration-150
            ${d ? 'border-primary-500 bg-primary-50' : 'border-surface-border bg-white'}
          `}
        />
      ))}
    </div>
  );
};

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const isValidEmail = (e) => {
    return COLLEGE_DOMAINS.some(d => e.toLowerCase().endsWith('@' + d));
  };

  const handleSendOtp = async () => {
    if (!isValidEmail(email)) {
      toast.error('Please use your college email address');
      return;
    }
    setIsLoading(true);
    try {
      getSupabaseClient();
      await requestStudentOtp(email.trim().toLowerCase());
      setStep('otp');
      setOtp('');
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer(t => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
      toast.success('A verification code has been sent to your college email.');
    } catch (error) {
      toast.error(error.message || 'Could not send the verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter all 6 digits');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email, otp);
      if (!result.success) {
        toast.error(result.error || 'Email verification failed.');
        return;
      }
      if (result.isNewUser) {
        navigate('/profile-setup', { replace: true });
      } else {
        toast.success('Welcome back!');
        navigate('/home', { replace: true });
      }
    } catch (error) {
      toast.error(error.message || 'Email verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="header-gradient px-6 pt-14 pb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14c0 4.4 3.6 8 8 8s8-3.6 8-8H6z" fill="#0252A1" />
                <path d="M4 14h20" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10 11c0-1.5 1.5-1.5 1.5-3M14 11c0-1.5 1.5-1.5 1.5-3M18 11c0-1.5 1.5-1.5 1.5-3" stroke="#0252A1" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-primary">Agni</h1>
              <p className="text-xs text-ink-secondary">Canteen Pre-Booking</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div key="email-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold text-ink-primary">Welcome! 👋</h2>
                <p className="text-ink-secondary mt-1">Enter your college email to get started</p>
              </motion.div>
            ) : (
              <motion.div key="otp-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-2xl font-bold text-ink-primary">Verify OTP 🔐</h2>
                <p className="text-ink-secondary mt-1">Code sent to <span className="font-semibold text-ink-primary">{email}</span></p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pt-8 pb-6">
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-sm font-semibold text-ink-secondary mb-2 block">
                    College Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 stroke-ink-secondary" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      placeholder="you@act.edu.in"
                      autoComplete="email"
                      className="w-full h-[56px] pl-12 pr-4 border-2 border-surface-border rounded-card
                                 text-base text-ink-primary bg-white transition-all duration-150
                                 focus:border-primary-500 focus:shadow-none placeholder:text-ink-disabled"
                    />
                  </div>
                  <p className="text-xs text-ink-secondary mt-2">
                    Use your college email ending with @act.edu.in
                  </p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  loading={isLoading}
                  disabled={!email}
                  fullWidth
                  size="lg"
                  iconRight={<ArrowRight size={18} />}
                >
                  Send OTP
                </Button>

                {/* Staff login link */}
                <div className="text-center pt-4">
                  <span className="text-ink-secondary text-sm">Are you canteen staff? </span>
                  <button
                    onClick={() => navigate('/staff-login')}
                    className="text-blue-link text-sm font-semibold"
                  >
                    Staff Login
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <label className="text-sm font-semibold text-ink-secondary mb-4 block text-center">
                    Enter 6-digit OTP
                  </label>
                  <OtpInput value={otp} onChange={setOtp} />
                  {/* Demo hint */}
                  <p className="text-center text-xs text-ink-secondary mt-3">
                    Enter the one-time code sent to your college email.
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  loading={isLoading}
                  disabled={otp.length !== 6}
                  fullWidth
                  size="lg"
                  icon={<ShieldCheck size={18} />}
                >
                  Verify & Login
                </Button>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-ink-secondary text-sm">
                      Resend OTP in <span className="font-bold text-ink-primary">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="text-blue-link text-sm font-semibold"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Back */}
                <button
                  onClick={() => setStep('email')}
                  className="text-ink-secondary text-sm text-center"
                >
                  ← Change email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
