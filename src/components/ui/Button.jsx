import { motion } from 'framer-motion';

export const Button = ({
  children,
  onClick,
  variant = 'primary', // primary | secondary | ghost | danger
  size = 'md', // sm | md | lg
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  className = '',
  type = 'button',
  ...props
}) => {
  const base = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-button
    transition-all duration-150 cursor-pointer select-none
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.97]
  `;

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-surface-dark text-white hover:bg-gray-800',
    outline: 'bg-white border-2 border-surface-border text-ink-primary hover:border-primary-500',
    ghost: 'bg-transparent text-ink-secondary hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    link: 'bg-transparent text-blue-link underline p-0',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-button px-8 text-base',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${size !== 'lg' || variant !== 'link' ? sizes[size] : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </motion.button>
  );
};

export default Button;
