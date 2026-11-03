import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { getSupabaseClient } from './utils/supabase';

// Pages
import SplashScreen from './pages/SplashScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import LoginScreen from './pages/auth/LoginScreen';
import StaffLoginScreen from './pages/auth/StaffLoginScreen';
import ProfileSetupScreen from './pages/auth/ProfileSetupScreen';
import HomeScreen from './pages/student/HomeScreen';
import OutletMenuScreen from './pages/student/OutletMenuScreen';
import CartScreen from './pages/student/CartScreen';
import PaymentScreen from './pages/student/PaymentScreen';
import OrderSuccessScreen from './pages/student/OrderSuccessScreen';
import OrdersScreen from './pages/student/OrdersScreen';
import FavoritesScreen from './pages/student/FavoritesScreen';

import ProfileScreen from './pages/student/ProfileScreen';
import NotificationsScreen from './pages/student/NotificationsScreen';
import HelpScreen from './pages/student/HelpScreen';
import SearchScreen from './pages/student/SearchScreen';
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles = ['student'] }) => {
  const { isLoggedIn, role, authReady } = useAuthStore();

  if (!authReady) {
    return <div className="app-container min-h-screen flex items-center justify-center text-sm text-ink-secondary">Checking secure session…</div>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'student_setup' && !allowedRoles.includes('student_setup')) {
    return <Navigate to="/profile-setup" replace />;
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'staff' ? '/admin/dashboard' : '/home'} replace />;
  }

  return children;
};

function App() {
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  useEffect(() => {
    let subscription;
    try {
      const supabase = getSupabaseClient();
      const result = supabase.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          window.setTimeout(() => initializeAuth(), 0);
        }
      });
      subscription = result.data.subscription;
    } catch {
      // The sign-in screen reports missing provider configuration when used.
    }
    initializeAuth();
    return () => subscription?.unsubscribe();
  }, [initializeAuth]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/staff-login" element={<StaffLoginScreen />} />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute allowedRoles={['student_setup']}>
                <ProfileSetupScreen />
              </ProtectedRoute>
            }
          />

          {/* Student routes - OutletMenuScreen is now HOME */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <OutletMenuScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/outlet/:outletId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <OutletMenuScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <CartScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <PaymentScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <OrderSuccessScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <OrdersScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <FavoritesScreen />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ProfileScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <NotificationsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <SearchScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <HelpScreen />
              </ProtectedRoute>
            }
          />

          {/* Admin/Staff routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <div className="app-container min-h-screen flex items-center justify-center">
                  <p className="text-center text-ink-secondary">Menu Management<br />(Coming soon)</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <div className="app-container min-h-screen flex items-center justify-center">
                  <p className="text-center text-ink-secondary">Analytics Dashboard<br />(Coming soon)</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#0066FF',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
