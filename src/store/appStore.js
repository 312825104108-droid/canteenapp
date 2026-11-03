import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockNotifications, mockTransactions } from '../data/mockData';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Onboarding
      hasSeenOnboarding: false,
      setHasSeenOnboarding: () => set({ hasSeenOnboarding: true }),

      // Notifications
      notifications: [...mockNotifications],
      unreadCount: mockNotifications.filter(n => !n.isRead).length,

      markAllRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      markRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      addNotification: (notif) => {
        set(state => ({
          notifications: [{ ...notif, isRead: false, id: `n${Date.now()}` }, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      // Wallet transactions
      transactions: [...mockTransactions],

      addTransaction: (txn) => {
        set(state => ({
          transactions: [{ ...txn, id: `txn${Date.now()}` }, ...state.transactions],
        }));
      },

      // Dietary preference
      dietaryMode: 'all', // 'all' | 'veg' | 'vegan'
      setDietaryMode: (mode) => set({ dietaryMode: mode }),

      // Online status
      isOnline: true,
      setIsOnline: (val) => set({ isOnline: val }),

      // Recent searches
      recentSearches: ['Filter Coffee', 'Masala Dosa', 'Samosa'],
      addRecentSearch: (q) => {
        set(state => ({
          recentSearches: [q, ...state.recentSearches.filter(s => s !== q)].slice(0, 8),
        }));
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'agni-app',
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        dietaryMode: state.dietaryMode,
        recentSearches: state.recentSearches,
      }),
    }
  )
);
