import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import ItemCard from '../../components/ui/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { mockMenuItems, mockOutlets } from '../../data/mockData';

export const FavoritesScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const favoriteItems = mockMenuItems.filter(item => user?.favorites?.includes(item.id));

  // Group by outlet
  const grouped = favoriteItems.reduce((acc, item) => {
    const outlet = mockOutlets.find(o => o.id === item.outletId);
    if (!outlet) return acc;
    if (!acc[outlet.id]) {
      acc[outlet.id] = { outlet, items: [] };
    }
    acc[outlet.id].items.push(item);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  return (
    <PageLayout showBottomNav showCartBar>
      {/* Header */}
      <div className="header-gradient px-4 pt-12 pb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-ink-primary flex items-center gap-2">
          <Heart size={24} className="fill-red-500 stroke-red-500" />
          Favourites
        </h1>
        <p className="text-ink-secondary text-sm mt-1">
          {favoriteItems.length} {favoriteItems.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40">
        {favoriteItems.length === 0 ? (
          <EmptyState
            type="favorites"
            title="No favourites yet"
            description="Tap the heart icon on any item to save it here for quick access."
            ctaLabel="Browse Menu"
            onCta={() => navigate('/home')}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map(({ outlet, items }) => (
              <motion.div
                key={outlet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Outlet header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-ink-primary">{outlet.name}</h2>
                  <button
                    onClick={() => navigate(`/outlet/${outlet.id}`)}
                    className="text-blue-link text-sm font-semibold"
                  >
                    View menu
                  </button>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-3">
                  {items.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      outletId={outlet.id}
                      outletName={outlet.name}
                      onCardClick={() => navigate(`/outlet/${outlet.id}`)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default FavoritesScreen;
