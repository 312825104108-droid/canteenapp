import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart, SlidersHorizontal, Star, Clock, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import ItemCard from '../../components/ui/ItemCard';
import FilterChip from '../../components/ui/FilterChip';
import VegIcon from '../../components/ui/VegIcon';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { mockOutlets, mockMenuItems } from '../../data/mockData';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  { name: 'Breakfast', icon: '🍳' },
  { name: 'Lunch', icon: '🍛' },
  { name: 'Snacks', icon: '🥪' },
  { name: 'Beverages', icon: '☕' },
];

// Helper functions
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const getUserFirstName = () => {
  const { user } = useAuthStore.getState();
  return user?.name?.split(' ')[0] || 'there';
};

export const OutletMenuScreen = () => {
  const { outletId: paramOutletId } = useParams();
  const navigate = useNavigate();

  // Default to 'o1' (Agni Canteen) if no outletId in params (for home page use)
  const outletId = paramOutletId || 'o1';

  const outlet = mockOutlets.find(o => o.id === outletId);
  const allItems = mockMenuItems.filter(i => i.outletId === outletId);

  const [activeTab, setActiveTab] = useState(CATEGORIES[0].name);
  const [search, setSearch] = useState('');
  const [vegFilter, setVegFilter] = useState('all'); // 'all' | 'veg' | 'nonveg'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price_asc' | 'price_desc' | 'popular'
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const tabsRef = useRef(null);
  const { items: cartItems } = useCartStore();
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (!outlet) {
    return (
      <PageLayout>
        <div className="p-8 text-center">Outlet not found</div>
      </PageLayout>
    );
  }

  const filterAndSort = (items) => {
    let filtered = [...items];
    if (search) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (vegFilter === 'veg') filtered = filtered.filter(i => i.vegType === 'veg');
    if (vegFilter === 'nonveg') filtered = filtered.filter(i => i.vegType === 'nonveg');
    
    if (sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'popular') filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    return filtered;
  };

  const getTabItems = (tab) => {
    return filterAndSort(allItems.filter(item => item.category === tab));
  };

  const currentItems = search
    ? filterAndSort(allItems)
    : getTabItems(activeTab);

  const scrollToTab = (tab) => {
    setActiveTab(tab);
    const el = tabsRef.current?.querySelector(`[data-tab="${tab}"]`);
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  };

  return (
    <PageLayout showBottomNav>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Header — Blue gradient like in screenshot */}
        <div className="header-gradient px-4 pt-12 pb-4 flex-shrink-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <img
              src="/agni-college-logo.png"
              alt="Agni College of Technology"
              className="h-12 w-12 object-contain"
            />
            <img
              src="/sri-sai-cafe-logo.png"
              alt="Sri Sai Cafe"
              className="h-12 w-36 object-contain"
            />
          </div>
          {/* Greeting */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm text-white/80">Good {getGreeting()},</p>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {getUserFirstName()} 👋
              </h1>
            </div>
            <button
              onClick={() => navigate('/cart')}
              aria-label={`Open cart${totalCartItems > 0 ? `, ${totalCartItems} items` : ''}`}
              className="relative -mr-2 p-2 text-white"
            >
              <ShoppingCart size={24} strokeWidth={2} />
              {totalCartItems > 0 && (
                <span className="absolute -top-0.5 right-0 min-w-5 h-5 px-1 rounded-full bg-red-500
                                 text-white text-xs font-bold flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 stroke-ink-secondary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dish"
              className="w-full h-11 pl-10 pr-4 rounded-chip bg-white border border-white/60
                         text-sm text-ink-primary placeholder:text-ink-disabled focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className="stroke-ink-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="px-4 pt-6 pb-2 bg-white">
          <h2 className="text-xl font-bold text-ink-primary mb-4">Categories</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map(({ name, icon }) => {
              const itemCount = allItems.filter(item => item.category === name && item.isAvailable).length;
              return (
                <button
                  key={name}
                  onClick={() => scrollToTab(name)}
                  aria-pressed={activeTab === name}
                  className="flex-shrink-0 flex flex-col items-center gap-2 w-24"
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl
                                   transition-transform hover:scale-105
                                   ${activeTab === name ? 'bg-primary-50 ring-2 ring-primary-500' : 'bg-surface-bg'}`}>
                    {icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-ink-primary whitespace-nowrap">{name}</p>
                    <p className="text-xs text-ink-secondary">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu section header */}
        <div className="px-4 pt-6 pb-3 bg-white">
          <h2 className="text-xl font-bold text-ink-primary flex items-center gap-1">
            Explore Menu
          </h2>
        </div>

        {/* Tabs - hidden, but functionality kept for filters */}
        <div
          ref={tabsRef}
          className="hidden overflow-x-auto scrollbar-hide border-b border-surface-border bg-white flex-shrink-0"
        >
          {CATEGORIES.map(({ name: tab }) => (
            <button
              key={tab}
              data-tab={tab}
              onClick={() => scrollToTab(tab)}
              aria-selected={activeTab === tab}
              className={`
                flex-shrink-0 px-4 py-3.5 text-sm font-medium transition-colors duration-150
                relative whitespace-nowrap
                ${activeTab === tab ? 'text-ink-primary' : 'text-ink-secondary'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide flex-shrink-0 border-b border-surface-border">
          {/* Filters button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`h-chip px-4 flex items-center gap-2 rounded-chip border text-sm font-medium
                        flex-shrink-0 transition-all duration-150
                        ${showFilters ? 'bg-ink-primary text-white border-ink-primary' : 'bg-white text-ink-secondary border-surface-border'}`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {sortBy !== 'default' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            )}
          </motion.button>

          {/* Veg filter chips */}
          <FilterChip
            label="Veg"
            icon={<VegIcon type="veg" size={14} />}
            active={vegFilter === 'veg'}
            onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
          />
          <FilterChip
            label="Non Veg"
            icon={<VegIcon type="nonveg" size={14} />}
            active={vegFilter === 'nonveg'}
            onClick={() => setVegFilter(vegFilter === 'nonveg' ? 'all' : 'nonveg')}
          />
        </div>

        {/* Sort options dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-surface-border bg-surface-bg px-4 py-3"
            >
              <p className="text-xs font-semibold text-ink-secondary mb-2">Sort by</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'default', label: 'Default' },
                  { value: 'popular', label: 'Popular' },
                  { value: 'price_asc', label: 'Price: Low to High' },
                  { value: 'price_desc', label: 'Price: High to Low' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-3 py-1.5 rounded-chip text-xs font-medium border transition-all
                      ${sortBy === opt.value
                        ? 'bg-ink-primary text-white border-ink-primary'
                        : 'bg-white text-ink-secondary border-surface-border'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : currentItems.length === 0 ? (
            <EmptyState
              type="search"
              title="No items found"
              description="Try adjusting your filters or search term."
              ctaLabel="Clear Filters"
              onCta={() => { setSearch(''); setVegFilter('all'); }}
            />
          ) : (
            <>
              {/* Section header */}
              {!search && (
                <h2 className="text-lg font-bold text-ink-primary mb-3">{activeTab}</h2>
              )}
              <div className="flex flex-col gap-4">
                {currentItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    outletId={outlet.id}
                    outletName={outlet.name}
                    onCardClick={setSelectedItem}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cart bar - positioned above bottom nav */}
        <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 px-4 pb-2 pointer-events-none">
          <CartBarInline />
        </div>
      </div>

      {/* Item detail bottom sheet */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailSheet
            item={selectedItem}
            outlet={outlet}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
};

// Inline cart bar (not using CartBar component to avoid bottom nav gap)
const CartBarInline = () => {
  const navigate = useNavigate();
  const { items, outletName } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => {
    const m = mockMenuItems.find(m => m.id === i.itemId);
    return s + (m ? m.price * i.qty : 0);
  }, 0);
  const total = subtotal + Math.round(subtotal * 0.05 * 100) / 100;

  if (totalItems === 0) return null;
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto bg-surface-dark rounded-card px-4 py-3 flex items-center justify-between shadow-bottom-bar"
    >
      <div className="flex flex-col">
        <span className="text-white font-bold text-base">{totalItems} {totalItems === 1 ? 'item' : 'items'} · ₹{total.toFixed(2)}</span>
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wide mt-0.5">{outletName}</span>
      </div>
      <button
        onClick={() => navigate('/cart')}
        className="bg-primary-500 text-white font-bold px-5 py-2.5 rounded-button text-sm flex items-center gap-1.5 active:scale-95"
      >
        Checkout <ChevronDown size={14} className="rotate-[-90deg]" />
      </button>
    </motion.div>
  );
};

// Item detail bottom sheet
const ItemDetailSheet = ({ item, outlet, onClose }) => {
  const { getItemQty, addItem, removeItem } = useCartStore();
  const qty = getItemQty(item.id);
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);

  const toggleCustomization = (cust) => {
    setSelectedCustomizations(prev =>
      prev.includes(cust.id) ? prev.filter(id => id !== cust.id) : [...prev, cust.id]
    );
  };

  const extraCost = item.customizations
    .filter(c => selectedCustomizations.includes(c.id))
    .reduce((s, c) => s + c.price, 0);

  const totalPrice = (item.price + extraCost) * (qty || 1);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />
      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-[24px] z-50 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="overflow-y-auto flex-1 pb-4">
          {/* Image */}
          <div className="relative mx-4 mt-2 h-48 rounded-card overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="px-5 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <VegIcon type={item.vegType} size={18} />
                </div>
                <h2 className="text-xl font-bold text-ink-primary">{item.name}</h2>
                <p className="text-sm text-ink-secondary mt-0.5">{item.sizeLabel}</p>
                <p className="text-base font-bold text-ink-primary mt-1">₹{item.price.toFixed(2)}</p>
              </div>
            </div>

            {item.description && (
              <p className="text-sm text-ink-secondary mt-3 leading-relaxed">{item.description}</p>
            )}

            {/* Customizations */}
            {item.customizations?.length > 0 && (
              <div className="mt-5">
                <h3 className="text-base font-semibold text-ink-primary mb-3">Add-ons</h3>
                <div className="flex flex-col gap-2">
                  {item.customizations.map(c => (
                    <label
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-card border border-surface-border cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomizations.includes(c.id)}
                          onChange={() => toggleCustomization(c)}
                          className="w-5 h-5 accent-primary-500"
                        />
                        <span className="text-sm font-medium text-ink-primary">{c.name}</span>
                      </div>
                      {c.price > 0 && (
                        <span className="text-sm font-semibold text-ink-primary">+₹{c.price.toFixed(2)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add button */}
        <div className="flex-shrink-0 px-4 pb-8 pt-3 border-t border-surface-border bg-white">
          {qty > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-surface-dark rounded-button h-12">
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-12 h-12 flex items-center justify-center text-white font-bold text-xl"
                >
                  −
                </button>
                <span className="w-10 text-center text-white font-bold">{qty}</span>
                <button
                  onClick={() => {
                    if (qty < item.maxQtyPerOrder) addItem(item.id, outlet.id, outlet.name);
                  }}
                  className="w-12 h-12 flex items-center justify-center text-white font-bold text-xl"
                >
                  +
                </button>
              </div>
              <button
                onClick={onClose}
                className="flex-1 ml-3 h-12 bg-primary-500 text-white font-bold rounded-button flex items-center justify-center text-base"
              >
                Done · ₹{(item.price * qty).toFixed(2)}
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item.id, outlet.id, outlet.name)}
              className="btn-primary"
            >
              Add to Cart · ₹{totalPrice.toFixed(2)}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default OutletMenuScreen;
