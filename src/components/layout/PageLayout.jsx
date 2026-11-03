import { motion } from 'framer-motion';
import BottomNav from './BottomNav';
import CartBar from './CartBar';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.2,
};

export const PageLayout = ({
  children,
  showBottomNav = true,
  showCartBar = false,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className="app-container">
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`
          min-h-screen flex flex-col
          ${showBottomNav ? 'pb-[64px]' : ''}
          ${showCartBar ? 'pb-[160px]' : ''}
          ${noPadding ? '' : ''}
          ${className}
        `}
      >
        {children}
      </motion.div>

      {showCartBar && <CartBar />}
      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default PageLayout;

