import { motion } from 'framer-motion';
import Button from './Button';

const illustrations = {
  cart: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#FFF9E6" />
      <path d="M30 35h8l10 40h34l8-28H44" stroke="#FFC233" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="52" cy="82" r="5" fill="#FFC233" />
      <circle cx="76" cy="82" r="5" fill="#FFC233" />
      <path d="M50 50h6M50 58h12M50 66h8" stroke="#E6E6E6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  orders: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#F0F7FF" />
      <rect x="32" y="28" width="56" height="64" rx="8" stroke="#1F6FEB" strokeWidth="2.5" fill="none" />
      <path d="M44 48h32M44 60h24M44 72h20" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  offline: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#FFF0F0" />
      <path d="M25 45c9.5-9.5 22.5-15 35-15s25.5 5.5 35 15" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M35 57c6.7-6.7 15.9-10.7 25-10.7s18.3 4 25 10.7" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M46 69c3.7-3.7 8.7-5.7 14-5.7s10.3 2 14 5.7" stroke="#E5E7EB" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="82" r="5" fill="#DC2626" />
      <line x1="28" y1="28" x2="92" y2="92" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  favorites: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#FFF0F5" />
      <path d="M60 82C60 82 32 64 32 44c0-8.8 7.2-16 16-16 4.8 0 9.1 2.1 12 5.5C62.9 30.1 67.2 28 72 28c8.8 0 16 7.2 16 16 0 20-28 38-28 38z" stroke="#F43F5E" strokeWidth="2.5" fill="none" />
    </svg>
  ),
  search: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#F8F8F8" />
      <circle cx="52" cy="52" r="20" stroke="#CBD5E1" strokeWidth="3" fill="none" />
      <path d="M67 67l18 18" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 52h16M52 44v16" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  closed: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#FFF9E6" />
      <circle cx="60" cy="60" r="28" stroke="#FFC233" strokeWidth="3" fill="none" />
      <path d="M60 36v24l16 8" stroke="#FFC233" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  error: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="55" fill="#FFF0F0" />
      <circle cx="60" cy="60" r="28" stroke="#DC2626" strokeWidth="2.5" fill="none" />
      <path d="M60 44v20M60 72v4" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export const EmptyState = ({
  type = 'search',
  title,
  description,
  ctaLabel,
  onCta,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="mb-6">
        {illustrations[type] || illustrations.search}
      </div>
      <h3 className="text-xl font-bold text-ink-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink-secondary mb-6 max-w-xs">{description}</p>
      )}
      {ctaLabel && onCta && (
        <Button onClick={onCta} variant="primary" className="px-8">
          {ctaLabel}
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
