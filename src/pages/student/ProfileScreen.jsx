import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Hash, BookOpen, Calendar, ChevronRight, LogOut, Bell, CreditCard, Leaf, HelpCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import toast from 'react-hot-toast';

const ProfileRow = ({ icon, label, value, onClick, showChevron = true }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-4 hover:bg-surface-bg transition-colors"
  >
    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 text-left min-w-0">
      <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-ink-primary mt-0.5 truncate">{value}</p>
    </div>
    {showChevron && <ChevronRight size={16} className="stroke-ink-secondary flex-shrink-0" />}
  </button>
);

const SettingRow = ({ icon, label, onClick, badge }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-surface-bg transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <span className="text-sm font-medium text-ink-primary">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-chip">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="stroke-ink-secondary" />
    </div>
  </button>
);

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { dietaryMode, setDietaryMode } = useAppStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not sign out. Please try again.');
      setShowLogoutConfirm(false);
    }
  };

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <PageLayout showBottomNav>
      {/* Header */}
      <div className="header-gradient px-4 pt-12 pb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-ink-primary mb-4">Profile</h1>

        {/* Avatar & name */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-ink-primary">{user.name}</h2>
            <p className="text-sm text-ink-secondary mt-0.5">{user.department}</p>
            <p className="text-xs text-ink-secondary mt-0.5">{user.year}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Profile info */}
        <div className="bg-white border-y border-surface-border mb-2">
          <ProfileRow
            icon={<Mail size={18} className="stroke-primary-500" />}
            label="Email"
            value={user.email}
            showChevron={false}
          />
          <div className="h-px bg-surface-border mx-4" />
          <ProfileRow
            icon={<Hash size={18} className="stroke-primary-500" />}
            label="Student ID"
            value={user.studentId}
            showChevron={false}
          />
          <div className="h-px bg-surface-border mx-4" />
          <ProfileRow
            icon={<BookOpen size={18} className="stroke-primary-500" />}
            label="Department"
            value={user.department}
            showChevron={false}
          />
          <div className="h-px bg-surface-border mx-4" />
          <ProfileRow
            icon={<Calendar size={18} className="stroke-primary-500" />}
            label="Year"
            value={user.year}
            showChevron={false}
          />
        </div>

        {/* Settings */}
        <div className="px-4 pt-6 pb-2">
          <h3 className="text-base font-bold text-ink-primary mb-2">Settings</h3>
        </div>

        <div className="bg-white border-y border-surface-border mb-2">
          <SettingRow
            icon={<CreditCard size={18} className="stroke-ink-secondary" />}
            label="Saved Payment Methods"
            onClick={() => toast('Feature coming soon')}
          />
          <div className="h-px bg-surface-border mx-4" />
          <SettingRow
            icon={<Bell size={18} className="stroke-ink-secondary" />}
            label="Notifications"
            onClick={() => navigate('/notifications')}
          />
          <div className="h-px bg-surface-border mx-4" />
          <SettingRow
            icon={<Leaf size={18} className="stroke-ink-secondary" />}
            label="Dietary Preference"
            onClick={() => {
              const modes = ['all', 'veg', 'vegan'];
              const currentIdx = modes.indexOf(dietaryMode);
              const next = modes[(currentIdx + 1) % modes.length];
              setDietaryMode(next);
              toast.success(`Dietary mode: ${next === 'all' ? 'All' : next === 'veg' ? 'Veg Only' : 'Vegan Only'}`);
            }}
            badge={dietaryMode === 'all' ? 'All' : dietaryMode === 'veg' ? 'Veg' : 'Vegan'}
          />
        </div>

        {/* Help */}
        <div className="px-4 pt-6 pb-2">
          <h3 className="text-base font-bold text-ink-primary mb-2">Help & Support</h3>
        </div>

        <div className="bg-white border-y border-surface-border mb-2">
          <SettingRow
            icon={<HelpCircle size={18} className="stroke-ink-secondary" />}
            label="Help & FAQs"
            onClick={() => navigate('/help')}
          />
          <div className="h-px bg-surface-border mx-4" />
          <SettingRow
            icon={<Info size={18} className="stroke-ink-secondary" />}
            label="About Agni"
            onClick={() => toast('Agni v1.0.0 — College Canteen Pre-Booking')}
          />
        </div>

        {/* Logout */}
        <div className="px-4 pt-8 pb-4">
          <Button
            onClick={() => setShowLogoutConfirm(true)}
            variant="danger"
            fullWidth
            size="lg"
            icon={<LogOut size={18} />}
          >
            Logout
          </Button>
        </div>

        <p className="text-center text-xs text-ink-secondary pb-4">Version 1.0.0</p>
      </div>

      {/* Logout confirm modal */}
      {showLogoutConfirm && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowLogoutConfirm(false)}
            className="fixed inset-0 z-[100] bg-black/60"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm
                       max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2
                       overflow-y-auto rounded-card bg-white p-6 shadow-2xl"
          >
            <h3 id="logout-dialog-title" className="text-lg font-bold text-ink-primary mb-2">
              Confirm Logout?
            </h3>
            <p id="logout-dialog-description" className="text-sm text-ink-secondary mb-6">
              Are you sure you want to logout from Sri Sai Cafe?
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowLogoutConfirm(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleLogout} variant="danger" className="flex-1">
                Confirm Logout
              </Button>
            </div>
          </motion.div>
        </>,
        document.body
      )}
    </PageLayout>
  );
};

export default ProfileScreen;
