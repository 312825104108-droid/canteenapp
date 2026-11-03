import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Menu, Clock, TrendingUp, Package, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import StatusChip from '../../components/ui/StatusChip';
import { useAuthStore } from '../../store/authStore';
import { formatPickupTime, usePickupTimeStore } from '../../store/pickupTimeStore';
import { fetchStaffOrders, logoutStaffSession, updateStaffOrderStatus } from '../../utils/api';
import { mockAnalytics } from '../../data/mockData';
import toast from 'react-hot-toast';

const StatsCard = ({ icon, label, value, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-500',
    green: 'bg-green-50 text-green-500',
    blue: 'bg-blue-50 text-blue-500',
    red: 'bg-red-50 text-red-500',
  };

  return (
    <div className="bg-white border border-surface-border rounded-card p-4">
      <div className={`w-10 h-10 rounded-full ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-ink-primary">{value}</p>
    </div>
  );
};

const OrderCard = ({ order, onStatusChange }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white border border-surface-border rounded-card p-4"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-extrabold text-ink-primary">
            {order.orderNumber || order.token || (order.paymentStatus === 'paid' ? order.id : 'Awaiting payment')}
          </span>
          <StatusChip status={order.status} size="sm" />
        </div>
        <p className="text-xs text-ink-secondary">{order.customerName} · {order.studentId}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-ink-primary">₹{order.total.toFixed(2)}</p>
        <p className="text-xs text-ink-secondary mt-0.5">
          {order.pickupSlot?.label
            || (order.pickupSlot?.startTime
              ? `${order.pickupSlot.startTime}–${order.pickupSlot.endTime}`
              : order.pickupSlot?.time || 'Pickup time not selected')}
        </p>
      </div>
    </div>

    <div className="flex flex-col gap-1 mb-3">
      {order.items.map((item, idx) => (
        <p key={idx} className="text-xs text-ink-secondary">
          {item.name} × {item.qty}
        </p>
      ))}
    </div>

    {order.paymentMethod === 'UPI' && (
      <div className={`mb-3 rounded-card px-3 py-2 text-xs font-semibold
        ${order.paymentStatus === 'paid'
          ? 'bg-green-50 text-green-700'
          : order.paymentStatus === 'failed'
            ? 'bg-red-50 text-red-700'
            : 'bg-amber-50 text-amber-800'}`}>
        UPI payment: {order.paymentStatus === 'paid'
          ? 'Verified'
          : order.paymentStatus === 'failed'
            ? 'Failed'
            : 'Pending verification'}
      </div>
    )}

    <div className="flex gap-2">
      {order.status === 'new' && order.paymentStatus === 'paid' && (
        <>
          <Button
            onClick={() => onStatusChange(order.id, 'accepted')}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            onClick={() => onStatusChange(order.id, 'cancelled')}
            variant="danger"
            size="sm"
            className="flex-1"
          >
            Reject
          </Button>
        </>
      )}
      {order.status === 'accepted' && (
        <Button
          onClick={() => onStatusChange(order.id, 'preparing')}
          variant="primary"
          size="sm"
          fullWidth
        >
          Start Preparing
        </Button>
      )}
      {order.status === 'preparing' && (
        <Button
          onClick={() => onStatusChange(order.id, 'ready')}
          variant="primary"
          size="sm"
          fullWidth
        >
          Mark Ready
        </Button>
      )}
      {order.status === 'ready' && (
        <Button
          onClick={() => onStatusChange(order.id, 'picked_up')}
          variant="primary"
          size="sm"
          fullWidth
        >
          Mark Collected
        </Button>
      )}
    </div>
  </motion.div>
);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { pickupTimes, addPickupTime, removePickupTime } = usePickupTimeStore();
  const [filter, setFilter] = useState('all'); // 'all' | 'new' | 'preparing' | 'ready'
  const [newPickupTime, setNewPickupTime] = useState('');
  const [serverOrders, setServerOrders] = useState([]);
  const hasShownSyncError = useRef(false);

  useEffect(() => {
    let active = true;
    const syncOrders = async () => {
      try {
        const { orders } = await fetchStaffOrders();
        if (active) {
          setServerOrders(orders);
          hasShownSyncError.current = false;
        }
      } catch (error) {
        if (active && !hasShownSyncError.current) {
          toast.error(`Could not sync server orders: ${error.message}`);
          hasShownSyncError.current = true;
        }
      }
    };
    syncOrders();
    const intervalId = window.setInterval(syncOrders, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutStaffSession();
    } catch (error) {
      toast.error(`Could not end the staff server session: ${error.message}`);
    }
    logout();
    toast.success('Logged out');
    navigate('/staff-login', { replace: true });
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const { order } = await updateStaffOrderStatus(orderId, status.toUpperCase());
      setServerOrders(current => current.map(existing => existing.id === order.id ? order : existing));
    } catch (error) {
      toast.error(`Order status was not updated: ${error.message}`);
      return;
    }
    toast.success(`Order ${status}`);
    if (status === 'ready') toast('Order ready for collection');
  };

  const allOrders = serverOrders;
  const filteredOrders = filter === 'all'
    ? allOrders.filter(order => !['picked_up', 'cancelled'].includes(order.status))
    : filter === 'new'
      ? allOrders.filter(order => ['new', 'pending_payment'].includes(order.status))
      : allOrders.filter(order => order.status === filter);

  const stats = mockAnalytics.today;

  return (
    <div className="app-container">
      <div className="min-h-screen bg-surface-bg flex flex-col">
        {/* Header */}
        <div className="bg-surface-dark px-4 pt-12 pb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">Staff Dashboard</h1>
              <p className="text-gray-400 text-sm">{user?.outletName || 'Agni Canteen'}</p>
            </div>
            {user?.isDemo && (
              <p className="mb-4 rounded-card bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">
                Local demo mode — live orders and order changes are disabled.
              </p>
            )}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Logout"
            >
              <LogOut size={18} className="stroke-white" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/menu')}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 rounded-card py-3 text-white font-semibold text-sm"
            >
              <Menu size={16} />
              Menu
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 rounded-card py-3 text-white font-semibold text-sm"
            >
              <TrendingUp size={16} />
              Stats
            </button>
          </div>
        </div>

        <section className="px-4 pt-4">
          <div className="bg-white border border-surface-border rounded-card p-4">
            <h2 className="text-base font-bold text-ink-primary mb-1">Pickup Time Settings</h2>
            <p className="text-xs text-ink-secondary mb-3">
              Configure available pickup times. There is no booking limit per time.
            </p>
            <form
              onSubmit={event => {
                event.preventDefault();
                if (!newPickupTime) return;
                if (!addPickupTime(newPickupTime)) {
                  toast.error('That pickup time is invalid or already listed');
                  return;
                }
                setNewPickupTime('');
                toast.success('Pickup time added');
              }}
              className="flex gap-2 mb-3"
            >
              <input
                type="time"
                value={newPickupTime}
                onChange={event => setNewPickupTime(event.target.value)}
                required
                aria-label="New pickup time"
                className="flex-1 min-w-0 h-11 px-3 border border-surface-border rounded-card text-sm"
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-card bg-primary-500 text-white font-semibold text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {pickupTimes.map(time => (
                <div key={time} className="flex items-center gap-2 rounded-chip bg-surface-bg px-3 py-1.5">
                  <span className="text-sm font-medium text-ink-primary">{formatPickupTime(time)}</span>
                  <button
                    type="button"
                    onClick={() => removePickupTime(time)}
                    aria-label={`Remove ${formatPickupTime(time)}`}
                    className="text-ink-secondary hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {pickupTimes.length === 0 && (
                <p className="text-xs text-ink-secondary">No pickup times configured.</p>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatsCard
              icon={<Package size={18} />}
              label="Today's Orders"
              value={stats.totalOrders}
              color="blue"
            />
            <StatsCard
              icon={<CheckCircle size={18} />}
              label="Completed"
              value={stats.completedOrders}
              color="green"
            />
            <StatsCard
              icon={<Clock size={18} />}
              label="Pending"
              value={stats.pendingOrders}
              color="primary"
            />
            <StatsCard
              icon={<TrendingUp size={18} />}
              label="Revenue"
              value={`₹${stats.revenue.toFixed(0)}`}
              color="green"
            />
          </div>
        </div>

        {/* Orders filter */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { value: 'all', label: 'All Active' },
              { value: 'new', label: 'New' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'ready', label: 'Ready' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 rounded-chip text-xs font-semibold whitespace-nowrap transition-all
                  ${filter === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white border border-surface-border text-ink-secondary'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ink-secondary text-sm">No {filter === 'all' ? 'active' : filter} orders</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
