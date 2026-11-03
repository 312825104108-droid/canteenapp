import { motion, AnimatePresence } from 'framer-motion';

// Dark quantity stepper (– qty +)
export const Stepper = ({ value, onIncrease, onDecrease, min = 0, max = 5, size = 'md' }) => {
  const sizes = {
    sm: { btn: 'w-7 h-7 text-sm', num: 'w-8 text-sm', wrap: 'h-8' },
    md: { btn: 'w-9 h-9 text-base', num: 'w-9 text-base', wrap: 'h-9' },
    lg: { btn: 'w-11 h-11 text-lg', num: 'w-11 text-lg', wrap: 'h-11' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center bg-surface-dark rounded-button ${s.wrap}`}>
      <button
        onClick={onDecrease}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${s.btn} flex items-center justify-center text-white font-bold
          active:bg-gray-700 rounded-l-button transition-colors
          disabled:opacity-40`}
      >
        −
      </button>

      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={`${s.num} text-center text-white font-bold select-none`}
        >
          {value}
        </motion.span>
      </AnimatePresence>

      <button
        onClick={onIncrease}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${s.btn} flex items-center justify-center text-white font-bold
          active:bg-gray-700 rounded-r-button transition-colors
          disabled:opacity-40`}
      >
        +
      </button>
    </div>
  );
};

// Add button that transitions to stepper
export const AddButton = ({ itemId, qty, onAdd, onIncrease, onDecrease, max = 5, size = 'md' }) => {
  const sizes = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-9 px-5 text-sm',
    lg: 'h-11 px-6 text-base',
  };

  if (qty > 0) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Stepper
          value={qty}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          min={0}
          max={max}
          size={size}
        />
      </motion.div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onAdd}
      aria-label="Add to cart"
      className={`
        ${sizes[size]} bg-surface-dark text-white font-semibold rounded-button
        flex items-center justify-center gap-1 transition-all duration-150
        hover:bg-gray-800 active:scale-95
      `}
    >
      <span className="text-lg leading-none">+</span>
      <span>Add</span>
    </motion.button>
  );
};

export default Stepper;
