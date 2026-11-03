import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import Button from '../components/ui/Button';

const slides = [
  {
    id: 0,
    title: 'Skip the Queue',
    subtitle: 'Pre-order your favourite canteen food from anywhere on campus.',
    illustration: (
      <svg width="240" height="200" viewBox="0 0 240 200" fill="none">
        <circle cx="120" cy="100" r="80" fill="#FFF9E6" />
        {/* Phone */}
        <rect x="90" y="50" width="60" height="100" rx="10" fill="white" stroke="#FFC233" strokeWidth="2" />
        <rect x="95" y="60" width="50" height="70" rx="4" fill="#FFF6DC" />
        {/* Food items on screen */}
        <rect x="99" y="64" width="20" height="20" rx="3" fill="#FFC233" opacity="0.6" />
        <rect x="124" y="64" width="16" height="8" rx="2" fill="#E5E7EB" />
        <rect x="124" y="74" width="12" height="6" rx="2" fill="#E5E7EB" />
        <rect x="99" y="88" width="20" height="20" rx="3" fill="#FFC233" opacity="0.4" />
        <rect x="124" y="88" width="16" height="8" rx="2" fill="#E5E7EB" />
        <rect x="124" y="98" width="12" height="6" rx="2" fill="#E5E7EB" />
        {/* Cart button */}
        <rect x="99" y="118" width="42" height="10" rx="5" fill="#FFC233" />
        {/* Arrow going up */}
        <path d="M175 120l-20-30-20 30" stroke="#FFC233" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Checkmark */}
        <circle cx="175" cy="85" r="12" fill="#2E7D32" />
        <path d="M170 85l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 1,
    title: 'Choose Your Pickup Slot',
    subtitle: 'Pick a time slot and walk right in. Your food will be ready exactly when you arrive.',
    illustration: (
      <svg width="240" height="200" viewBox="0 0 240 200" fill="none">
        <circle cx="120" cy="100" r="80" fill="#FFF9E6" />
        {/* Clock */}
        <circle cx="120" cy="90" r="40" fill="white" stroke="#FFC233" strokeWidth="2.5" />
        <path d="M120 70v20l14 8" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Slot chips */}
        <rect x="55" y="148" width="55" height="22" rx="11" fill="#FFC233" />
        <text x="82" y="163" textAnchor="middle" fontSize="10" fontWeight="600" fill="#111">10:30</text>
        <rect x="116" y="148" width="55" height="22" rx="11" fill="white" stroke="#E6E6E6" strokeWidth="1.5" />
        <text x="143" y="163" textAnchor="middle" fontSize="10" fill="#6B6B6B">11:00</text>
        {/* Check on first slot */}
        <circle cx="96" cy="148" r="7" fill="#2E7D32" />
        <path d="M93 148l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Pay Securely',
    subtitle: 'Continue to UPI checkout after selecting your preferred pickup time.',
    illustration: (
      <svg width="240" height="200" viewBox="0 0 240 200" fill="none">
        <circle cx="120" cy="100" r="80" fill="#FFF9E6" />
        {/* Card */}
        <rect x="65" y="65" width="110" height="70" rx="12" fill="white" stroke="#E6E6E6" strokeWidth="1.5" />
        <rect x="65" y="65" width="110" height="28" rx="12" fill="#FFC233" />
        <rect x="65" y="81" width="110" height="12" rx="0" fill="#FFC233" />
        <rect x="78" y="104" width="40" height="8" rx="4" fill="#E5E7EB" />
        <rect x="78" y="116" width="28" height="6" rx="3" fill="#E5E7EB" />
        {/* UPI logos */}
        <circle cx="90" cy="155" r="14" fill="white" stroke="#E6E6E6" strokeWidth="1" />
        <text x="90" y="159" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0B5EAB">G</text>
        <circle cx="120" cy="155" r="14" fill="white" stroke="#E6E6E6" strokeWidth="1" />
        <text x="120" y="159" textAnchor="middle" fontSize="9" fontWeight="700" fill="#5F259F">Pe</text>
        <circle cx="150" cy="155" r="14" fill="white" stroke="#E6E6E6" strokeWidth="1" />
        <text x="150" y="159" textAnchor="middle" fontSize="9" fontWeight="700" fill="#00BAF2">P</text>
        {/* Shield */}
        <path d="M155 75c0-4 3-6 5-7 2 1 5 3 5 7 0 5-5 8-5 8s-5-3-5-8z" fill="#2E7D32" />
        <path d="M157 79l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export const OnboardingScreen = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { setHasSeenOnboarding } = useAppStore();

  const goNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    setHasSeenOnboarding();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        {/* Skip */}
        <div className="flex justify-end px-6 pt-12">
          <button
            onClick={handleDone}
            className="text-ink-secondary text-base font-medium py-2 px-4 touch-target"
          >
            Skip
          </button>
        </div>

        {/* Slides */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center"
            >
              {/* Illustration */}
              <div className="mb-8">
                {slides[current].illustration}
              </div>

              {/* Text */}
              <h2 className="text-2xl font-bold text-ink-primary mb-3">
                {slides[current].title}
              </h2>
              <p className="text-base text-ink-secondary leading-relaxed max-w-xs">
                {slides[current].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots + buttons */}
        <div className="px-6 pb-12 flex flex-col gap-6">
          {/* Dot indicators */}
          <div className="flex justify-center gap-2">
            {slides.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                animate={{ width: i === current ? 24 : 8 }}
                className={`h-2 rounded-full transition-colors duration-200
                  ${i === current ? 'bg-primary-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {/* Button */}
          <Button
            onClick={goNext}
            variant="primary"
            fullWidth
            size="lg"
          >
            {current === slides.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
