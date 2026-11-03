import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="app-container">
      <div className="relative min-h-screen bg-white flex items-center justify-center overflow-hidden">
        <motion.img
          src="/agni-college-logo.png"
          alt="Agni College of Technology logo"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-[min(68vw,300px)] h-auto max-h-[48vh] object-contain"
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease: 'easeOut' }}
          className="absolute bottom-0 left-0 right-0 pb-[max(2.5rem,env(safe-area-inset-bottom))] px-5 text-center"
        >
          <h1 className="text-xl font-semibold tracking-tight text-ink-primary">
            Agni College of Technology
          </h1>
          <p className="mt-1 text-base font-medium text-ink-secondary">Sri Sai Cafe</p>
        </motion.div>
      </div>
    </div>
  );
};

export default SplashScreen;
