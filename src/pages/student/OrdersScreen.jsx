import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronRight } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import StatusChip from '../../components/ui/StatusChip';
import EmptyState from '../../components/ui/EmptyState';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { fetchStudentOrders } from '../../utils/api';
import toast from 'react-hot-toast';

const OrderReceiptCard = ({ order, onClick }) => {
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const paymentVerified = order.paymentStatus === 'paid' && Boolean(order.paymentVerifiedAt);
  const orderNumber = paymentVerified
    ? order.orderNumber || order.token
    : order.paymentStatus === 'failed'
      ? 'Payment Failed'
      : 'Verification Pending';
  const pickupTime = order.pickupSlot?.label
    || order.pickupSlot?.startTime
    || order.pickupSlot?.time
    || 'Not specified';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left bg-white border border-surface-border rounded-card p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
            {paymentVerified ? 'Collection Token' : 'Payment Status'}
          </p>
          <h2 className="text-lg font-extrabold tracking-wide text-primary-500">{orderNumber}</h2>
          <p className="text-sm font-bold text-ink-primary mt-1">{order.outletName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusChip status={order.status} />
          <ChevronRight size={16} className="stroke-ink-secondary" />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-secondary mb-2">
        <CalendarClock size={14} />
        <span>{new Date(order.createdAt).toLocaleString()}</span>
      </div>

      <div className="flex flex-col gap-1 mb-3">
        {order.items.map((item, index) => (
          <p key={`${item.itemId || item.name}-${index}`} className="text-sm text-ink-secondary">
            {item.name} × {item.qty}
          </p>
        ))}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-surface-border">
        <div>
          <p className="text-xs text-ink-secondary">Pickup: {pickupTime}</p>
          <p className="text-xs text-ink-secondary mt-1">
            UPI payment: {paymentVerified
              ? 'Paid'
              : order.paymentStatus === 'failed'
                ? 'Failed'
                : 'Verification pending'}
          </p>
          <p className="text-xs font-semibold text-ink-secondary mt-1">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · View receipt
          </p>
        </div>
        <span className="text-base font-extrabold text-ink-primary">₹{order.total.toFixed(2)}</span>
      </div>
    </motion.button>
  );
};

export const OrdersScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const upsertOrder = useOrderStore(state => state.upsertOrder);
  const orders = useOrderStore(state => state.orders
    .filter(order => order.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  useEffect(() => {
    let active = true;
    if (!user?.id) return undefined;
    fetchStudentOrders()
      .then(({ orders: serverOrders }) => {
        if (active) serverOrders.forEach(upsertOrder);
      })
      .catch(error => {
        if (active) toast.error(`Could not load order history: ${error.message}`);
      });
    return () => {
      active = false;
    };
  }, [user?.id, upsertOrder]);

  return (
    <PageLayout showBottomNav>
      <div className="header-gradient px-4 pt-12 pb-5 flex-shrink-0">
        <h1 className="text-2xl font-bold text-ink-primary">My Orders</h1>
        <p className="text-sm text-ink-secondary mt-1">Order numbers and receipts for collection</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {orders.length === 0 ? (
          <EmptyState
            type="orders"
            title="No orders yet"
            description="Your order receipts will appear here after you place an order."
            ctaLabel="Browse Menu"
            onCta={() => navigate('/home')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => (
              <OrderReceiptCard
                key={order.id}
                order={order}
                onClick={() => navigate(`/order-success?orderId=${encodeURIComponent(order.id)}`, {
                  state: { orderId: order.id },
                })}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default OrdersScreen;
