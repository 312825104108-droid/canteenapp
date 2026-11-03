import { motion } from 'framer-motion';

export const FilterChip = ({ label, icon, active, onClick, count }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={active}
      className={`
        h-chip px-4 flex items-center gap-2 rounded-chip border text-sm font-medium
        transition-all duration-150 cursor-pointer whitespace-nowrap flex-shrink-0
        ${active
          ? 'bg-ink-primary text-white border-ink-primary'
          : 'bg-white text-ink-secondary border-surface-border hover:border-gray-400'
        }
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`
          text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold
          ${active ? 'bg-white text-primary-500' : 'bg-primary-500 text-white'}
        `}>
          {count}
        </span>
      )}
    </motion.button>
  );
};

export default FilterChip;
