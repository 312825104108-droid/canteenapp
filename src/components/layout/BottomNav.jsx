import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Heart, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/favorites', icon: Heart, label: 'Favourites' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { orders } = useOrderStore();

  const activeCount = orders.filter(
    o => o.userId === user?.id && !['picked_up', 'cancelled'].includes(o.status)
  ).length;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                 bg-white border-t border-surface-border flex shadow-bottom-bar z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      aria-label="Main navigation"
    >
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path ||
          (path === '/orders' && location.pathname.startsWith('/orders'));

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative
                       min-h-[56px] transition-colors duration-150"
          >
            <div className="relative">
              <Icon
                size={22}
                className={`transition-colors duration-150 ${
                  isActive ? 'stroke-primary-500' : 'stroke-ink-secondary'
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {/* Badge for active orders */}
              {path === '/orders' && activeCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-primary-500 text-white
                                 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>

            <span className={`text-[10px] font-medium transition-colors duration-150 ${
              isActive ? 'text-primary-500' : 'text-ink-secondary'
            }`}>
              {label}
            </span>

            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="nav-dot"
                className="absolute top-1 w-1 h-1 rounded-full bg-primary-500"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
