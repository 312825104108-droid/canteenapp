import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { createStaffSession } from '../../utils/api';
import { demoAccounts } from '../../data/demoAccounts';
import { isLocalDemoEnabled } from '../../utils/demoMode';
import toast from 'react-hot-toast';

export const StaffLoginScreen = () => {
  const navigate = useNavigate();
  const { staffLogin, demoLogin } = useAuthStore();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await demoLogin('admin', demoAccounts.admin.email, demoAccounts.admin.password);
      toast.success('Local demo admin signed in. Live orders and payments are disabled.');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not start the local demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      toast.error('Enter 4-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      await createStaffSession(pin);
      const result = staffLogin();
      if (!result.success) throw new Error(result.error);
      toast.success('Welcome to Staff Dashboard');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Staff login failed');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="header-gradient px-4 pt-12 pb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full mb-6">
            <ArrowLeft size={20} className="stroke-ink-primary" />
          </button>
          <h1 className="text-2xl font-bold text-ink-primary">Staff Login</h1>
          <p className="text-ink-secondary mt-1">Enter your 4-digit PIN to access the staff dashboard</p>
        </div>

        {/* PIN display */}
        <div className="flex-1 flex flex-col items-center px-6 pt-12">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-8">
            <Lock size={24} className="stroke-primary-500" />
          </div>

          <div className="flex gap-4 mb-12">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ scale: pin.length > i ? 1.1 : 1 }}
                className={`w-14 h-14 rounded-card border-2 flex items-center justify-center text-2xl font-bold
                  ${pin.length > i ? 'border-primary-500 bg-primary-50' : 'border-surface-border bg-white'}`}
              >
                {pin.length > i ? '●' : ''}
              </motion.div>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
              <button
                key={digit}
                onClick={() => handlePinInput(digit.toString())}
                disabled={pin.length >= 4}
                className="w-full aspect-square rounded-card border-2 border-surface-border bg-white
                           text-2xl font-bold text-ink-primary active:bg-surface-bg transition-colors
                           disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
            <div /> {/* Empty cell */}
            <button
              onClick={() => handlePinInput('0')}
              disabled={pin.length >= 4}
              className="w-full aspect-square rounded-card border-2 border-surface-border bg-white
                         text-2xl font-bold text-ink-primary active:bg-surface-bg transition-colors
                         disabled:opacity-50"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={pin.length === 0}
              className="w-full aspect-square rounded-card border-2 border-surface-border bg-white
                         text-base font-bold text-ink-primary active:bg-surface-bg transition-colors
                         disabled:opacity-30"
            >
              ⌫
            </button>
          </div>

          {/* Login button */}
          <Button
            onClick={handleLogin}
            loading={isLoading}
            disabled={pin.length !== 4}
            fullWidth
            size="lg"
            className="max-w-xs"
          >
            Login
          </Button>
          {isLocalDemoEnabled && (
            <div className="w-full max-w-xs mt-6 rounded-card border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-bold text-ink-primary">Local demo admin</p>
              <p className="mt-1 text-xs text-ink-secondary">Email: {demoAccounts.admin.email}</p>
              <p className="text-xs text-ink-secondary">Password: {demoAccounts.admin.password}</p>
              <p className="mt-2 text-xs text-amber-900">This demo cannot view or modify real orders.</p>
              <Button onClick={handleDemoLogin} loading={isLoading} fullWidth size="md" className="mt-3">
                Continue as Demo Admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffLoginScreen;
