import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { mockMenuItems } from '../../data/mockData';

const QuickPickCard = ({ item, onPress }) => (
  <motion.div
    whileTap={{ scale: 0.95 }}
    onClick={() => onPress(item)}
    className="flex-shrink-0 w-40 bg-white rounded-card border border-surface-border shadow-card overflow-hidden cursor-pointer"
  >
    <div className="h-28 bg-gray-100">
      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
    </div>
    <div className="p-3">
      <p className="text-sm font-bold text-ink-primary line-clamp-1">{item.name}</p>
      <p className="text-xs text-ink-secondary">{item.sizeLabel}</p>
      <p className="text-sm font-bold text-ink-primary mt-1">?{item.price.toFixed(2)}</p>
    </div>
  </motion.div>
);

export const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const [isLoading, setIsLoading] = useState(true);

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Single canteen - Agni Canteen (o1)
  const canteenId = 'o1';
  const allItems = mockMenuItems.filter(i => i.outletId === canteenId);
  
  const popularItems = allItems.filter(i => i.isBestSeller).slice(0, 6);

  return (
    <PageLayout showBottomNav showCartBar={false}>
      {/* Header */}
      <div className="header-gradient px-4 pt-12 pb-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80">{greeting},</p>
            <h1 className="text-xl font-bold text-white">{user?.name?.split(' ')[0] || 'Student'} ??</h1>
          </div>
          
          {/* Cart Icon with Badge */}
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2 -mr-2"
          >
            <ShoppingCart size={24} className="stroke-white" strokeWidth={2} />
            {totalCartItems > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalCartItems}
              </div>
            )}
          </button>
        </div>

        {/* Search bar */}
        <button
          onClick={() => navigate('/search')}
          className="w-full h-12 bg-white rounded-chip border border-surface-border flex items-center gap-3 px-4 shadow-sm"
        >
          <Search size={18} className="stroke-ink-secondary flex-shrink-0" />
          <span className="text-ink-disabled text-base">Search dish</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-4">
        {isLoading ? (
          <div className="p-4 flex flex-col gap-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* Menu Section */}
            <div className="pt-6 pb-4">
              <div className="px-4 mb-3">
                <h2 className="text-lg font-bold text-ink-primary">Menu</h2>
              </div>
              <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                {popularItems.map(item => (
                  <QuickPickCard
                    key={item.id}
                    item={item}
                    onPress={() => navigate(`/outlet/${canteenId}`)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default HomeScreen;
