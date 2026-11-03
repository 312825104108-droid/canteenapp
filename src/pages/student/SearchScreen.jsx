import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ItemCard from '../../components/ui/ItemCard';
import EmptyState from '../../components/ui/EmptyState';
import { mockMenuItems, mockOutlets } from '../../data/mockData';
import { useAppStore } from '../../store/appStore';

export const SearchScreen = () => {
  const navigate = useNavigate();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = mockMenuItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
    setResults(filtered);
  }, [query]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
  };

  const groupedResults = results.reduce((acc, item) => {
    const outlet = mockOutlets.find(o => o.id === item.outletId);
    if (!outlet) return acc;
    if (!acc[outlet.id]) {
      acc[outlet.id] = { outlet, items: [] };
    }
    acc[outlet.id].items.push(item);
    return acc;
  }, {});

  const groups = Object.values(groupedResults);

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        {/* Search header */}
        <div className="header-gradient px-4 pt-12 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full">
              <ArrowLeft size={20} className="stroke-ink-primary" />
            </button>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 stroke-ink-secondary" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search dishes, outlets..."
                autoFocus
                className="w-full h-11 pl-11 pr-10 rounded-chip bg-white border border-white/60
                           text-sm text-ink-primary placeholder:text-ink-disabled focus:outline-none shadow-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
                >
                  <X size={16} className="stroke-ink-secondary" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
          <AnimatePresence mode="wait">
            {!query ? (
              <motion.div
                key="recent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Popular searches */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="stroke-ink-secondary" />
                    <h2 className="text-sm font-bold text-ink-secondary">Popular Searches</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Dosa', 'Coffee', 'Samosa', 'Idli', 'Parotta'].map(term => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-4 py-2 bg-surface-bg rounded-chip text-sm font-medium text-ink-primary hover:bg-primary-50 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="stroke-ink-secondary" />
                        <h2 className="text-sm font-bold text-ink-secondary">Recent Searches</h2>
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-blue-link text-xs font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {recentSearches.map((term, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(term)}
                          className="flex items-center gap-3 p-3 hover:bg-surface-bg rounded-card transition-colors text-left"
                        >
                          <Clock size={14} className="stroke-ink-secondary" />
                          <span className="text-sm text-ink-primary">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : results.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EmptyState
                  type="search"
                  title="No results found"
                  description={`We couldn't find anything for "${query}"`}
                />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-8"
              >
                <p className="text-sm text-ink-secondary">
                  Found <span className="font-bold text-ink-primary">{results.length}</span> {results.length === 1 ? 'result' : 'results'}
                </p>

                {groups.map(({ outlet, items }) => (
                  <div key={outlet.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-ink-primary">{outlet.name}</h2>
                      <button
                        onClick={() => navigate(`/outlet/${outlet.id}`)}
                        className="text-blue-link text-sm font-semibold"
                      >
                        View menu
                      </button>
                    </div>
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
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SearchScreen;
