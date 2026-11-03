import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Package, Wallet as WalletIcon, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '../../components/ui/EmptyState';
import { useAppStore } from '../../store/appStore';

const NotificationCard = ({ notification, onClick }) => {
  const icons = {
    order_ready: <Package size={18} className="stroke-success" />,
    order_accepted: <Package size={18} className="stroke-blue-500" />,
    wallet: <WalletIcon size={18} className="stroke-purple-500" />,
    promo: <Tag size={18} className="stroke-primary-500" />,
  };

  const colors = {
    order_ready: 'bg-green-100',
    order_accepted: 'bg-blue-100',
    wallet: 'bg-purple-100',
    promo: 'bg-primary-50',
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 border-b border-surface-border hover:bg-surface-bg transition-colors text-left
        ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full ${colors[notification.type] || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
        {icons[notification.type] || <Bell size={18} className="stroke-ink-secondary" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-ink-primary">{notification.title}</h3>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-ink-secondary leading-relaxed">{notification.message}</p>
        <p className="text-[10px] text-ink-secondary mt-1">{timeAgo(notification.time)}</p>
      </div>
    </motion.button>
  );
};

export const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead } = useAppStore();

  const handleNotificationClick = (notif) => {
    markRead(notif.id);
    if (notif.orderId) {
      navigate('/orders');
    }
  };

  const today = notifications.filter(n => {
    const diff = Date.now() - new Date(n.time).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });

  const earlier = notifications.filter(n => {
    const diff = Date.now() - new Date(n.time).getTime();
    return diff >= 24 * 60 * 60 * 1000;
  });

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="header-gradient px-4 pt-12 pb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full">
                <ArrowLeft size={20} className="stroke-ink-primary" />
              </button>
              <h1 className="text-xl font-bold text-ink-primary">Notifications</h1>
            </div>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={markAllRead}
                className="text-blue-link text-sm font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState
              type="search"
              title="No notifications"
              description="You're all caught up! Notifications will appear here."
            />
          ) : (
            <>
              {today.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xs font-bold text-ink-secondary uppercase tracking-wide px-4 py-2 bg-surface-bg">
                    Today
                  </h2>
                  {today.map(notif => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onClick={() => handleNotificationClick(notif)}
                    />
                  ))}
                </div>
              )}

              {earlier.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-ink-secondary uppercase tracking-wide px-4 py-2 bg-surface-bg">
                    Earlier
                  </h2>
                  {earlier.map(notif => (
                    <NotificationCard
                      key={notif.id}
                      notification={notif}
                      onClick={() => handleNotificationClick(notif)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsScreen;
