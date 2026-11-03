import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseClient } from '../utils/supabase';
import { createDemoSession, fetchStudentProfile, logoutDemoSession, saveStudentProfile } from '../utils/api';
import { demoAccounts } from '../data/demoAccounts';

const profileToUser = profile => ({
  ...profile,
  id: profile.studentId,
  role: 'student',
  walletBalance: 0,
  favorites: [],
});

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isNewUser: false,
      isDemo: false,
      authReady: false,
      role: null,
      favoritesByUser: {},

      applyProfile: (profile, favoritesByUser = get().favoritesByUser) => {
        const user = profileToUser(profile);
        user.favorites = favoritesByUser[user.id] || [];
        set({ user, isLoggedIn: true, isNewUser: false, isDemo: false, role: 'student', authReady: true });
        return user;
      },

      initializeAuth: async () => {
        try {
          const supabase = getSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            set({ user: null, isLoggedIn: false, isNewUser: false, isDemo: false, role: null, authReady: true });
            return;
          }
          const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
          if (error || !user?.email_confirmed_at || !user.email?.toLowerCase().endsWith('@act.edu.in')) {
            await supabase.auth.signOut();
            set({ user: null, isLoggedIn: false, isNewUser: false, isDemo: false, role: null, authReady: true });
            return;
          }
          const { profile } = await fetchStudentProfile();
          if (profile) {
            get().applyProfile(profile);
          } else {
            set({
              user: { id: user.id, studentId: user.id, email: user.email, role: 'student_setup' },
              isLoggedIn: true,
              isNewUser: true,
              isDemo: false,
              role: 'student_setup',
              authReady: true,
            });
          }
        } catch (error) {
          console.error('Unable to restore the student authentication session:', error.name || 'Error');
          set({ user: null, isLoggedIn: false, isNewUser: false, isDemo: false, role: null, authReady: true });
        }
      },

      login: async (email, otp) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^@\s]+@act\.edu\.in$/.test(normalizedEmail) || !/^\d{6}$/.test(otp)) {
          return { success: false, error: 'Enter your college email and the 6-digit code you received.' };
        }
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: otp,
          type: 'email',
        });
        if (error || !data.user?.email_confirmed_at || !data.session) {
          return { success: false, error: error?.message || 'Email verification did not complete.' };
        }

        const { profile } = await fetchStudentProfile();
        if (profile) {
          get().applyProfile(profile);
          return { success: true, isNewUser: false };
        }

        set({
          user: {
            id: data.user.id,
            studentId: data.user.id,
            email: data.user.email,
            role: 'student_setup',
          },
          isLoggedIn: true,
          isNewUser: true,
          isDemo: false,
          role: 'student_setup',
          authReady: true,
        });
        return { success: true, isNewUser: true };
      },

      demoLogin: async (role, email, password) => {
        const result = await createDemoSession(role, email, password);
        if (!result.authenticated) throw new Error('Local demo sign-in was not accepted.');
        const account = role === 'student' ? demoAccounts.student : demoAccounts.admin;
        const user = {
          ...account.profile,
          role: role === 'student' ? 'student' : 'staff',
          isDemo: true,
          walletBalance: 0,
          favorites: get().favoritesByUser[account.profile.id] || [],
        };
        set({
          user,
          isLoggedIn: true,
          isNewUser: false,
          isDemo: true,
          role: user.role,
          authReady: true,
        });
        return { success: true, role: user.role };
      },

      staffLogin: () => {
        set({
          user: {
            id: 'staff-session',
            name: 'Canteen Staff',
            studentId: 'STAFF',
            department: 'Canteen Staff',
            email: '',
            role: 'staff',
          },
          isLoggedIn: true,
          isNewUser: false,
          isDemo: false,
          role: 'staff',
          authReady: true,
        });
        return { success: true };
      },

      completeProfile: async profileData => {
        const { profile } = await saveStudentProfile(profileData);
        return get().applyProfile(profile);
      },

      logout: async () => {
        const role = get().role;
        if (get().isDemo) {
          await logoutDemoSession();
        } else if (role === 'student' || role === 'student_setup') {
          const { error } = await getSupabaseClient().auth.signOut();
          if (error) throw error;
        }
        set({ user: null, isLoggedIn: false, isNewUser: false, isDemo: false, role: null, authReady: true });
      },

      updateWalletBalance: amount => {
        const user = get().user;
        if (user) set({ user: { ...user, walletBalance: user.walletBalance + amount } });
      },

      toggleFavorite: itemId => {
        const user = get().user;
        if (!user || user.role !== 'student') return;
        const favorites = user.favorites || [];
        const updatedFavorites = favorites.includes(itemId)
          ? favorites.filter(id => id !== itemId)
          : [...favorites, itemId];
        set(state => ({
          favoritesByUser: { ...state.favoritesByUser, [user.id]: updatedFavorites },
          user: { ...user, favorites: updatedFavorites },
        }));
      },

      updateProfile: updates => {
        const user = get().user;
        if (user) set({ user: { ...user, ...updates } });
      },
    }),
    {
      name: 'agni-student-preferences',
      version: 3,
      migrate: () => ({ favoritesByUser: {} }),
      partialize: state => ({ favoritesByUser: state.favoritesByUser }),
    }
  )
);
